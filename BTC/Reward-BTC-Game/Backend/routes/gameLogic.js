const Koa = require("koa")
const route = require("koa-route")
const utils = require("../utils/logger.js")
const constants = require("../utils/constants.js")
const { processReferralAndSystemBonuses } = require("../utils/referrals.js")
const db = require("../utils/database/db.js")
const { decrypt } = require("../utils/encryptionUtilities.js")
const crypto = require("crypto")
const bitcore = require("bitcore-lib")
const verifyMessage = require("../utils/verifyMessage.js")
const { points } = require("../utils/points.js")
const { calculateTimeAgo } = require("../utils/timeAgo.js")


module.exports = async (app) => {
  app.use(
    route.post("/commitment", async (ctx) => {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating payload`)
      payload = ctx.checkPayload(ctx, "commitment")
      const { userId } = payload

      // TODO: make it an actual VRN
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Generating verifiable random number`)
      const gameVRN = crypto.randomBytes(16).toString("hex")

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Generating current date variable`)
      const commitmentTimestamp = Date.now()

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Generating game nonce`)
      const gameNonce = crypto.randomBytes(16).toString("hex")

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Generating secret nonce`)
      const secretNonce = crypto.randomBytes(16).toString("hex")

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Encrypting verifiable random number`)
      let commitment = bitcore.crypto.Hash.sha256(Buffer.from(gameVRN + gameNonce + secretNonce))
      commitment = commitment.toString("hex")

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Inserting new game data into database`)
      await db.insertNewGame(gameVRN, gameNonce, secretNonce, commitmentTimestamp, commitment, userId, ctx.state.requestId)

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Storing verifiable execution elements in publicly available IPFS`)
      //IPFS.precommit(ctx, gameNonce, commitment)

      ctx.status = 200
      ctx.body = {
        data: {
          commitment: commitment,
          gameNonce: gameNonce,
        }
      }
    })
  )

  app.use(
    route.post("/reveal", async (ctx) => {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, "Validating payload")
      const payload = ctx.checkPayload(ctx, "reveal")
      const { gameNonceReceived, choice, amount, userPublicKey, signedMessage } = payload

      // TODO: Maybe add smth here to ensure the game nonce isnt spent and more importantly that there is only one available at a time per user ofc
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Selecting game data by nonce ${gameNonceReceived}`)
      const result = await db.selectGameDataByNonce(gameNonceReceived)

      if (!result) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Game with nonce ${gameNonceReceived} not found`)
        ctx.status = 400
        ctx.body = { error: "Invalid request. Game not found" }
        return
      }
      await db.insertSelectionTimestamp(gameNonceReceived, Date.now())

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Selecting user from public key: ${userPublicKey}`)
      const userIdCheck = await db.selectUserIdByPublicKey(userPublicKey)

      if (!userIdCheck) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `User with public key ${userPublicKey} not found`)
        ctx.status = 400
        ctx.body = { error: "Invalid request. Users public key not found" }
        return
      }

      // Deal with balances
      let balance = await db.selectBalance(userIdCheck)
      if (balance.balance <= amount) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Invalid request. Balance too low`)
        //Delete the game 
        await db.deleteGame(gameNonceReceived)

        ctx.status = 400
        ctx.body = { error: "Invalid request. Balance too low" }
        return

      }

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Ensuring requested game belongs to user`)
      if (userIdCheck != result.user_id) {
        await db.deleteGame(gameNonceReceived)

        ctx.status = 400
        ctx.body = { error: "Invalid request. User doesnt own the game" }
      }

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Hashing game nonce recieved ${gameNonceReceived}`)
      const hash = bitcore.crypto.Hash.sha256(Buffer.from(gameNonceReceived))

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating signature for user with public key: ${userPublicKey}`)
      const verifyMessages = await verifyMessage.verifyMessage(userPublicKey, hash.toString('hex'), signedMessage, ctx)

      if (!verifyMessages) {
        await db.deleteGame(gameNonceReceived)
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Signature verification failed for user with public key: ${userPublicKey}`)
        ctx.status = 400
        ctx.body = { error: "Invalid request. Signature validation failed" }
        return
      }

      // TODO: fix referrals to match with the current infrastructure
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Selecting referrer id for user ${userIdCheck}`)
      processReferralAndSystemBonuses(result.user_id, amount, ctx.state.requestId,)

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Decrypting verifiable random number`)
      const decryptedVRN = decrypt(result.vrn)
      const decryptedSecretNonce = decrypt(result.secret_nonce)

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Translating users choice to string`)
      const choiceString = choice ? "heads" : "tails" // True is heads, False is Tails

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Generating user choice hash`)
      const userData = bitcore.crypto.Hash.sha256(Buffer.from(choiceString + gameNonceReceived + amount))

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Generating game outcome hash`)
      const outcomeHash = bitcore.crypto.Hash.sha256(Buffer.from(decryptedVRN + userData.toString('hex')))

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Determining game outcome`)
      const outcome = parseInt(outcomeHash[outcomeHash.length - 1], 16) % 2 === 0 ? true : false
      const outcomeString = outcome ? "heads" : "tails"

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Determining users outcome`)
      const didWin = choice === outcome

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Game outcome: ${didWin ? "User won" : "User lost"}`)
      const newAmount = didWin ? amount * 0.97 : -amount * 0.97

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Updating users balance`)
      const { newTotalBalance, gameStatus } = await db.updateUserBalance(amount, newAmount, result.user_id, "game", ctx.state.requestId)

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Game outcome updated in DB for nonce ${gameNonceReceived}`)

      const userPoints = await points(ctx, userIdCheck, didWin, amount, gameNonceReceived, gameStatus)

      revealTimestamp = Date.now()
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Updating game outcome`)
      await db.updateGameOutcome(outcome, didWin, amount, gameNonceReceived, outcomeHash.toString('hex'), signedMessage, choice, revealTimestamp, gameStatus)

      db.selectLatestGameByUserId(userIdCheck).then((game) => {
        if (game) {
          db.getLeaderboard().then((rank) => {
            const timeAgo = calculateTimeAgo(game.commitmenttimestamp);
            const outcome = game.did_win ? "won" : "lost";
            const choice = game.choice ? "Heads" : "Tails";
            const verified = game.verified;
            const gameNonce = game.game_nonce;
            const verifiedTimestamp = game.verificationtimestamp;

            const newGame = JSON.stringify({
              recentTuggerz: {
                public_key: game.public_key,
                user_name: game.user_name,
                bet_amount: game.bet_amount,
                user_id: game.user_id,
                choice,
                outcome,
                timeAgo,
                verified,
                gameNonce,
                verifiedTimestamp
              },
              ranking: {
                data: rank
              }
            });
            app.broadcast(newGame);
          });
        }
      });
      // TODO: set up an actual IPFS node to host all this for free.
      // IPFS.commitAndReveal(ctx, gameNonceReceived, decryptedVRN, decryptedSecretNonce, didWin, outcomeHash.toString('hex'), outcomeString, amountLikeString, choiceString, hash.toString('hex'), signedMessage, userPublicKey )
      ctx.status = 200
      ctx.body = {
        outcomeHash: outcomeHash,
        vrn: decryptedVRN,
        didWin: didWin,
        outcomeString: outcomeString,
        timestamp: result.commitmentTimestamp,
        gameNonce: gameNonceReceived,
        secretNonce: decryptedSecretNonce,
        newBalance: newTotalBalance.balance,
        userPoints
      }
    })
  )

  return app
}
