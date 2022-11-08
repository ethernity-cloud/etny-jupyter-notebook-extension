/**
 * etny.js
 * An extension that allows you to execute a task using an existing enclave provided by Ethernity Network
 *
 *
 * @version 0.2.0
 * @author  Ciprian Florea, ciprian@ethernity.cloud
 * @updated 2022-11-08
 *
 *
 */
define(["require", "base/js/namespace", "base/js/dialog", "https://cdnjs.cloudflare.com/ajax/libs/ethers/5.6.8/ethers.umd.min.js", "https://unpkg.com/ipfs-http-client/dist/index.min.js"],
    function (requirejs, Jupyter, dialog, ethers, ipfsHttpClient) {
        const ipfsAddress = "http://ipfs.ethernity.cloud:5001";
        const etnyContractAddress = "0x549A6E06BB2084100148D50F51CF77a3436C3Ae7";
        const __imageHash = "QmSwHhD3puVphVUqFUVGqZA8eMYNBehr4HDtXLvdNbPP4g:etny-pynithy";

        let ipfs = null;
        let __dohash = null;
        let __dorequest = 0;
        let __scriptHash = '';
        let __fileSetHash = '';
        let metadata3 = '';

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const abi = [{
            anonymous: false, inputs: [{
                indexed: true, internalType: "address", name: "tokenOwner", type: "address"
            }, {
                indexed: true, internalType: "address", name: "spender", type: "address"
            }, {
                indexed: false, internalType: "uint256", name: "tokens", type: "uint256"
            }], name: "Approval", type: "event"
        }, {
            anonymous: false, inputs: [{
                indexed: true, internalType: "address", name: "_from", type: "address"
            }, {
                indexed: true, internalType: "address", name: "_to", type: "address"
            }], name: "OwnershipTransferred", type: "event"
        }, {
            anonymous: false, inputs: [{
                indexed: true, internalType: "address", name: "_from", type: "address"
            }, {
                indexed: true, internalType: "address", name: "_to", type: "address"
            }], name: "ProxyTransferred", type: "event"
        }, {
            anonymous: false, inputs: [{
                indexed: true, internalType: "address", name: "from", type: "address"
            }, {
                indexed: true, internalType: "address", name: "to", type: "address"
            }, {
                indexed: false, internalType: "uint256", name: "tokens", type: "uint256"
            }], name: "Transfer", type: "event"
        }, {
            anonymous: false, inputs: [{
                indexed: true, internalType: "address", name: "_from", type: "address"
            }, {
                indexed: false, internalType: "uint256", name: "_rowNumber", type: "uint256"
            }], name: "_addDORequestEV", type: "event"
        }, {
            anonymous: false, inputs: [{
                indexed: true, internalType: "address", name: "_from", type: "address"
            }, {
                indexed: false, internalType: "uint256", name: "_rowNumber", type: "uint256"
            }], name: "_addDPRequestEV", type: "event"
        }, {
            anonymous: false, inputs: [{
                indexed: true, internalType: "address", name: "_from", type: "address"
            }, {
                indexed: false, internalType: "uint256", name: "_orderNumber", type: "uint256"
            }], name: "_placeOrderEV", type: "event"
        }, {
            payable: true, stateMutability: "payable", type: "fallback"
        }, {
            constant: false, inputs: [{
                internalType: "uint8", name: "_cpuRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "_memRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "_storageRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "_bandwidthRequest", type: "uint8"
            }, {
                internalType: "uint16", name: "_duration", type: "uint16"
            }, {
                internalType: "uint8", name: "_instances", type: "uint8"
            }, {
                internalType: "uint8", name: "_maxPrice", type: "uint8"
            }, {
                internalType: "string", name: "_metadata1", type: "string"
            }, {
                internalType: "string", name: "_metadata2", type: "string"
            }, {
                internalType: "string", name: "_metadata3", type: "string"
            }, {
                internalType: "string", name: "_metadata4", type: "string"
            }], name: "_addDORequest", outputs: [{
                internalType: "uint256", name: "_rowNumber", type: "uint256"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint8", name: "_cpuRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "_memRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "_storageRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "_bandwidthRequest", type: "uint8"
            }, {
                internalType: "uint16", name: "_duration", type: "uint16"
            }, {
                internalType: "uint8", name: "_minPrice", type: "uint8"
            }, {
                internalType: "string", name: "_metadata1", type: "string"
            }, {
                internalType: "string", name: "_metadata2", type: "string"
            }, {
                internalType: "string", name: "_metadata3", type: "string"
            }, {
                internalType: "string", name: "_metadata4", type: "string"
            }], name: "_addDPRequest", outputs: [{
                internalType: "uint256", name: "_rowNumber", type: "uint256"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }, {
                internalType: "string", name: "_key", type: "string"
            }, {
                internalType: "string", name: "_value", type: "string"
            }], name: "_addMetadataToDPRequest", outputs: [{
                internalType: "uint256", name: "_rowNumber", type: "uint256"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }, {
                internalType: "string", name: "_key", type: "string"
            }, {
                internalType: "string", name: "_value", type: "string"
            }], name: "_addMetadataToRequest", outputs: [{
                internalType: "uint256", name: "_rowNumber", type: "uint256"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint256", name: "_orderItem", type: "uint256"
            }, {
                internalType: "address", name: "processor", type: "address"
            }], name: "_addProcessorToOrder", outputs: [{
                internalType: "bool", name: "success", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint256", name: "_orderItem", type: "uint256"
            }, {
                internalType: "string", name: "_result", type: "string"
            }], name: "_addResultToOrder", outputs: [{
                internalType: "bool", name: "success", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "addr", type: "address"
            }], name: "_addToPresaleRound", outputs: [{
                internalType: "bool", name: "", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "addr", type: "address"
            }], name: "_addToPrivateSaleRound", outputs: [{
                internalType: "bool", name: "", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "addr", type: "address"
            }], name: "_addToPublicOneRound", outputs: [{
                internalType: "bool", name: "", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "addr", type: "address"
            }], name: "_addToPublicTwoRound", outputs: [{
                internalType: "bool", name: "", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "addr", type: "address"
            }], name: "_addToSeedRound", outputs: [{
                internalType: "bool", name: "", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint256", name: "_orderItem", type: "uint256"
            }], name: "_approveOrder", outputs: [{
                internalType: "bool", name: "success", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }], name: "_cancelDORequest", outputs: [], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }], name: "_cancelDPRequest", outputs: [], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: true, inputs: [], name: "_getBaseLockTimestamp", outputs: [{
                internalType: "uint128", name: "", type: "uint128"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }], name: "_getDORequest", outputs: [{
                internalType: "address", name: "downer", type: "address"
            }, {
                internalType: "uint8", name: "cpuRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "memoryRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "storageRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "bandwidthRequest", type: "uint8"
            }, {
                internalType: "uint16", name: "duration", type: "uint16"
            }, {
                internalType: "uint8", name: "maxPrice", type: "uint8"
            }, {
                internalType: "uint256", name: "status", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }], name: "_getDORequestMetadata", outputs: [{
                internalType: "address", name: "downer", type: "address"
            }, {
                internalType: "string", name: "metadata1", type: "string"
            }, {
                internalType: "string", name: "metadata2", type: "string"
            }, {
                internalType: "string", name: "metadata3", type: "string"
            }, {
                internalType: "string", name: "metadata4", type: "string"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "_getDORequestsCount", outputs: [{
                internalType: "uint256", name: "_length", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }], name: "_getDPRequest", outputs: [{
                internalType: "address", name: "dproc", type: "address"
            }, {
                internalType: "uint8", name: "cpuRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "memoryRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "storageRequest", type: "uint8"
            }, {
                internalType: "uint8", name: "bandwidthRequest", type: "uint8"
            }, {
                internalType: "uint16", name: "duration", type: "uint16"
            }, {
                internalType: "uint8", name: "minPrice", type: "uint8"
            }, {
                internalType: "uint256", name: "status", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }], name: "_getDPRequestMetadata", outputs: [{
                internalType: "address", name: "dproc", type: "address"
            }, {
                internalType: "string", name: "metadata1", type: "string"
            }, {
                internalType: "string", name: "metadata2", type: "string"
            }, {
                internalType: "string", name: "metadata3", type: "string"
            }, {
                internalType: "string", name: "metadata4", type: "string"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "_getDPRequestsCount", outputs: [{
                internalType: "uint256", name: "_length", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "address", name: "addr", type: "address"
            }], name: "_getLockoutTimestamp", outputs: [{
                internalType: "uint128", name: "", type: "uint128"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }], name: "_getMetadataCountForDPRequest", outputs: [{
                internalType: "uint256", name: "_length", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }], name: "_getMetadataCountForRequest", outputs: [{
                internalType: "uint256", name: "_length", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }, {
                internalType: "uint256", name: "_metadataItem", type: "uint256"
            }], name: "_getMetadataValueForDPRequest", outputs: [{
                internalType: "string", name: "key", type: "string"
            }, {
                internalType: "string", name: "value", type: "string"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_requestListItem", type: "uint256"
            }, {
                internalType: "uint256", name: "_metadataItem", type: "uint256"
            }], name: "_getMetadataValueForRequest", outputs: [{
                internalType: "string", name: "key", type: "string"
            }, {
                internalType: "string", name: "value", type: "string"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "_getMyDOOrders", outputs: [{
                internalType: "uint256[]", name: "req", type: "uint256[]"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "_getMyDORequests", outputs: [{
                internalType: "uint256[]", name: "req", type: "uint256[]"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "_getMyDPRequests", outputs: [{
                internalType: "uint256[]", name: "req", type: "uint256[]"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_orderItem", type: "uint256"
            }], name: "_getOrder", outputs: [{
                internalType: "address", name: "downer", type: "address"
            }, {
                internalType: "address", name: "dproc", type: "address"
            }, {
                internalType: "uint256", name: "doRequest", type: "uint256"
            }, {
                internalType: "uint256", name: "dpRequest", type: "uint256"
            }, {
                internalType: "uint256", name: "status", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "_getOrdersCount", outputs: [{
                internalType: "uint256", name: "_length", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "uint256", name: "_orderItem", type: "uint256"
            }], name: "_getResultFromOrder", outputs: [{
                internalType: "string", name: "_Result", type: "string"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint256", name: "_doRequestItem", type: "uint256"
            }, {
                internalType: "uint256", name: "_dpRequestItem", type: "uint256"
            }], name: "_placeOrder", outputs: [{
                internalType: "uint256", name: "_orderNumber", type: "uint256"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "addr", type: "address"
            }], name: "_removeLockoutTimestamp", outputs: [{
                internalType: "bool", name: "", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "uint128", name: "timestamp", type: "uint128"
            }], name: "_setBaseLockTimestamp", outputs: [{
                internalType: "bool", name: "", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: true, inputs: [], name: "_totalSupply", outputs: [{
                internalType: "uint256", name: "", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: false,
            inputs: [],
            name: "acceptOwnership",
            outputs: [],
            payable: false,
            stateMutability: "nonpayable",
            type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "address", name: "tokenOwner", type: "address"
            }, {
                internalType: "address", name: "spender", type: "address"
            }], name: "allowance", outputs: [{
                internalType: "uint256", name: "remaining", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "spender", type: "address"
            }, {
                internalType: "uint256", name: "tokens", type: "uint256"
            }], name: "approve", outputs: [{
                internalType: "bool", name: "success", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "spender", type: "address"
            }, {
                internalType: "uint256", name: "tokens", type: "uint256"
            }, {
                internalType: "bytes", name: "data", type: "bytes"
            }], name: "approveAndCall", outputs: [{
                internalType: "bool", name: "success", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: true, inputs: [{
                internalType: "address", name: "tokenOwner", type: "address"
            }], name: "balanceOf", outputs: [{
                internalType: "uint256", name: "balance", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "callerAddress", outputs: [{
                internalType: "address", name: "", type: "address"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "decimals", outputs: [{
                internalType: "uint8", name: "", type: "uint8"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "implementation", outputs: [{
                internalType: "address", name: "", type: "address"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "implementationPro", outputs: [{
                internalType: "address", name: "", type: "address"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "name", outputs: [{
                internalType: "string", name: "", type: "string"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "newOwner", outputs: [{
                internalType: "address", name: "", type: "address"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "owner", outputs: [{
                internalType: "address", name: "", type: "address"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "symbol", outputs: [{
                internalType: "string", name: "", type: "string"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: true, inputs: [], name: "totalSupply", outputs: [{
                internalType: "uint256", name: "", type: "uint256"
            }], payable: false, stateMutability: "view", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "to", type: "address"
            }, {
                internalType: "uint256", name: "tokens", type: "uint256"
            }], name: "transfer", outputs: [{
                internalType: "bool", name: "success", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "tokenAddress", type: "address"
            }, {
                internalType: "uint256", name: "tokens", type: "uint256"
            }], name: "transferAnyERC20Token", outputs: [{
                internalType: "bool", name: "success", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "from", type: "address"
            }, {
                internalType: "address", name: "to", type: "address"
            }, {
                internalType: "uint256", name: "tokens", type: "uint256"
            }], name: "transferFrom", outputs: [{
                internalType: "bool", name: "success", type: "bool"
            }], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "_newOwner", type: "address"
            }], name: "transferOwnership", outputs: [], payable: false, stateMutability: "nonpayable", type: "function"
        }, {
            constant: false, inputs: [{
                internalType: "address", name: "_newProxy", type: "address"
            }], name: "transferProxy", outputs: [], payable: false, stateMutability: "nonpayable", type: "function"
        }];

        let etnyContract = null;

        const getAccountAddress = async () => {
            return await signer.getAddress();
        }

        const getBalance = async (account) => {
            try {
                const balance = await etnyContract.balanceOf(account);
                // convert a currency unit from wei to ether
                const balanceFormatted = ethers.utils.formatEther(balance);
                console.log(`balance: ${balanceFormatted} ETNY`);

                return balanceFormatted;
            } catch (ex) {
                alert(ex.message);
                return ex.message;
            }
        }

        const initialize = async () => {
            ipfs = window.IpfsHttpClient.create(ipfsAddress);
            etnyContract = new ethers.Contract(etnyContractAddress, abi, signer);
            await listenForAddDORequestEvent();
        }

        const listenForAddDORequestEvent = async () => {
            await etnyContract.on("_addDORequestEV", (_from, _rowNumber) => {
                console.log('emited');
                __dorequest = _rowNumber.toNumber();
                console.log(__dorequest);
            });
        }

        const getCurrentTime = () => {
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            const yyyy = today.getFullYear();

            return mm + '/' + dd + '/' + yyyy;
        }

        const delay = ms => new Promise(res => setTimeout(res, ms));

        const uploadToIPFS = async (code) => {
            console.log('Uploading payload to IPFS...');
            const response = await ipfs.add(code);
            console.log(response);

            return response.path;
        }

        const getFromIPFS = async (hash) => {
            console.log('Downloading payload from IPFS...');
            let res = "";
            try {
                for await (const file of ipfs.cat(hash)) {
                    res += new TextDecoder().decode(file.buffer);
                }

                return res;
            } catch (error) {
                console.error(error.message);
                await delay(2000);
                return await getFromIPFS(hash);
            }
        }

        const callContractAddDORequest = async (metadata1, metadata2, metadata3) => {
            const cpu = 1, memory = 1, storage = 40, bandwidth = 1, duration = 60, instances = 1, maxPrice = 0;
            return await etnyContract._addDORequest(cpu, memory, storage, bandwidth, duration, instances, maxPrice, __imageHash, metadata1, metadata2, metadata3);
        }

        const waitForTransactionToBeProcessed = async (transactionHash) => {
            await provider.waitForTransaction(transactionHash);
            const txReceipt = await provider.getTransactionReceipt(transactionHash);
            console.log(txReceipt);
            // TODO add dialog
            if (!txReceipt && txReceipt.status === 0) {
                return false;
            }

            return true;
        }

        const createDORequest = async (scriptHash, filesetHash) => {
            console.log(`Submitting transaction for DO request on ${getCurrentTime()}`);
            // add here call to SC(smart contract)
            const tx = await callContractAddDORequest(scriptHash, filesetHash, metadata3);
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
                await delay(1000);
                await waitUntilDoRequestIdIsValid();
            }
        }

        const findOrderId = async () => {
            try {
                console.log('Waiting for the order to be placed and be taken into processing...');
                let orderId = -1;
                const resCount = await etnyContract._getOrdersCount();
                const count = resCount.toNumber();
                console.log(`Orders count: ${count}`);

                await waitUntilDoRequestIdIsValid();

                for (let i = count - 1, _pj_a = count - 5; i > _pj_a; i += -1) {
                    // console.log(i);
                    if (__dorequest !== 0) {
                        const order = await etnyContract._getOrder(i);
                        // console.log(order);
                        if (order[2].toNumber() === __dorequest && order[4].toNumber() === 0) {
                            orderId = i;
                            break;
                        }
                    }
                }

                if (orderId === -1) {
                    await delay(2000);
                    return await findOrderId();
                } else {
                    return orderId;
                }
            } catch (ex) {
                console.error(ex.message);
                await delay(2000);
                return await findOrderId();
            }
        }

        const approveOrder = async (orderId) => {
            const tx = await etnyContract._approveOrder(orderId);
            console.log(tx);
            const isProcessed = await waitForTransactionToBeProcessed(tx.hash);
            if (!isProcessed) {
                console.log("Unable to approve order, please check conectivity with bloxberg node");
                return;
            }
            console.log(`Order approved succcessfully!`)
            console.log(`TX hash: ${tx.hash}`);
        }

        const getResultFromOrder = async (orderId) => {
            console.log('Waiting for task to finish...');
            try {
                const result = await etnyContract._getResultFromOrder(orderId);
                console.log(result);
                const ipfsResult = await getFromIPFS(result);
                console.log(ipfsResult);

                const transaction = await provider.getTransaction(__dohash);
                const block = await provider.getBlock(transaction.blockNumber);
                let blockTimestamp = block.timestamp;
                let blockDatetime = new Date(blockTimestamp * 1000).toString();
                let endBlockNumber = await provider.getBlockNumber();
                let startBlockNumber = endBlockNumber - 100;

                let resultTransactionHash, resultBlockTimestamp, resultBlockDateTime;

                for (let i = endBlockNumber; i >= startBlockNumber; i--) {
                    const block = await provider.getBlockWithTransactions(i);
                    if (!block || !block.transactions) continue;

                    for (const transaction of block.transactions) {
                        if (transaction.to === etnyContractAddress && transaction.data) {
                            resultTransactionHash = transaction.hash;
                            resultBlockTimestamp = block.timestamp;
                            resultBlockDateTime = new Date(resultBlockTimestamp * 1000);
                        }
                    }
                }

                return `
              #############################################################################################################
              ######################################### bloxberg PoX certificate ##########################################
              #############################################################################################################
              ######                                                                                                 ######
              ###### [INFO]   contract address: 0x549A6E06BB2084100148D50F51CF77a3436C3Ae7                           ######
              ###### [INFO]   input transaction: ${__dohash}                                                         ######
              ###### [INFO]   output transaction: ${resultTransactionHash}                                           ######
              ###### [INFO]   PoX processing order: ${orderId}                                                       ######              
              ######                                                                                                 ######
              ###### [INPUT]  public image: ${__imageHash}                                                           ######
              ###### [INPUT]  public script: ${__scriptHash}                                                         ######
              ###### [INPUT]  public fileset: ${__fileSetHash}                                                       ######
              ###### [INPUT]  public timestamp: ${blockDatetime} [${blockTimestamp}]                                 ######
              ###### [OUTPUT] public result hash: ${result}                                                          ######
              ###### [OUTPUT] public result: ${ipfsResult}                                                           ######
              ###### [OUTPUT] timestamp: ${resultBlockDateTime} [${resultBlockTimestamp}]                            ######
              #############################################################################################################
              #############################################################################################################
              `;
            } catch (ex) {
                await delay(5000);
                return await getResultFromOrder(orderId);
            }
        }

        /// main method
        const runOnEthernity = async () => {
            // extracting code from all the code cells
            const code = extractPythonCode();

            // uploading all python code to IPFS and received hash of transaction
            const scriptHash = await uploadToIPFS(code);
            __scriptHash = scriptHash;
            const filesetHash = await uploadToIPFS("ethernithy");
            __fileSetHash = filesetHash;

            // create new DO Request
            await createDORequest(scriptHash, filesetHash);

            // search for the above created order
            const orderId = await findOrderId();

            // orderId = 4161;
            if (orderId === 0) return;

            // approve order
            await approveOrder(orderId);

            // get processed result from the order and create a certificate
            const certificate = await getResultFromOrder(orderId);

            generateCertificate(certificate);
        }

        const connectToMetaMaskAndSign = async () => {
            try {
                await provider.send("eth_requestAccounts", []);
                return true;
            } catch (e) {
                return false;
            }
        }

        const extractPythonCode = () => {
            const source_code = Jupyter.notebook.get_cells().map(function (cell) {
                if (cell.cell_type == "code") {
                    const source = cell.code_mirror.getValue();
                    if (!source.startsWith("%%javascript")) {
                        return source;
                    }
                }
            }).join("\n");

            console.log(source_code);
            return source_code;
        }

        const generateCertificate = (certificate) => {
            let cell = Jupyter.notebook.insert_cell_at_bottom('code');
            cell.set_text(`${certificate}`);
        }

        const isAddress = (address) => {
            try {
                ethers.utils.getAddress(address);
            } catch (e) {
                return false;
            }
            return true;
        };

        const runOnEthernityHandler = async () => {
            const res = await connectToMetaMaskAndSign();

            if (res) {
                const nodeAddressCheckbox = $(` <div class="checkbox">
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
                            metadata3 = '';
                            $('#nodeAddress').val('');
                        }
                    });
                }
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
                                    if (isAddress(nodeAddress)) {
                                        metadata3 = nodeAddress;
                                    } else {
                                        alert('Introduced address is not a valid wallet address');
                                        return false;
                                    }
                                } else {
                                    metadata3 = '';
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
                    title: "MetaMask",
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
                text: "Run on Ethernity Cloud",
                help_index: "zz",
                handler: runOnEthernityHandler,
            };
            const prefix = "etny_extension";
            const action_name = "run-on-etny";

            return Jupyter.actions.register(action, action_name, prefix);
        }

        const load_ipython_extension = async () => {
            await initialize();
            Jupyter.toolbar.add_buttons_group([createRunOnEthernityAction()
                // createMetaMaskConnectAction()
            ]);
        }

        return {
            load_ipython_extension: load_ipython_extension,
        };
    });
