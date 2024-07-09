const Koa = require("koa")
const route = require("koa-route")
const utils = require("../utils/logger.js")
const constants = require("../utils/constants.js")
const db = require("../utils/database/db.js")
const { decrypt } = require("../utils/encryptionUtilities.js")


module.exports = async () => {
    const app = new Koa()

    /**
     * Endpoint dedicated to return the health of the container when queried
     *
     * @returns Code indicating the health, o lack thereof, of the container
     */
    app.use(
        route.post("/update_state", async (ctx) => {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating the payload`)
            const payload = ctx.checkPayload(ctx, "verification")
            const {userId, gameNonce, status} = payload

            // TODO: return error if un-existent game nonce
            await db.updateVerificationStatus(userId, gameNonce, status, Date.now())

            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Updated the status of verification`)
            ctx.status = 200
            ctx.body = {
                data: "OK"
            }
        })
    )

    app.use(
        route.post("/", async (ctx) => {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating the payload`)
            const payload = ctx.checkPayload(ctx, "verification")
            const { userId, gameNonce, status } = payload

            const game = await db.selectGameDataByNonce(gameNonce)
            const user = await db.selectUserDetails(userId)

            const outcomeString = game.outcome ? "heads" : "tails" // True is heads, False is Tails
            const decryptedSecretNonce = await decrypt(game.secret_nonce)
            const decryptedVRN = await decrypt(game.vrn)
            // Parse the timestamp as a Date object
            const commitmentDate = new Date(game.commitmenttimestamp);
            const selectionDate = new Date(game.selectiontimestamp);
            const revealDate = new Date(game.revealtimestamp);

            // Get the time in milliseconds
            const commitmentMs = commitmentDate.getTime();
            const selectionMs = selectionDate.getTime();
            const revealMs = revealDate.getTime();
            const amount = parseFloat(game.bet_amount)

            // Get the time in milliseconds
            const commitment = JSON.stringify({
                gameTimestamp: commitmentMs,
                gameNonce: gameNonce,
                commitment: game.commitment,
            })

            const selection = JSON.stringify({
                selectionTimestamp: selectionMs,
                gameNonce: gameNonce,                
                choice:game.choice,
                amount: amount,
                userPublicKey: user.public_key,
                signedGameNonce: game.signedgamenonce,
            });

            const reveal = JSON.stringify({
                gameTimestamp: revealMs,
                gameNonce: gameNonce,
                vrn: decryptedVRN,
                secretNonce: decryptedSecretNonce,
                outcomeHash: Buffer.from(game.outcomehash, 'hex'),
                outcomeString: outcomeString,
                didWin: game.did_win
            });

            ctx.status = 200
            ctx.body = {
                data:{
                    commitment,
                    selection,
                    reveal
                }
            }
        })
    )

    return app
}
