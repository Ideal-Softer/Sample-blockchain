const { RESPONSE_CODES, LOG_LEVELS } = require("./constants")
const { logEvent } = require("./logger")

const formatErrorResponse = (err, href) => {
  let statusCode
  let message
  let logMessage = ""

  logMessage = ` ${href} ENDPOINT CALL ENDED WITH ERROR : ${err}`

  logEvent(LOG_LEVELS.error, err.response_code || 500, logMessage)

  statusCode = err.response_code || 500
  message = err

  return {
    status: statusCode,
    body: {
      response_code: JSON.stringify(statusCode),
      response_message: message
    }
  }
}

module.exports = { formatErrorResponse }
