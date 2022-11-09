define(function (require, exports, module) {
    const ethers = require("https://cdnjs.cloudflare.com/ajax/libs/ethers/5.6.8/ethers.umd.min.js");
    const abi = require('./abi');

    const etnyContractAddress = "0x549A6E06BB2084100148D50F51CF77a3436C3Ae7";
    const IMAGE_HASH = "QmSwHhD3puVphVUqFUVGqZA8eMYNBehr4HDtXLvdNbPP4g:etny-pynithy";

    let provider, signer, etnyContract = null;

    const isAddress = (address) => {
        try {
            ethers.utils.getAddress(address);
        } catch (e) {
            return false;
        }
        return true;
    };

    const initContract = () => {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        etnyContract = new ethers.Contract(etnyContractAddress, abi, signer);
    }

    const getContract = () => {
        return etnyContract;
    }

    const getProvider = () => {
        return provider;
    }

    const getCurrentWallet = async () => {
        const accounts = await provider.listAccounts();
        return accounts[0];
    }

    const addDORequest = async (metadata1, metadata2, nodeAddress) => {
        const cpu = 1, memory = 1, storage = 40, bandwidth = 1, duration = 60, instances = 1, maxPrice = 0;
        return await etnyContract._addDORequest(cpu, memory, storage, bandwidth, duration, instances, maxPrice, IMAGE_HASH, metadata1, metadata2, nodeAddress);
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

    module.exports = {
        getContract,
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
        getResultFromOrder
    };
});