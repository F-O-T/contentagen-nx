import require$$0$1 from "assert";
import require$$0 from "util";
var old;
var hasRequiredOld;
function requireOld() {
  if (hasRequiredOld) return old;
  hasRequiredOld = 1;
  const assert = require$$0$1;
  const util = require$$0;
  function RedisError(message) {
    Object.defineProperty(this, "message", {
      value: message || "",
      configurable: true,
      writable: true
    });
    Error.captureStackTrace(this, this.constructor);
  }
  util.inherits(RedisError, Error);
  Object.defineProperty(RedisError.prototype, "name", {
    value: "RedisError",
    configurable: true,
    writable: true
  });
  function ParserError(message, buffer, offset) {
    assert(buffer);
    assert.strictEqual(typeof offset, "number");
    Object.defineProperty(this, "message", {
      value: message || "",
      configurable: true,
      writable: true
    });
    const tmp = Error.stackTraceLimit;
    Error.stackTraceLimit = 2;
    Error.captureStackTrace(this, this.constructor);
    Error.stackTraceLimit = tmp;
    this.offset = offset;
    this.buffer = buffer;
  }
  util.inherits(ParserError, RedisError);
  Object.defineProperty(ParserError.prototype, "name", {
    value: "ParserError",
    configurable: true,
    writable: true
  });
  function ReplyError(message) {
    Object.defineProperty(this, "message", {
      value: message || "",
      configurable: true,
      writable: true
    });
    const tmp = Error.stackTraceLimit;
    Error.stackTraceLimit = 2;
    Error.captureStackTrace(this, this.constructor);
    Error.stackTraceLimit = tmp;
  }
  util.inherits(ReplyError, RedisError);
  Object.defineProperty(ReplyError.prototype, "name", {
    value: "ReplyError",
    configurable: true,
    writable: true
  });
  function AbortError(message) {
    Object.defineProperty(this, "message", {
      value: message || "",
      configurable: true,
      writable: true
    });
    Error.captureStackTrace(this, this.constructor);
  }
  util.inherits(AbortError, RedisError);
  Object.defineProperty(AbortError.prototype, "name", {
    value: "AbortError",
    configurable: true,
    writable: true
  });
  function InterruptError(message) {
    Object.defineProperty(this, "message", {
      value: message || "",
      configurable: true,
      writable: true
    });
    Error.captureStackTrace(this, this.constructor);
  }
  util.inherits(InterruptError, AbortError);
  Object.defineProperty(InterruptError.prototype, "name", {
    value: "InterruptError",
    configurable: true,
    writable: true
  });
  old = {
    RedisError,
    ParserError,
    ReplyError,
    AbortError,
    InterruptError
  };
  return old;
}
var modern;
var hasRequiredModern;
function requireModern() {
  if (hasRequiredModern) return modern;
  hasRequiredModern = 1;
  const assert = require$$0$1;
  class RedisError extends Error {
    get name() {
      return this.constructor.name;
    }
  }
  class ParserError extends RedisError {
    constructor(message, buffer, offset) {
      assert(buffer);
      assert.strictEqual(typeof offset, "number");
      const tmp = Error.stackTraceLimit;
      Error.stackTraceLimit = 2;
      super(message);
      Error.stackTraceLimit = tmp;
      this.offset = offset;
      this.buffer = buffer;
    }
    get name() {
      return this.constructor.name;
    }
  }
  class ReplyError extends RedisError {
    constructor(message) {
      const tmp = Error.stackTraceLimit;
      Error.stackTraceLimit = 2;
      super(message);
      Error.stackTraceLimit = tmp;
    }
    get name() {
      return this.constructor.name;
    }
  }
  class AbortError extends RedisError {
    get name() {
      return this.constructor.name;
    }
  }
  class InterruptError extends AbortError {
    get name() {
      return this.constructor.name;
    }
  }
  modern = {
    RedisError,
    ParserError,
    ReplyError,
    AbortError,
    InterruptError
  };
  return modern;
}
var redisErrors;
var hasRequiredRedisErrors;
function requireRedisErrors() {
  if (hasRequiredRedisErrors) return redisErrors;
  hasRequiredRedisErrors = 1;
  const Errors = process.version.charCodeAt(1) < 55 && process.version.charCodeAt(2) === 46 ? /* @__PURE__ */ requireOld() : /* @__PURE__ */ requireModern();
  redisErrors = Errors;
  return redisErrors;
}
export {
  requireRedisErrors as r
};
