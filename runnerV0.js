/**
 * main.js
 * An extension that allows to execute a task using an existing enclave provided by Ethernity Cloud Network
 *
 * @version 0.2.0
 * @author  Ciprian Florea, ciprian@ethernity.cloud
 * @updated 2022-11-08
 *
 *
 */
define(["require", 'jquery', "base/js/namespace", "base/js/dialog", './bloxbergAPI', './etnyContract', './ipfs', './certificate', './cell', './crypto', './utils'],
    function (requirejs, $, Jupyter, dialog, bloxbergAPI, etnyContract, ipfs, certificate, cells, crypto, utils) {
        let nodeAddressMetadata = '';
        let authorName, titleOfResearch, emailAddress = '';

        let __orderNumber = -1;
        let __dohash = null;
        let __dorequest = -1;
        let __doRequestId = -1;
        let __scriptHash = '';
        let __fileSetHash = '';

        let loadingCell = null;
        let loadingText = '';
        let findOrderRepeats = 1;
        let getResultFromOrderRepeats = 1;

        const VERSION = 'v0';
        const LAST_BLOCKS = 20;
        const FILESET_DATA = 'ethernity';

        const initialize = async () => {
            ipfs.initialize();
            await etnyContract.initContract();
        }

        const reset = () => {
            nodeAddressMetadata = '';
            authorName = '';
            titleOfResearch = '';
            emailAddress = '';

            __orderNumber = -1;
            __dohash = null;
            __doRequestId = -1;
            __dorequest = -1;
            __scriptHash = '';
            __fileSetHash = '';

            loadingCell = null;
            loadingText = '';
            findOrderRepeats = 1;
            getResultFromOrderRepeats = 1;
        }

        const listenForAddDORequestEvent = async () => {
            let interval = null;
            let intervalRepeats = 1;
            let _addDORequestEVPassed = false;
            let _orderPlacedEVPassed = false;
            let _orderClosedEVPassed = false;

            const contract = etnyContract.getContract();
            const messageInterval = () => {
                if (intervalRepeats % 2 === 0) {
                    loadingText = cells.updateLastLineOfCell(loadingCell, loadingText, "\\ Waiting for the task to be processed...");
                } else {
                    loadingText = cells.updateLastLineOfCell(loadingCell, loadingText, `/ Waiting for the task to be processed...`);
                }
                intervalRepeats++;
            }

            const _orderApproved = async () => {
                _orderPlacedEVPassed = true;
                contract.off("_orderPlacedEV", _orderPlacedEV);
                // console.log("total subscribed events:", contract.listenerCount());

                // approve order in case we are not providing a node address as metadata4 parameter
                if (!nodeAddressMetadata) {
                    await approveOrder(__orderNumber);
                }

                loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Order ${__orderNumber} was placed and approved.`);
                interval = setInterval(messageInterval, 1000);
            }

            const _addDORequestEV = async (_from, _doRequest) => {
                const walletAddress = (await etnyContract.getProvider().send("eth_requestAccounts", []))[0];
                // console.log('wallet address:', walletAddress);
                try {
                    if (walletAddress && _from.toLowerCase() === walletAddress.toLowerCase() && !_addDORequestEVPassed) {
                        __dorequest = _doRequest.toNumber();
                        loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Task was picked up and DO Request ${__dorequest} was created.`);
                        _addDORequestEVPassed = true;
                        contract.off("_addDORequestEV", _addDORequestEV);
                        // console.log("total subscribed events:", contract.listenerCount());

                        // in case _orderPlacedEV was dispatched before _addDORequestEV we have to call the _orderApproved
                        if (__orderNumber !== -1 && __dorequest === __doRequestId) {
                            await _orderApproved();
                        }
                    } else {
                        if (!walletAddress) {
                            dialog.modal({
                                title: "Ethernity Cloud",
                                body: "Unable to retrieve current wallet address.",
                                buttons: {OK: {class: "btn-primary"}},
                                notebook: Jupyter.notebook,
                                keyboard_manager: Jupyter.keyboard_manager,
                            });
                        }
                    }
                } catch (e) {
                    console.log(e);
                    dialog.modal({
                        title: "Ethernity Cloud",
                        body: "Unable to retrieve current wallet address.",
                        buttons: {OK: {class: "btn-primary"}},
                        notebook: Jupyter.notebook,
                        keyboard_manager: Jupyter.keyboard_manager,
                    });
                }
            }

            const _orderPlacedEV = async (orderNumber, doRequestId, dpRequestId) => {
                // console.log(`Task was approved.`)
                // this means that addDPRequestEV was dispatched
                if (doRequestId.toNumber() === __dorequest && !_orderPlacedEVPassed && __dorequest !== -1) {
                    __orderNumber = orderNumber.toNumber();
                    __doRequestId = doRequestId.toNumber();
                    await _orderApproved();
                } else {
                    // otherwise keep track of the result of this event and call the function _orderApproved in addDPRequestEV
                    if (__dorequest === -1) {
                        __orderNumber = orderNumber.toNumber();
                        __doRequestId = doRequestId.toNumber();
                    }
                }
            }

            const _orderClosedEV = async (orderNumber) => {
                // console.log(`Checking if task has finished processing.`);
                if (__orderNumber === orderNumber.toNumber() && !_orderClosedEVPassed && __orderNumber !== -1) {
                    clearInterval(interval);
                    _orderClosedEVPassed = true;
                    contract.off("_orderClosedEV", _orderClosedEV);
                    // console.log("total subscribed events:", contract.listenerCount());

                    //get processed result from the order and create a certificate
                    const parsedOrderResult = await getResultFromOrder(orderNumber);
                    if (parsedOrderResult.success === false) {
                        dialog.modal({
                            title: "Ethernity Cloud",
                            body: parsedOrderResult.message,
                            buttons: {OK: {class: "btn-primary"}},
                            notebook: Jupyter.notebook,
                            keyboard_manager: Jupyter.keyboard_manager,
                        });
                        return;
                    }
                    const formattedCertificate = certificate.generateCertificateV1(parsedOrderResult);
                    await cells.insertCertificateCell(formattedCertificate);
                    const sha256FromCertificate = await certificate.generateSha256FromImage($);
                    const certificateData = await createBloxbergCertificate(parsedOrderResult, sha256FromCertificate);
                    if (certificateData) {
                        await bloxbergAPI.generatePDFForCertificate(certificateData);
                    }
                }
            }

            contract.on("_addDORequestEV", _addDORequestEV);
            contract.on("_orderPlacedEV", _orderPlacedEV);
            contract.on("_orderClosedEV", _orderClosedEV);

            // console.log("total subscribed events:", contract.listenerCount());
        }

        const callContractAddDORequest = async (imageMetadata, payloadMetadata, inputMetadata, nodeAddress) => {
            return await etnyContract.addDORequest(imageMetadata, payloadMetadata, inputMetadata, nodeAddress);
        }

        const waitForTransactionToBeProcessed = async (transactionHash) => {
            await etnyContract.getProvider().waitForTransaction(transactionHash);
            const txReceipt = await etnyContract.getProvider().getTransactionReceipt(transactionHash);
            // console.log(txReceipt);
            return !(!txReceipt && txReceipt.status === 0);
        }

        const createDORequest = async (scriptHash, filesetHash) => {
            try {
                loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Submitting transaction for DO request on ${utils.formatDate()}`);
                // add here call to SC(smart contract)
                const tx = await callContractAddDORequest(etnyContract.imageHash, scriptHash, filesetHash, nodeAddressMetadata);
                const transactionHash = tx.hash;
                __dohash = transactionHash;

                loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Waiting for transaction ${transactionHash} to be processed...`);
                const isProcessed = await waitForTransactionToBeProcessed(transactionHash);
                if (!isProcessed) {
                    loadingText = cells.writeMessageToCell(loadingCell, loadingText, "Unable to create request, please check connectivity with Bloxberg node");
                    return;
                }
                loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Transaction ${transactionHash} was processed`);
            } catch (e) {
                dialog.modal({
                    title: "Ethernity Cloud",
                    body: "There was an error creating DO Request.",
                    buttons: { OK: { class: "btn-primary" } },
                    notebook: Jupyter.notebook,
                    keyboard_manager: Jupyter.keyboard_manager,
                });
            }
        }

        const approveOrder = async (orderId) => {
            const tx = await etnyContract.approveOrder(orderId);
            // console.log(tx);
            const isProcessed = await waitForTransactionToBeProcessed(tx.hash);
            if (!isProcessed) {
                loadingText = cells.writeMessageToCell(loadingCell, loadingText, "Unable to approve order, please check connectivity with Bloxberg node");
                return;
            }
            loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Order successfully approved!`);
            // loadingText = cells.writeMessageToCell(loadingCell, loadingText,`TX hash: ${tx.hash}`);
        }

        const getResultFromOrder = async (orderId) => {
            // loadingText = cells.updateLastLineOfCell(loadingCell, loadingText, `(${getResultFromOrderRepeats}) Waiting for the task to be processed...`);
            try {
                const ipfsResultHash = await etnyContract.getResultFromOrder(orderId);
                loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Task with order number ${orderId}  was successfully processed at ${utils.formatDate()}`);
                loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Result IPFS hash: ${ipfsResultHash}`);
                const ipfsResult = await ipfs.getFromIPFS(ipfsResultHash);
                loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Result value: ${ipfsResult}`);

                const transaction = await etnyContract.getProvider().getTransaction(__dohash);
                const block = await etnyContract.getProvider().getBlock(transaction.blockNumber);
                const blockTimestamp = block.timestamp;
                const endBlockNumber = await etnyContract.getProvider().getBlockNumber();
                const startBlockNumber = endBlockNumber - LAST_BLOCKS;

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
                    author: authorName,
                    projectDescription: titleOfResearch,
                    emailAddress: emailAddress,
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
                getResultFromOrderRepeats = getResultFromOrderRepeats + 1;
                return await getResultFromOrder(orderId);
            }
        }

        const runOnEthernity = async () => {
            await listenForAddDORequestEvent();

            // extracting code from all the code cells
            const code = cells.extractPythonCode();

            // uploading all python code to IPFS and received hash of transaction
            __scriptHash = await ipfs.uploadToIPFS(code);
            await ipfs.getFromIPFS(__scriptHash);
            __fileSetHash = await ipfs.uploadToIPFS(FILESET_DATA);

            // create new DO Request
            await createDORequest(__scriptHash, __fileSetHash);

            // from here the logic is moved into Events
        }

        const connectToMetaMaskAndSign = async () => {
            try {
                await etnyContract.getProvider().send("eth_requestAccounts", []);
                await initialize();
                const walletAddress = etnyContract.getCurrentWallet();
                return walletAddress !== null && walletAddress !== undefined;
            } catch (e) {
                return false;
            }
        }

        const createBloxbergCertificate = async (certificate, crid) => {
            try {
                const walletAddress = await etnyContract.getCurrentWallet();
                return await bloxbergAPI.createCertificate(walletAddress, crid, certificate);
            } catch (e) {
                return null;
            }
        }

        const cleanup = async () => {
            reset();
            await cells.deleteLastCells();
            const contract = etnyContract.getContract();
            contract.removeAllListeners();
        }

        const runOnEthernityHandler = async () => {
            await initialize();
            await cleanup();

            loadingCell = await cells.insertLoadingCell(loadingText);
            loadingText = cells.writeMessageToCell(loadingCell, loadingText, 'Starting running task...');

            const res = await connectToMetaMaskAndSign();

            if (res) {
                const authorInput = $(`<input id="authorName" class='form-control' type='text' value=''/>`);
                const emailAddressInput = $(`<input id="emailAddress" class='form-control' type='text' value=''/>`);
                const titleOrDescriptionInput = $(`<input id="titleOfResearch" class='form-control' type='text' value=''/>`);
                const nodeAddressCheckbox = $(`
                    <div class="checkbox">
                        <label>
                          <input id="runOnNodeCheckbox" type="checkbox" style="width: 14px;height: 14px"> 
                          <span style="font-size: 14px">Would you like to run the code on a specific node?</span>
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
                    title: "Ethernity Cloud Runner v0", body: $("<div></div>")
                        .append("Every field is optional, it is only to enhance the generated certificate at the end of the process.")
                        .append($("<br/><br/>"))
                        .append($("<label style='font-weight: bold;'>Author or Group Name</label>"))
                        .append(authorInput)
                        .append($("<br/><br/>"))
                        .append($("<label style='font-weight: bold;'>Title or Brief Description of Research</label>"))
                        .append(titleOrDescriptionInput)
                        .append($("<br/><br/>"))
                        .append($("<label style='font-weight: bold;'>Email Address</label>"))
                        .append(emailAddressInput)
                        .append($("<br/><br/>"))
                        .append("If bellow checkbox is checked the code will be delegated to a specified node, if not, a random node will be selected from the network.")
                        .append($("<br/><br/>"))
                        .append(nodeAddressCheckbox)
                        .append($("<label style='font-weight: bold;'>Node Address</label>"))
                        .append(nodeAddress), buttons: {
                            'Run on Ethernity Cloud': {
                                class: "btn-primary", click: async function (e) {
                                    e.preventDefault();
                                    authorName = $('#authorName').val();
                                    titleOfResearch = $('#titleOfResearch').val();
                                    emailAddress = $('#emailAddress').val();

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
                    buttons: { OK: { class: "btn-primary" } },
                    notebook: Jupyter.notebook,
                    keyboard_manager: Jupyter.keyboard_manager,
                });
            }
        }

        return {
            run: runOnEthernityHandler,
        }
    });
