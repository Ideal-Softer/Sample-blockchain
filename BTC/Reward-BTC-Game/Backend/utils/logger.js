const log4js = require("log4js")

// Import global variables
const { LOG_LEVELS, RESPONSE_CODES } = require("./constants")

log4js.configure({
  appenders: {
    logging: {
      type: "dateFile",
      filename: "../logs/logs.log",
      category: "default",
      pattern: ".yyyy-MM-dd-hh",
      compress: true
    },
    console: { type: "console" }
  },
  categories: { default: { appenders: ["logging", "console"], level: "info" } }
})
global.logger = log4js.getLogger("logging")

global.logger.info("LOGGING ACTIVATED")

/**
 * Creates Event Logs
 * This is called by developers for logging messages according to given error code, logging level and passed arguments
 * USAGE and LEVELS examples :
 * logger.log(LOG_LEVELS.trace, RESPONSE_CODES.SUCCESS,'Entering cheese testing',)
 * logger.log(LOG_LEVELS.debug, RESPONSE_CODES.SUCCESS, 'Got cheese.');
 * logger.log(LOG_LEVELS.info, RESPONSE_CODES.SUCCESS, 'Cheese is Comté.');
 * logger.log(LOG_LEVELS.warn, RESPONSE_CODES.SUCCESS, 'Cheese is quite smelly.');
 * logger.log(LOG_LEVELS.error, RESPONSE_CODES.SUCCESS, 'Cheese is too ripe!');
 * logger.log(LOG_LEVELS.fatal, RESPONSE_CODES.SUCCESS, 'Cheese was breeding ground for listeria.');
 * @param {LOG_LEVELS} logLevel Log level
 * @param {RESPONSE_CODES} responseCode Response Code
 * @param {any} message Event Message
 * @param {any[]} args Event Message - dynamic text arguments
 */
const logEvent = async (UUID, logLevel, responseCode, message, arg) => {
  try {
    let args
    arg === undefined ? (args = "") : (args = arg)
    const initial = responseCode === RESPONSE_CODES.LOG_MESSAGE_ONLY ? `REQUEST ID: [${UUID}] - ` : `REQUEST ID: [${UUID}] - `+ "RESPONSE CODE: " + responseCode + " - "

    switch (logLevel) {
      case LOG_LEVELS.info:
        await global.logger.info(initial + "EVENT MESSAGE: " + message + args)
        break
      case LOG_LEVELS.warn:
        await global.logger.info(initial + "EVENT MESSAGE: " + message + args)
        break
      case LOG_LEVELS.error:
        await global.logger.info(initial + "EVENT MESSAGE: " + message + args)
        break

      default:
        break
    }
  } catch (error) {
    // empty
  }
}

module.exports = { logEvent }
