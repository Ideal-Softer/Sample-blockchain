const bitcoin = require('bitcoinjs-lib');
const ecurve = require('ecurve')
const secp256k1 = ecurve.getCurveByName('secp256k1')
const schnorr = require('bip-schnorr')
const bech32 = require('bech32').bech32
const bech32m = require('bech32').bech32m

// derivationPath = "m/84'/0'/0'/0/"
const masterPublicKey = "xpub6B9AeA8LJbxJEuzxDcpys5J7JNdv2RkVT1F7edKW8yTFD6Fa9gnoyE6ojyu69DFfTc312NWFeJt2M2X4nwpL5wpAZj3dDYqw6dBPgnb4ajD"

function generateBTCAddressFromMasterPublicKey(userId, counter) {
    const network = bitcoin.networks.bitcoin;

    // Assuming masterPublicKey is derived from m/84'/0'
    const path = `${counter}/${userId}`;
    const childNode = bitcoin.bip32.fromBase58(masterPublicKey, network).derivePath(path);

    const { address } = bitcoin.payments.p2wpkh({
        pubkey: childNode.publicKey,
        network: network
    });

    return address;
}

function generateTrBTCAddressFromMasterPublicKey(userId, counter) {
    const network = bitcoin.networks.bitcoin;

    // Assuming masterPublicKey is derived from m/84'/0'
    const path = `${counter}/${userId}`;
    const childNode = bitcoin.bip32.fromBase58(masterPublicKey, network).derivePath(path);

    const pubKey = ecurve.Point.decodeFrom(secp256k1, childNode.publicKey)
    const taprootPubkey = schnorr.taproot.taprootConstruct(pubKey)
    const words = bech32.toWords(taprootPubkey)
    words.unshift(1)
    const address = bech32m.encode('bc',words)
    return address;
}

console.log(generateBTCAddressFromMasterPublicKey(1,1));
console.log(generateTrBTCAddressFromMasterPublicKey(1,1));