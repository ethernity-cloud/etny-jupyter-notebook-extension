/**
 * main.js
 * An extension that allows to execute a task using an existing enclave provided by Ethernity Cloud Network
 *
 * @version 0.2.0
 * @author  Ciprian Florea, ciprian@ethernity.cloud
 * @updated 2023-01-09
 *
 *
 */
define(["require", 'jquery', "base/js/namespace", "base/js/dialog", './bloxbergAPI', './etnyContract', './ipfs', './certificate', './cell', './crypto', './utils'], function (require, $, Jupyter, dialog, bloxbergAPI, etnyContract, ipfs, certificate, cells, crypto, utils) {
    let nodeAddressMetadata = '';
    let authorName, titleOfResearch, emailAddress = '';

    let __orderNumber = -1;
    let __dohash = null;
    let __doRequestId = -1;
    let __dorequest = -1;
    let __scriptHash = '';
    let __fileSetHash = '';

    let loadingCell = null;
    let loadingText = '';
    let findOrderRepeats = 1;
    let getResultFromOrderRepeats = 1;

    const LAST_BLOCKS = 20;

    const VERSION = 'v1';
    const ENCLAVE_IMAGE_IPFS_HASH = 'QmdyuRmvkgrQWQAESyGpkpbWJKtSEsSesRFodpvgfTHtzs';
    const ENCLAVE_IMAGE_NAME = 'etny-pynithy';
    const ENCLAVE_DOCKER_COMPOSE_IPFS_HASH = 'QmWoDZn181xdBPL85RW3qDeanLzgQz4L1AJ2ojjhqLJRGp';
    const ZERO_CHECKSUM = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const FILESET_HASH = `v1::${ZERO_CHECKSUM}`;

    const certPem = `-----BEGIN CERTIFICATE-----
        MIIBdDCB+6ADAgECAgkAk7lTTBumyLowCgYIKoZIzj0EAwMwEjEQMA4GA1UEAwwH
        Q0FfQ0VSVDAgFw0yMzAxMTExNjM1NDRaGA80MDk2MDEwMTAwMDAwMFowFjEUMBIG
        A1UEAwwLU0VSVkVSX0NFUlQwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAASUYAQ8ep17
        baZp+ScHpr48q/ijwsgPs/JlXEWFoHd0UTZaqurcs09NtNzfASASMyTBBNH+pEek
        kFBDitgLk8CmpVdGZ102IlCt1ZgVhygp12NEkHd1CNzdm+GYVjFSyHKjFzAVMBMG
        A1UdJQQMMAoGCCsGAQUFBwMBMAoGCCqGSM49BAMDA2gAMGUCMQDJ1h3DNllIi5u1
        Dc5voeCsTt2MPFk9iTCwGyKIrp/lrZPS3NgbJ53EPWO+71DgU4UCMHkffuV3+LHr
        X3dMoLpSb+NwpWVk+wb+agK3aRQQJb72pt+LFUOAnkq7DoQEB8rBjg==
        -----END CERTIFICATE-----`;

    const OrderTaskStatus = {
        0: "SUCCESS",
        1: "SYSTEM_ERROR",
        2: "KEY_ERROR",
        3: "SYNTAX_WARNING",
        4: "BASE_EXCEPTION",
        5: "PAYLOAD_NOT_DEFINED",
        6: "PAYLOAD_CHECKSUM_ERROR",
        7: "INPUT_CHECKSUM_ERROR"
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

    const initialize = async () => {
        ipfs.initialize();
        return await etnyContract.initContract();
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
                loadingText = cells.updateLastLineOfCell(loadingCell, loadingText, `\\ Waiting for the task to be processed by ${nodeAddressMetadata} ...`);
            } else {
                loadingText = cells.updateLastLineOfCell(loadingCell, loadingText, `/ Waiting for the task to be processed by ${nodeAddressMetadata} ...`);
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

    const getV1ImageMetadata = async (challengeHash) => {
        //generating encrypted base64 hash of the challenge
        const base64EncryptedChallenge = await crypto.encryptWithCertificate(challengeHash, certPem);

        // uploading to IPFS the base64 encrypted challenge
        const challengeIPFSHash = await ipfs.uploadToIPFS(base64EncryptedChallenge);

        // image metadata for v1 format v1:image_ipfs_hash:image_name:docker_Compose_ipfs_hash:client_challenge_ipfs_hash
        return `v1:${ENCLAVE_IMAGE_IPFS_HASH}:${ENCLAVE_IMAGE_NAME}:${ENCLAVE_DOCKER_COMPOSE_IPFS_HASH}:${challengeIPFSHash}`;
    }

    const getV1InputMetadata = async () => {
        // extracting code from all the code cells
        const code = cells.extractPythonCode();
        const scriptChecksum = crypto.sha256_1(code);
        // uploading all python code to IPFS and received hash of transaction
        __scriptHash = await ipfs.uploadToIPFS(code);

        return `v1:${__scriptHash}:${scriptChecksum}`
    }

    const parseOrderResult = (result) => {
        try {
            const arr = result.split(':');
            return {
                version: arr[0], transactionBytes: `0x${arr[1]}`, resultIPFSHash: arr[2]
            }
        } catch (e) {
            throw new Error('EtnyParseError');
        }
    }

    const parseTransactionBytes = (bytes) => {
        try {
            const result = etnyContract.parseTransactionBytes(bytes);
            // console.log(result);
            const arr = result.result.split(':');
            return {
                version: arr[0],
                from: result.from,
                taskCode: arr[1],
                taskCodeString: OrderTaskStatus[arr[1]],
                checksum: arr[2],
                enclaveChallenge: arr[3]
            }
        } catch (e) {
            throw new Error('EtnyParseError');
        }
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

    const createDORequest = async (imageMetadata, scriptHash) => {
        loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Submitting transaction for DO request on ${utils.formatDate()}`);
        // add here call to SC(smart contract)
        const tx = await callContractAddDORequest(imageMetadata, scriptHash, FILESET_HASH, nodeAddressMetadata);
        const transactionHash = tx.hash;
        __dohash = transactionHash;

        loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Waiting for transaction ${transactionHash} to be processed...`);
        const isProcessed = await waitForTransactionToBeProcessed(transactionHash);
        if (!isProcessed) {
            loadingText = cells.writeMessageToCell(loadingCell, loadingText, "Unable to create request, please check connectivity with Bloxberg node");
            return;
        }
        loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Transaction ${transactionHash} was confirmed`);
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

        nodeAddressMetadata = (await etnyContract.getOrder(orderId)).dproc;
    }

    const getResultFromOrder = async (orderId) => {
        // update the loading message to indicate the number of times the function has been repeated
        // loadingText = cells.updateLastLineOfCell(loadingCell, loadingText, `(${getResultFromOrderRepeats}) Waiting for the task to be processed...`);
        try {
            // get the result of the order using the `etnyContract` object
            const orderResult = await etnyContract.getResultFromOrder(orderId);
            // update the loading message to indicate that the task has been successfully processed
            loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Task with order number ${orderId}  was successfully processed at ${utils.formatDate()}`);

            // parse the order result
            const parsedOrderResult = parseOrderResult(orderResult);
            console.log(parsedOrderResult);
            // update the loading message to show the IPFS hash of the result
            loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Result IPFS hash: ${parsedOrderResult.resultIPFSHash}`);

            // parse the transaction bytes of the order result
            const transactionResult = parseTransactionBytes(parsedOrderResult.transactionBytes);
            console.log(transactionResult);

            // generate a wallet address using the `challengeHash` and `transactionResult.enclaveChallenge`
            const wallet = etnyContract.generateWallet(challengeHash, transactionResult.enclaveChallenge);
            console.log(wallet);
            // check if the generated wallet address matches the `transactionResult.from` address
            if (!wallet || wallet !== transactionResult.from) {
                return {success: false, message: 'Integrity check failed, signer wallet address is wrong.'};
            }

            // get the result value from IPFS using the `parsedOrderResult.resultIPFSHash`
            const ipfsResult = await ipfs.getFromIPFS(parsedOrderResult.resultIPFSHash);
            // update the loading message to show the result value
            loadingText = cells.writeMessageToCell(loadingCell, loadingText, `Result value: ${ipfsResult}`);
            // calculate the SHA-256 checksum of the result value
            const ipfsResultChecksum = crypto.sha256_1(ipfsResult);
            // check if the calculated checksum matches the `transactionResult.checksum`
            if (ipfsResultChecksum !== transactionResult.checksum) {
                return {success: false, message: 'Integrity check failed, checksum of the order result is wrong.'};
            }

            // get the original input transaction hash and the output transaction hash for the order
            const transaction = await etnyContract.getProvider().getTransaction(__dohash);
            const block = await etnyContract.getProvider().getBlock(transaction.blockNumber);
            const blockTimestamp = block.timestamp;
            const endBlockNumber = await etnyContract.getProvider().getBlockNumber();
            const startBlockNumber = endBlockNumber - LAST_BLOCKS;
            //
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
                success: true,
                author: authorName,
                projectDescription: titleOfResearch,
                emailAddress: emailAddress,
                contractAddress: etnyContract.contractAddress,
                inputTransactionHash: __dohash,
                outputTransactionHash: resultTransactionHash,
                orderId: orderId,
                imageHash: `${ENCLAVE_IMAGE_IPFS_HASH}:${ENCLAVE_IMAGE_NAME}`,
                scriptHash: __scriptHash,
                fileSetHash: __fileSetHash,
                publicTimestamp: blockTimestamp,
                resultHash: parsedOrderResult.resultIPFSHash,
                resultTaskCode: transactionResult.taskCodeString,
                resultValue: ipfsResult,
                resultTimestamp: resultBlockTimestamp
            };

        } catch (ex) {
            if (ex.name === 'EtnyParseError') {
                return {success: false, message: 'Ethernity Parsing Error'};
            }
            await utils.delay(5000);
            getResultFromOrderRepeats = getResultFromOrderRepeats + 1;
            return await getResultFromOrder(orderId);
        }
    }

    /// main method
    const runOnEthernity = async () => {
        await listenForAddDORequestEvent();

        // getting image metadata
        const imageMetadata = await getV1ImageMetadata(challengeHash);

        // getting script metadata
        const scriptMetadata = await getV1InputMetadata();

        // create new DO Request
        await createDORequest(imageMetadata, scriptMetadata);
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
            const walletAddress = (await etnyContract.getProvider().send("eth_requestAccounts", []))[0];
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
        loadingText = cells.writeMessageToCell(loadingCell, loadingText, 'Started running task...');

        const res = await connectToMetaMaskAndSign();

        if (res) {
            const authorInput = $(`<input id="authorName" class='form-control' type='text' value=''/>`);
            const emailAddressInput = $(`<input id="emailAddress" class='form-control' type='text' value=''/>`);
            const challengeHashValue = utils.generateRandomHexOfSize(20);
            // console.log(challengeHashValue);
            const challengeInput = $(`<input id="challengeInput" class='form-control' type='text' value='${challengeHashValue}'/>`);
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
                title: "Ethernity Cloud Runner v1", body: $("<div></div>")
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
                    .append($("<label style='font-weight: bold;'>Challenge</label>"))
                    .append(challengeInput)
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
                            challengeHash = $('#challengeInput').val();

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

    return {
        run: runOnEthernityHandler,
    }
});
