const Koa = require("koa")
const route = require("koa-route")
const utils = require("../utils/logger.js")
const constants = require("../utils/constants.js")
const db = require("../utils/database/db.js")
const verifyMessage = require("../utils/verifyMessage.js")
const { nanoid } = require("nanoid")
const { calculateTimeAgo } = require("../utils/timeAgo.js")
const { sanitizeInput } = require("../utils/InputSanitation.js")
const bitcore = require("bitcore-lib")


module.exports = async () => {
  const app = new Koa()

  app.use(
    route.get("/", async (ctx) => {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating the payload`)
      ctx.checkPayload(ctx, "empty")

      results = await db.selectGames()
      formatted_results = []
      if (results) {
        formatted_results = results.map((result) => {
          const timeAgo = calculateTimeAgo(result.commitmenttimestamp)
          const outcome = result.did_win ? "won" : "lost"
          const choice = result.choice ? "Heads" : "Tails"
          const verified = result.verified
          const gameNonce = result.game_nonce
          const verifiedTimestamp = result.verificationtimestamp

          return {
            public_key: result.public_key,
            user_name: result.user_name,
            bet_amount: result.bet_amount,
            user_id: result.user_id,
            choice,
            outcome,
            timeAgo,
            verified,
            gameNonce,
            verifiedTimestamp
          }
        })
      }
      ctx.status = 200
      ctx.body = {
        data: formatted_results
      }
    })
  )

  app.use(
    route.post("/login", async (ctx) => {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating payload`)
      const payload = ctx.checkPayload(ctx, "login")
      const { hash, userPublicKey, signedMessage, userName, value } = payload

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating hash`)
      const hashConstruction = bitcore.crypto.Hash.sha256(Buffer.from(value))

      if (hashConstruction.toString("hex") !== hash.toString("hex")) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Hash mismatch for user ${userName}`)
        ctx.status = 400
        ctx.body = { error: "Invalid request. Hash validation failure" }
        return
      }

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating signature`)
      const verifyMessages = await verifyMessage.verifyMessage(userPublicKey, hash, signedMessage, ctx)
      if (!verifyMessages) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Incorrect signature for user ${userName}`)
        ctx.status = 400
        ctx.body = { error: "Invalid request. Signature validation failure" }
        return
      }

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Inserting user data`)
      const userCreation = Date.now()
      let user = await db.userInsertion(userPublicKey, userName, userCreation, ctx)

      if (user.exists) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Updating users balance`)
        let balance = await db.selectBalance(user.user_id)
        let points = await db.selectUser(user.user_id)
        ctx.status = 201
        ctx.body = {
          data: {
            userId: user.user_id,
            balance: balance.balance,
            points: points.total_points,
            newUser: !user.exists
          }
        }
        return
      } else {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `New user created`)
        let userId = user.user_id

        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Detecting referral code for user`)
        const referralCode = ctx.query.ref
        if (referralCode) {
          utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Sanitising Referal`)
          const sanitizedReferralCode = sanitizeInput(referralCode)

          // Referral Code Validation
          utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Selecting Referal`)
          const referrerId = await db.selectReferrerIdByReferralCode(sanitizedReferralCode)

          if (referrerId) {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Referral code captured: ${sanitizedReferralCode}`)
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Inserting referral record`)
            await db.insertReferral(sanitizedReferralCode, referrerId, userId)

            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Referral recorded: ${referrerId} referred ${userId}`)
          } else {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Invalid referral code provided: ${sanitizedReferralCode}`)
          }
        } else {
          utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `No referral found`)
        }

        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Generating referral code for new user`)
        const referal_code = nanoid(10)
        await db.insertReferralCode(referal_code, userId)

        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Initialising user balance`)
        await db.insertInitialBalance(userId)
        ctx.status = 200
        ctx.body = {
          data: {
            userId: userId,
            balance: 420.0,
            newUser: !user.exists
          }
        }
      }
    })
  )


  app.use(
    route.post("/profile", async (ctx) => {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating payload`);
      const payload = ctx.checkPayload(ctx, "commitment");
      const { userId } = payload;

      // Fetch referrals and games
      const results = await db.selectGameDataByUserId(userId);
      formatted_games = []

      if (results) {
        formatted_games = results.map((result) => {
          const timeAgo = calculateTimeAgo(result.commitmenttimestamp)
          const outcome = result.did_win ? "won" : "lost"
          const choice = result.choice ? "Heads" : "Tails"
          const verified = result.verified
          const gameNonce = result.game_nonce
          const verifiedTimestamp = result.verificationtimestamp

          return {
            public_key: result.public_key,
            user_name: result.user_name,
            user_id: result.user_id,
            bet_amount: result.bet_amount,
            choice,
            outcome,
            timeAgo,
            verified,
            gameNonce,
            verifiedTimestamp
          }
        })
      }
      // Initialize variables for financial insights and game statistics
      let totalBetAmount = 0;
      let totalGames = results ? results.length : 0;
      let totalWins = 0;
      let totalEarnings = 0;
      let currentStreak = 0;
      let highestStreak = 0;

      // Calculate financial insights and game statistics
      if (results) {
        for (const game of results) {
          totalBetAmount += parseFloat(game.bet_amount); // Assuming bet_amount is stored as a string in the DB
          if (game.did_win) {
            totalWins++;
            totalEarnings += parseFloat(game.bet_amount);
            currentStreak++;
            if (currentStreak > highestStreak) {
              highestStreak = currentStreak;
            }
          } else {
            totalEarnings -= parseFloat(game.bet_amount);
            currentStreak = 0;
          }
        }
      }

      const averageBetAmount = totalBetAmount == 0 ? 0 : totalBetAmount / totalGames;
      const totalAmountBet = totalBetAmount == 0 ? 0 : totalBetAmount;
      const winningPercentage = totalWins == 0 ? 0 : (totalWins / totalGames) * 100;

      // Prepare the insights object
      const insights = {
        averageBetAmount: averageBetAmount.toFixed(8),
        totalAmountBet: totalAmountBet.toFixed(8),
        winningPercentage: winningPercentage.toFixed(2),
        totalEarnings: totalEarnings.toFixed(8),
      };

      let user = await db.selectUser(userId)
      let achievements = await db.selectAchievements(userId)
      let referrals
      if (ctx.country == 'GB') {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Referrals blocked since the request comes from: ${ctx.country}`);
        referrals = { error: "Referrals are not curently available in this region" }
      } else {
        referrals = await db.selectReferredUsersAndEarnings(userId);
      }

      // Send the response
      ctx.status = 200;
      ctx.body = {
        data: {
          referrals,
          formatted_games,
          insights,
          publicKey: user.public_key,
          points: user.total_points,
          userName: user.user_name,
          streaks: {
            success: user.highest_streak,
            failure: user.highest_loss_streak
          },
          gamesPlayed: totalGames,
          accountCreation: user.user_creation,
          leaderboard: {
            best: user.best_position,
            current: user.current_position
          },
          achievements
        }
      };
    })
  );

  app.use(
    route.post("/ref", async (ctx) => {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating payload`)
      const payload = ctx.checkPayload(ctx, "commitment")
      const { userId } = payload

      let results = await db.selectReferredUsersAndEarnings(userId)
      ctx.status = 200
      ctx.body = {
        data: results
      }
    })
  )

  app.use(
    route.get("/leaderboard", async (ctx) => {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating the payload`)
      ctx.checkPayload(ctx, "empty")

      const leaderboard = await db.getLeaderboard()

      ctx.status = 200
      ctx.body = {
        data: leaderboard
      }
    })
  )

  app.use(
    route.post("/set_username", async (ctx) => {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating payload`)
      const payload = ctx.checkPayload(ctx, "setUsername")
      const { userId, userName } = payload

      await db.setUserName(userName, userId)

      ctx.status = 200
      ctx.body = {
        data: "OK"
      }
    })
  )
  return app
}
