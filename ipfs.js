define(function (require, exports, module) {
    const ipfsHttpClient = require('https://unpkg.com/ipfs-http-client/dist/index.min.js');
    const ipfsAddress = "https://ipfs.ethernity.cloud:5001";
    let ipfs = null;

    const initialize = () => {
        ipfs = window.IpfsHttpClient.create(ipfsAddress);
    }

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

    const delay = ms => new Promise(res => setTimeout(res, ms));

    module.exports = {
        initialize,
        uploadToIPFS,
        getFromIPFS
    };
});