const mempoolJS = require("@mempool/mempool.js");
const axios = require("axios");
const { MAIN_TOKEN_TICK, POOL_ADDRESS } = require("./openapi/config.js");
const openapiService = require("./openapi/openapi");
const { getInscription } = require("./openapi/getInscriptions.js");
const { sendInscription } = require("./openapi/sendInscription.js");
const { sendBitcoin } = require("./openapi/sendBitcoin.js");
const utils = require("./logger.js");
const constants = require("./constants.js");

const checkConfirmation = async (transactionId) => {
    const {
        bitcoin: { transactions },
    } = mempoolJS({
        hostname: "mempool.space",
    });
    let txData;
    try {
        txData = await transactions.getTx({ txid: transactionId });
    } catch (error) {
        if (error.response.status == 400) {
            return {
                status: 400,
                body: {
                    data: "Transaction not found",
                },
            };
        }
        // return {
        //   status: 400,
        //   body: {
        //     data: "Transaction Id is not valid",
        //   },
        // };
    }
    if (!txData.status.confirmed) {
        return {
            status: 400,
            body: {
                data: "Transaction is not confirmed",
            },
        };
    } else {
        return {
            status: 200,
            body: {
                data: "Transaction is confirmed",
            },
        };
    }
};

const analyze = async (transactionId, currency = "BTC", pubKey) => {
    const {
        bitcoin: { transactions },
    } = mempoolJS({
        hostname: "mempool.space",
    });
    const txData = await transactions.getTx({ txid: transactionId });
    let inscriptionTxs = [];
    let bitcoinTxs = [];
    let sender = "";
    for (let index = 0; index < txData.vout.length; index++) {
        const out_utxo = txData.vout[index];
        const outputAddress = out_utxo.scriptpubkey_address;
        if (outputAddress == POOL_ADDRESS) {
            const in_utxo = txData.vin.filter(
                (utxo) => utxo.vout == index && utxo.prevout.value == 546
            );
            if (in_utxo.length > 0 && out_utxo.value == 546) {
                inscriptionTxs = inscriptionTxs.concat(in_utxo);
                sender = in_utxo[0].prevout.scriptpubkey_address;
            } else if (out_utxo.value != 546) {
                bitcoinTxs.push(out_utxo);
                sender = txData.vin[0].prevout.scriptpubkey_address;
            }
        }
    }

    if (sender != pubKey) {
        return {
            status: 400,
            body: {
                data: "Invalid sender address",
            },
        };
    }

    if (currency == "BRC20") {
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
    } else {
        if (bitcoinTxs.length > 0) {
            let receivedBTC = 0;
            bitcoinTxs.map((tx) => {
                receivedBTC += tx.value;
            });
            return {
                status: 200,
                body: {
                    data: receivedBTC / 100000000,
                },
            };
        }
    }
};

const inscrbie = async (amount) => {
    const orderId = await getInscription(MAIN_TOKEN_TICK, Number(amount));
    if (orderId == undefined) {
        return {
            status: 400,
            body: {
                data: "Sending bitcoin error",
            },
        };
    }
    return {
        status: 200,
        body: {
            data: orderId,
        },
    };
};

const sendBtc = async (receipient, amount) => {
    let result;
    try {
        result = await sendBitcoin(receipient, Number(amount));
    } catch (e) {
        return {
            status: 400,
            body: {
                data: "Invalid request. Error in sendBitcoin",
            },
        };
    }
    const {
        bitcoin: { transactions },
    } = mempoolJS({
        hostname: "mempool.space",
    });
    try {
        await transactions.getTx({ txid: String(result) });
        return {
            status: 200,
            body: {
                data: result,
            },
        };
    } catch (error) {
        if (error.response.status == 400) {
            return {
                status: 400,
                body: {
                    data: "Sending transaction is not valid",
                },
            };
        } else {
            return {
                status: 200,
                body: {
                    data: result,
                },
            };
        }
    }
};

const sendBrc20 = async (orderId, receipient) => {
    const orderResult = await openapiService.getRawInscribeResult(orderId);
    if (orderResult.status !== "pending") {
        const result = await sendInscription(
            receipient,
            orderResult.files[0].inscriptionId
        );
        const {
            bitcoin: { transactions },
        } = mempoolJS({
            hostname: "mempool.space",
        });
        try {
            await transactions.getTx({ txid: String(result) });
            return {
                status: 200,
                body: {
                    data: result,
                },
            };
        } catch (error) {
            if (error.response.status == 400) {
                return {
                    status: 400,
                    body: {
                        data: "Sending transaction is not valid",
                    },
                };
            } else {
                return {
                    status: 200,
                    body: {
                        data: result,
                    },
                };
            }
        }
    } else {
        return {
            status: 400,
            body: {
                data: "Order is waiting",
            },
        };
    }
};

module.exports = {
    checkConfirmation,
    analyze,
    inscrbie,
    sendBtc,
    sendBrc20,
};