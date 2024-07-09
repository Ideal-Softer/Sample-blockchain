const mempoolJS = require("@mempool/mempool.js")
const axios = require("axios");
const MAIN_TOKEN_TICK = "ΛRC"
const utils = require("../logger.js")
const constants = require("../constants.js")

const checkConfirmation = async (transactionId) => {
  const {
    bitcoin: { transactions }
  } = mempoolJS({
    hostname: "mempool.space"
  })
  let txData
  try {
    txData = await transactions.getTx({ txid: transactionId })
  } catch (error) {
    if (error.response.status == 400) {
      return {
        status: 400,
        body: {
          data: "Transaction not found"
        }
      }
    }
    return {
      status: 400,
      body: {
        data: "Transaction Id is not valid"
      }
    }
  }
  if (!txData.status.confirmed) {
    return {
      status: 400,
      body: {
        data: "Transaction is not confirmed"
      }
    }
  } else {
    return {
      status: 200,
      body: {
        data: "Transaction is confirmed"
      }
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const SATOSHI_TO_BTC = 100000000;

const analyze = async (transactionId, address) => {
  try {
    const {
      bitcoin: { transactions }
    } = mempoolJS({
      hostname: "mempool.space"
    });
    await sleep(30000)

    const txData = await transactions.getTx({ txid: transactionId });
    let inscriptionTxs = [];
    let bitcoinTxs = [];

    for (let index = 0; index < txData.vout.length; index++) {
      const out_utxo = txData.vout[index];
      const outputAddress = out_utxo.scriptpubkey_address;
      if (outputAddress === address) {
        const in_utxo = txData.vin.filter(
          (utxo) => utxo.vout == index && utxo.prevout.value == 546
        );
        if (in_utxo.length > 0 && out_utxo.value == 546) {
          inscriptionTxs = inscriptionTxs.concat(in_utxo);
        }
        bitcoinTxs.push(out_utxo);
      }
    }

    if (inscriptionTxs.length > 0) {
      const inscription_witnesses = await Promise.all(
        inscriptionTxs.map((inscriptionTx) =>
          axios.get(`https://blockchain.info/rawtx/${inscriptionTx.txid}`)
        )
      );
      
      const regularStrings = inscription_witnesses.map((witness) =>
        Buffer.from(witness.data.inputs[0].witness, "hex").toString()
      );

      let inscriptionIds_sent = [];
      regularStrings.map((regularString, index) => {
        if (regularString.includes('{"p":"brc-20","op":"transfer","tick"')) {
          const regex = /{"p":"brc-20","op":"transfer","tick".*?}/s;
          const match = regularString.match(regex);
          const jsonStr = match ? match[0] : "";
          const json = JSON.parse(jsonStr);
          if (json.tick == MAIN_TOKEN_TICK)
            inscriptionIds_sent.push(inscriptionTxs[index].txid + "i0");
        }
      });
      if (inscriptionIds_sent.length > 0) {
        let totalReceived = 0;
        const promises = inscriptionIds_sent.map(async (e) => {
          const res = await openapiService.getInscriptionContent(e);
          if (res.tick == MAIN_TOKEN_TICK) totalReceived += Number(res.amt);
        });
        await Promise.all(promises);

        return {
          status: 200,
          body: {
            data: totalReceived,
          },
        };
      } else {
        return {
          status: 400,
          body: {
            data: "No Inscription sent",
          },
        };
      }
    }

    if (bitcoinTxs.length > 0) {
      const receivedBTC = bitcoinTxs.reduce((acc, tx) => acc + tx.value, 0);
      utils.logEvent("", constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Transaction with ID ${transactionId} is for address ${address} is ${txData.status.confirmed ? 'confirmed, balance can now be withdrawn': 'not confirmed, wait 60 seconds for the next check'}`)
      if (txData.status.confirmed) {
        return {
          status: 200,
          body: {
            data: receivedBTC / SATOSHI_TO_BTC
          }
        };
      }
      else {
        return {
          status: 201,
          body: {
            data: receivedBTC / SATOSHI_TO_BTC,
          },
        }
      }
    } else {
      console.log(`No transactions found for address: ${address}`);
      return { status: 404, body: { message: "Transaction not found for this address." } };
    }
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    return { status: 500, body: { message: "An error occurred." } };
  }
};


module.exports = {
  checkConfirmation,
  analyze
}
