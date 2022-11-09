define(function (require, exports, module) {
    const BLOXBERG_API_URL = 'https://certify.bloxberg.org'
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

    const generatePDFForCertificate = async (data) => {
        fetch(`${BLOXBERG_API_URL}/generatePDF`, {
            method: 'POST',
            headers: setupHeaders(),
            body: JSON.stringify(data)
        })
            .then((response) => response.json())
            .then((data) => console.log(data));
    };

    module.exports = {createCertificate, generatePDFForCertificate};
});