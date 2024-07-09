const Koa = require("koa")
const route = require("koa-route")
const utils = require("../utils/logger.js")
const constants = require("../utils/constants.js")

module.exports = async () => {
  const app = new Koa()

  /**
   * Endpoint dedicated to return the health of the container when queried
   *
   * @returns Code indicating the health, o lack thereof, of the container
   */
  app.use(
    route.get("/",  async (ctx) => { 
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating the payload`)
      ctx.checkPayload(ctx, "empty")

      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Bean flicking container is running`)
      ctx.status = 200
      ctx.body = {
        data: "OK"
      }
    })
  )

  return app
}
