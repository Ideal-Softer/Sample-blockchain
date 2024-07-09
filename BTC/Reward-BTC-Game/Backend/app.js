const Koa = require("koa")
const cors = require("@koa/cors")
const mount = require("koa-mount")
const logger = require("koa-logger")
const bodyParser = require("koa-bodyparser")
const websockify = require('koa-websocket');
const healthcheck = require("./routes/healtcheck.js")
const gameLogic = require("./routes/gameLogic.js")
const exchange = require("./routes/exchange.js")
const verify = require("./routes/verification.js")
const user = require("./routes/user.js")
const utils = require("./utils/logger.js")
const format = require("./utils/formatErrorResponse.js")
const constants = require("./utils/constants.js")
const geoip = require('geoip-lite');
const setupWebSocket = require('./websocket/ws.js');
const { thread } = require('./utils/btc/thread.js')

require("dotenv").config()
Object.defineProperty(global, "_bitcore", {
  get() {
    return undefined
  },
  set() { }
})
const { nanoid } = require("nanoid")


const main = async () => {
  const app = websockify(new Koa());
  await setupWebSocket(app);

  const schema = require("./json_schema/schema")
  app.use(bodyParser())
  app.use(logger())

  app.use(
    cors({
      credentials: true
    })
  )

  app.use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      const errorResponse = format.formatErrorResponse(err, ctx.request.href)
      ctx.status = errorResponse.status
      ctx.body = errorResponse.body

      ctx.app.emit("error", err, ctx)
    } finally {
      utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `${ctx.request.href} ENDPOINT CALL ENDED`)
    }
  })

  app.use(
    await schema({
      empty: require("./json_schema/schemas/empty.json"),
      commitment: require("./json_schema/schemas/commitment.json"),
      reveal: require("./json_schema/schemas/reveal.json"),
      login: require("./json_schema/schemas/login.json"),
      exchange: require("./json_schema/schemas/exchange.json"),
      deposit: require("./json_schema/schemas/deposit.json"),
      withdraw: require("./json_schema/schemas/withdraw.json"),
      setUsername: require("./json_schema/schemas/setUsername.json"),
      verification: require("./json_schema/schemas/verification.json")
    })
  )

  app.use(mount("/", await user()))
  app.use(mount("/healthcheck", await healthcheck()))
  app.use(mount("/game", await gameLogic(app)))
  app.use(mount("/exchange", await exchange()))
  app.use(mount("/verification", await verify()))

  thread(app)

  return app
}

if (require.main === module) {
  const requestId = nanoid(10);

  main().then((app) => app.listen(5000), utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Listening On Port 5000}`))
}

const { ethers } = require('ethers');
const provider = ethers.getDefaultProvider('mainnet');

module.exports = { main }
