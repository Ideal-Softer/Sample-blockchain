const db = require("./database/db.js")
const axios = require('axios');
const utils = require("./logger.js")
const constants = require("./constants.js")


const pinataApiKey = '56e041af88cdd5938cd8';
const pinataSecretApiKey = '12a98ee0c767d23fb56e04494530c83c2f696485a3842cb2be18a0b816347997';

const pinataHeaders = {
    headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey
    }
};

const commitAndReveal = async (ctx, gameNonceReceived, decryptvedVRN, decryptedSecretNonce, didWin, outcomeHash, outcomeString, amountLikeString, choiceString, hash, signedMessage, userPublicKey) => {

    const pinataMetadataFinal = {
        name: `Final Commitment for ${gameNonceReceived}`,
        keyvalues: {
            collection: gameNonceReceived // Using gameNonceReceived as the collection name
        }
    }
    const finalCommitmentData = {
        pinataContent: {
            vrn: decryptvedVRN,
            gameNonce: gameNonceReceived,
            secretNonce: decryptedSecretNonce,
            didWin: didWin,
            outcomeHash: outcomeHash.toString('hex'),
            outcomeString: outcomeString,
            gameTimestamp: Date.now() // Capturing the timestamp for the final commitment
        },
        pinataMetadata: pinataMetadataFinal
    };

    const pinataMetadata = {
        name: `User selection for ${gameNonceReceived}`,
        keyvalues: {
            collection: gameNonceReceived // Using gameNonceReceived as the collection name
        }
    };

    // Create an object to store on IPFS
    const ipfsData = {
        pinataContent: {
            amount: amountLikeString,
            choice: choiceString,
            gameNonce: gameNonceReceived,
            gameNonceHash: hash.toString('hex'),
            selectionTimestamp: Date.now(), // Capturing the timestamp for the reveal
            signedGameNonce: signedMessage,
            userPublicKey: userPublicKey
        },
        pinataMetadata: pinataMetadata
    };
    utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Pinning initial commitment JSON to IPFS`);
    axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', ipfsData, pinataHeaders)
        .then((userSelectionPinataResponse) => {
            return db.updateSelectionByNonce(gameNonceReceived, userSelectionPinataResponse.data.IpfsHash)
                .then(() => {
                    utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Database update completed for IPFS with CID ${userSelectionPinataResponse.data.IpfsHash}`);
                    return axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', finalCommitmentData, pinataHeaders);
                });
        })
        .then((finalPinataResponse) => {
            return db.updateOutcomeByNonce(gameNonceReceived, finalPinataResponse.data.IpfsHash)
                .then(() => {
                    utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Database update completed for IPFS with CID ${finalPinataResponse.data.IpfsHash}`);
                });
        })
        .catch((error) => {
            // handle error
            console.error(error);
        });
}

const precommit = (ctx, gameNonce, commitment) => {
    // Create an object to store on IPFS
    const pinataMetadata = {
        name: `Commitment for ${gameNonce}`,
        keyvalues: {
            collection: gameNonce // Using gameNonce as the collection name
        }
    };

    const ipfsData = {
        pinataContent: {
            commitment: commitment,
            gameTimestamp: Date.now(),
            gameNonce: gameNonce
        },
        pinataMetadata: pinataMetadata
    };

    utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Pinning initial commitment JSON to IPFS`);
    axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', ipfsData, pinataHeaders).then((pinataResponse) => {
        db.insertCommitmentByNonce(gameNonce, pinataResponse.data.IpfsHash)
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Database updata completed for IPFS with CID ${pinataResponse.data.IpfsHash}`);

    }
    ).catch((error) => {
        // Handle error
        console.error(error);
    });

}


module.exports = {
    commitAndReveal,
    precommit
}

