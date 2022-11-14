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
define(["require", 'jquery', "base/js/namespace", "base/js/dialog", './bloxbergAPI', './etnyContract', './ipfs', './certificate', './cell', './utils'],
    function (requirejs, $, Jupyter, dialog, bloxbergAPI, etnyContract, ipfs, certificate, cells, utils) {
        let nodeAddressMetadata = '';

        let __dohash = null;
        let __dorequest = 0;
        let __scriptHash = '';
        let __fileSetHash = '';
        let loadingCell = null;
        let loadingText = '';
        let findOrderRepeats = 1;
        let getResultFromOrderRepeats = 1;

        const LAST_BLOCKS = 20;
        const FILESET_DATA = 'ethernity';

        const initialize = async () => {
            ipfs.initialize();
            await etnyContract.initContract();
            await listenForAddDORequestEvent();
        }

        const listenForAddDORequestEvent = async () => {
            const event = async (_from, _doRequest) => {
                const walletAddress = etnyContract.getCurrentWallet();
                if (_from === walletAddress) {
                    __dorequest = _doRequest.toNumber();
                    loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Task was picked up and DO Request ${__dorequest} was created.`);
                    etnyContract.getContract().off("_addDORequestEV", event);
                }
            }
            await etnyContract.getContract().on("_addDORequestEV", event);
        }

        const callContractAddDORequest = async (metadata1, metadata2, metadata3) => {
            return await etnyContract.addDORequest(metadata1, metadata2, metadata3);
        }

        const waitForTransactionToBeProcessed = async (transactionHash) => {
            await etnyContract.getProvider().waitForTransaction(transactionHash);
            const txReceipt = await etnyContract.getProvider().getTransactionReceipt(transactionHash);
            // console.log(txReceipt);
            return !(!txReceipt && txReceipt.status === 0);
        }

        const createDORequest = async (scriptHash, filesetHash) => {
            loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Submitting transaction for DO request on ${utils.formatDate()}`);
            // add here call to SC(smart contract)
            const tx = await callContractAddDORequest(scriptHash, filesetHash, nodeAddressMetadata);
            const transactionHash = tx.hash;
            __dohash = transactionHash;

            loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Waiting for transaction ${transactionHash} to be processed...`);
            const isProcessed = await waitForTransactionToBeProcessed(transactionHash);
            if (!isProcessed) {
                loadingText = cells.writeMessageToCell(loadingCell, loadingText, "Unable to create request, please check connectivity with Bloxberg node");
                return;
            }
            loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Transaction ${transactionHash} was processed`);
        }

        const waitUntilDoRequestIdIsValid = async () => {
            if (__dorequest === 0) {
                await utils.delay(1000);
                await waitUntilDoRequestIdIsValid();
            }
        }

        const findOrderId = async () => {
            try {
                loadingText = cells.updateLastLineOfCell(loadingCell, loadingText, `(${findOrderRepeats}) Waiting for the order to be placed and be taken into processing...`);
                let orderId = -1;
                const ordersCount = await etnyContract.getOrdersCount();
                const count = ordersCount.toNumber();

                await waitUntilDoRequestIdIsValid();

                for (let i = count - 1, _pj_a = count - 5; i > _pj_a; i += -1) {
                    if (__dorequest !== 0) {
                        const order = await etnyContract.getOrder(i);
                        // console.log(order);
                        if (order.doRequest.toNumber() === __dorequest && order.status.toNumber() === 0) {
                            orderId = i;
                            break;
                        }
                    }
                }

                if (orderId === -1) {
                    await utils.delay(2000);
                    findOrderRepeats = findOrderRepeats + 1;
                    return await findOrderId();
                } else {
                    return orderId;
                }
            } catch (ex) {
                console.error(ex.message);
                await utils.delay(2000);
                findOrderRepeats = findOrderRepeats + 1;
                return await findOrderId();
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
            loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Order approved successfully!`);
            // loadingText = cells.writeMessageToCell(loadingCell, loadingText,`TX hash: ${tx.hash}`);
        }

        const getResultFromOrder = async (orderId) => {
            loadingText = cells.updateLastLineOfCell(loadingCell, loadingText, `(${getResultFromOrderRepeats}) Waiting for the task to be processed...`);
            try {
                const ipfsResultHash = await etnyContract.getResultFromOrder(orderId);
                loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Task successfully processed at ${utils.formatDate()}`);
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

        /// main method
        const runOnEthernity = async () => {
            // extracting code from all the code cells
            const code = cells.extractPythonCode();
            console.log(code);
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
            await cells.insertCertificateCell(formattedCertificate);
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

        const createBloxbergCertificate = async (certificate, crid) => {
            try {
                const walletAddress = await etnyContract.getCurrentWallet();
                return await bloxbergAPI.createCertificate(walletAddress, crid, certificate);
            } catch (e) {
                return null;
            }
        }

        const runOnEthernityHandler = async () => {
            loadingText = '';
            findOrderRepeats = 1;
            getResultFromOrderRepeats = 1;

            await cells.deleteLastCells();
            loadingCell = await cells.insertLoadingCell(loadingText);

            loadingText = cells.writeMessageToCell(loadingCell, loadingText, 'Starting running task...');

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

        const createEtnyButton = () => {
            $('#maintoolbar-container').append('<button id="runOnEthernityButton" style="margin-left: 4px;" class="btn btn-default" type="submit"><div style="display: flex;\n' +
                '  justify-content: center;\n' +
                '  align-items: center;">' +
                '<svg style="margin-right: 2px;" width="36" height="18" viewBox="0 0 73 38" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M72.3696 21.8934C71.0385 29.5846 63.3004 34.1812 56.5748 34.1812C54.1642 34.1812 51.9044 33.638 49.8693 32.5618C46.8686 36.0252 42.4631 38 37.7794 38C34.5272 38 31.4159 37.0444 28.7739 35.2272C28.6633 35.1535 28.5895 35.0227 28.5995 34.8886C28.6096 34.7478 28.6834 34.6271 28.8041 34.5634C30.0043 33.8895 31.1979 33.0111 32.3513 31.9617C32.425 31.898 32.5256 31.8611 32.6362 31.8611C32.7033 31.8611 32.7636 31.8711 32.8307 31.908C34.4836 32.7596 36.1566 33.1888 37.7827 33.1888C42.5939 33.1888 46.5032 29.4069 49.0144 26.5537C49.0881 26.4766 49.1887 26.4196 49.2994 26.4129H49.3295C49.4301 26.4129 49.5341 26.4498 49.6145 26.5235C51.5893 28.2938 54.1675 29.2661 56.8665 29.2661C59.7465 29.2661 62.4622 28.1731 64.5141 26.1983C64.5979 26.1178 64.6247 26.0944 64.6683 26.0508C65.9491 24.8337 66.7202 23.372 67.1795 21.7258C67.2265 21.5481 67.3941 21.4274 67.5785 21.4274H71.9672C72.0846 21.4274 72.2053 21.4844 72.279 21.5682C72.3629 21.6621 72.3997 21.7828 72.3729 21.8934H72.3696V21.8934Z" fill="url(#paint0_linear_4673_53665)"></path>' +
                '<path d="M18.7016 33.9364C15.0706 33.9364 11.691 32.4746 8.34832 29.4907C5.9947 27.2444 4.47926 24.3945 3.95288 21.2564H0.415741C0.194461 21.2564 0 21.082 0 20.8742V17.0118C0 16.7905 0.177696 16.6128 0.398977 16.6128H3.95288C4.78436 9.52178 11.8955 3.7383 19.808 3.7383C22.2354 3.7383 24.5085 4.29486 26.5403 5.40126C29.551 1.96806 33.9565 0 38.637 0C41.8791 0 45.0005 0.955531 47.6424 2.75595C47.7531 2.82971 47.8168 2.96047 47.8168 3.09123C47.8067 3.22198 47.7329 3.35274 47.6122 3.41644C46.412 4.08699 45.2184 4.9587 44.0651 5.99805C43.9913 6.06175 43.8907 6.10199 43.7801 6.10199C43.713 6.10199 43.6493 6.09193 43.5856 6.05505C41.9327 5.21016 40.2698 4.78436 38.6437 4.78436C33.9163 4.78436 30.1579 8.27121 27.4153 11.3188C27.3416 11.4027 27.2309 11.4597 27.1203 11.4597H27.1002C26.9895 11.4597 26.889 11.4228 26.8051 11.349C24.9477 9.6123 22.4365 8.66013 19.7409 8.66013C15.2617 8.66013 10.1454 11.3893 9.05575 16.6229H19.3621C19.5833 16.6229 19.7711 16.8006 19.7778 17.0118L19.8046 20.8742C19.8046 20.9814 19.7577 21.0854 19.6839 21.1558C19.6001 21.2295 19.4995 21.2664 19.3889 21.2664H9.02893C10.1655 26.3693 15.2818 29.0347 19.7409 29.0347C22.6042 29.0347 24.1867 28.7095 27.1102 26.1044L34.6103 18.9094C41.4801 11.8251 49.2584 3.79865 57.7073 3.79865C61.3384 3.79865 64.7179 5.25039 68.0505 8.22762C68.0874 8.25444 68.1344 8.28127 68.1612 8.31144C70.1829 10.3097 71.5977 12.7739 72.2415 15.4595C72.2784 15.5768 72.2415 15.6975 72.1677 15.788C72.0839 15.8886 71.9632 15.9356 71.8458 15.9356H67.6214C67.437 15.9356 67.2794 15.8249 67.2224 15.6606C65.8746 11.5435 61.563 8.65677 56.7317 8.65677C53.8383 8.65677 51.1661 9.73635 49.2249 11.6675C49.2249 11.6675 44.3936 16.1166 41.7349 18.8659C34.8819 25.9435 27.127 33.9398 18.6949 33.9498L18.7016 33.9364V33.9364Z" fill="#0C86FF"></path>' +
                '<defs><linearGradient id="paint0_linear_4673_53665" x1="28.5995" y1="29.712" x2="72.3796" y2="29.712" gradientUnits="userSpaceOnUse"><stop stop-color="#0C86FF"></stop><stop offset="1" stop-color="#0A42E7"></stop></linearGradient></defs>' +
                '</svg>' +
                'Run on Ethernity Cloud' +
                '</div></button>');
            setTimeout(() => {
                $('#runOnEthernityButton').click(async () => await runOnEthernityHandler());
            }, 1000);
        }

        const load_ipython_extension = async () => {
            await initialize();
            createEtnyButton();
        }

        return {
            load_ipython_extension: load_ipython_extension,
        }
    });
