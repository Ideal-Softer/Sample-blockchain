const bitcore = require("bitcore-lib");
const { ECPairFactory } = require('ecpair');
const tinysecp = require('tiny-secp256k1');
const { verifyMessageSignatureRsv } = require('@stacks/encryption');
const utils = require("./logger.js")
const constants = require("./constants.js")

const ECPair = ECPairFactory(tinysecp);

const verifyMessage = async (publicKey, text, sig, ctx) => {
  const message = new bitcore.Message(text);
  var hash = message.magicHash();

  // Using Bitcore for message hashing and verification
  try {
    var signature = bitcore.crypto.Signature.fromCompact(
      Buffer.from(sig, "base64")
    );

    // recover the public key
    var ecdsa = new bitcore.crypto.ECDSA();
    ecdsa.hashbuf = hash;
    ecdsa.sig = signature;

    const pubkeyInSig = ecdsa.toPublicKey();

    const pubkeyInSigString = new bitcore.PublicKey(
      Object.assign({}, pubkeyInSig.toObject(), { compressed: true })
    ).toString();
    if (pubkeyInSigString != publicKey) {
      return false;
    }

    return bitcore.crypto.ECDSA.verify(hash, signature, pubkeyInSig);
  } catch (e) {
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');
    const keyPair = ECPair.fromPublicKey(publicKeyBuffer);

    const signatureBuffer = Buffer.from(sig, "base64");

    if(signatureBuffer.length == 65){
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Signature length is 65 bytes`)
      const rawSignature = new Uint8Array(signatureBuffer).slice(1);
      const rawSignatureBuffer = Buffer.from(rawSignature);
      const isVerified = keyPair.verify(hash, rawSignatureBuffer);
      return isVerified
    } else if (signatureBuffer.length == 64){
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Signature length is 64 bytes`)
      const isVerified = keyPair.verify(hash, signatureBuffer);
      return isVerified
    } else if (signatureBuffer.length == 97){
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Signature length is 97 bytes`)
      const verified = await verifyMessageSignatureRsv({ message: text, publicKey: publicKey, signature: sig });
      return verified
    }
  }
};

module.exports = { verifyMessage };
