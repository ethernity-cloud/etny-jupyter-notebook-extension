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
        try {
            const data = {
                publicKey: walletAddress,
                crid: [crid],
                cridType: "sha2-256",
                enableIPFS: false,
                metadataJson: JSON.stringify(metadataJson)
            }

            const res = await fetch(`${BLOXBERG_API_URL}/createBloxbergCertificate`, {
                method: 'POST',
                headers: setupHeaders(),
                body: JSON.stringify(data)
            });

            return await res.json();
        } catch (e) {
            return null;
        }
    };

    const generatePDFForCertificate = async (data) => {
        try {
            return await fetch(`${BLOXBERG_API_URL}/generatePDF`, {
                method: 'POST',
                headers: setupHeaders(),
                body: JSON.stringify(data)
            }).then((response) => response.blob())
                .then((data) => {
                    let a = document.createElement('a');
                    a.href = URL.createObjectURL(data);
                    a.setAttribute('download', `BloxbergCertificate-${new Date().getTime()}`);
                    a.click();
                })
                .catch((err) => console.error(err));

        } catch (e) {
            console.log(e);
            return null;
        }
    };

    module.exports = {createCertificate, generatePDFForCertificate};
});