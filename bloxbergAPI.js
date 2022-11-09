define(function (require, exports, module) {
    // const BLOXBERG_API_URL = 'https://certify.bloxberg.org'
    const BLOXBERG_API_URL = 'https://api.ethernity.cloud'
    const BLOXBERG_API_SECRET_KEY = '68530229-8c87-41e1-b6f6-554378e6ba65';

    const setupHeaders = () => {
        const headers = new Headers();
        headers.append('accept', ' application/json');
        headers.append('Content-Type', ' application/json');
        headers.append('api_key', BLOXBERG_API_SECRET_KEY);
        return headers;
    };


    const createCertificate = async (walletAddress, crid, metadataJson) => {
        const data = {
            publicKey: walletAddress,
            crid: [crid],
            cridType: "sha2-256",
            enableIPFS: false,
            metadataJson: JSON.stringify(metadataJson)
        }

        fetch(`${BLOXBERG_API_URL}/createBloxbergCertificate`, {
            method: 'POST',
            headers: setupHeaders(),
            body: JSON.stringify(data)
        })
            .then((response) => response.json())
            .then((data) => console.log(data));
    };

    const create = async () => {
      await createCertificate('0xAfebaB49BA2D05091A58FA89ecA4Bfd99AeF1EAd', '0x0e4ded5319861c8daac00d425c53a16bd180a7d01a340a0e00f7dede40d2c9f6', {"publicKey":"0xAfebaB49BA2D05091A58FA89ecA4Bfd99AeF1EAd","crid":["0x0e4ded5319861c8daac00d425c53a16bd180a7d01a340a0e00f7dede40d2c9f6"],"cridType":"sha2-256","enableIPFS":false,"metadataJson":"{\"contractAddress\":\"0x549A6E06BB2084100148D50F51CF77a3436C3Ae7\",\"inputTransactionHash\":\"0x177a8608f3c4c94d1f325a40ae71a85f8329aeb9f0a8c9abd82142e75ddbe2f9\",\"outputTransactionHash\":\"0xe5fbb37e7b348db8a5e680beefd445710d6fdafe9172718c57d078324acc8036\",\"orderId\":5114,\"imageHash\":\"QmSwHhD3puVphVUqFUVGqZA8eMYNBehr4HDtXLvdNbPP4g:etny-pynithy\",\"scriptHash\":\"Qme4gka4XSEH3QxQuQxsssK6hwePrQPoyvYQM5nVq454jL\",\"fileSetHash\":\"Qme3i7UGCq92wiYHrVrfjKxfv8XxCNjeCfFAd5NJQdedUN\",\"publicTimestamp\":1667995660,\"resultHash\":\"QmepbM7swPAdnVM7fST38ks4piCPt5Fj1qeq7K1ag7YbRP\",\"resultValue\":\"2000\\n\",\"resultTimestamp\":1667995270}"});
    }

    const generatePDFForCertificate = async (data) => {
        fetch(`${BLOXBERG_API_URL}/generatePDF`, {
            method: 'POST',
            headers: setupHeaders(),
            body: JSON.stringify(data)
        })
            .then((response) => response.json())
            .then((data) => console.log(data));
    };

    module.exports = {create, createCertificate, generatePDFForCertificate};
});