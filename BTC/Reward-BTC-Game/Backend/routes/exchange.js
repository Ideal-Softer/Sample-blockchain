const Koa = require("koa")
const route = require("koa-route")
const utils = require("../utils/logger.js")
const constants = require("../utils/constants.js")
const db = require("../utils/database/db.js")
const { generateBTCAddressFromMasterPublicKey } = require("../utils/btc/addressManager.js")

module.exports = async () => {
  const app = new Koa()

  app.use(
    route.post("/generate_address", async (ctx) => {
      const payload = ctx.checkPayload(ctx, "commitment");
      const { userId } = payload;

      // Fetch the current counter from the database
      const currentCounter = await db.selectUserDetails(userId);

      if (!currentCounter.length) {
        const currentAddressCount = currentCounter.btc_derivation_counter == 0 ? 0 : currentCounter.btc_derivation_counter-1
        const existingAddress = generateBTCAddressFromMasterPublicKey(userId, currentAddressCount);
        const latestAddress = await db.getLatestUnspentDepositAddress(userId, existingAddress)
        if (currentCounter.btc_derivation_counter == 0){
          await db.incrementCounterForUser(userId);
          await db.insertDepositAddress(userId, existingAddress);
        }
        if (!latestAddress?.transaction_id) {
          ctx.status = 200;
          ctx.body = {
            data: existingAddress
          };
        }
        else {

          const address = generateBTCAddressFromMasterPublicKey(userId, currentCounter.btc_derivation_counter);

          // Increment the counter and save it back to the database
          await db.incrementCounterForUser(userId);

          // Store the generated address in the database (as you're already doing)
          await db.insertDepositAddress(userId, address);


          ctx.status = 200;
          ctx.body = {
            data: address
          };
        }
      }
      else {
        ctx.status = 500;
        ctx.body = {
          error: "No user found"
        };
      }
    })
  );


  app.use(
    route.post("/deposit_btc", async (ctx) => {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating the payload`)

      const payload = ctx.checkPayload(ctx, "deposit")
      const { userId, transactionId, address } = payload

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Insert BTC deposit transaction`)
      await db.updateTransactionIdForAddress(userId, address, transactionId)

      ctx.status = 202
      ctx.body = {
        data: "OK"
      }
    })
  )

  return app
}
