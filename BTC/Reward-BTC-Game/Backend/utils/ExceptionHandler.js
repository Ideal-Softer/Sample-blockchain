class ExceptionHandler extends Error {
  constructor(responseCode, error) {
    super()

    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name

    this.error = error

    this.response_code = responseCode

    throw this
  }
}
module.exports = ExceptionHandler
