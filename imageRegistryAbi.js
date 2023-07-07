define(function () {
    const abi = [{"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {
        "anonymous": false,
        "inputs": [{"indexed": true, "internalType": "address", "name": "wallet", "type": "address"}],
        "name": "AllowedWalletAdded",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": true, "internalType": "address", "name": "wallet", "type": "address"}],
        "name": "AllowedWalletRemoved",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{
            "indexed": false,
            "internalType": "string",
            "name": "ipfsHash",
            "type": "string"
        }, {"indexed": false, "internalType": "string", "name": "publicKey", "type": "string"}, {
            "indexed": false,
            "internalType": "string",
            "name": "version",
            "type": "string"
        }],
        "name": "ImageAdded",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string"}],
        "name": "ImageRemoved",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string"}],
        "name": "ImageValidated",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
        }, {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}],
        "name": "OwnerChanged",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string"}],
        "name": "TrustedZoneImageAdded",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string"}],
        "name": "TrustedZoneImageRemoved",
        "type": "event"
    }, {
        "inputs": [{"internalType": "address", "name": "wallet", "type": "address"}],
        "name": "addAllowedWallet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "ipfsHash", "type": "string"}, {
            "internalType": "string",
            "name": "certPublicKey",
            "type": "string"
        }, {"internalType": "string", "name": "version", "type": "string"}, {
            "internalType": "string",
            "name": "imageName",
            "type": "string"
        }, {"internalType": "string", "name": "dockerComposeHash", "type": "string"}],
        "name": "addImage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "ipfsHash", "type": "string"}, {
            "internalType": "string",
            "name": "certPublicKey",
            "type": "string"
        }, {"internalType": "string", "name": "version", "type": "string"}, {
            "internalType": "string",
            "name": "imageName",
            "type": "string"
        }, {"internalType": "string", "name": "dockerComposeHash", "type": "string"}],
        "name": "addTrustedZoneImage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "allowedWallets",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
        "name": "changeOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "ipfsHash", "type": "string"}],
        "name": "getImageCertPublicKey",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "imageName", "type": "string"}, {
            "internalType": "string",
            "name": "version",
            "type": "string"
        }],
        "name": "getLatestImageVersionPublicKey",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}, {
            "internalType": "string",
            "name": "",
            "type": "string"
        }, {"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "imageName", "type": "string"}, {
            "internalType": "string",
            "name": "version",
            "type": "string"
        }],
        "name": "getLatestTrustedZoneImageCertPublicKey",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}, {
            "internalType": "string",
            "name": "",
            "type": "string"
        }, {"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "ipfsHash", "type": "string"}],
        "name": "getTrustedZoneImageCertPublicKey",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "", "type": "string"}, {
            "internalType": "string",
            "name": "",
            "type": "string"
        }, {"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "imageVersions",
        "outputs": [{"internalType": "address", "name": "owner", "type": "address"}, {
            "internalType": "string",
            "name": "ipfsHash",
            "type": "string"
        }, {"internalType": "string", "name": "version", "type": "string"}, {
            "internalType": "bool",
            "name": "validated",
            "type": "bool"
        }, {"internalType": "string", "name": "certPublicKey", "type": "string"}, {
            "internalType": "string",
            "name": "dockerComposeHash",
            "type": "string"
        }, {"internalType": "string", "name": "name", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "", "type": "string"}],
        "name": "images",
        "outputs": [{"internalType": "address", "name": "owner", "type": "address"}, {
            "internalType": "string",
            "name": "ipfsHash",
            "type": "string"
        }, {"internalType": "string", "name": "version", "type": "string"}, {
            "internalType": "bool",
            "name": "validated",
            "type": "bool"
        }, {"internalType": "string", "name": "certPublicKey", "type": "string"}, {
            "internalType": "string",
            "name": "dockerComposeHash",
            "type": "string"
        }, {"internalType": "string", "name": "name", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address", "name": "wallet", "type": "address"}],
        "name": "removeAllowedWallet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "", "type": "string"}],
        "name": "trustedZoneImages",
        "outputs": [{"internalType": "address", "name": "owner", "type": "address"}, {
            "internalType": "string",
            "name": "ipfsHash",
            "type": "string"
        }, {"internalType": "string", "name": "version", "type": "string"}, {
            "internalType": "bool",
            "name": "validated",
            "type": "bool"
        }, {"internalType": "string", "name": "certPublicKey", "type": "string"}, {
            "internalType": "string",
            "name": "dockerComposeHash",
            "type": "string"
        }, {"internalType": "string", "name": "name", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "", "type": "string"}, {
            "internalType": "string",
            "name": "",
            "type": "string"
        }, {"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "trustedZoneVersions",
        "outputs": [{"internalType": "address", "name": "owner", "type": "address"}, {
            "internalType": "string",
            "name": "ipfsHash",
            "type": "string"
        }, {"internalType": "string", "name": "version", "type": "string"}, {
            "internalType": "bool",
            "name": "validated",
            "type": "bool"
        }, {"internalType": "string", "name": "certPublicKey", "type": "string"}, {
            "internalType": "string",
            "name": "dockerComposeHash",
            "type": "string"
        }, {"internalType": "string", "name": "name", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "string", "name": "ipfsHash", "type": "string"}],
        "name": "validateImage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }];

    return abi;
});
