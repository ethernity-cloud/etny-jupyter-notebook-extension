define(function (require, exports, module) {
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
            return `${generateHash(START_HASH_LENGTH)}${' '.repeat(emptyLength)}${generateHash(END_HASH_LENGTH)}`
        } else {
            const textLength = text.length;
            let emptyLength = HASH_LENGTH - START_HASH_LENGTH - END_HASH_LENGTH - textLength;
            emptyLength = emptyLength < 0 ? 0 : emptyLength - 1;
            return `${generateHash(START_HASH_LENGTH)} ${text}${' '.repeat(emptyLength)}${generateHash(END_HASH_LENGTH)}`
        }
    }

    const generateCertificate = (certificate) => {
        const publicTimestampDate = new Date(certificate.publicTimestamp * 1000);
        const timestampDate = new Date(certificate.resultTimestamp * 1000);
        return `
              ${generateHash()}
              ${generateTitle('ETHERNITY CLOUD CERTIFICATE')}
              ${generateHash()}
              ${insertCertificateRow(true)}
              ${insertCertificateRow(false, ` [INFO]   Contract address: ${certificate.contractAddress.trim()}`)}
              ${insertCertificateRow(false, ` [INFO]   Input transaction: ${certificate.inputTransactionHash.trim()}`)}
              ${insertCertificateRow(false, ` [INFO]   Output transaction: ${certificate.outputTransactionHash.trim()}`)}
              ${insertCertificateRow(false, ` [INFO]   PoX processing order: ${certificate.orderId}`)}
              ${insertCertificateRow(true)}
              ${insertCertificateRow(false, ` [INPUT]  Public image: ${certificate.imageHash.trim()}`)}
              ${insertCertificateRow(false, ` [INPUT]  Public script: ${certificate.scriptHash.trim()} `)}
              ${insertCertificateRow(false, ` [INPUT]  Public fileset: ${certificate.fileSetHash.trim()}`)}
              ${insertCertificateRow(false, ` [INPUT]  Public timestamp: ${formatDate(publicTimestampDate)} [${certificate.publicTimestamp}]`)}
              ${insertCertificateRow(true)}
              ${insertCertificateRow(false, ` [OUTPUT] Public result hash: ${certificate.resultHash.trim()}`)}
              ${insertCertificateRow(false, ` [OUTPUT] Public result: ${certificate.resultValue.trim()}`)}
              ${insertCertificateRow(false, ` [OUTPUT] Timestamp: ${formatDate(timestampDate)} [${certificate.resultTimestamp}] `)}
              ${generateHash()}
              ${generateHash()}
              `;
    }
    module.exports = {
        generateCertificate
    };
});