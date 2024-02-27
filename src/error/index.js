class GeneralError extends Error {
  code = 200;

  constructor(message, code) {
    super();
    this.message = message;
    this.code = code;
  }

  getCode() {
    if (this instanceof BadRequest) {
      if (this.code) {
        return this.code;
      }
      return 400;
    }
    if (this instanceof NotFound) {
      return 404;
    }
    return 500;
  }
}

class BadRequest extends GeneralError {}
class NotFound extends GeneralError {}

module.exports = {
  GeneralError,
  BadRequest,
  NotFound,
};
