/**
 * etny.js
 * An extension that allows to execute a task using an existing enclave provided by Ethernity Network
 *
 * @version 0.2.0
 * @author  Ciprian Florea, ciprian@ethernity.cloud
 * @updated 2022-11-08
 *
 *
 */
define(["require", 'jquery', "base/js/namespace", "base/js/dialog", './bloxbergAPI', './etnyContract', './ipfs', './certificate', './cell', './utils'],
    function (requirejs, $, Jupyter, dialog, bloxbergAPI, etnyContract, ipfs, certificate, cells, utils) {
        let nodeAddressMetadata = '';

        let __dohash = null;
        let __dorequest = 0;
        let __scriptHash = '';
        let __fileSetHash = '';

        const FILESET_DATA = 'ethernity';

        const initialize = async () => {
            ipfs.initialize();
            etnyContract.initContract();
            await listenForAddDORequestEvent();
        }

        const listenForAddDORequestEvent = async () => {
            await etnyContract.getContract().on("_addDORequestEV", (_from, _rowNumber) => {
                console.log('emitted');
                __dorequest = _rowNumber.toNumber();
                console.log(__dorequest);
            });
        }

        const callContractAddDORequest = async (metadata1, metadata2, metadata3) => {
            return await etnyContract.addDORequest(metadata1, metadata2, metadata3);
        }

        const waitForTransactionToBeProcessed = async (transactionHash) => {
            await etnyContract.getProvider().waitForTransaction(transactionHash);
            const txReceipt = await etnyContract.getProvider().getTransactionReceipt(transactionHash);
            console.log(txReceipt);
            return !(!txReceipt && txReceipt.status === 0);
        }

        const createDORequest = async (scriptHash, filesetHash) => {
            console.log(`Submitting transaction for DO request on ${utils.getCurrentTime()}`);
            // add here call to SC(smart contract)
            const tx = await callContractAddDORequest(scriptHash, filesetHash, nodeAddressMetadata);
            const transactionHash = tx.hash;
            __dohash = transactionHash;

            console.log(`Waiting for transaction ${transactionHash} to be processed...`);
            const isProcessed = await waitForTransactionToBeProcessed(transactionHash);
            if (!isProcessed) {
                console.log("Unable to create request, please check connectivity with bloxberg node");
                return;
            }
            console.log(`Request ${__dorequest} created successfully!`);
            console.log(`TX hash: ${transactionHash}`);
        }

        const waitUntilDoRequestIdIsValid = async () => {
            if (__dorequest === 0) {
                await utils.delay(1000);
                await waitUntilDoRequestIdIsValid();
            }
        }

        const findOrderId = async () => {
            try {
                console.log('Waiting for the order to be placed and be taken into processing...');
                let orderId = -1;
                const ordersCount = await etnyContract.getOrdersCount();
                const count = ordersCount.toNumber();
                console.log(`Orders count: ${count}`);

                await waitUntilDoRequestIdIsValid();

                for (let i = count - 1, _pj_a = count - 5; i > _pj_a; i += -1) {
                    if (__dorequest !== 0) {
                        const order = await etnyContract.getOrder(i);
                        if (order[2].toNumber() === __dorequest && order[4].toNumber() === 0) {
                            orderId = i;
                            break;
                        }
                    }
                }

                if (orderId === -1) {
                    await utils.delay(2000);
                    return await findOrderId();
                } else {
                    return orderId;
                }
            } catch (ex) {
                console.error(ex.message);
                await utils.delay(2000);
                return await findOrderId();
            }
        }

        const approveOrder = async (orderId) => {
            const tx = await etnyContract.approveOrder(orderId);
            console.log(tx);
            const isProcessed = await waitForTransactionToBeProcessed(tx.hash);
            if (!isProcessed) {
                console.log("Unable to approve order, please check connectivity with bloxberg node");
                return;
            }
            console.log(`Order approved successfully!`)
            console.log(`TX hash: ${tx.hash}`);
        }

        const getResultFromOrder = async (orderId) => {
            console.log('Waiting for task to finish...');
            try {
                const ipfsResultHash = await etnyContract.getResultFromOrder(orderId);
                console.log(ipfsResultHash);
                const ipfsResult = await ipfs.getFromIPFS(ipfsResultHash);
                console.log(ipfsResult);

                const transaction = await etnyContract.getProvider().getTransaction(__dohash);
                const block = await etnyContract.getProvider().getBlock(transaction.blockNumber);
                const blockTimestamp = block.timestamp;
                const endBlockNumber = await etnyContract.getProvider().getBlockNumber();
                const startBlockNumber = endBlockNumber - 100;

                let resultTransactionHash, resultBlockTimestamp;

                for (let i = endBlockNumber; i >= startBlockNumber; i--) {
                    const block = await etnyContract.getProvider().getBlockWithTransactions(i);
                    if (!block || !block.transactions) continue;

                    for (const transaction of block.transactions) {
                        if (transaction.to === etnyContract.contractAddress && transaction.data) {
                            resultTransactionHash = transaction.hash;
                            resultBlockTimestamp = block.timestamp;
                        }
                    }
                }

                return {
                    contractAddress: etnyContract.contractAddress,
                    inputTransactionHash: __dohash,
                    outputTransactionHash: resultTransactionHash,
                    orderId: orderId,
                    imageHash: etnyContract.imageHash,
                    scriptHash: __scriptHash,
                    fileSetHash: __fileSetHash,
                    publicTimestamp: blockTimestamp,
                    resultHash: ipfsResultHash,
                    resultValue: ipfsResult,
                    resultTimestamp: resultBlockTimestamp
                };

            } catch (ex) {
                await utils.delay(5000);
                return await getResultFromOrder(orderId);
            }
        }

        /// main method
        const runOnEthernity = async () => {
            // extracting code from all the code cells
            const code = extractPythonCode();

            // uploading all python code to IPFS and received hash of transaction
            __scriptHash = await ipfs.uploadToIPFS(code);
            __fileSetHash = await ipfs.uploadToIPFS(FILESET_DATA);

            // create new DO Request
            await createDORequest(__scriptHash, __fileSetHash);

            // search for the above created order
            const orderId = await findOrderId();

            if (orderId === 0) return;

            // approve order
            await approveOrder(orderId);

            //get processed result from the order and create a certificate
            const certificateObject = await getResultFromOrder(orderId);
            const formattedCertificate = certificate.generateCertificate(certificateObject);
            insertCertificate(formattedCertificate);
            const sha256FromCertificate = await certificate.generateSha256FromImage($);
            const certificateData = await createBloxbergCertificate(certificateObject, sha256FromCertificate);
            if (certificateData) {
                await bloxbergAPI.generatePDFForCertificate(certificateData);
            }
        }

        const connectToMetaMaskAndSign = async () => {
            try {
                await etnyContract.getProvider().send("eth_requestAccounts", []);
                return true;
            } catch (e) {
                return false;
            }
        }

        const extractPythonCode = () => {
            // console.log(source_code);
            return Jupyter.notebook.get_cells().map(function (cell) {
                if (cell.cell_type === "code") {
                    const source = cell.code_mirror.getValue();
                    if (!source.startsWith("%%javascript")) {
                        return source;
                    }
                }
            }).join("\n");
        }

        const insertCertificate = (certificate) => {
            let cell = Jupyter.notebook.insert_cell_at_bottom('markdown');
            cell.set_text(`<div id="ethernity_certificate">${certificate}</div>`);
            cell.render();

            setTimeout(() => {
                cells.setState($, cell, 'frozen');
            }, 1000);
        }

        const createBloxbergCertificate = async (certificate, crid) => {
            try {
                const walletAddress = await etnyContract.getCurrentWallet();
                const res = await bloxbergAPI.createCertificate(walletAddress, crid, certificate)
                console.log(res);
                return res;
            } catch (e) {
                return null;
            }
        }

        const runOnEthernityHandler = async () => {
            const res = await connectToMetaMaskAndSign();

            if (res) {
                const nodeAddressCheckbox = $(`
                    <div class="checkbox">
                        <label>
                          <input id="runOnNodeCheckbox" type="checkbox"> Would you like to run the code on a specific node?
                        </label>
                    </div>`);
                const nodeAddress = $(`<input id="nodeAddress" class='form-control' type='text' value='' disabled/>`);
                const onInit = () => {
                    $('#runOnNodeCheckbox').click(function () {
                        if ($(this).is(':checked')) {
                            $('#nodeAddress').removeAttr('disabled');
                        } else {
                            $('#nodeAddress').attr('disabled', 'disabled');
                            nodeAddressMetadata = '';
                            $('#nodeAddress').val('');
                        }
                    });
                };

                dialog.modal({
                    title: "Ethernity Cloud", body: $("<div></div>")
                        .append("If bellow checkbox is checked the code will be delegated to a specified node, if not, a random node will be selected from the network.")
                        .append($("<br/><br/>"))
                        .append(nodeAddressCheckbox)
                        .append($("<label style='font-weight: bold;'>Node Address</label>"))
                        .append(nodeAddress), buttons: {
                        'Run on Ethernity Cloud': {
                            class: "btn-primary", click: async function (e) {
                                e.preventDefault();
                                if ($('#runOnNodeCheckbox').is(':checked')) {
                                    const nodeAddress = $('#nodeAddress').val();
                                    if (etnyContract.isAddress(nodeAddress)) {
                                        const isNode = await etnyContract.isNodeOperator(nodeAddress);
                                        if (isNode) {
                                            nodeAddressMetadata = nodeAddress;
                                        } else {
                                            alert('Introduced address is not a valid node operator address');
                                            return false;
                                        }
                                    } else {
                                        alert('Introduced address is not a valid wallet address');
                                        return false;
                                    }
                                } else {
                                    nodeAddressMetadata = '';
                                }

                                await runOnEthernity();
                            }
                        }
                    }, notebook: Jupyter.notebook, keyboard_manager: Jupyter.keyboard_manager
                });

                setTimeout(() => {
                    onInit();
                }, 1000);
            } else {
                dialog.modal({
                    title: "Ethernity Cloud",
                    body: "There was an error connecting to your wallet.",
                    buttons: {OK: {class: "btn-primary"}},
                    notebook: Jupyter.notebook,
                    keyboard_manager: Jupyter.keyboard_manager,
                });
            }
        }

        const createRunOnEthernityAction = () => {
            const action = {
                icon: "fa-play-circle-o", // a font-awesome class used on buttons, etc
                help: "Run on Ethernity Cloud",
                label: "Run on Ethernity Cloud",
                help_index: "zz",
                handler: runOnEthernityHandler
            };
            const prefix = "etny_extension";
            const action_name = "run-on-etny";

            return Jupyter.actions.register(action, action_name, prefix);
        }

        const load_ipython_extension = async () => {
            await initialize();
            Jupyter.toolbar.add_buttons_group([createRunOnEthernityAction()]);
        }

        return {
            load_ipython_extension: load_ipython_extension,
        }
    });
