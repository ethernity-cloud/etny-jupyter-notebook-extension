define(function (require, exports, module) {
    const ethers = require("https://cdnjs.cloudflare.com/ajax/libs/ethers/5.6.8/ethers.umd.min.js");
    const abi = require('./imageRegistryAbi');
    const contractAddress = "0x6ca77d7C997b0873b2Ba0361387e56E2C5c0FEE8";

    let provider, signer, contract = null, etnyContactWithProvider, currentWallet;

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
        contract = new ethers.Contract(contractAddress, abi, signer);
        etnyContactWithProvider = new ethers.Contract(contractAddress, abi, provider);
        currentWallet = await _getCurrentWallet();
    }

    const getSigner = () => {
        return signer;
    }

    const getContract = () => {
        return contract;
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


    const getEnclaveDetails = async (imageName, version) => {
        console.log(imageName, '-', version);
        try {
            return await contract.getLatestImageVersionPublicKey(imageName, version);
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    const getEnclaveDetailsV3 = async (imageName, version) => {
        console.log(imageName, '-', version);
        try {
            return await contract.getLatestTrustedZoneImageCertPublicKey(imageName, version);
        } catch (e) {
            console.log(e);
            return null;
        }
    }


    module.exports = {
        getContract,
        getSigner,
        contractAddress: contractAddress,
        getProvider,
        signer: signer,
        isAddress,
        getCurrentWallet,
        initContract,
        getEnclaveDetails,
        getEnclaveDetailsV3
    };
});
