define(function (require, exports, module) {
    const html2canvas = require('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    const js_sha256 = require('https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js');
    const DIV_IMAGE_ID = 'ethernity_certificate';

    const HASH_LENGTH = 121;
    const START_HASH_LENGTH = 10;
    const END_HASH_LENGTH = 10;
    const formatDate = (dt) => {
        const padL = (nr, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);

        return `${padL(dt.getDate())}/${padL(dt.getMonth() + 1)}/${dt.getFullYear()} ${padL(dt.getHours())}:${padL(dt.getMinutes())}:${padL(dt.getSeconds())}`;
    }

    const generateHash = (length) => "#".repeat(length || HASH_LENGTH);

    const generateTitle = (title) => {
        const titleLength = title.length + 2;
        const hashLength = Math.round((HASH_LENGTH - titleLength) / 2);
        return `${generateHash(hashLength)} ${title} ${generateHash(hashLength)}`;
    }

    const insertCertificateRow = (isEmpty, text) => {
        if (isEmpty) {
            const emptyLength = HASH_LENGTH - START_HASH_LENGTH - END_HASH_LENGTH;
            return `${generateHash(START_HASH_LENGTH)}${`&ensp;`.repeat(emptyLength)}${generateHash(END_HASH_LENGTH)}`
        } else {
            const textLength = text.length;
            let emptyLength = HASH_LENGTH - START_HASH_LENGTH - END_HASH_LENGTH - textLength;
            emptyLength = emptyLength < 0 ? 0 : emptyLength;
            console.log(emptyLength);
            return `${generateHash(START_HASH_LENGTH)} ${text}${'&ensp;'.repeat(emptyLength)}${generateHash(END_HASH_LENGTH)}`
        }
    }

    const generateCertificate = (certificate) => {
        const publicTimestampDate = new Date(certificate.publicTimestamp * 1000);
        const timestampDate = new Date(certificate.resultTimestamp * 1000);
        return `
            <div style="font-family: monospace;font-size: 14px;color: #16a34a;">
              <span>${generateHash()}</span>
              <br>              
              <span>${generateTitle('ETHERNITY CLOUD CERTIFICATE')}</span>
              <br>              
              <span>${generateHash()}</span>
              <br>              
              <span>${insertCertificateRow(true)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [INFO] Contract address: ${certificate.contractAddress}`)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [INFO] Input transaction: ${certificate.inputTransactionHash.trim()}`)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [INFO] Output transaction: ${certificate.outputTransactionHash.trim()}`)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [INFO] PoX processing order: ${certificate.orderId}`)}</span>
              <br>
              <span>${insertCertificateRow(true)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [INPUT] Public image: ${certificate.imageHash.trim()}`)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [INPUT] Public script: ${certificate.scriptHash.trim()}`)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [INPUT] Public fileset: ${certificate.fileSetHash.trim()}`)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [INPUT] Public timestamp: ${formatDate(publicTimestampDate)} [${certificate.publicTimestamp}]`)}</span>
              <br>
              <span>${insertCertificateRow(true)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [OUTPUT] Public result hash: ${certificate.resultHash.trim()}`)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [OUTPUT] Public result: ${certificate.resultValue.trim()}`)}</span>
              <br>
              <span>${insertCertificateRow(false, ` [OUTPUT] Timestamp: ${formatDate(timestampDate)} [${certificate.resultTimestamp}]`)}</span>
              <br>
              <span>${generateHash()}</span>
              <br>
              <span>${generateHash()}</span>
            </div>`;
    }

    const saveImage = (canvas) => {
        const link = document.createElement('a');
        link.download = 'filename.png';
        link.href = canvas.toDataURL()
        link.click();
    }

    const getBufferFromCanvas = (canvas) => {
        return new Promise((resolve, reject) => {
            try {
                canvas.toBlob((blob) => {
                    blob.arrayBuffer().then(buff => {
                        return resolve(buff);
                    });
                });
            } catch (err) {
                console.log(err);
                reject(err);
            }
        })

    }
    const generateSha256FromImage = async ($) => {
        try {
            const element = $(`#${DIV_IMAGE_ID}`);
            const canvas = await html2canvas(element[0]);
            saveImage(canvas);
            const buff = await getBufferFromCanvas(canvas);
            const sha = js_sha256.sha256(buff);
            console.log(sha);
            return sha;
        } catch (e) {
            return null;
        }
    };

    module.exports = {
        generateCertificate,
        generateSha256FromImage
    };
});