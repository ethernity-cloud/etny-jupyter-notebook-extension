define(function (require, exports, module) {
    const ethers = require("https://cdnjs.cloudflare.com/ajax/libs/ethers/5.6.8/ethers.umd.min.js");
    const abi = require('./abi');
    const crypto = require('./crypto');
    require("https://cdn.jsdelivr.net/npm/abi-decoder@1.2.0/dist/abi-decoder.js");


    const etnyContractAddress = "0x70c5c7b31E116AF7156Cf69BD0Edbf9B2A86ad88";
    const IMAGE_HASH = "QmexKQm3wqeV63kR1G83ktCzodMAsdYRi4vV4RGhn1e1NT:etny-pynithy";

    let provider, signer, etnyContract = null, etnyContactWithProvider, currentWallet;

    const isAddress = (address) => {
        try {
            ethers.utils.getAddress(address);
        } catch (e) {
            return false;
        }
        return true;
    };

    const initContract = async () => {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        etnyContract = new ethers.Contract(etnyContractAddress, abi, signer);
        etnyContactWithProvider = new ethers.Contract(etnyContractAddress, abi, provider);
        currentWallet = await _getCurrentWallet();
    }

    const getSigner = () => {
        return signer;
    }

    const getContract = () => {
        return etnyContract;
    }

    const getProvider = () => {
        return provider;
    }
    const getCurrentWallet = () => {
        return currentWallet;
    }

    const _getCurrentWallet = async () => {
        try {
            const accounts = await provider.listAccounts();
            return accounts[0];
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    const addDORequest = async (imageMetadata = IMAGE_HASH, payloadMetadata, inputMetadata, nodeAddress) => {
        const cpu = 1, memory = 1, storage = 40, bandwidth = 1, duration = 60, instances = 1, maxPrice = 10;
        return await etnyContract._addDORequest(cpu, memory, storage, bandwidth, duration, instances, maxPrice, imageMetadata, payloadMetadata, inputMetadata, nodeAddress);
    }

    const getOrdersCount = async () => {
        return await etnyContract._getOrdersCount();
    }

    const getOrder = async (orderId) => {
        return await etnyContract._getOrder(orderId);
    }

    const approveOrder = async (orderId) => {
        const tx = await etnyContract._approveOrder(orderId);
        return tx;
    }

    const getResultFromOrder = async (orderId) => {
        return await etnyContract._getResultFromOrder(orderId);
    }

    const isNodeOperator = async (account) => {
        try {
            const requests = await etnyContactWithProvider._getMyDPRequests({from: account});
            return requests.length > 0;
        } catch (ex) {
            console.log(ex);
            return false;
        }
    }

    const parseTransactionBytes = (bytesInput) => {
        const parsedTransaction = ethers.utils.parseTransaction(bytesInput);
        console.log(parsedTransaction);
        window.abiDecoder.addABI(abi);
        const decodedData = abiDecoder.decodeMethod(parsedTransaction.data);
        const result = decodedData.params[1].value;
        return {
            from: parsedTransaction.from,
            result: result
        };
    }

    const createRandomWallet = () => {
        return ethers.Wallet.createRandom();
    }

    const generateWallet = (clientChallenge, enclaveChallenge) => {
        try {
            const encoded = clientChallenge + enclaveChallenge;
            console.log(encoded);
            const hash = crypto.sha256_1(crypto.sha256_1(encoded, true), true);
            console.log(`0x${hash}`);
            const wallet = new ethers.Wallet(`${hash}`);
            return wallet.address;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    // facem checksum la cod in clar + semnam cu wallet => trimitem in metadatele noastre
    // pe trusted zone  => calculez checksum la codul/input decriptat si verific semnatura ca e owner walletul care a initiat tranzactia
    const signMessage = async (message) => {
        console.log('message to sign: ', message);
        const signer = getSigner();
        console.log('signer:', signer);
        const signedMessage = await signer.signMessage(message);
        console.log(signedMessage);
        return signedMessage;
    }

    module.exports = {
        getContract,
        getSigner,
        contractAddress: etnyContractAddress,
        imageHash: IMAGE_HASH,
        getProvider,
        signer: signer,
        isAddress,
        getCurrentWallet,
        initContract,
        addDORequest,
        getOrdersCount,
        getOrder,
        approveOrder,
        getResultFromOrder,
        parseTransactionBytes,
        generateWallet,
        isNodeOperator,
        createRandomWallet,
        signMessage
    };
});
