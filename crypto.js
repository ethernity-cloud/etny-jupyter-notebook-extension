define(function (require, exports, module) {
    const forge = require('https://cdn.jsdelivr.net/npm/node-forge@1.0.0/dist/forge.min.js');
    const jsrsasign = require('https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/8.0.20/jsrsasign-all-min.js');
    const elliptic = require('https://cdnjs.cloudflare.com/ajax/libs/elliptic/6.5.4/elliptic.min.js');
    const js_sha256 = require('https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js');
    const ethereumjs = require('https://cdn.jsdelivr.net/gh/ethereumjs/browser-builds/dist/ethereumjs-tx/ethereumjs-tx-1.3.3.min.js');
    const ascii = require('./ascii');

    const curve = new elliptic.ec('p384');

    const sha256 = async (value) => {
        const buffer = new TextEncoder().encode(value);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer));
    }

    const sha256_1 = (value, asHex = false) => {
        const buffer = new TextEncoder().encode(value);
        const sha = js_sha256.sha256(buffer);
        if (asHex) {
            return sha.toString('hex');
        }
        return sha.toString();
    }
    const ecc_point_to_256_bit_key = async (point) => {
        const value = point.getX().toString() + point.getY().toString();
        const buffer = new TextEncoder().encode(value);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer));
    }

    const generateRandomBytes = (length) => {
        const array = new Uint16Array(length);
        crypto.getRandomValues(array);
        return array;
    }

    const encryptMsg = (msg, secretKey) => {
        if (secretKey.length !== 32) {
            throw new Error('Secret key must be 32 bytes (256 bits) long');
        }

        const iv = generateRandomBytes(16);
        // encrypt some bytes using GCM mode
        const cipher = forge.cipher.createCipher('AES-GCM', secretKey);
        cipher.start({iv: iv});
        cipher.update(forge.util.createBuffer(msg));
        cipher.finish();
        const encrypted = cipher.output;
        const tag = cipher.mode.tag;

        // outputs encrypted hex
        return {
            ciphertext: forge.util.bytesToHex(encrypted.data),
            iv: forge.util.bytesToHex(iv),
            authTag: forge.util.bytesToHex(tag.data)
        };
    }

    const encryptedDataToBase64Json = (encryptedMsg) => {
        const key = curve.keyFromPublic(encryptedMsg.cipherTextPublicKey, 'hex');
        const jsonObj = {
            ciphertext: encryptedMsg.ciphertext,
            nonce: encryptedMsg.nonce,
            authTag: encryptedMsg.authTag,
            x: key.getPublic().getX().toString(16),
            y: key.getPublic().getY().toString(16)
        };
        const jsonString = JSON.stringify(jsonObj);
        return btoa(jsonString);
    }

    const encrypt_ecc = async (msg, publicKey) => {
        const cipherTextPrivateKey = generateRandomBytes(32);
        const sharedEccKey = publicKey.getPublic().mul(cipherTextPrivateKey);
        const secretKey = await ecc_point_to_256_bit_key(sharedEccKey);
        // console.log(secretKey.toString('hex'));
        const encrypted = encryptMsg(msg, secretKey);
        const cipherTextPublicKey = curve.g.mul(cipherTextPrivateKey);
        return {
            ciphertext: encrypted.ciphertext,
            secretKey: secretKey,
            nonce: encrypted.iv,
            authTag: encrypted.authTag,
            cipherTextPublicKey: cipherTextPublicKey.encode('hex')
        };
    }

    const encrypt = async (pubKey, message) => {
        const publicKeyPoint = curve.keyFromPublic(pubKey, 'hex');
        const encryptedMessage = await encrypt_ecc(message, publicKeyPoint);
        const encryptedMessageObject = {
            ciphertext: encryptedMessage.ciphertext,
            nonce: encryptedMessage.nonce,
            authTag: encryptedMessage.authTag,
            ciphertextPubKey: encryptedMessage.cipherTextPublicKey
        };
        // console.log('encrypted msg:', encryptedMessageObject);

        const base64Encrypted = encryptedDataToBase64Json(encryptedMessage);
        console.log(base64Encrypted);
        return base64Encrypted;
    }

    const loadCertificate = (certificate) => {
        const c = new X509();
        c.readCertPEM(certificate);
        const pubKey = c.getPublicKey().pubKeyHex;
        // console.log(pubKey);
        return pubKey;
    }

    const execute = async (message, certificate) => {
        const pubKey = loadCertificate(certificate);
        // console.log(message);
        return await encrypt(pubKey, message);
    }

    const decryptWithPrivateKey = (encryptedData, privateKey) => {
        const pk = window.ecies.PrivateKey.fromHex(
            privateKey.replace('0x', '')
        );

        const decryptedData = window.ecies.decrypt(pk.toHex(), window.ecies.utils.decodeHex(encryptedData)).toString()

        return decryptedData;
    }

    const decryptWithPrivateKey1 = async (encryptMsg, account) => {
        try {
            const data = ethereumjs.Buffer.Buffer.from(encryptMsg, 'hex');

            const structuredData = {
                version: 'x25519-xsalsa20-poly1305',
                ephemPublicKey: data.slice(0, 32).toString('base64'),
                nonce: data.slice(32, 56).toString('base64'),
                ciphertext: data.slice(56).toString('base64'),
            };
            const ct = `0x${ethereumjs.Buffer.Buffer.from(JSON.stringify(structuredData), 'utf8').toString('hex')}`;
            const decryptedMessage = await ethereum.request({method: 'eth_decrypt',params: [ct, account]});
            const decodedMessage = ascii.decode(decryptedMessage).toString();
            console.log('The decrypted message is:', decodedMessage);
            return {success: true, data: decodedMessage};
        } catch (error) {
            console.log(error.message);
            return {success: false};
        }
    }

    module.exports = {
        encryptChallenge: execute,
        sha256,
        sha256_1,
        decrypt: decryptWithPrivateKey,
        decrypt1: decryptWithPrivateKey1
    };
});
