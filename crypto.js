define(function (require, exports, module) {
    const forge = require('https://cdn.jsdelivr.net/npm/node-forge@1.0.0/dist/forge.min.js');
    const jsrsasign = require('https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/8.0.20/jsrsasign-all-min.js');
    const elliptic = require('https://cdnjs.cloudflare.com/ajax/libs/elliptic/6.5.4/elliptic.min.js');
    const js_sha256 = require('https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js');
    const ecies = require('https://cdn.jsdelivr.net/npm/eciesjs@0.3.16/dist/index.min.js');

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
        // console.log(base64Encrypted);
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
        const pk = ecies.PrivateKey.fromHex(
            privateKey.replace('0x', '')
        );

        const decryptedData = ecies.decrypt(pk.toHex(), ecies.utils.decodeHex(encryptedData)).toString()

        return decryptedData;
    }
    module.exports = {
        encryptChallenge: execute,
        sha256,
        sha256_1,
        decrypt: decryptWithPrivateKey
    };
});
