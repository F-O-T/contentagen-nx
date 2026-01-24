import { g as getDefaultExportFromCjs } from "./@ioredis/commands.mjs";
import require$$0$1 from "node:assert";
import require$$0$2 from "node:net";
import require$$2 from "node:http";
import require$$0 from "node:stream";
import require$$5 from "node:querystring";
import require$$6 from "node:events";
import require$$0$4 from "node:diagnostics_channel";
import require$$0$3 from "node:util";
import require$$4 from "node:tls";
import require$$0$5 from "node:buffer";
import require$$3 from "node:zlib";
import require$$5$1 from "node:perf_hooks";
import require$$8 from "node:util/types";
import crypto from "node:crypto";
import require$$1 from "node:sqlite";
import require$$2$1 from "node:worker_threads";
import require$$1$1 from "node:async_hooks";
import require$$1$2 from "node:console";
import require$$0$6 from "node:fs/promises";
import require$$1$3 from "node:path";
import require$$2$2 from "node:timers";
import require$$1$4 from "node:dns";
function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    const e = m[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k in e) {
        if (k !== "default" && !(k in n)) {
          const d = Object.getOwnPropertyDescriptor(e, k);
          if (d) {
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: function() {
                return e[k];
              }
            });
          }
        }
      }
    }
  }
  return Object.freeze(n);
}
var undici = { exports: {} };
var symbols;
var hasRequiredSymbols;
function requireSymbols() {
  if (hasRequiredSymbols) return symbols;
  hasRequiredSymbols = 1;
  symbols = {
    kClose: Symbol("close"),
    kDestroy: Symbol("destroy"),
    kDispatch: Symbol("dispatch"),
    kUrl: Symbol("url"),
    kWriting: Symbol("writing"),
    kResuming: Symbol("resuming"),
    kQueue: Symbol("queue"),
    kConnect: Symbol("connect"),
    kConnecting: Symbol("connecting"),
    kKeepAliveDefaultTimeout: Symbol("default keep alive timeout"),
    kKeepAliveMaxTimeout: Symbol("max keep alive timeout"),
    kKeepAliveTimeoutThreshold: Symbol("keep alive timeout threshold"),
    kKeepAliveTimeoutValue: Symbol("keep alive timeout"),
    kKeepAlive: Symbol("keep alive"),
    kHeadersTimeout: Symbol("headers timeout"),
    kBodyTimeout: Symbol("body timeout"),
    kServerName: Symbol("server name"),
    kLocalAddress: Symbol("local address"),
    kHost: Symbol("host"),
    kNoRef: Symbol("no ref"),
    kBodyUsed: Symbol("used"),
    kBody: Symbol("abstracted request body"),
    kRunning: Symbol("running"),
    kBlocking: Symbol("blocking"),
    kPending: Symbol("pending"),
    kSize: Symbol("size"),
    kBusy: Symbol("busy"),
    kQueued: Symbol("queued"),
    kFree: Symbol("free"),
    kConnected: Symbol("connected"),
    kClosed: Symbol("closed"),
    kNeedDrain: Symbol("need drain"),
    kReset: Symbol("reset"),
    kDestroyed: Symbol.for("nodejs.stream.destroyed"),
    kResume: Symbol("resume"),
    kOnError: Symbol("on error"),
    kMaxHeadersSize: Symbol("max headers size"),
    kRunningIdx: Symbol("running index"),
    kPendingIdx: Symbol("pending index"),
    kError: Symbol("error"),
    kClients: Symbol("clients"),
    kClient: Symbol("client"),
    kParser: Symbol("parser"),
    kOnDestroyed: Symbol("destroy callbacks"),
    kPipelining: Symbol("pipelining"),
    kSocket: Symbol("socket"),
    kHostHeader: Symbol("host header"),
    kConnector: Symbol("connector"),
    kStrictContentLength: Symbol("strict content length"),
    kMaxRedirections: Symbol("maxRedirections"),
    kMaxRequests: Symbol("maxRequestsPerClient"),
    kProxy: Symbol("proxy agent options"),
    kCounter: Symbol("socket request counter"),
    kMaxResponseSize: Symbol("max response size"),
    kHTTP2Session: Symbol("http2Session"),
    kHTTP2SessionState: Symbol("http2Session state"),
    kRetryHandlerDefaultRetry: Symbol("retry agent default retry"),
    kConstruct: Symbol("constructable"),
    kListeners: Symbol("listeners"),
    kHTTPContext: Symbol("http context"),
    kMaxConcurrentStreams: Symbol("max concurrent streams"),
    kHTTP2InitialWindowSize: Symbol("http2 initial window size"),
    kHTTP2ConnectionWindowSize: Symbol("http2 connection window size"),
    kEnableConnectProtocol: Symbol("http2session connect protocol"),
    kRemoteSettings: Symbol("http2session remote settings"),
    kHTTP2Stream: Symbol("http2session client stream"),
    kNoProxyAgent: Symbol("no proxy agent"),
    kHttpProxyAgent: Symbol("http proxy agent"),
    kHttpsProxyAgent: Symbol("https proxy agent")
  };
  return symbols;
}
var timers;
var hasRequiredTimers;
function requireTimers() {
  if (hasRequiredTimers) return timers;
  hasRequiredTimers = 1;
  let fastNow = 0;
  const RESOLUTION_MS = 1e3;
  const TICK_MS = (RESOLUTION_MS >> 1) - 1;
  let fastNowTimeout;
  const kFastTimer = Symbol("kFastTimer");
  const fastTimers = [];
  const NOT_IN_LIST = -2;
  const TO_BE_CLEARED = -1;
  const PENDING = 0;
  const ACTIVE = 1;
  function onTick() {
    fastNow += TICK_MS;
    let idx = 0;
    let len = fastTimers.length;
    while (idx < len) {
      const timer = fastTimers[idx];
      if (timer._state === PENDING) {
        timer._idleStart = fastNow - TICK_MS;
        timer._state = ACTIVE;
      } else if (timer._state === ACTIVE && fastNow >= timer._idleStart + timer._idleTimeout) {
        timer._state = TO_BE_CLEARED;
        timer._idleStart = -1;
        timer._onTimeout(timer._timerArg);
      }
      if (timer._state === TO_BE_CLEARED) {
        timer._state = NOT_IN_LIST;
        if (--len !== 0) {
          fastTimers[idx] = fastTimers[len];
        }
      } else {
        ++idx;
      }
    }
    fastTimers.length = len;
    if (fastTimers.length !== 0) {
      refreshTimeout();
    }
  }
  function refreshTimeout() {
    if (fastNowTimeout?.refresh) {
      fastNowTimeout.refresh();
    } else {
      clearTimeout(fastNowTimeout);
      fastNowTimeout = setTimeout(onTick, TICK_MS);
      fastNowTimeout?.unref();
    }
  }
  class FastTimer {
    [kFastTimer] = true;
    /**
     * The state of the timer, which can be one of the following:
     * - NOT_IN_LIST (-2)
     * - TO_BE_CLEARED (-1)
     * - PENDING (0)
     * - ACTIVE (1)
     *
     * @type {-2|-1|0|1}
     * @private
     */
    _state = NOT_IN_LIST;
    /**
     * The number of milliseconds to wait before calling the callback.
     *
     * @type {number}
     * @private
     */
    _idleTimeout = -1;
    /**
     * The time in milliseconds when the timer was started. This value is used to
     * calculate when the timer should expire.
     *
     * @type {number}
     * @default -1
     * @private
     */
    _idleStart = -1;
    /**
     * The function to be executed when the timer expires.
     * @type {Function}
     * @private
     */
    _onTimeout;
    /**
     * The argument to be passed to the callback when the timer expires.
     *
     * @type {*}
     * @private
     */
    _timerArg;
    /**
     * @constructor
     * @param {Function} callback A function to be executed after the timer
     * expires.
     * @param {number} delay The time, in milliseconds that the timer should wait
     * before the specified function or code is executed.
     * @param {*} arg
     */
    constructor(callback, delay, arg) {
      this._onTimeout = callback;
      this._idleTimeout = delay;
      this._timerArg = arg;
      this.refresh();
    }
    /**
     * Sets the timer's start time to the current time, and reschedules the timer
     * to call its callback at the previously specified duration adjusted to the
     * current time.
     * Using this on a timer that has already called its callback will reactivate
     * the timer.
     *
     * @returns {void}
     */
    refresh() {
      if (this._state === NOT_IN_LIST) {
        fastTimers.push(this);
      }
      if (!fastNowTimeout || fastTimers.length === 1) {
        refreshTimeout();
      }
      this._state = PENDING;
    }
    /**
     * The `clear` method cancels the timer, preventing it from executing.
     *
     * @returns {void}
     * @private
     */
    clear() {
      this._state = TO_BE_CLEARED;
      this._idleStart = -1;
    }
  }
  timers = {
    /**
     * The setTimeout() method sets a timer which executes a function once the
     * timer expires.
     * @param {Function} callback A function to be executed after the timer
     * expires.
     * @param {number} delay The time, in milliseconds that the timer should
     * wait before the specified function or code is executed.
     * @param {*} [arg] An optional argument to be passed to the callback function
     * when the timer expires.
     * @returns {NodeJS.Timeout|FastTimer}
     */
    setTimeout(callback, delay, arg) {
      return delay <= RESOLUTION_MS ? setTimeout(callback, delay, arg) : new FastTimer(callback, delay, arg);
    },
    /**
     * The clearTimeout method cancels an instantiated Timer previously created
     * by calling setTimeout.
     *
     * @param {NodeJS.Timeout|FastTimer} timeout
     */
    clearTimeout(timeout) {
      if (timeout[kFastTimer]) {
        timeout.clear();
      } else {
        clearTimeout(timeout);
      }
    },
    /**
     * The setFastTimeout() method sets a fastTimer which executes a function once
     * the timer expires.
     * @param {Function} callback A function to be executed after the timer
     * expires.
     * @param {number} delay The time, in milliseconds that the timer should
     * wait before the specified function or code is executed.
     * @param {*} [arg] An optional argument to be passed to the callback function
     * when the timer expires.
     * @returns {FastTimer}
     */
    setFastTimeout(callback, delay, arg) {
      return new FastTimer(callback, delay, arg);
    },
    /**
     * The clearTimeout method cancels an instantiated FastTimer previously
     * created by calling setFastTimeout.
     *
     * @param {FastTimer} timeout
     */
    clearFastTimeout(timeout) {
      timeout.clear();
    },
    /**
     * The now method returns the value of the internal fast timer clock.
     *
     * @returns {number}
     */
    now() {
      return fastNow;
    },
    /**
     * Trigger the onTick function to process the fastTimers array.
     * Exported for testing purposes only.
     * Marking as deprecated to discourage any use outside of testing.
     * @deprecated
     * @param {number} [delay=0] The delay in milliseconds to add to the now value.
     */
    tick(delay = 0) {
      fastNow += delay - RESOLUTION_MS + 1;
      onTick();
      onTick();
    },
    /**
     * Reset FastTimers.
     * Exported for testing purposes only.
     * Marking as deprecated to discourage any use outside of testing.
     * @deprecated
     */
    reset() {
      fastNow = 0;
      fastTimers.length = 0;
      clearTimeout(fastNowTimeout);
      fastNowTimeout = null;
    },
    /**
     * Exporting for testing purposes only.
     * Marking as deprecated to discourage any use outside of testing.
     * @deprecated
     */
    kFastTimer
  };
  return timers;
}
var errors;
var hasRequiredErrors;
function requireErrors() {
  if (hasRequiredErrors) return errors;
  hasRequiredErrors = 1;
  const kUndiciError = Symbol.for("undici.error.UND_ERR");
  class UndiciError extends Error {
    constructor(message, options) {
      super(message, options);
      this.name = "UndiciError";
      this.code = "UND_ERR";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kUndiciError] === true;
    }
    get [kUndiciError]() {
      return true;
    }
  }
  const kConnectTimeoutError = Symbol.for("undici.error.UND_ERR_CONNECT_TIMEOUT");
  class ConnectTimeoutError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "ConnectTimeoutError";
      this.message = message || "Connect Timeout Error";
      this.code = "UND_ERR_CONNECT_TIMEOUT";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kConnectTimeoutError] === true;
    }
    get [kConnectTimeoutError]() {
      return true;
    }
  }
  const kHeadersTimeoutError = Symbol.for("undici.error.UND_ERR_HEADERS_TIMEOUT");
  class HeadersTimeoutError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "HeadersTimeoutError";
      this.message = message || "Headers Timeout Error";
      this.code = "UND_ERR_HEADERS_TIMEOUT";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kHeadersTimeoutError] === true;
    }
    get [kHeadersTimeoutError]() {
      return true;
    }
  }
  const kHeadersOverflowError = Symbol.for("undici.error.UND_ERR_HEADERS_OVERFLOW");
  class HeadersOverflowError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "HeadersOverflowError";
      this.message = message || "Headers Overflow Error";
      this.code = "UND_ERR_HEADERS_OVERFLOW";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kHeadersOverflowError] === true;
    }
    get [kHeadersOverflowError]() {
      return true;
    }
  }
  const kBodyTimeoutError = Symbol.for("undici.error.UND_ERR_BODY_TIMEOUT");
  class BodyTimeoutError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "BodyTimeoutError";
      this.message = message || "Body Timeout Error";
      this.code = "UND_ERR_BODY_TIMEOUT";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kBodyTimeoutError] === true;
    }
    get [kBodyTimeoutError]() {
      return true;
    }
  }
  const kInvalidArgumentError = Symbol.for("undici.error.UND_ERR_INVALID_ARG");
  class InvalidArgumentError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "InvalidArgumentError";
      this.message = message || "Invalid Argument Error";
      this.code = "UND_ERR_INVALID_ARG";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kInvalidArgumentError] === true;
    }
    get [kInvalidArgumentError]() {
      return true;
    }
  }
  const kInvalidReturnValueError = Symbol.for("undici.error.UND_ERR_INVALID_RETURN_VALUE");
  class InvalidReturnValueError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "InvalidReturnValueError";
      this.message = message || "Invalid Return Value Error";
      this.code = "UND_ERR_INVALID_RETURN_VALUE";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kInvalidReturnValueError] === true;
    }
    get [kInvalidReturnValueError]() {
      return true;
    }
  }
  const kAbortError = Symbol.for("undici.error.UND_ERR_ABORT");
  class AbortError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "AbortError";
      this.message = message || "The operation was aborted";
      this.code = "UND_ERR_ABORT";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kAbortError] === true;
    }
    get [kAbortError]() {
      return true;
    }
  }
  const kRequestAbortedError = Symbol.for("undici.error.UND_ERR_ABORTED");
  class RequestAbortedError extends AbortError {
    constructor(message) {
      super(message);
      this.name = "AbortError";
      this.message = message || "Request aborted";
      this.code = "UND_ERR_ABORTED";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kRequestAbortedError] === true;
    }
    get [kRequestAbortedError]() {
      return true;
    }
  }
  const kInformationalError = Symbol.for("undici.error.UND_ERR_INFO");
  class InformationalError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "InformationalError";
      this.message = message || "Request information";
      this.code = "UND_ERR_INFO";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kInformationalError] === true;
    }
    get [kInformationalError]() {
      return true;
    }
  }
  const kRequestContentLengthMismatchError = Symbol.for("undici.error.UND_ERR_REQ_CONTENT_LENGTH_MISMATCH");
  class RequestContentLengthMismatchError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "RequestContentLengthMismatchError";
      this.message = message || "Request body length does not match content-length header";
      this.code = "UND_ERR_REQ_CONTENT_LENGTH_MISMATCH";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kRequestContentLengthMismatchError] === true;
    }
    get [kRequestContentLengthMismatchError]() {
      return true;
    }
  }
  const kResponseContentLengthMismatchError = Symbol.for("undici.error.UND_ERR_RES_CONTENT_LENGTH_MISMATCH");
  class ResponseContentLengthMismatchError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "ResponseContentLengthMismatchError";
      this.message = message || "Response body length does not match content-length header";
      this.code = "UND_ERR_RES_CONTENT_LENGTH_MISMATCH";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kResponseContentLengthMismatchError] === true;
    }
    get [kResponseContentLengthMismatchError]() {
      return true;
    }
  }
  const kClientDestroyedError = Symbol.for("undici.error.UND_ERR_DESTROYED");
  class ClientDestroyedError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "ClientDestroyedError";
      this.message = message || "The client is destroyed";
      this.code = "UND_ERR_DESTROYED";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kClientDestroyedError] === true;
    }
    get [kClientDestroyedError]() {
      return true;
    }
  }
  const kClientClosedError = Symbol.for("undici.error.UND_ERR_CLOSED");
  class ClientClosedError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "ClientClosedError";
      this.message = message || "The client is closed";
      this.code = "UND_ERR_CLOSED";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kClientClosedError] === true;
    }
    get [kClientClosedError]() {
      return true;
    }
  }
  const kSocketError = Symbol.for("undici.error.UND_ERR_SOCKET");
  class SocketError extends UndiciError {
    constructor(message, socket) {
      super(message);
      this.name = "SocketError";
      this.message = message || "Socket error";
      this.code = "UND_ERR_SOCKET";
      this.socket = socket;
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kSocketError] === true;
    }
    get [kSocketError]() {
      return true;
    }
  }
  const kNotSupportedError = Symbol.for("undici.error.UND_ERR_NOT_SUPPORTED");
  class NotSupportedError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "NotSupportedError";
      this.message = message || "Not supported error";
      this.code = "UND_ERR_NOT_SUPPORTED";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kNotSupportedError] === true;
    }
    get [kNotSupportedError]() {
      return true;
    }
  }
  const kBalancedPoolMissingUpstreamError = Symbol.for("undici.error.UND_ERR_BPL_MISSING_UPSTREAM");
  class BalancedPoolMissingUpstreamError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "MissingUpstreamError";
      this.message = message || "No upstream has been added to the BalancedPool";
      this.code = "UND_ERR_BPL_MISSING_UPSTREAM";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kBalancedPoolMissingUpstreamError] === true;
    }
    get [kBalancedPoolMissingUpstreamError]() {
      return true;
    }
  }
  const kHTTPParserError = Symbol.for("undici.error.UND_ERR_HTTP_PARSER");
  class HTTPParserError extends Error {
    constructor(message, code, data) {
      super(message);
      this.name = "HTTPParserError";
      this.code = code ? `HPE_${code}` : void 0;
      this.data = data ? data.toString() : void 0;
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kHTTPParserError] === true;
    }
    get [kHTTPParserError]() {
      return true;
    }
  }
  const kResponseExceededMaxSizeError = Symbol.for("undici.error.UND_ERR_RES_EXCEEDED_MAX_SIZE");
  class ResponseExceededMaxSizeError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "ResponseExceededMaxSizeError";
      this.message = message || "Response content exceeded max size";
      this.code = "UND_ERR_RES_EXCEEDED_MAX_SIZE";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kResponseExceededMaxSizeError] === true;
    }
    get [kResponseExceededMaxSizeError]() {
      return true;
    }
  }
  const kRequestRetryError = Symbol.for("undici.error.UND_ERR_REQ_RETRY");
  class RequestRetryError extends UndiciError {
    constructor(message, code, { headers: headers2, data }) {
      super(message);
      this.name = "RequestRetryError";
      this.message = message || "Request retry error";
      this.code = "UND_ERR_REQ_RETRY";
      this.statusCode = code;
      this.data = data;
      this.headers = headers2;
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kRequestRetryError] === true;
    }
    get [kRequestRetryError]() {
      return true;
    }
  }
  const kResponseError = Symbol.for("undici.error.UND_ERR_RESPONSE");
  class ResponseError extends UndiciError {
    constructor(message, code, { headers: headers2, body: body2 }) {
      super(message);
      this.name = "ResponseError";
      this.message = message || "Response error";
      this.code = "UND_ERR_RESPONSE";
      this.statusCode = code;
      this.body = body2;
      this.headers = headers2;
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kResponseError] === true;
    }
    get [kResponseError]() {
      return true;
    }
  }
  const kSecureProxyConnectionError = Symbol.for("undici.error.UND_ERR_PRX_TLS");
  class SecureProxyConnectionError extends UndiciError {
    constructor(cause, message, options = {}) {
      super(message, { cause, ...options });
      this.name = "SecureProxyConnectionError";
      this.message = message || "Secure Proxy Connection failed";
      this.code = "UND_ERR_PRX_TLS";
      this.cause = cause;
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kSecureProxyConnectionError] === true;
    }
    get [kSecureProxyConnectionError]() {
      return true;
    }
  }
  const kMaxOriginsReachedError = Symbol.for("undici.error.UND_ERR_MAX_ORIGINS_REACHED");
  class MaxOriginsReachedError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "MaxOriginsReachedError";
      this.message = message || "Maximum allowed origins reached";
      this.code = "UND_ERR_MAX_ORIGINS_REACHED";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kMaxOriginsReachedError] === true;
    }
    get [kMaxOriginsReachedError]() {
      return true;
    }
  }
  errors = {
    AbortError,
    HTTPParserError,
    UndiciError,
    HeadersTimeoutError,
    HeadersOverflowError,
    BodyTimeoutError,
    RequestContentLengthMismatchError,
    ConnectTimeoutError,
    InvalidArgumentError,
    InvalidReturnValueError,
    RequestAbortedError,
    ClientDestroyedError,
    ClientClosedError,
    InformationalError,
    SocketError,
    NotSupportedError,
    ResponseContentLengthMismatchError,
    BalancedPoolMissingUpstreamError,
    ResponseExceededMaxSizeError,
    RequestRetryError,
    ResponseError,
    SecureProxyConnectionError,
    MaxOriginsReachedError
  };
  return errors;
}
var constants$4;
var hasRequiredConstants$4;
function requireConstants$4() {
  if (hasRequiredConstants$4) return constants$4;
  hasRequiredConstants$4 = 1;
  const wellknownHeaderNames = (
    /** @type {const} */
    [
      "Accept",
      "Accept-Encoding",
      "Accept-Language",
      "Accept-Ranges",
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Origin",
      "Access-Control-Expose-Headers",
      "Access-Control-Max-Age",
      "Access-Control-Request-Headers",
      "Access-Control-Request-Method",
      "Age",
      "Allow",
      "Alt-Svc",
      "Alt-Used",
      "Authorization",
      "Cache-Control",
      "Clear-Site-Data",
      "Connection",
      "Content-Disposition",
      "Content-Encoding",
      "Content-Language",
      "Content-Length",
      "Content-Location",
      "Content-Range",
      "Content-Security-Policy",
      "Content-Security-Policy-Report-Only",
      "Content-Type",
      "Cookie",
      "Cross-Origin-Embedder-Policy",
      "Cross-Origin-Opener-Policy",
      "Cross-Origin-Resource-Policy",
      "Date",
      "Device-Memory",
      "Downlink",
      "ECT",
      "ETag",
      "Expect",
      "Expect-CT",
      "Expires",
      "Forwarded",
      "From",
      "Host",
      "If-Match",
      "If-Modified-Since",
      "If-None-Match",
      "If-Range",
      "If-Unmodified-Since",
      "Keep-Alive",
      "Last-Modified",
      "Link",
      "Location",
      "Max-Forwards",
      "Origin",
      "Permissions-Policy",
      "Pragma",
      "Proxy-Authenticate",
      "Proxy-Authorization",
      "RTT",
      "Range",
      "Referer",
      "Referrer-Policy",
      "Refresh",
      "Retry-After",
      "Sec-WebSocket-Accept",
      "Sec-WebSocket-Extensions",
      "Sec-WebSocket-Key",
      "Sec-WebSocket-Protocol",
      "Sec-WebSocket-Version",
      "Server",
      "Server-Timing",
      "Service-Worker-Allowed",
      "Service-Worker-Navigation-Preload",
      "Set-Cookie",
      "SourceMap",
      "Strict-Transport-Security",
      "Supports-Loading-Mode",
      "TE",
      "Timing-Allow-Origin",
      "Trailer",
      "Transfer-Encoding",
      "Upgrade",
      "Upgrade-Insecure-Requests",
      "User-Agent",
      "Vary",
      "Via",
      "WWW-Authenticate",
      "X-Content-Type-Options",
      "X-DNS-Prefetch-Control",
      "X-Frame-Options",
      "X-Permitted-Cross-Domain-Policies",
      "X-Powered-By",
      "X-Requested-With",
      "X-XSS-Protection"
    ]
  );
  const headerNameLowerCasedRecord = {};
  Object.setPrototypeOf(headerNameLowerCasedRecord, null);
  const wellknownHeaderNameBuffers = {};
  Object.setPrototypeOf(wellknownHeaderNameBuffers, null);
  function getHeaderNameAsBuffer(header) {
    let buffer = wellknownHeaderNameBuffers[header];
    if (buffer === void 0) {
      buffer = Buffer.from(header);
    }
    return buffer;
  }
  for (let i = 0; i < wellknownHeaderNames.length; ++i) {
    const key = wellknownHeaderNames[i];
    const lowerCasedKey = key.toLowerCase();
    headerNameLowerCasedRecord[key] = headerNameLowerCasedRecord[lowerCasedKey] = lowerCasedKey;
  }
  constants$4 = {
    wellknownHeaderNames,
    headerNameLowerCasedRecord,
    getHeaderNameAsBuffer
  };
  return constants$4;
}
var tree_1;
var hasRequiredTree;
function requireTree() {
  if (hasRequiredTree) return tree_1;
  hasRequiredTree = 1;
  const {
    wellknownHeaderNames,
    headerNameLowerCasedRecord
  } = /* @__PURE__ */ requireConstants$4();
  class TstNode {
    /** @type {any} */
    value = null;
    /** @type {null | TstNode} */
    left = null;
    /** @type {null | TstNode} */
    middle = null;
    /** @type {null | TstNode} */
    right = null;
    /** @type {number} */
    code;
    /**
     * @param {string} key
     * @param {any} value
     * @param {number} index
     */
    constructor(key, value, index2) {
      if (index2 === void 0 || index2 >= key.length) {
        throw new TypeError("Unreachable");
      }
      const code = this.code = key.charCodeAt(index2);
      if (code > 127) {
        throw new TypeError("key must be ascii string");
      }
      if (key.length !== ++index2) {
        this.middle = new TstNode(key, value, index2);
      } else {
        this.value = value;
      }
    }
    /**
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    add(key, value) {
      const length = key.length;
      if (length === 0) {
        throw new TypeError("Unreachable");
      }
      let index2 = 0;
      let node = this;
      while (true) {
        const code = key.charCodeAt(index2);
        if (code > 127) {
          throw new TypeError("key must be ascii string");
        }
        if (node.code === code) {
          if (length === ++index2) {
            node.value = value;
            break;
          } else if (node.middle !== null) {
            node = node.middle;
          } else {
            node.middle = new TstNode(key, value, index2);
            break;
          }
        } else if (node.code < code) {
          if (node.left !== null) {
            node = node.left;
          } else {
            node.left = new TstNode(key, value, index2);
            break;
          }
        } else if (node.right !== null) {
          node = node.right;
        } else {
          node.right = new TstNode(key, value, index2);
          break;
        }
      }
    }
    /**
     * @param {Uint8Array} key
     * @returns {TstNode | null}
     */
    search(key) {
      const keylength = key.length;
      let index2 = 0;
      let node = this;
      while (node !== null && index2 < keylength) {
        let code = key[index2];
        if (code <= 90 && code >= 65) {
          code |= 32;
        }
        while (node !== null) {
          if (code === node.code) {
            if (keylength === ++index2) {
              return node;
            }
            node = node.middle;
            break;
          }
          node = node.code < code ? node.left : node.right;
        }
      }
      return null;
    }
  }
  class TernarySearchTree {
    /** @type {TstNode | null} */
    node = null;
    /**
     * @param {string} key
     * @param {any} value
     * @returns {void}
     * */
    insert(key, value) {
      if (this.node === null) {
        this.node = new TstNode(key, value, 0);
      } else {
        this.node.add(key, value);
      }
    }
    /**
     * @param {Uint8Array} key
     * @returns {any}
     */
    lookup(key) {
      return this.node?.search(key)?.value ?? null;
    }
  }
  const tree = new TernarySearchTree();
  for (let i = 0; i < wellknownHeaderNames.length; ++i) {
    const key = headerNameLowerCasedRecord[wellknownHeaderNames[i]];
    tree.insert(key, key);
  }
  tree_1 = {
    TernarySearchTree,
    tree
  };
  return tree_1;
}
var util$5;
var hasRequiredUtil$5;
function requireUtil$5() {
  if (hasRequiredUtil$5) return util$5;
  hasRequiredUtil$5 = 1;
  const assert = require$$0$1;
  const { kDestroyed, kBodyUsed, kListeners, kBody } = /* @__PURE__ */ requireSymbols();
  const { IncomingMessage } = require$$2;
  const stream = require$$0;
  const net = require$$0$2;
  const { stringify } = require$$5;
  const { EventEmitter: EE } = require$$6;
  const timers2 = /* @__PURE__ */ requireTimers();
  const { InvalidArgumentError, ConnectTimeoutError } = /* @__PURE__ */ requireErrors();
  const { headerNameLowerCasedRecord } = /* @__PURE__ */ requireConstants$4();
  const { tree } = /* @__PURE__ */ requireTree();
  const [nodeMajor, nodeMinor] = process.versions.node.split(".", 2).map((v) => Number(v));
  class BodyAsyncIterable {
    constructor(body2) {
      this[kBody] = body2;
      this[kBodyUsed] = false;
    }
    async *[Symbol.asyncIterator]() {
      assert(!this[kBodyUsed], "disturbed");
      this[kBodyUsed] = true;
      yield* this[kBody];
    }
  }
  function noop() {
  }
  function wrapRequestBody(body2) {
    if (isStream(body2)) {
      if (bodyLength(body2) === 0) {
        body2.on("data", function() {
          assert(false);
        });
      }
      if (typeof body2.readableDidRead !== "boolean") {
        body2[kBodyUsed] = false;
        EE.prototype.on.call(body2, "data", function() {
          this[kBodyUsed] = true;
        });
      }
      return body2;
    } else if (body2 && typeof body2.pipeTo === "function") {
      return new BodyAsyncIterable(body2);
    } else if (body2 && isFormDataLike(body2)) {
      return body2;
    } else if (body2 && typeof body2 !== "string" && !ArrayBuffer.isView(body2) && isIterable(body2)) {
      return new BodyAsyncIterable(body2);
    } else {
      return body2;
    }
  }
  function isStream(obj) {
    return obj && typeof obj === "object" && typeof obj.pipe === "function" && typeof obj.on === "function";
  }
  function isBlobLike(object) {
    if (object === null) {
      return false;
    } else if (object instanceof Blob) {
      return true;
    } else if (typeof object !== "object") {
      return false;
    } else {
      const sTag = object[Symbol.toStringTag];
      return (sTag === "Blob" || sTag === "File") && ("stream" in object && typeof object.stream === "function" || "arrayBuffer" in object && typeof object.arrayBuffer === "function");
    }
  }
  function pathHasQueryOrFragment(url) {
    return url.includes("?") || url.includes("#");
  }
  function serializePathWithQuery(url, queryParams) {
    if (pathHasQueryOrFragment(url)) {
      throw new Error('Query params cannot be passed when url already contains "?" or "#".');
    }
    const stringified = stringify(queryParams);
    if (stringified) {
      url += "?" + stringified;
    }
    return url;
  }
  function isValidPort(port) {
    const value = parseInt(port, 10);
    return value === Number(port) && value >= 0 && value <= 65535;
  }
  function isHttpOrHttpsPrefixed(value) {
    return value != null && value[0] === "h" && value[1] === "t" && value[2] === "t" && value[3] === "p" && (value[4] === ":" || value[4] === "s" && value[5] === ":");
  }
  function parseURL(url) {
    if (typeof url === "string") {
      url = new URL(url);
      if (!isHttpOrHttpsPrefixed(url.origin || url.protocol)) {
        throw new InvalidArgumentError("Invalid URL protocol: the URL must start with `http:` or `https:`.");
      }
      return url;
    }
    if (!url || typeof url !== "object") {
      throw new InvalidArgumentError("Invalid URL: The URL argument must be a non-null object.");
    }
    if (!(url instanceof URL)) {
      if (url.port != null && url.port !== "" && isValidPort(url.port) === false) {
        throw new InvalidArgumentError("Invalid URL: port must be a valid integer or a string representation of an integer.");
      }
      if (url.path != null && typeof url.path !== "string") {
        throw new InvalidArgumentError("Invalid URL path: the path must be a string or null/undefined.");
      }
      if (url.pathname != null && typeof url.pathname !== "string") {
        throw new InvalidArgumentError("Invalid URL pathname: the pathname must be a string or null/undefined.");
      }
      if (url.hostname != null && typeof url.hostname !== "string") {
        throw new InvalidArgumentError("Invalid URL hostname: the hostname must be a string or null/undefined.");
      }
      if (url.origin != null && typeof url.origin !== "string") {
        throw new InvalidArgumentError("Invalid URL origin: the origin must be a string or null/undefined.");
      }
      if (!isHttpOrHttpsPrefixed(url.origin || url.protocol)) {
        throw new InvalidArgumentError("Invalid URL protocol: the URL must start with `http:` or `https:`.");
      }
      const port = url.port != null ? url.port : url.protocol === "https:" ? 443 : 80;
      let origin = url.origin != null ? url.origin : `${url.protocol || ""}//${url.hostname || ""}:${port}`;
      let path = url.path != null ? url.path : `${url.pathname || ""}${url.search || ""}`;
      if (origin[origin.length - 1] === "/") {
        origin = origin.slice(0, origin.length - 1);
      }
      if (path && path[0] !== "/") {
        path = `/${path}`;
      }
      return new URL(`${origin}${path}`);
    }
    if (!isHttpOrHttpsPrefixed(url.origin || url.protocol)) {
      throw new InvalidArgumentError("Invalid URL protocol: the URL must start with `http:` or `https:`.");
    }
    return url;
  }
  function parseOrigin(url) {
    url = parseURL(url);
    if (url.pathname !== "/" || url.search || url.hash) {
      throw new InvalidArgumentError("invalid url");
    }
    return url;
  }
  function getHostname(host) {
    if (host[0] === "[") {
      const idx2 = host.indexOf("]");
      assert(idx2 !== -1);
      return host.substring(1, idx2);
    }
    const idx = host.indexOf(":");
    if (idx === -1) return host;
    return host.substring(0, idx);
  }
  function getServerName(host) {
    if (!host) {
      return null;
    }
    assert(typeof host === "string");
    const servername = getHostname(host);
    if (net.isIP(servername)) {
      return "";
    }
    return servername;
  }
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function isAsyncIterable(obj) {
    return !!(obj != null && typeof obj[Symbol.asyncIterator] === "function");
  }
  function isIterable(obj) {
    return !!(obj != null && (typeof obj[Symbol.iterator] === "function" || typeof obj[Symbol.asyncIterator] === "function"));
  }
  function bodyLength(body2) {
    if (body2 == null) {
      return 0;
    } else if (isStream(body2)) {
      const state = body2._readableState;
      return state && state.objectMode === false && state.ended === true && Number.isFinite(state.length) ? state.length : null;
    } else if (isBlobLike(body2)) {
      return body2.size != null ? body2.size : null;
    } else if (isBuffer(body2)) {
      return body2.byteLength;
    }
    return null;
  }
  function isDestroyed(body2) {
    return body2 && !!(body2.destroyed || body2[kDestroyed] || stream.isDestroyed?.(body2));
  }
  function destroy(stream2, err) {
    if (stream2 == null || !isStream(stream2) || isDestroyed(stream2)) {
      return;
    }
    if (typeof stream2.destroy === "function") {
      if (Object.getPrototypeOf(stream2).constructor === IncomingMessage) {
        stream2.socket = null;
      }
      stream2.destroy(err);
    } else if (err) {
      queueMicrotask(() => {
        stream2.emit("error", err);
      });
    }
    if (stream2.destroyed !== true) {
      stream2[kDestroyed] = true;
    }
  }
  const KEEPALIVE_TIMEOUT_EXPR = /timeout=(\d+)/;
  function parseKeepAliveTimeout(val) {
    const m = val.match(KEEPALIVE_TIMEOUT_EXPR);
    return m ? parseInt(m[1], 10) * 1e3 : null;
  }
  function headerNameToString(value) {
    return typeof value === "string" ? headerNameLowerCasedRecord[value] ?? value.toLowerCase() : tree.lookup(value) ?? value.toString("latin1").toLowerCase();
  }
  function bufferToLowerCasedHeaderName(value) {
    return tree.lookup(value) ?? value.toString("latin1").toLowerCase();
  }
  function parseHeaders(headers2, obj) {
    if (obj === void 0) obj = {};
    for (let i = 0; i < headers2.length; i += 2) {
      const key = headerNameToString(headers2[i]);
      let val = obj[key];
      if (val) {
        if (typeof val === "string") {
          val = [val];
          obj[key] = val;
        }
        val.push(headers2[i + 1].toString("utf8"));
      } else {
        const headersValue = headers2[i + 1];
        if (typeof headersValue === "string") {
          obj[key] = headersValue;
        } else {
          obj[key] = Array.isArray(headersValue) ? headersValue.map((x) => x.toString("utf8")) : headersValue.toString("utf8");
        }
      }
    }
    if ("content-length" in obj && "content-disposition" in obj) {
      obj["content-disposition"] = Buffer.from(obj["content-disposition"]).toString("latin1");
    }
    return obj;
  }
  function parseRawHeaders(headers2) {
    const headersLength = headers2.length;
    const ret = new Array(headersLength);
    let hasContentLength = false;
    let contentDispositionIdx = -1;
    let key;
    let val;
    let kLen = 0;
    for (let n = 0; n < headersLength; n += 2) {
      key = headers2[n];
      val = headers2[n + 1];
      typeof key !== "string" && (key = key.toString());
      typeof val !== "string" && (val = val.toString("utf8"));
      kLen = key.length;
      if (kLen === 14 && key[7] === "-" && (key === "content-length" || key.toLowerCase() === "content-length")) {
        hasContentLength = true;
      } else if (kLen === 19 && key[7] === "-" && (key === "content-disposition" || key.toLowerCase() === "content-disposition")) {
        contentDispositionIdx = n + 1;
      }
      ret[n] = key;
      ret[n + 1] = val;
    }
    if (hasContentLength && contentDispositionIdx !== -1) {
      ret[contentDispositionIdx] = Buffer.from(ret[contentDispositionIdx]).toString("latin1");
    }
    return ret;
  }
  function encodeRawHeaders(headers2) {
    if (!Array.isArray(headers2)) {
      throw new TypeError("expected headers to be an array");
    }
    return headers2.map((x) => Buffer.from(x));
  }
  function isBuffer(buffer) {
    return buffer instanceof Uint8Array || Buffer.isBuffer(buffer);
  }
  function assertRequestHandler(handler, method, upgrade) {
    if (!handler || typeof handler !== "object") {
      throw new InvalidArgumentError("handler must be an object");
    }
    if (typeof handler.onRequestStart === "function") {
      return;
    }
    if (typeof handler.onConnect !== "function") {
      throw new InvalidArgumentError("invalid onConnect method");
    }
    if (typeof handler.onError !== "function") {
      throw new InvalidArgumentError("invalid onError method");
    }
    if (typeof handler.onBodySent !== "function" && handler.onBodySent !== void 0) {
      throw new InvalidArgumentError("invalid onBodySent method");
    }
    if (upgrade || method === "CONNECT") {
      if (typeof handler.onUpgrade !== "function") {
        throw new InvalidArgumentError("invalid onUpgrade method");
      }
    } else {
      if (typeof handler.onHeaders !== "function") {
        throw new InvalidArgumentError("invalid onHeaders method");
      }
      if (typeof handler.onData !== "function") {
        throw new InvalidArgumentError("invalid onData method");
      }
      if (typeof handler.onComplete !== "function") {
        throw new InvalidArgumentError("invalid onComplete method");
      }
    }
  }
  function isDisturbed(body2) {
    return !!(body2 && (stream.isDisturbed(body2) || body2[kBodyUsed]));
  }
  function getSocketInfo(socket) {
    return {
      localAddress: socket.localAddress,
      localPort: socket.localPort,
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort,
      remoteFamily: socket.remoteFamily,
      timeout: socket.timeout,
      bytesWritten: socket.bytesWritten,
      bytesRead: socket.bytesRead
    };
  }
  function ReadableStreamFrom(iterable) {
    let iterator;
    return new ReadableStream(
      {
        start() {
          iterator = iterable[Symbol.asyncIterator]();
        },
        pull(controller) {
          return iterator.next().then(({ done, value }) => {
            if (done) {
              return queueMicrotask(() => {
                controller.close();
                controller.byobRequest?.respond(0);
              });
            } else {
              const buf = Buffer.isBuffer(value) ? value : Buffer.from(value);
              if (buf.byteLength) {
                return controller.enqueue(new Uint8Array(buf));
              } else {
                return this.pull(controller);
              }
            }
          });
        },
        cancel() {
          return iterator.return();
        },
        type: "bytes"
      }
    );
  }
  function isFormDataLike(object) {
    return object && typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && object[Symbol.toStringTag] === "FormData";
  }
  function addAbortListener(signal, listener) {
    if ("addEventListener" in signal) {
      signal.addEventListener("abort", listener, { once: true });
      return () => signal.removeEventListener("abort", listener);
    }
    signal.once("abort", listener);
    return () => signal.removeListener("abort", listener);
  }
  const validTokenChars = new Uint8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 0-15
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 16-31
    0,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    1,
    0,
    // 32-47 (!"#$%&'()*+,-./)
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    // 48-63 (0-9:;<=>?)
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    // 64-79 (@A-O)
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    1,
    1,
    // 80-95 (P-Z[\]^_)
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    // 96-111 (`a-o)
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    1,
    0,
    1,
    0,
    // 112-127 (p-z{|}~)
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 128-143
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 144-159
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 160-175
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 176-191
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 192-207
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 208-223
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 224-239
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
    // 240-255
  ]);
  function isTokenCharCode(c) {
    return validTokenChars[c] === 1;
  }
  const tokenRegExp = /^[\^_`a-zA-Z\-0-9!#$%&'*+.|~]+$/;
  function isValidHTTPToken(characters) {
    if (characters.length >= 12) return tokenRegExp.test(characters);
    if (characters.length === 0) return false;
    for (let i = 0; i < characters.length; i++) {
      if (validTokenChars[characters.charCodeAt(i)] !== 1) {
        return false;
      }
    }
    return true;
  }
  const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
  function isValidHeaderValue(characters) {
    return !headerCharRegex.test(characters);
  }
  const rangeHeaderRegex = /^bytes (\d+)-(\d+)\/(\d+)?$/;
  function parseRangeHeader(range) {
    if (range == null || range === "") return { start: 0, end: null, size: null };
    const m = range ? range.match(rangeHeaderRegex) : null;
    return m ? {
      start: parseInt(m[1]),
      end: m[2] ? parseInt(m[2]) : null,
      size: m[3] ? parseInt(m[3]) : null
    } : null;
  }
  function addListener(obj, name, listener) {
    const listeners = obj[kListeners] ??= [];
    listeners.push([name, listener]);
    obj.on(name, listener);
    return obj;
  }
  function removeAllListeners(obj) {
    if (obj[kListeners] != null) {
      for (const [name, listener] of obj[kListeners]) {
        obj.removeListener(name, listener);
      }
      obj[kListeners] = null;
    }
    return obj;
  }
  function errorRequest(client2, request2, err) {
    try {
      request2.onError(err);
      assert(request2.aborted);
    } catch (err2) {
      client2.emit("error", err2);
    }
  }
  const setupConnectTimeout = process.platform === "win32" ? (socketWeakRef, opts) => {
    if (!opts.timeout) {
      return noop;
    }
    let s1 = null;
    let s2 = null;
    const fastTimer = timers2.setFastTimeout(() => {
      s1 = setImmediate(() => {
        s2 = setImmediate(() => onConnectTimeout(socketWeakRef.deref(), opts));
      });
    }, opts.timeout);
    return () => {
      timers2.clearFastTimeout(fastTimer);
      clearImmediate(s1);
      clearImmediate(s2);
    };
  } : (socketWeakRef, opts) => {
    if (!opts.timeout) {
      return noop;
    }
    let s1 = null;
    const fastTimer = timers2.setFastTimeout(() => {
      s1 = setImmediate(() => {
        onConnectTimeout(socketWeakRef.deref(), opts);
      });
    }, opts.timeout);
    return () => {
      timers2.clearFastTimeout(fastTimer);
      clearImmediate(s1);
    };
  };
  function onConnectTimeout(socket, opts) {
    if (socket == null) {
      return;
    }
    let message = "Connect Timeout Error";
    if (Array.isArray(socket.autoSelectFamilyAttemptedAddresses)) {
      message += ` (attempted addresses: ${socket.autoSelectFamilyAttemptedAddresses.join(", ")},`;
    } else {
      message += ` (attempted address: ${opts.hostname}:${opts.port},`;
    }
    message += ` timeout: ${opts.timeout}ms)`;
    destroy(socket, new ConnectTimeoutError(message));
  }
  function getProtocolFromUrlString(urlString) {
    if (urlString[0] === "h" && urlString[1] === "t" && urlString[2] === "t" && urlString[3] === "p") {
      switch (urlString[4]) {
        case ":":
          return "http:";
        case "s":
          if (urlString[5] === ":") {
            return "https:";
          }
      }
    }
    return urlString.slice(0, urlString.indexOf(":") + 1);
  }
  const kEnumerableProperty = /* @__PURE__ */ Object.create(null);
  kEnumerableProperty.enumerable = true;
  const normalizedMethodRecordsBase = {
    delete: "DELETE",
    DELETE: "DELETE",
    get: "GET",
    GET: "GET",
    head: "HEAD",
    HEAD: "HEAD",
    options: "OPTIONS",
    OPTIONS: "OPTIONS",
    post: "POST",
    POST: "POST",
    put: "PUT",
    PUT: "PUT"
  };
  const normalizedMethodRecords = {
    ...normalizedMethodRecordsBase,
    patch: "patch",
    PATCH: "PATCH"
  };
  Object.setPrototypeOf(normalizedMethodRecordsBase, null);
  Object.setPrototypeOf(normalizedMethodRecords, null);
  util$5 = {
    kEnumerableProperty,
    isDisturbed,
    isBlobLike,
    parseOrigin,
    parseURL,
    getServerName,
    isStream,
    isIterable,
    isAsyncIterable,
    isDestroyed,
    headerNameToString,
    bufferToLowerCasedHeaderName,
    addListener,
    removeAllListeners,
    errorRequest,
    parseRawHeaders,
    encodeRawHeaders,
    parseHeaders,
    parseKeepAliveTimeout,
    destroy,
    bodyLength,
    deepClone,
    ReadableStreamFrom,
    isBuffer,
    assertRequestHandler,
    getSocketInfo,
    isFormDataLike,
    pathHasQueryOrFragment,
    serializePathWithQuery,
    addAbortListener,
    isValidHTTPToken,
    isValidHeaderValue,
    isTokenCharCode,
    parseRangeHeader,
    normalizedMethodRecordsBase,
    normalizedMethodRecords,
    isValidPort,
    isHttpOrHttpsPrefixed,
    nodeMajor,
    nodeMinor,
    safeHTTPMethods: Object.freeze(["GET", "HEAD", "OPTIONS", "TRACE"]),
    wrapRequestBody,
    setupConnectTimeout,
    getProtocolFromUrlString
  };
  return util$5;
}
var stats;
var hasRequiredStats;
function requireStats() {
  if (hasRequiredStats) return stats;
  hasRequiredStats = 1;
  const {
    kConnected,
    kPending,
    kRunning,
    kSize,
    kFree,
    kQueued
  } = /* @__PURE__ */ requireSymbols();
  class ClientStats {
    constructor(client2) {
      this.connected = client2[kConnected];
      this.pending = client2[kPending];
      this.running = client2[kRunning];
      this.size = client2[kSize];
    }
  }
  class PoolStats {
    constructor(pool2) {
      this.connected = pool2[kConnected];
      this.free = pool2[kFree];
      this.pending = pool2[kPending];
      this.queued = pool2[kQueued];
      this.running = pool2[kRunning];
      this.size = pool2[kSize];
    }
  }
  stats = { ClientStats, PoolStats };
  return stats;
}
var diagnostics;
var hasRequiredDiagnostics;
function requireDiagnostics() {
  if (hasRequiredDiagnostics) return diagnostics;
  hasRequiredDiagnostics = 1;
  const diagnosticsChannel = require$$0$4;
  const util2 = require$$0$3;
  const undiciDebugLog = util2.debuglog("undici");
  const fetchDebuglog = util2.debuglog("fetch");
  const websocketDebuglog = util2.debuglog("websocket");
  const channels = {
    // Client
    beforeConnect: diagnosticsChannel.channel("undici:client:beforeConnect"),
    connected: diagnosticsChannel.channel("undici:client:connected"),
    connectError: diagnosticsChannel.channel("undici:client:connectError"),
    sendHeaders: diagnosticsChannel.channel("undici:client:sendHeaders"),
    // Request
    create: diagnosticsChannel.channel("undici:request:create"),
    bodySent: diagnosticsChannel.channel("undici:request:bodySent"),
    bodyChunkSent: diagnosticsChannel.channel("undici:request:bodyChunkSent"),
    bodyChunkReceived: diagnosticsChannel.channel("undici:request:bodyChunkReceived"),
    headers: diagnosticsChannel.channel("undici:request:headers"),
    trailers: diagnosticsChannel.channel("undici:request:trailers"),
    error: diagnosticsChannel.channel("undici:request:error"),
    // WebSocket
    open: diagnosticsChannel.channel("undici:websocket:open"),
    close: diagnosticsChannel.channel("undici:websocket:close"),
    socketError: diagnosticsChannel.channel("undici:websocket:socket_error"),
    ping: diagnosticsChannel.channel("undici:websocket:ping"),
    pong: diagnosticsChannel.channel("undici:websocket:pong"),
    // ProxyAgent
    proxyConnected: diagnosticsChannel.channel("undici:proxy:connected")
  };
  let isTrackingClientEvents = false;
  function trackClientEvents(debugLog = undiciDebugLog) {
    if (isTrackingClientEvents) {
      return;
    }
    if (channels.beforeConnect.hasSubscribers || channels.connected.hasSubscribers || channels.connectError.hasSubscribers || channels.sendHeaders.hasSubscribers) {
      isTrackingClientEvents = true;
      return;
    }
    isTrackingClientEvents = true;
    diagnosticsChannel.subscribe(
      "undici:client:beforeConnect",
      (evt) => {
        const {
          connectParams: { version, protocol, port, host }
        } = evt;
        debugLog(
          "connecting to %s%s using %s%s",
          host,
          port ? `:${port}` : "",
          protocol,
          version
        );
      }
    );
    diagnosticsChannel.subscribe(
      "undici:client:connected",
      (evt) => {
        const {
          connectParams: { version, protocol, port, host }
        } = evt;
        debugLog(
          "connected to %s%s using %s%s",
          host,
          port ? `:${port}` : "",
          protocol,
          version
        );
      }
    );
    diagnosticsChannel.subscribe(
      "undici:client:connectError",
      (evt) => {
        const {
          connectParams: { version, protocol, port, host },
          error
        } = evt;
        debugLog(
          "connection to %s%s using %s%s errored - %s",
          host,
          port ? `:${port}` : "",
          protocol,
          version,
          error.message
        );
      }
    );
    diagnosticsChannel.subscribe(
      "undici:client:sendHeaders",
      (evt) => {
        const {
          request: { method, path, origin }
        } = evt;
        debugLog("sending request to %s %s%s", method, origin, path);
      }
    );
  }
  let isTrackingRequestEvents = false;
  function trackRequestEvents(debugLog = undiciDebugLog) {
    if (isTrackingRequestEvents) {
      return;
    }
    if (channels.headers.hasSubscribers || channels.trailers.hasSubscribers || channels.error.hasSubscribers) {
      isTrackingRequestEvents = true;
      return;
    }
    isTrackingRequestEvents = true;
    diagnosticsChannel.subscribe(
      "undici:request:headers",
      (evt) => {
        const {
          request: { method, path, origin },
          response: { statusCode }
        } = evt;
        debugLog(
          "received response to %s %s%s - HTTP %d",
          method,
          origin,
          path,
          statusCode
        );
      }
    );
    diagnosticsChannel.subscribe(
      "undici:request:trailers",
      (evt) => {
        const {
          request: { method, path, origin }
        } = evt;
        debugLog("trailers received from %s %s%s", method, origin, path);
      }
    );
    diagnosticsChannel.subscribe(
      "undici:request:error",
      (evt) => {
        const {
          request: { method, path, origin },
          error
        } = evt;
        debugLog(
          "request to %s %s%s errored - %s",
          method,
          origin,
          path,
          error.message
        );
      }
    );
  }
  let isTrackingWebSocketEvents = false;
  function trackWebSocketEvents(debugLog = websocketDebuglog) {
    if (isTrackingWebSocketEvents) {
      return;
    }
    if (channels.open.hasSubscribers || channels.close.hasSubscribers || channels.socketError.hasSubscribers || channels.ping.hasSubscribers || channels.pong.hasSubscribers) {
      isTrackingWebSocketEvents = true;
      return;
    }
    isTrackingWebSocketEvents = true;
    diagnosticsChannel.subscribe(
      "undici:websocket:open",
      (evt) => {
        const {
          address: { address, port }
        } = evt;
        debugLog("connection opened %s%s", address, port ? `:${port}` : "");
      }
    );
    diagnosticsChannel.subscribe(
      "undici:websocket:close",
      (evt) => {
        const { websocket: websocket2, code, reason } = evt;
        debugLog(
          "closed connection to %s - %s %s",
          websocket2.url,
          code,
          reason
        );
      }
    );
    diagnosticsChannel.subscribe(
      "undici:websocket:socket_error",
      (err) => {
        debugLog("connection errored - %s", err.message);
      }
    );
    diagnosticsChannel.subscribe(
      "undici:websocket:ping",
      (evt) => {
        debugLog("ping received");
      }
    );
    diagnosticsChannel.subscribe(
      "undici:websocket:pong",
      (evt) => {
        debugLog("pong received");
      }
    );
  }
  if (undiciDebugLog.enabled || fetchDebuglog.enabled) {
    trackClientEvents(fetchDebuglog.enabled ? fetchDebuglog : undiciDebugLog);
    trackRequestEvents(fetchDebuglog.enabled ? fetchDebuglog : undiciDebugLog);
  }
  if (websocketDebuglog.enabled) {
    trackClientEvents(undiciDebugLog.enabled ? undiciDebugLog : websocketDebuglog);
    trackWebSocketEvents(websocketDebuglog);
  }
  diagnostics = {
    channels
  };
  return diagnostics;
}
var request$1;
var hasRequiredRequest$1;
function requireRequest$1() {
  if (hasRequiredRequest$1) return request$1;
  hasRequiredRequest$1 = 1;
  const {
    InvalidArgumentError,
    NotSupportedError
  } = /* @__PURE__ */ requireErrors();
  const assert = require$$0$1;
  const {
    isValidHTTPToken,
    isValidHeaderValue,
    isStream,
    destroy,
    isBuffer,
    isFormDataLike,
    isIterable,
    isBlobLike,
    serializePathWithQuery,
    assertRequestHandler,
    getServerName,
    normalizedMethodRecords,
    getProtocolFromUrlString
  } = /* @__PURE__ */ requireUtil$5();
  const { channels } = /* @__PURE__ */ requireDiagnostics();
  const { headerNameLowerCasedRecord } = /* @__PURE__ */ requireConstants$4();
  const invalidPathRegex = /[^\u0021-\u00ff]/;
  const kHandler = Symbol("handler");
  class Request {
    constructor(origin, {
      path,
      method,
      body: body2,
      headers: headers2,
      query,
      idempotent,
      blocking,
      upgrade,
      headersTimeout,
      bodyTimeout,
      reset,
      expectContinue,
      servername,
      throwOnError,
      maxRedirections
    }, handler) {
      if (typeof path !== "string") {
        throw new InvalidArgumentError("path must be a string");
      } else if (path[0] !== "/" && !(path.startsWith("http://") || path.startsWith("https://")) && method !== "CONNECT") {
        throw new InvalidArgumentError("path must be an absolute URL or start with a slash");
      } else if (invalidPathRegex.test(path)) {
        throw new InvalidArgumentError("invalid request path");
      }
      if (typeof method !== "string") {
        throw new InvalidArgumentError("method must be a string");
      } else if (normalizedMethodRecords[method] === void 0 && !isValidHTTPToken(method)) {
        throw new InvalidArgumentError("invalid request method");
      }
      if (upgrade && typeof upgrade !== "string") {
        throw new InvalidArgumentError("upgrade must be a string");
      }
      if (headersTimeout != null && (!Number.isFinite(headersTimeout) || headersTimeout < 0)) {
        throw new InvalidArgumentError("invalid headersTimeout");
      }
      if (bodyTimeout != null && (!Number.isFinite(bodyTimeout) || bodyTimeout < 0)) {
        throw new InvalidArgumentError("invalid bodyTimeout");
      }
      if (reset != null && typeof reset !== "boolean") {
        throw new InvalidArgumentError("invalid reset");
      }
      if (expectContinue != null && typeof expectContinue !== "boolean") {
        throw new InvalidArgumentError("invalid expectContinue");
      }
      if (throwOnError != null) {
        throw new InvalidArgumentError("invalid throwOnError");
      }
      if (maxRedirections != null && maxRedirections !== 0) {
        throw new InvalidArgumentError("maxRedirections is not supported, use the redirect interceptor");
      }
      this.headersTimeout = headersTimeout;
      this.bodyTimeout = bodyTimeout;
      this.method = method;
      this.abort = null;
      if (body2 == null) {
        this.body = null;
      } else if (isStream(body2)) {
        this.body = body2;
        const rState = this.body._readableState;
        if (!rState || !rState.autoDestroy) {
          this.endHandler = function autoDestroy() {
            destroy(this);
          };
          this.body.on("end", this.endHandler);
        }
        this.errorHandler = (err) => {
          if (this.abort) {
            this.abort(err);
          } else {
            this.error = err;
          }
        };
        this.body.on("error", this.errorHandler);
      } else if (isBuffer(body2)) {
        this.body = body2.byteLength ? body2 : null;
      } else if (ArrayBuffer.isView(body2)) {
        this.body = body2.buffer.byteLength ? Buffer.from(body2.buffer, body2.byteOffset, body2.byteLength) : null;
      } else if (body2 instanceof ArrayBuffer) {
        this.body = body2.byteLength ? Buffer.from(body2) : null;
      } else if (typeof body2 === "string") {
        this.body = body2.length ? Buffer.from(body2) : null;
      } else if (isFormDataLike(body2) || isIterable(body2) || isBlobLike(body2)) {
        this.body = body2;
      } else {
        throw new InvalidArgumentError("body must be a string, a Buffer, a Readable stream, an iterable, or an async iterable");
      }
      this.completed = false;
      this.aborted = false;
      this.upgrade = upgrade || null;
      this.path = query ? serializePathWithQuery(path, query) : path;
      this.origin = origin;
      this.protocol = getProtocolFromUrlString(origin);
      this.idempotent = idempotent == null ? method === "HEAD" || method === "GET" : idempotent;
      this.blocking = blocking ?? this.method !== "HEAD";
      this.reset = reset == null ? null : reset;
      this.host = null;
      this.contentLength = null;
      this.contentType = null;
      this.headers = [];
      this.expectContinue = expectContinue != null ? expectContinue : false;
      if (Array.isArray(headers2)) {
        if (headers2.length % 2 !== 0) {
          throw new InvalidArgumentError("headers array must be even");
        }
        for (let i = 0; i < headers2.length; i += 2) {
          processHeader(this, headers2[i], headers2[i + 1]);
        }
      } else if (headers2 && typeof headers2 === "object") {
        if (headers2[Symbol.iterator]) {
          for (const header of headers2) {
            if (!Array.isArray(header) || header.length !== 2) {
              throw new InvalidArgumentError("headers must be in key-value pair format");
            }
            processHeader(this, header[0], header[1]);
          }
        } else {
          const keys = Object.keys(headers2);
          for (let i = 0; i < keys.length; ++i) {
            processHeader(this, keys[i], headers2[keys[i]]);
          }
        }
      } else if (headers2 != null) {
        throw new InvalidArgumentError("headers must be an object or an array");
      }
      assertRequestHandler(handler, method, upgrade);
      this.servername = servername || getServerName(this.host) || null;
      this[kHandler] = handler;
      if (channels.create.hasSubscribers) {
        channels.create.publish({ request: this });
      }
    }
    onBodySent(chunk) {
      if (channels.bodyChunkSent.hasSubscribers) {
        channels.bodyChunkSent.publish({ request: this, chunk });
      }
      if (this[kHandler].onBodySent) {
        try {
          return this[kHandler].onBodySent(chunk);
        } catch (err) {
          this.abort(err);
        }
      }
    }
    onRequestSent() {
      if (channels.bodySent.hasSubscribers) {
        channels.bodySent.publish({ request: this });
      }
      if (this[kHandler].onRequestSent) {
        try {
          return this[kHandler].onRequestSent();
        } catch (err) {
          this.abort(err);
        }
      }
    }
    onConnect(abort) {
      assert(!this.aborted);
      assert(!this.completed);
      if (this.error) {
        abort(this.error);
      } else {
        this.abort = abort;
        return this[kHandler].onConnect(abort);
      }
    }
    onResponseStarted() {
      return this[kHandler].onResponseStarted?.();
    }
    onHeaders(statusCode, headers2, resume, statusText) {
      assert(!this.aborted);
      assert(!this.completed);
      if (channels.headers.hasSubscribers) {
        channels.headers.publish({ request: this, response: { statusCode, headers: headers2, statusText } });
      }
      try {
        return this[kHandler].onHeaders(statusCode, headers2, resume, statusText);
      } catch (err) {
        this.abort(err);
      }
    }
    onData(chunk) {
      assert(!this.aborted);
      assert(!this.completed);
      if (channels.bodyChunkReceived.hasSubscribers) {
        channels.bodyChunkReceived.publish({ request: this, chunk });
      }
      try {
        return this[kHandler].onData(chunk);
      } catch (err) {
        this.abort(err);
        return false;
      }
    }
    onUpgrade(statusCode, headers2, socket) {
      assert(!this.aborted);
      assert(!this.completed);
      return this[kHandler].onUpgrade(statusCode, headers2, socket);
    }
    onComplete(trailers) {
      this.onFinally();
      assert(!this.aborted);
      assert(!this.completed);
      this.completed = true;
      if (channels.trailers.hasSubscribers) {
        channels.trailers.publish({ request: this, trailers });
      }
      try {
        return this[kHandler].onComplete(trailers);
      } catch (err) {
        this.onError(err);
      }
    }
    onError(error) {
      this.onFinally();
      if (channels.error.hasSubscribers) {
        channels.error.publish({ request: this, error });
      }
      if (this.aborted) {
        return;
      }
      this.aborted = true;
      return this[kHandler].onError(error);
    }
    onFinally() {
      if (this.errorHandler) {
        this.body.off("error", this.errorHandler);
        this.errorHandler = null;
      }
      if (this.endHandler) {
        this.body.off("end", this.endHandler);
        this.endHandler = null;
      }
    }
    addHeader(key, value) {
      processHeader(this, key, value);
      return this;
    }
  }
  function processHeader(request2, key, val) {
    if (val && (typeof val === "object" && !Array.isArray(val))) {
      throw new InvalidArgumentError(`invalid ${key} header`);
    } else if (val === void 0) {
      return;
    }
    let headerName = headerNameLowerCasedRecord[key];
    if (headerName === void 0) {
      headerName = key.toLowerCase();
      if (headerNameLowerCasedRecord[headerName] === void 0 && !isValidHTTPToken(headerName)) {
        throw new InvalidArgumentError("invalid header key");
      }
    }
    if (Array.isArray(val)) {
      const arr = [];
      for (let i = 0; i < val.length; i++) {
        if (typeof val[i] === "string") {
          if (!isValidHeaderValue(val[i])) {
            throw new InvalidArgumentError(`invalid ${key} header`);
          }
          arr.push(val[i]);
        } else if (val[i] === null) {
          arr.push("");
        } else if (typeof val[i] === "object") {
          throw new InvalidArgumentError(`invalid ${key} header`);
        } else {
          arr.push(`${val[i]}`);
        }
      }
      val = arr;
    } else if (typeof val === "string") {
      if (!isValidHeaderValue(val)) {
        throw new InvalidArgumentError(`invalid ${key} header`);
      }
    } else if (val === null) {
      val = "";
    } else {
      val = `${val}`;
    }
    if (request2.host === null && headerName === "host") {
      if (typeof val !== "string") {
        throw new InvalidArgumentError("invalid host header");
      }
      request2.host = val;
    } else if (request2.contentLength === null && headerName === "content-length") {
      request2.contentLength = parseInt(val, 10);
      if (!Number.isFinite(request2.contentLength)) {
        throw new InvalidArgumentError("invalid content-length header");
      }
    } else if (request2.contentType === null && headerName === "content-type") {
      request2.contentType = val;
      request2.headers.push(key, val);
    } else if (headerName === "transfer-encoding" || headerName === "keep-alive" || headerName === "upgrade") {
      throw new InvalidArgumentError(`invalid ${headerName} header`);
    } else if (headerName === "connection") {
      const value = typeof val === "string" ? val.toLowerCase() : null;
      if (value !== "close" && value !== "keep-alive") {
        throw new InvalidArgumentError("invalid connection header");
      }
      if (value === "close") {
        request2.reset = true;
      }
    } else if (headerName === "expect") {
      throw new NotSupportedError("expect header not supported");
    } else {
      request2.headers.push(key, val);
    }
  }
  request$1 = Request;
  return request$1;
}
var wrapHandler;
var hasRequiredWrapHandler;
function requireWrapHandler() {
  if (hasRequiredWrapHandler) return wrapHandler;
  hasRequiredWrapHandler = 1;
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  wrapHandler = class WrapHandler {
    #handler;
    constructor(handler) {
      this.#handler = handler;
    }
    static wrap(handler) {
      return handler.onRequestStart ? handler : new WrapHandler(handler);
    }
    // Unwrap Interface
    onConnect(abort, context) {
      return this.#handler.onConnect?.(abort, context);
    }
    onHeaders(statusCode, rawHeaders, resume, statusMessage) {
      return this.#handler.onHeaders?.(statusCode, rawHeaders, resume, statusMessage);
    }
    onUpgrade(statusCode, rawHeaders, socket) {
      return this.#handler.onUpgrade?.(statusCode, rawHeaders, socket);
    }
    onData(data) {
      return this.#handler.onData?.(data);
    }
    onComplete(trailers) {
      return this.#handler.onComplete?.(trailers);
    }
    onError(err) {
      if (!this.#handler.onError) {
        throw err;
      }
      return this.#handler.onError?.(err);
    }
    // Wrap Interface
    onRequestStart(controller, context) {
      this.#handler.onConnect?.((reason) => controller.abort(reason), context);
    }
    onRequestUpgrade(controller, statusCode, headers2, socket) {
      const rawHeaders = [];
      for (const [key, val] of Object.entries(headers2)) {
        rawHeaders.push(Buffer.from(key), Array.isArray(val) ? val.map((v) => Buffer.from(v)) : Buffer.from(val));
      }
      this.#handler.onUpgrade?.(statusCode, rawHeaders, socket);
    }
    onResponseStart(controller, statusCode, headers2, statusMessage) {
      const rawHeaders = [];
      for (const [key, val] of Object.entries(headers2)) {
        rawHeaders.push(Buffer.from(key), Array.isArray(val) ? val.map((v) => Buffer.from(v)) : Buffer.from(val));
      }
      if (this.#handler.onHeaders?.(statusCode, rawHeaders, () => controller.resume(), statusMessage) === false) {
        controller.pause();
      }
    }
    onResponseData(controller, data) {
      if (this.#handler.onData?.(data) === false) {
        controller.pause();
      }
    }
    onResponseEnd(controller, trailers) {
      const rawTrailers = [];
      for (const [key, val] of Object.entries(trailers)) {
        rawTrailers.push(Buffer.from(key), Array.isArray(val) ? val.map((v) => Buffer.from(v)) : Buffer.from(val));
      }
      this.#handler.onComplete?.(rawTrailers);
    }
    onResponseError(controller, err) {
      if (!this.#handler.onError) {
        throw new InvalidArgumentError("invalid onError method");
      }
      this.#handler.onError?.(err);
    }
  };
  return wrapHandler;
}
var dispatcher;
var hasRequiredDispatcher;
function requireDispatcher() {
  if (hasRequiredDispatcher) return dispatcher;
  hasRequiredDispatcher = 1;
  const EventEmitter = require$$6;
  const WrapHandler = /* @__PURE__ */ requireWrapHandler();
  const wrapInterceptor = (dispatch) => (opts, handler) => dispatch(opts, WrapHandler.wrap(handler));
  class Dispatcher extends EventEmitter {
    dispatch() {
      throw new Error("not implemented");
    }
    close() {
      throw new Error("not implemented");
    }
    destroy() {
      throw new Error("not implemented");
    }
    compose(...args) {
      const interceptors = Array.isArray(args[0]) ? args[0] : args;
      let dispatch = this.dispatch.bind(this);
      for (const interceptor of interceptors) {
        if (interceptor == null) {
          continue;
        }
        if (typeof interceptor !== "function") {
          throw new TypeError(`invalid interceptor, expected function received ${typeof interceptor}`);
        }
        dispatch = interceptor(dispatch);
        dispatch = wrapInterceptor(dispatch);
        if (dispatch == null || typeof dispatch !== "function" || dispatch.length !== 2) {
          throw new TypeError("invalid interceptor");
        }
      }
      return new Proxy(this, {
        get: (target, key) => key === "dispatch" ? dispatch : target[key]
      });
    }
  }
  dispatcher = Dispatcher;
  return dispatcher;
}
var unwrapHandler;
var hasRequiredUnwrapHandler;
function requireUnwrapHandler() {
  if (hasRequiredUnwrapHandler) return unwrapHandler;
  hasRequiredUnwrapHandler = 1;
  const { parseHeaders } = /* @__PURE__ */ requireUtil$5();
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  const kResume = Symbol("resume");
  class UnwrapController {
    #paused = false;
    #reason = null;
    #aborted = false;
    #abort;
    [kResume] = null;
    constructor(abort) {
      this.#abort = abort;
    }
    pause() {
      this.#paused = true;
    }
    resume() {
      if (this.#paused) {
        this.#paused = false;
        this[kResume]?.();
      }
    }
    abort(reason) {
      if (!this.#aborted) {
        this.#aborted = true;
        this.#reason = reason;
        this.#abort(reason);
      }
    }
    get aborted() {
      return this.#aborted;
    }
    get reason() {
      return this.#reason;
    }
    get paused() {
      return this.#paused;
    }
  }
  unwrapHandler = class UnwrapHandler {
    #handler;
    #controller;
    constructor(handler) {
      this.#handler = handler;
    }
    static unwrap(handler) {
      return !handler.onRequestStart ? handler : new UnwrapHandler(handler);
    }
    onConnect(abort, context) {
      this.#controller = new UnwrapController(abort);
      this.#handler.onRequestStart?.(this.#controller, context);
    }
    onUpgrade(statusCode, rawHeaders, socket) {
      this.#handler.onRequestUpgrade?.(this.#controller, statusCode, parseHeaders(rawHeaders), socket);
    }
    onHeaders(statusCode, rawHeaders, resume, statusMessage) {
      this.#controller[kResume] = resume;
      this.#handler.onResponseStart?.(this.#controller, statusCode, parseHeaders(rawHeaders), statusMessage);
      return !this.#controller.paused;
    }
    onData(data) {
      this.#handler.onResponseData?.(this.#controller, data);
      return !this.#controller.paused;
    }
    onComplete(rawTrailers) {
      this.#handler.onResponseEnd?.(this.#controller, parseHeaders(rawTrailers));
    }
    onError(err) {
      if (!this.#handler.onResponseError) {
        throw new InvalidArgumentError("invalid onError method");
      }
      this.#handler.onResponseError?.(this.#controller, err);
    }
  };
  return unwrapHandler;
}
var dispatcherBase;
var hasRequiredDispatcherBase;
function requireDispatcherBase() {
  if (hasRequiredDispatcherBase) return dispatcherBase;
  hasRequiredDispatcherBase = 1;
  const Dispatcher = /* @__PURE__ */ requireDispatcher();
  const UnwrapHandler = /* @__PURE__ */ requireUnwrapHandler();
  const {
    ClientDestroyedError,
    ClientClosedError,
    InvalidArgumentError
  } = /* @__PURE__ */ requireErrors();
  const { kDestroy, kClose, kClosed, kDestroyed, kDispatch } = /* @__PURE__ */ requireSymbols();
  const kOnDestroyed = Symbol("onDestroyed");
  const kOnClosed = Symbol("onClosed");
  class DispatcherBase extends Dispatcher {
    /** @type {boolean} */
    [kDestroyed] = false;
    /** @type {Array<Function|null} */
    [kOnDestroyed] = null;
    /** @type {boolean} */
    [kClosed] = false;
    /** @type {Array<Function>|null} */
    [kOnClosed] = null;
    /** @returns {boolean} */
    get destroyed() {
      return this[kDestroyed];
    }
    /** @returns {boolean} */
    get closed() {
      return this[kClosed];
    }
    close(callback) {
      if (callback === void 0) {
        return new Promise((resolve, reject) => {
          this.close((err, data) => {
            return err ? reject(err) : resolve(data);
          });
        });
      }
      if (typeof callback !== "function") {
        throw new InvalidArgumentError("invalid callback");
      }
      if (this[kDestroyed]) {
        const err = new ClientDestroyedError();
        queueMicrotask(() => callback(err, null));
        return;
      }
      if (this[kClosed]) {
        if (this[kOnClosed]) {
          this[kOnClosed].push(callback);
        } else {
          queueMicrotask(() => callback(null, null));
        }
        return;
      }
      this[kClosed] = true;
      this[kOnClosed] ??= [];
      this[kOnClosed].push(callback);
      const onClosed = () => {
        const callbacks = this[kOnClosed];
        this[kOnClosed] = null;
        for (let i = 0; i < callbacks.length; i++) {
          callbacks[i](null, null);
        }
      };
      this[kClose]().then(() => this.destroy()).then(() => queueMicrotask(onClosed));
    }
    destroy(err, callback) {
      if (typeof err === "function") {
        callback = err;
        err = null;
      }
      if (callback === void 0) {
        return new Promise((resolve, reject) => {
          this.destroy(err, (err2, data) => {
            return err2 ? reject(err2) : resolve(data);
          });
        });
      }
      if (typeof callback !== "function") {
        throw new InvalidArgumentError("invalid callback");
      }
      if (this[kDestroyed]) {
        if (this[kOnDestroyed]) {
          this[kOnDestroyed].push(callback);
        } else {
          queueMicrotask(() => callback(null, null));
        }
        return;
      }
      if (!err) {
        err = new ClientDestroyedError();
      }
      this[kDestroyed] = true;
      this[kOnDestroyed] ??= [];
      this[kOnDestroyed].push(callback);
      const onDestroyed = () => {
        const callbacks = this[kOnDestroyed];
        this[kOnDestroyed] = null;
        for (let i = 0; i < callbacks.length; i++) {
          callbacks[i](null, null);
        }
      };
      this[kDestroy](err).then(() => queueMicrotask(onDestroyed));
    }
    dispatch(opts, handler) {
      if (!handler || typeof handler !== "object") {
        throw new InvalidArgumentError("handler must be an object");
      }
      handler = UnwrapHandler.unwrap(handler);
      try {
        if (!opts || typeof opts !== "object") {
          throw new InvalidArgumentError("opts must be an object.");
        }
        if (this[kDestroyed] || this[kOnDestroyed]) {
          throw new ClientDestroyedError();
        }
        if (this[kClosed]) {
          throw new ClientClosedError();
        }
        return this[kDispatch](opts, handler);
      } catch (err) {
        if (typeof handler.onError !== "function") {
          throw err;
        }
        handler.onError(err);
        return false;
      }
    }
  }
  dispatcherBase = DispatcherBase;
  return dispatcherBase;
}
var connect;
var hasRequiredConnect;
function requireConnect() {
  if (hasRequiredConnect) return connect;
  hasRequiredConnect = 1;
  const net = require$$0$2;
  const assert = require$$0$1;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  let tls;
  const SessionCache = class WeakSessionCache {
    constructor(maxCachedSessions) {
      this._maxCachedSessions = maxCachedSessions;
      this._sessionCache = /* @__PURE__ */ new Map();
      this._sessionRegistry = new FinalizationRegistry((key) => {
        if (this._sessionCache.size < this._maxCachedSessions) {
          return;
        }
        const ref = this._sessionCache.get(key);
        if (ref !== void 0 && ref.deref() === void 0) {
          this._sessionCache.delete(key);
        }
      });
    }
    get(sessionKey) {
      const ref = this._sessionCache.get(sessionKey);
      return ref ? ref.deref() : null;
    }
    set(sessionKey, session) {
      if (this._maxCachedSessions === 0) {
        return;
      }
      this._sessionCache.set(sessionKey, new WeakRef(session));
      this._sessionRegistry.register(session, sessionKey);
    }
  };
  function buildConnector({ allowH2, useH2c, maxCachedSessions, socketPath, timeout, session: customSession, ...opts }) {
    if (maxCachedSessions != null && (!Number.isInteger(maxCachedSessions) || maxCachedSessions < 0)) {
      throw new InvalidArgumentError("maxCachedSessions must be a positive integer or zero");
    }
    const options = { path: socketPath, ...opts };
    const sessionCache = new SessionCache(maxCachedSessions == null ? 100 : maxCachedSessions);
    timeout = timeout == null ? 1e4 : timeout;
    allowH2 = allowH2 != null ? allowH2 : false;
    return function connect2({ hostname, host, protocol, port, servername, localAddress, httpSocket }, callback) {
      let socket;
      if (protocol === "https:") {
        if (!tls) {
          tls = require$$4;
        }
        servername = servername || options.servername || util2.getServerName(host) || null;
        const sessionKey = servername || hostname;
        assert(sessionKey);
        const session = customSession || sessionCache.get(sessionKey) || null;
        port = port || 443;
        socket = tls.connect({
          highWaterMark: 16384,
          // TLS in node can't have bigger HWM anyway...
          ...options,
          servername,
          session,
          localAddress,
          ALPNProtocols: allowH2 ? ["http/1.1", "h2"] : ["http/1.1"],
          socket: httpSocket,
          // upgrade socket connection
          port,
          host: hostname
        });
        socket.on("session", function(session2) {
          sessionCache.set(sessionKey, session2);
        });
      } else {
        assert(!httpSocket, "httpSocket can only be sent on TLS update");
        port = port || 80;
        socket = net.connect({
          highWaterMark: 64 * 1024,
          // Same as nodejs fs streams.
          ...options,
          localAddress,
          port,
          host: hostname
        });
        if (useH2c === true) {
          socket.alpnProtocol = "h2";
        }
      }
      if (options.keepAlive == null || options.keepAlive) {
        const keepAliveInitialDelay = options.keepAliveInitialDelay === void 0 ? 6e4 : options.keepAliveInitialDelay;
        socket.setKeepAlive(true, keepAliveInitialDelay);
      }
      const clearConnectTimeout = util2.setupConnectTimeout(new WeakRef(socket), { timeout, hostname, port });
      socket.setNoDelay(true).once(protocol === "https:" ? "secureConnect" : "connect", function() {
        queueMicrotask(clearConnectTimeout);
        if (callback) {
          const cb = callback;
          callback = null;
          cb(null, this);
        }
      }).on("error", function(err) {
        queueMicrotask(clearConnectTimeout);
        if (callback) {
          const cb = callback;
          callback = null;
          cb(err);
        }
      });
      return socket;
    };
  }
  connect = buildConnector;
  return connect;
}
var constants$3 = {};
var utils = {};
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  Object.defineProperty(utils, "__esModule", { value: true });
  utils.enumToMap = enumToMap;
  function enumToMap(obj, filter = [], exceptions = []) {
    const emptyFilter = (filter?.length ?? 0) === 0;
    const emptyExceptions = (exceptions?.length ?? 0) === 0;
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => {
      return typeof value === "number" && (emptyFilter || filter.includes(value)) && (emptyExceptions || !exceptions.includes(value));
    }));
  }
  return utils;
}
var hasRequiredConstants$3;
function requireConstants$3() {
  if (hasRequiredConstants$3) return constants$3;
  hasRequiredConstants$3 = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.SPECIAL_HEADERS = exports$1.MINOR = exports$1.MAJOR = exports$1.HTAB_SP_VCHAR_OBS_TEXT = exports$1.QUOTED_STRING = exports$1.CONNECTION_TOKEN_CHARS = exports$1.HEADER_CHARS = exports$1.TOKEN = exports$1.HEX = exports$1.URL_CHAR = exports$1.USERINFO_CHARS = exports$1.MARK = exports$1.ALPHANUM = exports$1.NUM = exports$1.HEX_MAP = exports$1.NUM_MAP = exports$1.ALPHA = exports$1.STATUSES_HTTP = exports$1.H_METHOD_MAP = exports$1.METHOD_MAP = exports$1.METHODS_RTSP = exports$1.METHODS_ICE = exports$1.METHODS_HTTP = exports$1.HEADER_STATE = exports$1.FINISH = exports$1.STATUSES = exports$1.METHODS = exports$1.LENIENT_FLAGS = exports$1.FLAGS = exports$1.TYPE = exports$1.ERROR = void 0;
    const utils_1 = /* @__PURE__ */ requireUtils();
    exports$1.ERROR = {
      OK: 0,
      INTERNAL: 1,
      STRICT: 2,
      CR_EXPECTED: 25,
      LF_EXPECTED: 3,
      UNEXPECTED_CONTENT_LENGTH: 4,
      UNEXPECTED_SPACE: 30,
      CLOSED_CONNECTION: 5,
      INVALID_METHOD: 6,
      INVALID_URL: 7,
      INVALID_CONSTANT: 8,
      INVALID_VERSION: 9,
      INVALID_HEADER_TOKEN: 10,
      INVALID_CONTENT_LENGTH: 11,
      INVALID_CHUNK_SIZE: 12,
      INVALID_STATUS: 13,
      INVALID_EOF_STATE: 14,
      INVALID_TRANSFER_ENCODING: 15,
      CB_MESSAGE_BEGIN: 16,
      CB_HEADERS_COMPLETE: 17,
      CB_MESSAGE_COMPLETE: 18,
      CB_CHUNK_HEADER: 19,
      CB_CHUNK_COMPLETE: 20,
      PAUSED: 21,
      PAUSED_UPGRADE: 22,
      PAUSED_H2_UPGRADE: 23,
      USER: 24,
      CB_URL_COMPLETE: 26,
      CB_STATUS_COMPLETE: 27,
      CB_METHOD_COMPLETE: 32,
      CB_VERSION_COMPLETE: 33,
      CB_HEADER_FIELD_COMPLETE: 28,
      CB_HEADER_VALUE_COMPLETE: 29,
      CB_CHUNK_EXTENSION_NAME_COMPLETE: 34,
      CB_CHUNK_EXTENSION_VALUE_COMPLETE: 35,
      CB_RESET: 31,
      CB_PROTOCOL_COMPLETE: 38
    };
    exports$1.TYPE = {
      BOTH: 0,
      // default
      REQUEST: 1,
      RESPONSE: 2
    };
    exports$1.FLAGS = {
      CONNECTION_KEEP_ALIVE: 1 << 0,
      CONNECTION_CLOSE: 1 << 1,
      CONNECTION_UPGRADE: 1 << 2,
      CHUNKED: 1 << 3,
      UPGRADE: 1 << 4,
      CONTENT_LENGTH: 1 << 5,
      SKIPBODY: 1 << 6,
      TRAILING: 1 << 7,
      // 1 << 8 is unused
      TRANSFER_ENCODING: 1 << 9
    };
    exports$1.LENIENT_FLAGS = {
      HEADERS: 1 << 0,
      CHUNKED_LENGTH: 1 << 1,
      KEEP_ALIVE: 1 << 2,
      TRANSFER_ENCODING: 1 << 3,
      VERSION: 1 << 4,
      DATA_AFTER_CLOSE: 1 << 5,
      OPTIONAL_LF_AFTER_CR: 1 << 6,
      OPTIONAL_CRLF_AFTER_CHUNK: 1 << 7,
      OPTIONAL_CR_BEFORE_LF: 1 << 8,
      SPACES_AFTER_CHUNK_SIZE: 1 << 9
    };
    exports$1.METHODS = {
      "DELETE": 0,
      "GET": 1,
      "HEAD": 2,
      "POST": 3,
      "PUT": 4,
      /* pathological */
      "CONNECT": 5,
      "OPTIONS": 6,
      "TRACE": 7,
      /* WebDAV */
      "COPY": 8,
      "LOCK": 9,
      "MKCOL": 10,
      "MOVE": 11,
      "PROPFIND": 12,
      "PROPPATCH": 13,
      "SEARCH": 14,
      "UNLOCK": 15,
      "BIND": 16,
      "REBIND": 17,
      "UNBIND": 18,
      "ACL": 19,
      /* subversion */
      "REPORT": 20,
      "MKACTIVITY": 21,
      "CHECKOUT": 22,
      "MERGE": 23,
      /* upnp */
      "M-SEARCH": 24,
      "NOTIFY": 25,
      "SUBSCRIBE": 26,
      "UNSUBSCRIBE": 27,
      /* RFC-5789 */
      "PATCH": 28,
      "PURGE": 29,
      /* CalDAV */
      "MKCALENDAR": 30,
      /* RFC-2068, section 19.6.1.2 */
      "LINK": 31,
      "UNLINK": 32,
      /* icecast */
      "SOURCE": 33,
      /* RFC-7540, section 11.6 */
      "PRI": 34,
      /* RFC-2326 RTSP */
      "DESCRIBE": 35,
      "ANNOUNCE": 36,
      "SETUP": 37,
      "PLAY": 38,
      "PAUSE": 39,
      "TEARDOWN": 40,
      "GET_PARAMETER": 41,
      "SET_PARAMETER": 42,
      "REDIRECT": 43,
      "RECORD": 44,
      /* RAOP */
      "FLUSH": 45,
      /* DRAFT https://www.ietf.org/archive/id/draft-ietf-httpbis-safe-method-w-body-02.html */
      "QUERY": 46
    };
    exports$1.STATUSES = {
      CONTINUE: 100,
      SWITCHING_PROTOCOLS: 101,
      PROCESSING: 102,
      EARLY_HINTS: 103,
      RESPONSE_IS_STALE: 110,
      // Unofficial
      REVALIDATION_FAILED: 111,
      // Unofficial
      DISCONNECTED_OPERATION: 112,
      // Unofficial
      HEURISTIC_EXPIRATION: 113,
      // Unofficial
      MISCELLANEOUS_WARNING: 199,
      // Unofficial
      OK: 200,
      CREATED: 201,
      ACCEPTED: 202,
      NON_AUTHORITATIVE_INFORMATION: 203,
      NO_CONTENT: 204,
      RESET_CONTENT: 205,
      PARTIAL_CONTENT: 206,
      MULTI_STATUS: 207,
      ALREADY_REPORTED: 208,
      TRANSFORMATION_APPLIED: 214,
      // Unofficial
      IM_USED: 226,
      MISCELLANEOUS_PERSISTENT_WARNING: 299,
      // Unofficial
      MULTIPLE_CHOICES: 300,
      MOVED_PERMANENTLY: 301,
      FOUND: 302,
      SEE_OTHER: 303,
      NOT_MODIFIED: 304,
      USE_PROXY: 305,
      SWITCH_PROXY: 306,
      // No longer used
      TEMPORARY_REDIRECT: 307,
      PERMANENT_REDIRECT: 308,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      PAYMENT_REQUIRED: 402,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      METHOD_NOT_ALLOWED: 405,
      NOT_ACCEPTABLE: 406,
      PROXY_AUTHENTICATION_REQUIRED: 407,
      REQUEST_TIMEOUT: 408,
      CONFLICT: 409,
      GONE: 410,
      LENGTH_REQUIRED: 411,
      PRECONDITION_FAILED: 412,
      PAYLOAD_TOO_LARGE: 413,
      URI_TOO_LONG: 414,
      UNSUPPORTED_MEDIA_TYPE: 415,
      RANGE_NOT_SATISFIABLE: 416,
      EXPECTATION_FAILED: 417,
      IM_A_TEAPOT: 418,
      PAGE_EXPIRED: 419,
      // Unofficial
      ENHANCE_YOUR_CALM: 420,
      // Unofficial
      MISDIRECTED_REQUEST: 421,
      UNPROCESSABLE_ENTITY: 422,
      LOCKED: 423,
      FAILED_DEPENDENCY: 424,
      TOO_EARLY: 425,
      UPGRADE_REQUIRED: 426,
      PRECONDITION_REQUIRED: 428,
      TOO_MANY_REQUESTS: 429,
      REQUEST_HEADER_FIELDS_TOO_LARGE_UNOFFICIAL: 430,
      // Unofficial
      REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
      LOGIN_TIMEOUT: 440,
      // Unofficial
      NO_RESPONSE: 444,
      // Unofficial
      RETRY_WITH: 449,
      // Unofficial
      BLOCKED_BY_PARENTAL_CONTROL: 450,
      // Unofficial
      UNAVAILABLE_FOR_LEGAL_REASONS: 451,
      CLIENT_CLOSED_LOAD_BALANCED_REQUEST: 460,
      // Unofficial
      INVALID_X_FORWARDED_FOR: 463,
      // Unofficial
      REQUEST_HEADER_TOO_LARGE: 494,
      // Unofficial
      SSL_CERTIFICATE_ERROR: 495,
      // Unofficial
      SSL_CERTIFICATE_REQUIRED: 496,
      // Unofficial
      HTTP_REQUEST_SENT_TO_HTTPS_PORT: 497,
      // Unofficial
      INVALID_TOKEN: 498,
      // Unofficial
      CLIENT_CLOSED_REQUEST: 499,
      // Unofficial
      INTERNAL_SERVER_ERROR: 500,
      NOT_IMPLEMENTED: 501,
      BAD_GATEWAY: 502,
      SERVICE_UNAVAILABLE: 503,
      GATEWAY_TIMEOUT: 504,
      HTTP_VERSION_NOT_SUPPORTED: 505,
      VARIANT_ALSO_NEGOTIATES: 506,
      INSUFFICIENT_STORAGE: 507,
      LOOP_DETECTED: 508,
      BANDWIDTH_LIMIT_EXCEEDED: 509,
      NOT_EXTENDED: 510,
      NETWORK_AUTHENTICATION_REQUIRED: 511,
      WEB_SERVER_UNKNOWN_ERROR: 520,
      // Unofficial
      WEB_SERVER_IS_DOWN: 521,
      // Unofficial
      CONNECTION_TIMEOUT: 522,
      // Unofficial
      ORIGIN_IS_UNREACHABLE: 523,
      // Unofficial
      TIMEOUT_OCCURED: 524,
      // Unofficial
      SSL_HANDSHAKE_FAILED: 525,
      // Unofficial
      INVALID_SSL_CERTIFICATE: 526,
      // Unofficial
      RAILGUN_ERROR: 527,
      // Unofficial
      SITE_IS_OVERLOADED: 529,
      // Unofficial
      SITE_IS_FROZEN: 530,
      // Unofficial
      IDENTITY_PROVIDER_AUTHENTICATION_ERROR: 561,
      // Unofficial
      NETWORK_READ_TIMEOUT: 598,
      // Unofficial
      NETWORK_CONNECT_TIMEOUT: 599
      // Unofficial
    };
    exports$1.FINISH = {
      SAFE: 0,
      SAFE_WITH_CB: 1,
      UNSAFE: 2
    };
    exports$1.HEADER_STATE = {
      GENERAL: 0,
      CONNECTION: 1,
      CONTENT_LENGTH: 2,
      TRANSFER_ENCODING: 3,
      UPGRADE: 4,
      CONNECTION_KEEP_ALIVE: 5,
      CONNECTION_CLOSE: 6,
      CONNECTION_UPGRADE: 7,
      TRANSFER_ENCODING_CHUNKED: 8
    };
    exports$1.METHODS_HTTP = [
      exports$1.METHODS.DELETE,
      exports$1.METHODS.GET,
      exports$1.METHODS.HEAD,
      exports$1.METHODS.POST,
      exports$1.METHODS.PUT,
      exports$1.METHODS.CONNECT,
      exports$1.METHODS.OPTIONS,
      exports$1.METHODS.TRACE,
      exports$1.METHODS.COPY,
      exports$1.METHODS.LOCK,
      exports$1.METHODS.MKCOL,
      exports$1.METHODS.MOVE,
      exports$1.METHODS.PROPFIND,
      exports$1.METHODS.PROPPATCH,
      exports$1.METHODS.SEARCH,
      exports$1.METHODS.UNLOCK,
      exports$1.METHODS.BIND,
      exports$1.METHODS.REBIND,
      exports$1.METHODS.UNBIND,
      exports$1.METHODS.ACL,
      exports$1.METHODS.REPORT,
      exports$1.METHODS.MKACTIVITY,
      exports$1.METHODS.CHECKOUT,
      exports$1.METHODS.MERGE,
      exports$1.METHODS["M-SEARCH"],
      exports$1.METHODS.NOTIFY,
      exports$1.METHODS.SUBSCRIBE,
      exports$1.METHODS.UNSUBSCRIBE,
      exports$1.METHODS.PATCH,
      exports$1.METHODS.PURGE,
      exports$1.METHODS.MKCALENDAR,
      exports$1.METHODS.LINK,
      exports$1.METHODS.UNLINK,
      exports$1.METHODS.PRI,
      // TODO(indutny): should we allow it with HTTP?
      exports$1.METHODS.SOURCE,
      exports$1.METHODS.QUERY
    ];
    exports$1.METHODS_ICE = [
      exports$1.METHODS.SOURCE
    ];
    exports$1.METHODS_RTSP = [
      exports$1.METHODS.OPTIONS,
      exports$1.METHODS.DESCRIBE,
      exports$1.METHODS.ANNOUNCE,
      exports$1.METHODS.SETUP,
      exports$1.METHODS.PLAY,
      exports$1.METHODS.PAUSE,
      exports$1.METHODS.TEARDOWN,
      exports$1.METHODS.GET_PARAMETER,
      exports$1.METHODS.SET_PARAMETER,
      exports$1.METHODS.REDIRECT,
      exports$1.METHODS.RECORD,
      exports$1.METHODS.FLUSH,
      // For AirPlay
      exports$1.METHODS.GET,
      exports$1.METHODS.POST
    ];
    exports$1.METHOD_MAP = (0, utils_1.enumToMap)(exports$1.METHODS);
    exports$1.H_METHOD_MAP = Object.fromEntries(Object.entries(exports$1.METHODS).filter(([k]) => k.startsWith("H")));
    exports$1.STATUSES_HTTP = [
      exports$1.STATUSES.CONTINUE,
      exports$1.STATUSES.SWITCHING_PROTOCOLS,
      exports$1.STATUSES.PROCESSING,
      exports$1.STATUSES.EARLY_HINTS,
      exports$1.STATUSES.RESPONSE_IS_STALE,
      exports$1.STATUSES.REVALIDATION_FAILED,
      exports$1.STATUSES.DISCONNECTED_OPERATION,
      exports$1.STATUSES.HEURISTIC_EXPIRATION,
      exports$1.STATUSES.MISCELLANEOUS_WARNING,
      exports$1.STATUSES.OK,
      exports$1.STATUSES.CREATED,
      exports$1.STATUSES.ACCEPTED,
      exports$1.STATUSES.NON_AUTHORITATIVE_INFORMATION,
      exports$1.STATUSES.NO_CONTENT,
      exports$1.STATUSES.RESET_CONTENT,
      exports$1.STATUSES.PARTIAL_CONTENT,
      exports$1.STATUSES.MULTI_STATUS,
      exports$1.STATUSES.ALREADY_REPORTED,
      exports$1.STATUSES.TRANSFORMATION_APPLIED,
      exports$1.STATUSES.IM_USED,
      exports$1.STATUSES.MISCELLANEOUS_PERSISTENT_WARNING,
      exports$1.STATUSES.MULTIPLE_CHOICES,
      exports$1.STATUSES.MOVED_PERMANENTLY,
      exports$1.STATUSES.FOUND,
      exports$1.STATUSES.SEE_OTHER,
      exports$1.STATUSES.NOT_MODIFIED,
      exports$1.STATUSES.USE_PROXY,
      exports$1.STATUSES.SWITCH_PROXY,
      exports$1.STATUSES.TEMPORARY_REDIRECT,
      exports$1.STATUSES.PERMANENT_REDIRECT,
      exports$1.STATUSES.BAD_REQUEST,
      exports$1.STATUSES.UNAUTHORIZED,
      exports$1.STATUSES.PAYMENT_REQUIRED,
      exports$1.STATUSES.FORBIDDEN,
      exports$1.STATUSES.NOT_FOUND,
      exports$1.STATUSES.METHOD_NOT_ALLOWED,
      exports$1.STATUSES.NOT_ACCEPTABLE,
      exports$1.STATUSES.PROXY_AUTHENTICATION_REQUIRED,
      exports$1.STATUSES.REQUEST_TIMEOUT,
      exports$1.STATUSES.CONFLICT,
      exports$1.STATUSES.GONE,
      exports$1.STATUSES.LENGTH_REQUIRED,
      exports$1.STATUSES.PRECONDITION_FAILED,
      exports$1.STATUSES.PAYLOAD_TOO_LARGE,
      exports$1.STATUSES.URI_TOO_LONG,
      exports$1.STATUSES.UNSUPPORTED_MEDIA_TYPE,
      exports$1.STATUSES.RANGE_NOT_SATISFIABLE,
      exports$1.STATUSES.EXPECTATION_FAILED,
      exports$1.STATUSES.IM_A_TEAPOT,
      exports$1.STATUSES.PAGE_EXPIRED,
      exports$1.STATUSES.ENHANCE_YOUR_CALM,
      exports$1.STATUSES.MISDIRECTED_REQUEST,
      exports$1.STATUSES.UNPROCESSABLE_ENTITY,
      exports$1.STATUSES.LOCKED,
      exports$1.STATUSES.FAILED_DEPENDENCY,
      exports$1.STATUSES.TOO_EARLY,
      exports$1.STATUSES.UPGRADE_REQUIRED,
      exports$1.STATUSES.PRECONDITION_REQUIRED,
      exports$1.STATUSES.TOO_MANY_REQUESTS,
      exports$1.STATUSES.REQUEST_HEADER_FIELDS_TOO_LARGE_UNOFFICIAL,
      exports$1.STATUSES.REQUEST_HEADER_FIELDS_TOO_LARGE,
      exports$1.STATUSES.LOGIN_TIMEOUT,
      exports$1.STATUSES.NO_RESPONSE,
      exports$1.STATUSES.RETRY_WITH,
      exports$1.STATUSES.BLOCKED_BY_PARENTAL_CONTROL,
      exports$1.STATUSES.UNAVAILABLE_FOR_LEGAL_REASONS,
      exports$1.STATUSES.CLIENT_CLOSED_LOAD_BALANCED_REQUEST,
      exports$1.STATUSES.INVALID_X_FORWARDED_FOR,
      exports$1.STATUSES.REQUEST_HEADER_TOO_LARGE,
      exports$1.STATUSES.SSL_CERTIFICATE_ERROR,
      exports$1.STATUSES.SSL_CERTIFICATE_REQUIRED,
      exports$1.STATUSES.HTTP_REQUEST_SENT_TO_HTTPS_PORT,
      exports$1.STATUSES.INVALID_TOKEN,
      exports$1.STATUSES.CLIENT_CLOSED_REQUEST,
      exports$1.STATUSES.INTERNAL_SERVER_ERROR,
      exports$1.STATUSES.NOT_IMPLEMENTED,
      exports$1.STATUSES.BAD_GATEWAY,
      exports$1.STATUSES.SERVICE_UNAVAILABLE,
      exports$1.STATUSES.GATEWAY_TIMEOUT,
      exports$1.STATUSES.HTTP_VERSION_NOT_SUPPORTED,
      exports$1.STATUSES.VARIANT_ALSO_NEGOTIATES,
      exports$1.STATUSES.INSUFFICIENT_STORAGE,
      exports$1.STATUSES.LOOP_DETECTED,
      exports$1.STATUSES.BANDWIDTH_LIMIT_EXCEEDED,
      exports$1.STATUSES.NOT_EXTENDED,
      exports$1.STATUSES.NETWORK_AUTHENTICATION_REQUIRED,
      exports$1.STATUSES.WEB_SERVER_UNKNOWN_ERROR,
      exports$1.STATUSES.WEB_SERVER_IS_DOWN,
      exports$1.STATUSES.CONNECTION_TIMEOUT,
      exports$1.STATUSES.ORIGIN_IS_UNREACHABLE,
      exports$1.STATUSES.TIMEOUT_OCCURED,
      exports$1.STATUSES.SSL_HANDSHAKE_FAILED,
      exports$1.STATUSES.INVALID_SSL_CERTIFICATE,
      exports$1.STATUSES.RAILGUN_ERROR,
      exports$1.STATUSES.SITE_IS_OVERLOADED,
      exports$1.STATUSES.SITE_IS_FROZEN,
      exports$1.STATUSES.IDENTITY_PROVIDER_AUTHENTICATION_ERROR,
      exports$1.STATUSES.NETWORK_READ_TIMEOUT,
      exports$1.STATUSES.NETWORK_CONNECT_TIMEOUT
    ];
    exports$1.ALPHA = [];
    for (let i = "A".charCodeAt(0); i <= "Z".charCodeAt(0); i++) {
      exports$1.ALPHA.push(String.fromCharCode(i));
      exports$1.ALPHA.push(String.fromCharCode(i + 32));
    }
    exports$1.NUM_MAP = {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9
    };
    exports$1.HEX_MAP = {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
      A: 10,
      B: 11,
      C: 12,
      D: 13,
      E: 14,
      F: 15,
      a: 10,
      b: 11,
      c: 12,
      d: 13,
      e: 14,
      f: 15
    };
    exports$1.NUM = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9"
    ];
    exports$1.ALPHANUM = exports$1.ALPHA.concat(exports$1.NUM);
    exports$1.MARK = ["-", "_", ".", "!", "~", "*", "'", "(", ")"];
    exports$1.USERINFO_CHARS = exports$1.ALPHANUM.concat(exports$1.MARK).concat(["%", ";", ":", "&", "=", "+", "$", ","]);
    exports$1.URL_CHAR = [
      "!",
      '"',
      "$",
      "%",
      "&",
      "'",
      "(",
      ")",
      "*",
      "+",
      ",",
      "-",
      ".",
      "/",
      ":",
      ";",
      "<",
      "=",
      ">",
      "@",
      "[",
      "\\",
      "]",
      "^",
      "_",
      "`",
      "{",
      "|",
      "}",
      "~"
    ].concat(exports$1.ALPHANUM);
    exports$1.HEX = exports$1.NUM.concat(["a", "b", "c", "d", "e", "f", "A", "B", "C", "D", "E", "F"]);
    exports$1.TOKEN = [
      "!",
      "#",
      "$",
      "%",
      "&",
      "'",
      "*",
      "+",
      "-",
      ".",
      "^",
      "_",
      "`",
      "|",
      "~"
    ].concat(exports$1.ALPHANUM);
    exports$1.HEADER_CHARS = ["	"];
    for (let i = 32; i <= 255; i++) {
      if (i !== 127) {
        exports$1.HEADER_CHARS.push(i);
      }
    }
    exports$1.CONNECTION_TOKEN_CHARS = exports$1.HEADER_CHARS.filter((c) => c !== 44);
    exports$1.QUOTED_STRING = ["	", " "];
    for (let i = 33; i <= 255; i++) {
      if (i !== 34 && i !== 92) {
        exports$1.QUOTED_STRING.push(i);
      }
    }
    exports$1.HTAB_SP_VCHAR_OBS_TEXT = ["	", " "];
    for (let i = 33; i <= 126; i++) {
      exports$1.HTAB_SP_VCHAR_OBS_TEXT.push(i);
    }
    for (let i = 128; i <= 255; i++) {
      exports$1.HTAB_SP_VCHAR_OBS_TEXT.push(i);
    }
    exports$1.MAJOR = exports$1.NUM_MAP;
    exports$1.MINOR = exports$1.MAJOR;
    exports$1.SPECIAL_HEADERS = {
      "connection": exports$1.HEADER_STATE.CONNECTION,
      "content-length": exports$1.HEADER_STATE.CONTENT_LENGTH,
      "proxy-connection": exports$1.HEADER_STATE.CONNECTION,
      "transfer-encoding": exports$1.HEADER_STATE.TRANSFER_ENCODING,
      "upgrade": exports$1.HEADER_STATE.UPGRADE
    };
    exports$1.default = {
      ERROR: exports$1.ERROR,
      TYPE: exports$1.TYPE,
      FLAGS: exports$1.FLAGS,
      LENIENT_FLAGS: exports$1.LENIENT_FLAGS,
      METHODS: exports$1.METHODS,
      STATUSES: exports$1.STATUSES,
      FINISH: exports$1.FINISH,
      HEADER_STATE: exports$1.HEADER_STATE,
      ALPHA: exports$1.ALPHA,
      NUM_MAP: exports$1.NUM_MAP,
      HEX_MAP: exports$1.HEX_MAP,
      NUM: exports$1.NUM,
      ALPHANUM: exports$1.ALPHANUM,
      MARK: exports$1.MARK,
      USERINFO_CHARS: exports$1.USERINFO_CHARS,
      URL_CHAR: exports$1.URL_CHAR,
      HEX: exports$1.HEX,
      TOKEN: exports$1.TOKEN,
      HEADER_CHARS: exports$1.HEADER_CHARS,
      CONNECTION_TOKEN_CHARS: exports$1.CONNECTION_TOKEN_CHARS,
      QUOTED_STRING: exports$1.QUOTED_STRING,
      HTAB_SP_VCHAR_OBS_TEXT: exports$1.HTAB_SP_VCHAR_OBS_TEXT,
      MAJOR: exports$1.MAJOR,
      MINOR: exports$1.MINOR,
      SPECIAL_HEADERS: exports$1.SPECIAL_HEADERS,
      METHODS_HTTP: exports$1.METHODS_HTTP,
      METHODS_ICE: exports$1.METHODS_ICE,
      METHODS_RTSP: exports$1.METHODS_RTSP,
      METHOD_MAP: exports$1.METHOD_MAP,
      H_METHOD_MAP: exports$1.H_METHOD_MAP,
      STATUSES_HTTP: exports$1.STATUSES_HTTP
    };
  })(constants$3);
  return constants$3;
}
var llhttpWasm = { exports: {} };
llhttpWasm.exports;
var hasRequiredLlhttpWasm;
function requireLlhttpWasm() {
  if (hasRequiredLlhttpWasm) return llhttpWasm.exports;
  hasRequiredLlhttpWasm = 1;
  (function(module) {
    const { Buffer: Buffer2 } = require$$0$5;
    const wasmBase64 = "AGFzbQEAAAABJwdgAX8Bf2ADf39/AX9gAn9/AGABfwBgBH9/f38Bf2AAAGADf39/AALLAQgDZW52GHdhc21fb25faGVhZGVyc19jb21wbGV0ZQAEA2VudhV3YXNtX29uX21lc3NhZ2VfYmVnaW4AAANlbnYLd2FzbV9vbl91cmwAAQNlbnYOd2FzbV9vbl9zdGF0dXMAAQNlbnYUd2FzbV9vbl9oZWFkZXJfZmllbGQAAQNlbnYUd2FzbV9vbl9oZWFkZXJfdmFsdWUAAQNlbnYMd2FzbV9vbl9ib2R5AAEDZW52GHdhc21fb25fbWVzc2FnZV9jb21wbGV0ZQAAAzU0BQYAAAMAAAAAAAADAQMAAwMDAAACAAAAAAICAgICAgICAgIBAQEBAQEBAQEBAwAAAwAAAAQFAXABExMFAwEAAgYIAX8BQcDZBAsHxQcoBm1lbW9yeQIAC19pbml0aWFsaXplAAgZX19pbmRpcmVjdF9mdW5jdGlvbl90YWJsZQEAC2xsaHR0cF9pbml0AAkYbGxodHRwX3Nob3VsZF9rZWVwX2FsaXZlADcMbGxodHRwX2FsbG9jAAsGbWFsbG9jADkLbGxodHRwX2ZyZWUADARmcmVlAAwPbGxodHRwX2dldF90eXBlAA0VbGxodHRwX2dldF9odHRwX21ham9yAA4VbGxodHRwX2dldF9odHRwX21pbm9yAA8RbGxodHRwX2dldF9tZXRob2QAEBZsbGh0dHBfZ2V0X3N0YXR1c19jb2RlABESbGxodHRwX2dldF91cGdyYWRlABIMbGxodHRwX3Jlc2V0ABMObGxodHRwX2V4ZWN1dGUAFBRsbGh0dHBfc2V0dGluZ3NfaW5pdAAVDWxsaHR0cF9maW5pc2gAFgxsbGh0dHBfcGF1c2UAFw1sbGh0dHBfcmVzdW1lABgbbGxodHRwX3Jlc3VtZV9hZnRlcl91cGdyYWRlABkQbGxodHRwX2dldF9lcnJubwAaF2xsaHR0cF9nZXRfZXJyb3JfcmVhc29uABsXbGxodHRwX3NldF9lcnJvcl9yZWFzb24AHBRsbGh0dHBfZ2V0X2Vycm9yX3BvcwAdEWxsaHR0cF9lcnJub19uYW1lAB4SbGxodHRwX21ldGhvZF9uYW1lAB8SbGxodHRwX3N0YXR1c19uYW1lACAabGxodHRw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AXRrQT5qIQILIAEgAjYCHCABQgA3AhAgAkECdEH01wBqIQACQEHI1QAoAgAiA0EBIAJ0IgdxRQRAIAAgATYCAEHI1QAgAyAHcjYCACABIAA2AhggASABNgIIIAEgATYCDAwBCyAEQRkgAkEBdmtBACACQR9HG3QhAiAAKAIAIQACQANAIAAiAygCBEF4cSAERg0BIAJBHXYhACACQQF0IQIgAyAAQQRxakEQaiIHKAIAIgANAAsgByABNgIAIAEgAzYCGCABIAE2AgwgASABNgIIDAELIAMoAggiACABNgIMIAMgATYCCCABQQA2AhggASADNgIMIAEgADYCCAtB5NUAQeTVACgCAEEBayIAQX8gABs2AgALCwcAIAAtACgLBwAgAC0AKgsHACAALQArCwcAIAAtACkLBwAgAC8BNAsHACAALQAwC0ABBH8gACgCGCEBIAAvAS4hAiAALQAoIQMgACgCOCEEIAAQOCAAIAQ2AjggACADOgAoIAAgAjsBLiAAIAE2AhgL5YUCAgd/A34gASACaiEEAkAgACIDKAIMIgANACADKAIEBEAgAyABNgIECyMAQRBrIgkkAAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAn8CQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC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C0HjAQwHC0HXAQwGC0HYAQwFC0HZAQwEC0HaAQwDC0HbAQwCC0HdAQwBC0HcAQshAgNAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCADAn8CQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAn8CQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAn8CQAJAAkACQAJAAkACQAJ/AkACQAJAAn8CQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIAMCfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAg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ogKiAqICogKiAqICogKiAqICogKiAqICogIAogILIAQgAUEBaiIBRw0AC0HJACECDOwCCyABQQFqIQEgA0Evai0AAEEBcQ2lAiADQQA2AhwgAyABNgIUIANBlxA2AhAgA0EKNgIMQQAhAgzrAgsgASAERwRAA0AgAS0AAEEgRw0VIAQgAUEBaiIBRw0AC0H4ACECDOsCC0H4ACECDOoCCyADQQI6ACgMOAtBACECIANBADYCHCADQb8LNgIQIANBAjYCDCADIAFBAWo2AhQM6AILQQAhAgzOAgtBDSECDM0CC0ETIQIMzAILQRUhAgzLAgtBFiECDMoCC0EYIQIMyQILQRkhAgzIAgtBGiECDMcCC0EbIQIMxgILQRwhAgzFAgtBHSECDMQCC0EeIQIMwwILQR8hAgzCAgtBICECDMECC0EiIQIMwAILQSMhAgy/AgtBJSECDL4CC0HlACECDL0CCyADQT02AhwgAyABNgIUIAMgADYCDEEAIQIM1QILIANBGzYCHCADIAE2AhQgA0GkHDYCECADQRU2AgxBACECDNQCCyADQSA2AhwgAyABNgIUIANBmBo2AhAgA0EVNgIMQQAhAgzTAgsgA0ETNgIcIAMgATYCFCADQZgaNgIQIANBFTYCDEEAIQIM0gILIANBCzYCHCADIAE2AhQgA0GYGjYCECADQRU2AgxBACECDNECCyADQRA2AhwgAyABNgIUIANBmBo2AhAgA0EVNgIMQQAhAgzQAgsgA0EgNgIcIAMgATYCFCADQaQcNgIQIANBFTYCDEEAIQIMzwILIANBCzYCHCADIAE2AhQgA0GkHDYCECADQRU2AgxBACECDM4CCyADQQw2AhwgAyABNgIUIANBpBw2AhAgA0EVNgIMQQAhAgzNAgtBACECIANBADYCHCADIAE2AhQgA0HdDjYCECADQRI2AgwMzAILAkADQAJAIAEtAABBCmsOBAACAgACCyAEIAFBAWoiAUcNAAtB/QEhAgzMAgsCQAJAIAMtADZBAUcNAEEAIQACQCADKAI4IgJFDQAgAigCYCICRQ0AIAMgAhEAACEACyAARQ0AIABBFUcNASADQfwBNgIcIAMgATYCFCADQdwZNgIQIANBFTYCDEEAIQIMzQILQdwBIQIMswILIANBADYCHCADIAE2AhQgA0H5CzYCECADQR82AgxBACECDMsCCwJAAkAgAy0AKEEBaw4CBAEAC0HbASECDLICC0HUASECDLECCyADQQI6ADFBACEAAkAgAygCOCICRQ0AIAIoAgAiAkUNACADIAIRAAAhAAsgAEUEQEHdASECDLECCyAAQRVHBEAgA0EANgIcIAMgATYCFCADQbQMNgIQIANBEDYCDEEAIQIMygILIANB+wE2AhwgAyABNgIUIANBgRo2AhAgA0EVNgIMQQAhAgzJAgsgASAERgRAQfoBIQIMyQILIAEtAABByABGDQEgA0EBOgAoC0HAASECDK4CC0HaASECDK0CCyABIARHBEAgA0EMNgIIIAMgATYCBEHZASECDK0CC0H5ASECDMUCCyABIARGBEBB+AEhAgzFAgsgAS0AAEHIAEcNBCABQQFqIQFB2AEhAgyrAgsgASAERgRAQfcBIQIMxAILAkACQCABLQAAQcUAaw4QAAUFBQUFBQUFBQUFBQUFAQULIAFBAWohAUHWASECDKsCCyABQQFqIQFB1wEhAgyqAgtB9gEhAiABIARGDcICIAMoAgAiACAEIAFraiEFIAEgAGtBAmohBgJAA0AgAS0AACAAQbrVAGotAABHDQMgAEECRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADMMCCyADKAIEIQAgA0IANwMAIAMgACAGQQFqIgEQLiIARQRAQeMBIQIMqgILIANB9QE2AhwgAyABNgIUIAMgADYCDEEAIQIMwgILQfQBIQIgASAERg3BAiADKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEG41QBqLQAARw0CIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzCAgsgA0GBBDsBKCADKAIEIQAgA0IANwMAIAMgACAGQQFqIgEQLiIADQMMAgsgA0EANgIAC0EAIQIgA0EANgIcIAMgATYCFCADQeUfNgIQIANBCDYCDAy/AgtB1QEhAgylAgsgA0HzATYCHCADIAE2AhQgAyAANgIMQQAhAgy9AgtBACEAAkAgAygCOCICRQ0AIAIoAkAiAkUNACADIAIRAAAhAAsgAEUNbiAAQRVHBEAgA0EANgIcIAMgATYCFCADQYIPNgIQIANBIDYCDEEAIQIMvQILIANBjwE2AhwgAyABNgIUIANB7Bs2AhAgA0EVNgIMQQAhAgy8AgsgASAERwRAIANBDTYCCCADIAE2AgRB0wEhAgyjAgtB8gEhAgy7AgsgASAERgRAQfEBIQIMuwILAkACQAJAIAEtAABByABrDgsAAQgICAgICAgIAggLIAFBAWohAUHQASECDKMCCyABQQFqIQFB0QEhAgyiAgsgAUEBaiEBQdIBIQIMoQILQfABIQIgASAERg25AiADKAIAIgAgBCABa2ohBiABIABrQQJqIQUDQCABLQAAIABBtdUAai0AAEcNBCAAQQJGDQMgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAY2AgAMuQILQe8BIQIgASAERg24AiADKAIAIgAgBCABa2ohBiABIABrQQFqIQUDQCABLQAAIABBs9UAai0AAEcNAyAAQQFGDQIgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAY2AgAMuAILQe4BIQIgASAERg23AiADKAIAIgAgBCABa2ohBiABIABrQQJqIQUDQCABLQAAIABBsNUAai0AAEcNAiAAQQJGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAY2AgAMtwILIAMoAgQhACADQgA3AwAgAyAAIAVBAWoiARArIgBFDQIgA0HsATYCHCADIAE2AhQgAyAANgIMQQAhAgy2AgsgA0EANgIACyADKAIEIQAgA0EANgIEIAMgACABECsiAEUNnAIgA0HtATYCHCADIAE2AhQgAyAANgIMQQAhAgy0AgtBzwEhAgyaAgtBACEAAkAgAygCOCICRQ0AIAIoAjQiAkUNACADIAIRAAAhAAsCQCAABEAgAEEVRg0BIANBADYCHCADIAE2AhQgA0HqDTYCECADQSY2AgxBACECDLQCC0HOASECDJoCCyADQesBNgIcIAMgATYCFCADQYAbNgIQIANBFTYCDEEAIQIMsgILIAEgBEYEQEHrASECDLICCyABLQAAQS9GBEAgAUEBaiEBDAELIANBADYCHCADIAE2AhQgA0GyODYCECADQQg2AgxBACECDLECC0HNASECDJcCCyABIARHBEAgA0EONgIIIAMgATYCBEHMASECDJcCC0HqASECDK8CCyABIARGBEBB6QEhAgyvAgsgAS0AAEEwayIAQf8BcUEKSQRAIAMgADoAKiABQQFqIQFBywEhAgyWAgsgAygCBCEAIANBADYCBCADIAAgARAvIgBFDZcCIANB6AE2AhwgAyABNgIUIAMgADYCDEEAIQIMrgILIAEgBEYEQEHnASECDK4CCwJAIAEtAABBLkYEQCABQQFqIQEMAQsgAygCBCEAIANBADYCBCADIAAgARAvIgBFDZgCIANB5gE2AhwgAyABNgIUIAMgADYCDEEAIQIMrgILQcoBIQIMlAILIAEgBEYEQEHlASECDK0CC0EAIQBBASEFQQEhB0EAIQICQAJAAkACQAJAAn8CQAJAAkACQAJAAkACQCABLQAAQTBrDgoKCQABAgMEBQYICwtBAgwGC0EDDAULQQQMBAtBBQwDC0EGDAILQQcMAQtBCAshAkEAIQVBACEHDAILQQkhAkEBIQBBACEFQQAhBwwBC0EAIQVBASECCyADIAI6ACsgAUEBaiEBAkACQCADLQAuQRBxDQACQAJAAkAgAy0AKg4DAQACBAsgB0UNAwwCCyAADQEMAgsgBUUNAQsgAygCBCEAIANBADYCBCADIAAgARAvIgBFDQIgA0HiATYCHCADIAE2AhQgAyAANgIMQQAhAgyvAgsgAygCBCEAIANBADYCBCADIAAgARAvIgBFDZoCIANB4wE2AhwgAyABNgIUIAMgADYCDEEAIQIMrgILIAMoAgQhACADQQA2AgQgAyAAIAEQLyIARQ2YAiADQeQBNgIcIAMgATYCFCADIAA2AgwMrQILQckBIQIMkwILQQAhAAJAIAMoAjgiAkUNACACKAJEIgJFDQAgAyACEQAAIQALAkAgAARAIABBFUYNASADQQA2AhwgAyABNgIUIANBpA02AhAgA0EhNgIMQQAhAgytAgtByAEhAgyTAgsgA0HhATYCHCADIAE2AhQgA0HQGjYCECADQRU2AgxBACECDKsCCyABIARGBEBB4QEhAgyrAgsCQCABLQAAQSBGBEAgA0EAOwE0IAFBAWohAQwBCyADQQA2AhwgAyABNgIUIANBmRE2AhAgA0EJNgIMQQAhAgyrAgtBxwEhAgyRAgsgASAERgRAQeABIQIMqgILAkAgAS0AAEEwa0H/AXEiAkEKSQRAIAFBAWohAQJAIAMvATQiAEGZM0sNACADIABBCmwiADsBNCAAQf7/A3EgAkH//wNzSw0AIAMgACACajsBNAwCC0EAIQIgA0EANgIcIAMgATYCFCADQZUeNgIQIANBDTYCDAyrAgsgA0EANgIcIAMgATYCFCADQZUeNgIQIANBDTYCDEEAIQIMqgILQcYBIQIMkAILIAEgBEYEQEHfASECDKkCCwJAIAEtAABBMGtB/wFxIgJBCkkEQCABQQFqIQECQCADLwE0IgBBmTNLDQAgAyAAQQpsIgA7ATQgAEH+/wNxIAJB//8Dc0sNACADIAAgAmo7ATQMAgtBACECIANBADYCHCADIAE2AhQgA0GVHjYCECADQQ02AgwMqgILIANBADYCHCADIAE2AhQgA0GVHjYCECADQQ02AgxBACECDKkCC0HFASECDI8CCyABIARGBEBB3gEhAgyoAgsCQCABLQAAQTBrQf8BcSICQQpJBEAgAUEBaiEBAkAgAy8BNCIAQZkzSw0AIAMgAEEKbCIAOwE0IABB/v8DcSACQf//A3NLDQAgAyAAIAJqOwE0DAILQQAhAiADQQA2AhwgAyABNgIUIANBlR42AhAgA0ENNgIMDKkCCyADQQA2AhwgAyABNgIUIANBlR42AhAgA0ENNgIMQQAhAgyoAgtBxAEhAgyOAgsgASAERgRAQd0BIQIMpwILAkACQAJAAkAgAS0AAEEKaw4XAgMDAAMDAwMDAwMDAwMDAwMDAwMDAwEDCyABQQFqDAULIAFBAWohAUHDASECDI8CCyABQQFqIQEgA0Evai0AAEEBcQ0IIANBADYCHCADIAE2AhQgA0GNCzYCECADQQ02AgxBACECDKcCCyADQQA2AhwgAyABNgIUIANBjQs2AhAgA0ENNgIMQQAhAgymAgsgASAERwRAIANBDzYCCCADIAE2AgRBASECDI0CC0HcASECDKUCCwJAAkADQAJAIAEtAABBCmsOBAIAAAMACyAEIAFBAWoiAUcNAAtB2wEhAgymAgsgAygCBCEAIANBADYCBCADIAAgARAtIgBFBEAgAUEBaiEBDAQLIANB2gE2AhwgAyAANgIMIAMgAUEBajYCFEEAIQIMpQILIAMoAgQhACADQQA2AgQgAyAAIAEQLSIADQEgAUEBagshAUHBASECDIoCCyADQdkBNgIcIAMgADYCDCADIAFBAWo2AhRBACECDKICC0HCASECDIgCCyADQS9qLQAAQQFxDQEgA0EANgIcIAMgATYCFCADQeQcNgIQIANBGTYCDEEAIQIMoAILIAEgBEYEQEHZASEC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IAFBAWohAUGeASECDOQBCyABQQFqIQFBnwEhAgzjAQtBtwEhAiABIARGDfsBIAMoAgAiACAEIAFraiEFIAEgAGtBA2ohBgJAA0AgAS0AACAAQezUAGotAABHDSggAEEDRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADPwBCyADQQA2AgAgBkEBaiEBQQ0MKAtBtgEhAiABIARGDfoBIAMoAgAiACAEIAFraiEFIAEgAGtBAmohBgJAA0AgAS0AACAAQaHVAGotAABHDScgAEECRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADPsBCyADQQA2AgAgBkEBaiEBQQwMJwtBtQEhAiABIARGDfkBIAMoAgAiACAEIAFraiEFIAEgAGtBAWohBgJAA0AgAS0AACAAQerUAGotAABHDSYgAEEBRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADPoBCyADQQA2AgAgBkEBaiEBQQMMJgtBtAEhAiABIARGDfgBIAMoAgAiACAEIAFraiEFIAEgAGtBAWohBgJAA0AgAS0AACAAQejUAGotAABHDSUgAEEBRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADPkBCyADQQA2AgAgBkEBaiEBQSYMJQsgASAERgRAQbMBIQIM+AELAkACQCABLQAAQdQAaw4CAAEnCyABQQFqIQFBmQEhAgzfAQsgAUEBaiEBQZoBIQIM3gELQbIBIQIgASAERg32ASADKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHm1ABqLQAARw0jIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAz3AQsgA0EANgIAIAZBAWohAUEnDCMLQbEBIQIgASAERg31ASADKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHk1ABqLQAARw0iIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAz2AQsgA0EANgIAIAZBAWohAUEcDCILQbABIQIgASAERg30ASADKAIAIgAgBCABa2ohBSABIABrQQVqIQYCQANAIAEtAAAgAEHe1ABqLQAARw0hIABBBUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAz1AQsgA0EANgIAIAZBAWohAUEGDCELQa8BIQIgASAERg3zASADKAIAIgAgBCABa2ohBSABIABrQQRqIQYCQANAIAEtAAAgAEHZ1ABqLQAARw0gIABBBEYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAz0AQsgA0EANgIAIAZBAWohAUEZDCALIAEgBEYEQEGuASECDPMBCwJAAkACQAJAIAEtAABBLWsOIwAkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJAEkJCQkJAIkJCQDJAsgAUEBaiEBQY4BIQIM3AELIAFBAWohAUGPASECDNsBCyABQQFqIQFBlAEhAgzaAQsgAUEBaiEBQZUBIQIM2QELQa0BIQIgASAERg3xASADKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHX1ABqLQAARw0eIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzyAQsgA0EANgIAIAZBAWohAUELDB4LIAEgBEYEQEGsASECDPEBCwJAAkAgAS0AAEHBAGsOAwAgASALIAFBAWohAUGQASECDNgBCyABQQFqIQFBkwEhAgzXAQsgASAERgRAQasBIQIM8AELAkACQCABLQAAQcEAaw4PAB8fHx8fHx8fHx8fHx8BHwsgAUEBaiEBQZEBIQIM1wELIAFBAWohAUGSASECDNYBCyABIARGBEBBqgEhAgzvAQsgAS0AAEHMAEcNHCABQQFqIQFBCgwbC0GpASECIAEgBEYN7QEgAygCACIAIAQgAWtqIQUgASAAa0EFaiEGAkADQCABLQAAIABB0dQAai0AAEcNGiAAQQVGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM7gELIANBADYCACAGQQFqIQFBHgwaC0GoASECIAEgBEYN7AEgAygCACIAIAQgAWtqIQUgASAAa0EGaiEGAkADQCABLQAAIABBytQAai0AAEcNGSAAQQZGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM7QELIANBADYCACAGQQFqIQFBFQwZC0GnASECIAEgBEYN6wEgAygCACIAIAQgAWtqIQUgASAAa0ECaiEGAkADQCABLQAAIABBx9QAai0AAEcNGCAAQQJGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM7AELIANBADYCACAGQQFqIQFBFwwYC0GmASECIAEgBEYN6gEgAygCACIAIAQgAWtqIQUgASAAa0EFaiEGAkADQCABLQAAIABBwdQAai0AAEcNFyAAQQVGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM6wELIANBADYCACAGQQFqIQFBGAwXCyABIARGBEBBpQEhAgzqAQsCQAJAIAEtAABByQBrDgcAGRkZGRkBGQsgAUEBaiEBQYsBIQIM0QELIAFBAWohAUGMASECDNABC0GkASECIAEgBEYN6AEgAygCACIAIAQgAWtqIQUgASAAa0EBaiEGAkADQCABLQAAIABBptUAai0AAEcNFSAAQQFGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM6QELIANBADYCACAGQQFqIQFBCQwVC0GjASECIAEgBEYN5wEgAygCACIAIAQgAWtqIQUgASAAa0EBaiEGAkADQCABLQAAIABBpNUAai0AAEcNFCAAQQFGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM6AELIANBADYCACAGQQFqIQFBHwwUC0GiASECIAEgBEYN5gEgAygCACIAIAQgAWtqIQUgASAAa0ECaiEGAkADQCABLQAAIABBvtQAai0AAEcNEyAAQQJGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM5wELIANBADYCACAGQQFqIQFBAgwTC0GhASECIAEgBEYN5QEgAygCACIAIAQgAWtqIQUgASAAa0EBaiEGA0AgAS0AACAAQbzUAGotAABHDREgAEEBRg0CIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADOUBCyABIARGBEBBoAEhAgzlAQtBASABLQAAQd8ARw0RGiABQQFqIQFBhwEhAgzLAQsgA0EANgIAIAZBAWohAUGIASECDMoBC0GfASECIAEgBEYN4gEgAygCACIAIAQgAWtqIQUgASAAa0EIaiEGAkADQCABLQAAIABBhNUAai0AAEcNDyAAQQhGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM4wELIANBADYCACAGQQFqIQFBKQwPC0GeASECIAEgBEYN4QEgAygCACIAIAQgAWtqIQUgASAAa0EDaiEGAkADQCABLQAAIABBuNQAai0AAEcNDiAAQQNGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM4gELIANBADYCACAGQQFqIQFBLQwOCyABIARGBEBBnQEhAgzhAQsgAS0AAEHFAEcNDiABQQFqIQFBhAEhAgzHAQsgASAERgRAQZwBIQIM4AELAkACQCABLQAAQcwAaw4IAA8PDw8PDwEPCyABQQFqIQFBggEhAgzHAQsgAUEBaiEBQYMBIQIMxgELQZsBIQIgASAERg3eASADKAIAIgAgBCABa2ohBSABIABrQQRqIQYCQANAIAEtAAAgAEGz1ABqLQAARw0LIABBBEYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzfAQsgA0EANgIAIAZBAWohAUEjDAsLQZoBIQIgASAERg3dASADKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGw1ABqLQAARw0KIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzeAQsgA0EANgIAIAZBAWohAUEADAoLIAEgBEYEQEGZASECDN0BCwJAAkAgAS0AAEHIAGsOCAAMDAwMDAwBDAsgAUEBaiEBQf0AIQIMxAELIAFBAWohAUGAASECDMMBCyABIARGBEBBmAEhAgzcAQsCQAJAIAEtAABBzgBrDgMACwELCyABQQFqIQFB/gAhAgzDAQsgAUEBaiEBQf8AIQIMwgELIAEgBEYEQEGXASECDNsBCyABLQAAQdkARw0IIAFBAWohAUEIDAcLQZYBIQIgASAERg3ZASADKAIAIgAgBCABa2ohBSABIABrQQNqIQYCQANAIAEtAAAgAEGs1ABqLQAARw0GIABBA0YNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzaAQsgA0EANgIAIAZBAWohAUEFDAYLQZUBIQIgASAERg3YASADKAIAIgAgBCABa2ohBSABIABrQQVqIQYCQANAIAEtAAAgAEGm1ABqLQAARw0FIABBBUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzZAQsgA0EANgIAIAZBAWohAUEWDAULQZQBIQIgASAERg3XASADKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGh1QBqLQAARw0EIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzYAQsgA0EANgIAIAZBAWohAUEQDAQLIAEgBEYEQEGTASECDNcBCwJAAkAgAS0AAEHDAGsODAAGBgYGBgYGBgYGAQYLIAFBAWohAUH5ACECDL4BCyABQQFqIQFB+gAhAgy9AQtBkgEhAiABIARGDdUBIAMoAgAiACAEIAFraiEFIAEgAGtBBWohBgJAA0AgAS0AACAAQaDUAGotAABHDQIgAEEFRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADNYBCyADQQA2AgAgBkEBaiEBQSQMAgsgA0EANgIADAILIAEgBEYEQEGRASECDNQBCyABLQAAQcwARw0BIAFBAWohAUETCzoAKSADKAIEIQAgA0EANgIEIAMgACABEC4iAA0CDAELQQAhAiADQQA2AhwgAyABNgIUIANB/h82AhAgA0EGNgIMDNEBC0H4ACECDLcBCyADQZABNgIcIAMgATYCFCADIAA2AgxBACECDM8BC0EAIQACQCADKAI4IgJFDQAgAigCQCICRQ0AIAMgAhEAACEACyAARQ0AIABBFUYNASADQQA2AhwgAyABNgIUIANBgg82AhAgA0EgNgIMQQAhAgzOAQtB9wAhAgy0AQsgA0GPATYCHCADIAE2AhQgA0HsGzYCECADQRU2AgxBACECDMwBCyABIARGBEBBjwEhAgzMAQsCQCABLQAAQSBGBEAgAUEBaiEBDAELIANBADYCHCADIAE2AhQgA0GbHzYCECADQQY2AgxBACECDMwBC0ECIQIMsgELA0AgAS0AAEEgRw0CIAQgAUEBaiIBRw0AC0GOASECDMoBCyABIARGBEBBjQEhAgzKAQsCQCABLQAAQQlrDgRKAABKAAtB9QAhAgywAQsgAy0AKUEFRgRAQfYAIQIMsAELQfQAIQIMrwELIAEgBEYEQEGMASECDMgBCyADQRA2AgggAyABNgIEDAoLIAEgBEYEQEGLASECDMcBCwJAIAEtAABBCWsOBEcAAEcAC0HzACECDK0BCyABIARHBEAgA0EQNgIIIAMgATYCBEHxACECDK0BC0GKASECDMUBCwJAIAEgBEcEQANAIAEtAABBoNAAai0AACIAQQNHBEACQCAAQQFrDgJJAAQLQfAAIQIMrwELIAQgAUEBaiIBRw0AC0GIASEC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BCABQQFqIgFHDQALQfsAIQIMpwELIAMoAgQhACADQQA2AgQgAyAAIAEQLCIARQ0DIANB2wA2AhwgAyABNgIUIAMgADYCDEEAIQIMpgELIAMoAgQhACADQQA2AgQgAyAAIAEQLCIARQ0DIANB3QA2AhwgAyABNgIUIAMgADYCDEEAIQIMpQELIAMoAgQhACADQQA2AgQgAyAAIAEQLCIARQ0DIANB+gA2AhwgAyABNgIUIAMgADYCDEEAIQIMpAELIANBADYCHCADIAE2AhQgA0G8CjYCECADQQc2AgxBACECDKMBC0HPACECDIkBC0HRACECDIgBC0HnACECDIcBCyABIARGBEBB+gAhAgygAQsCQCABLQAAQQlrDgQgAAAgAAsgAUEBaiEBQeYAIQIMhgELIAEgBEYEQEH5ACECDJ8BCwJAIAEtAABBCWsOBB8AAB8AC0EAIQACQCADKAI4IgJFDQAgAigCOCICRQ0AIAMgAhEAACEACyAARQRAQeIBIQIMhgELIABBFUcEQCADQQA2AhwgAyABNgIUIANByQ02AhAgA0EaNgIMQQAhAgyfAQsgA0H4ADYCHCADIAE2AhQgA0HqGjYCECADQRU2AgxBACECDJ4BCyABIARHBEAgA0ENNgIIIAMgATYCBEHkACECDIUBC0H3ACECDJ0BCyABIARGBEBB9gAhAgydAQsCQAJAAkAgAS0AAEHIAGsOCwABCwsLCwsLCwsCCwsgAUEBaiEBQd0AIQIMhQELIAFBAWohAUHgACECDIQBCyABQQFqIQFB4wAhAgyDAQtB9QAhAiABIARGDZsBIAMoAgAiACAEIAFraiEFIAEgAGtBAmohBgJAA0AgAS0AACAAQbXVAGotAABHDQggAEECRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADJwBCyADKAIEIQAgA0IANwMAIAMgACAGQQFqIgEQKyIABEAgA0H0ADYCHCADIAE2AhQgAyAANgIMQQAhAgycAQtB4gAhAgyCAQtBACEAAkAgAygCOCICRQ0AIAIoAjQiAkUNACADIAIRAAAhAAsCQCAABEAgAEEVRg0BIANBADYCHCADIAE2AhQgA0HqDTYCECADQSY2AgxBACECDJwBC0HhACECDIIBCyADQfMANgIcIAMgATYCFCADQYAbNgIQIANBFTYCDEEAIQIMmgELIAMtACkiAEEja0ELSQ0JAkAgAEEGSw0AQQEgAHRBygBxRQ0ADAoLQQAhAiADQQA2AhwgAyABNgIUIANB7Qk2AhAgA0EINgIMDJkBC0HyACECIAEgBEYNmAEgAygCACIAIAQgAWtqIQUgASAAa0EBaiEGAkADQCABLQAAIABBs9UAai0AAEcNBSAAQQFGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAMmQELIAMoAgQhACADQgA3AwAgAyAAIAZBAWoiARArIgAEQCADQfEANgIcIAMgATYCFCADIAA2AgxBACECDJkBC0HfACECDH8LQQAhAAJAIAMoAjgiAkUNACACKAI0IgJFDQAgAyACEQAAIQALAkAgAARAIABBFUYNASADQQA2AhwgAyABNgIUIANB6g02AhAgA0EmNgIMQQAhAgyZAQtB3gAhAgx/CyADQfAANgIcIAMgATYCFCADQYAbNgIQIANBFTYCDEEAIQIMlwELIAMtAClBIUYNBiADQQA2AhwgAyABNgIUIANBkQo2AhAgA0EINgIMQQAhAgyWAQtB7wAhAiABIARGDZUBIAMoAgAiACAEIAFraiEFIAEgAGtBAmohBgJAA0AgAS0AACAAQbDVAGotAABHDQIgAEECRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADJYBCyADKAIEIQAgA0IANwMAIAMgACAGQQFqIgEQKyIARQ0CIANB7QA2AhwgAyABNgIUIAMgADYCDEEAIQIMlQELIANBADYCAAsgAygCBCEAIANBADYCBCADIAAgARArIgBFDYABIANB7gA2AhwgAyABNgIUIAMgADYCDEEAIQIMkwELQdwAIQIMeQtBACEAAkAgAygCOCICRQ0AIAIoAjQiAkUNACADIAIRAAAhAAsCQCAABEAgAEEVRg0BIANBADYCHCADIAE2AhQgA0HqDTYCECADQSY2AgxBACECDJMBC0HbACECDHkLIANB7AA2AhwgAyABNgIUIANBgBs2AhAgA0EVNgIMQQAhAgyRAQsgAy0AKSIAQSNJDQAgAEEuRg0AIANBADYCHCADIAE2AhQgA0HJCTYCECADQQg2AgxBACECDJABC0HaACECDHYLIAEgBEYEQEHrACECDI8BCwJAIAEtAABBL0YEQCABQQFqIQEMAQsgA0EANgIcIAMgATYCFCADQbI4NgIQIANBCDYCDEEAIQIMjwELQdkAIQIMdQsgASAERwRAIANBDjYCCCADIAE2AgRB2AAhAgx1C0HqACECDI0BCyABIARGBEBB6QAhAgyNAQsgAS0AAEEwayIAQf8BcUEKSQRAIAMgADoAKiABQQFqIQFB1wAhAgx0CyADKAIEIQAgA0EANgIEIAMgACABEC8iAEUNeiADQegANgIcIAMgATYCFCADIAA2AgxBACECDIwBCyABIARGBEBB5wAhAgyMAQsCQCABLQAAQS5GBEAgAUEBaiEBDAELIAMoAgQhACADQQA2AgQgAyAAIAEQLyIARQ17IANB5gA2AhwgAyABNgIUIAMgADYCDEEAIQIMjAELQdYAIQIMcgsgASAERgRAQeUAIQIMiwELQQAhAEEBIQVBASEHQQAhAgJAAkACQAJAAkACfwJAAkACQAJAAkACQAJAIAEtAABBMGsOCgoJAAECAwQFBggLC0ECDAYLQQMMBQtBBAwEC0EFDAMLQQYMAgtBBwwBC0EICyECQQAhBUEAIQcMAgtBCSECQQEhAEEAIQVBACEHDAELQQAhBUEBIQILIAMgAjoAKyABQQFqIQECQAJAIAMtAC5BEHENAAJAAkACQCADLQAqDgMBAAIECyAHRQ0DDAILIAANAQwCCyAFRQ0BCyADKAIEIQAgA0EANgIEIAMgACABEC8iAEUNAiADQeIANgIcIAMgATYCFCADIAA2AgxBACECDI0BCyADKAIEIQAgA0EANgIEIAMgACABEC8iAEUNfSADQeMANgIcIAMgATYCFCADIAA2AgxBACECDIwBCyADKAIEIQAgA0EANgIEIAMgACABEC8iAEUNeyADQeQANgIcIAMgATYCFCADIAA2AgwMiwELQdQAIQIMcQsgAy0AKUEiRg2GAUHTACECDHALQQAhAAJAIAMoAjgiAkUNACACKAJEIgJFDQAgAyACEQAAIQALIABFBEBB1QAhAgxwCyAAQRVHBEAgA0EANgIcIAMgATYCFCADQaQNNgIQIANBITYCDEEAIQIMiQELIANB4QA2AhwgAyABNgIUIANB0Bo2AhAgA0EVNgIMQQAhAgyIAQsgASAERgRAQeAAIQIMiAELAkACQAJAAkACQCABLQAAQQprDgQBBAQABAsgAUEBaiEBDAELIAFBAWohASADQS9qLQAAQQFxRQ0BC0HSACECDHALIANBADYCHCADIAE2AhQgA0G2ETYCECADQQk2AgxBACECDIgBCyADQQA2AhwgAyABNgIUIANBthE2AhAgA0EJNgIMQQAhAgyHAQsgASAERgRAQd8AIQIMhwELIAEtAABBCkYEQCABQQFqIQEMCQsgAy0ALkHAAHENCCADQQA2AhwgAyABNgIUIANBthE2AhAgA0ECNgIMQQAhAgyGAQsgASAERgRAQd0AIQIMhgELIAEtAAAiAkENRgRAIAFBAWohAUHQACECDG0LIAEhACACQQlrDgQFAQEFAQsgBCABIgBGBEBB3AAhAgyFAQsgAC0AAEEKRw0AIABBAWoMAgtBACECIANBADYCHCADIAA2AhQgA0HKLTYCECADQQc2AgwMgwELIAEgBEYEQEHbACECDIMBCwJAIAEtAABBCWsOBAMAAAMACyABQQFqCyEBQc4AIQIMaAsgASAERgRAQdoAIQIMgQELIAEtAABBCWsOBAABAQABC0EAIQIgA0EANgIcIANBmhI2AhAgA0EHNgIMIAMgAUEBajYCFAx/CyADQYASOwEqQQAhAAJAIAMoAjgiAkUNACACKAI4IgJFDQAgAyACEQAAIQALIABFDQAgAEEVRw0BIANB2QA2AhwgAyABNgIUIANB6ho2AhAgA0EVNgIMQQAhAgx+C0HNACECDGQLIANBADYCHCADIAE2AhQgA0HJDTYCECADQRo2AgxBACECDHwLIAEgBEYEQEHZACECDHwLIAEtAABBIEcNPSABQQFqIQEgAy0ALkEBcQ09IANBADYCHCADIAE2AhQgA0HCHDYCECADQR42AgxBACECDHsLIAEgBEYEQEHYACECDHsLAkACQAJAAkACQCABLQAAIgBBCmsOBAIDAwABCyABQQFqIQFBLCECDGULIABBOkcNASADQQA2AhwgAyABNgIUIANB5xE2AhAgA0EKNgIMQQAhAgx9CyABQQFqIQEgA0Evai0AAEEBcUUNcyADLQAyQYABcUUEQCADQTJqIQIgAxA1QQAhAAJAIAMoAjgiBkUNACAGKAIoIgZFDQAgAyAGEQAAIQALAkACQCAADhZNTEsBAQEBAQEBAQEBAQEBAQEBAQEAAQsgA0EpNgIcIAMgATYCFCADQawZNgIQIANBFTYCDEEAIQIMfgsg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c3BvbnNlIHN0YXR1cwBFeHBlY3RlZCBMRiBhZnRlciBoZWFkZXJzAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMAVXNlciBjYWxsYmFjayBlcnJvcgBgb25fcmVzZXRgIGNhbGxiYWNrIGVycm9yAGBvbl9jaHVua19oZWFkZXJgIGNhbGxiYWNrIGVycm9yAGBvbl9tZXNzYWdlX2JlZ2luYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfZXh0ZW5zaW9uX3ZhbHVlYCBjYWxsYmFjayBlcnJvcgBgb25fc3RhdHVzX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fdmVyc2lvbl9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX3VybF9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX3Byb3RvY29sX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9oZWFkZXJfdmFsdWVfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9tZXNzYWdlX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fbWV0aG9kX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25faGVhZGVyX2ZpZWxkX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfZXh0ZW5zaW9uX25hbWVgIGNhbGxiYWNrIGVycm9yAFVuZXhwZWN0ZWQgY2hhciBpbiB1cmwgc2VydmVyAEludmFsaWQgaGVhZGVyIHZhbHVlIGNoYXIASW52YWxpZCBoZWFkZXIgZmllbGQgY2hhcgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3ZlcnNpb24ASW52YWxpZCBtaW5vciB2ZXJzaW9uAEludmFsaWQgbWFqb3IgdmVyc2lvbgBFeHBlY3RlZCBzcGFjZSBhZnRlciB2ZXJzaW9uAEV4cGVjdGVkIENSTEYgYWZ0ZXIgdmVyc2lvbgBJbnZhbGlkIEhUVFAgdmVyc2lvbgBJbnZhbGlkIGhlYWRlciB0b2tlbgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3VybABJbnZhbGlkIGNoYXJhY3RlcnMgaW4gdXJsAFVuZXhwZWN0ZWQgc3RhcnQgY2hhciBpbiB1cmwARG91YmxlIEAgaW4gdXJsAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fcHJvdG9jb2wARW1wdHkgQ29udGVudC1MZW5ndGgASW52YWxpZCBjaGFyYWN0ZXIgaW4gQ29udGVudC1MZW5ndGgAVHJhbnNmZXItRW5jb2RpbmcgY2FuJ3QgYmUgcHJlc2VudCB3aXRoIENvbnRlbnQtTGVuZ3RoAER1cGxpY2F0ZSBDb250ZW50LUxlbmd0aABJbnZhbGlkIGNoYXIgaW4gdXJsIHBhdGgAQ29udGVudC1MZW5ndGggY2FuJ3QgYmUgcHJlc2VudCB3aXRoIFRyYW5zZmVyLUVuY29kaW5nAE1pc3NpbmcgZXhwZWN0ZWQgQ1IgYWZ0ZXIgY2h1bmsgc2l6ZQBFeHBlY3RlZCBMRiBhZnRlciBjaHVuayBzaXplAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIHNpemUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfdmFsdWUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9jaHVua19leHRlbnNpb25fdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyB2YWx1ZQBVbmV4cGVjdGVkIHdoaXRlc3BhY2UgYWZ0ZXIgaGVhZGVyIHZhbHVlAE1pc3NpbmcgZXhwZWN0ZWQgQ1IgYWZ0ZXIgaGVhZGVyIHZhbHVlAE1pc3NpbmcgZXhwZWN0ZWQgTEYgYWZ0ZXIgaGVhZGVyIHZhbHVlAEludmFsaWQgYFRyYW5zZmVyLUVuY29kaW5nYCBoZWFkZXIgdmFsdWUATWlzc2luZyBleHBlY3RlZCBDUiBhZnRlciBjaHVuayBleHRlbnNpb24gdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBxdW90ZSB2YWx1ZQBJbnZhbGlkIHF1b3RlZC1wYWlyIGluIGNodW5rIGV4dGVuc2lvbnMgcXVvdGVkIHZhbHVlAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgcXVvdGVkIHZhbHVlAFBhdXNlZCBieSBvbl9oZWFkZXJzX2NvbXBsZXRlAEludmFsaWQgRU9GIHN0YXRlAG9uX3Jlc2V0IHBhdXNlAG9uX2NodW5rX2hlYWRlciBwYXVzZQBvbl9tZXNzYWdlX2JlZ2luIHBhdXNlAG9uX2NodW5rX2V4dGVuc2lvbl92YWx1ZSBwYXVzZQBvbl9zdGF0dXNfY29tcGxldGUgcGF1c2UAb25fdmVyc2lvbl9jb21wbGV0ZSBwYXVzZQBvbl91cmxfY29tcGxldGUgcGF1c2UAb25fcHJvdG9jb2xfY29tcGxldGUgcGF1c2UAb25fY2h1bmtfY29tcGxldGUgcGF1c2UAb25faGVhZGVyX3ZhbHVlX2NvbXBsZXRlIHBhdXNlAG9uX21lc3NhZ2VfY29tcGxldGUgcGF1c2UAb25fbWV0aG9kX2NvbXBsZXRlIHBhdXNlAG9uX2hlYWRlcl9maWVsZF9jb21wbGV0ZSBwYXVzZQBvbl9jaHVua19leHRlbnNpb25fbmFtZSBwYXVzZQBVbmV4cGVjdGVkIHNwYWNlIGFmdGVyIHN0YXJ0IGxpbmUATWlzc2luZyBleHBlY3RlZCBDUiBhZnRlciByZXNwb25zZSBsaW5lAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fY2h1bmtfZXh0ZW5zaW9uX25hbWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBuYW1lAE1pc3NpbmcgZXhwZWN0ZWQgQ1IgYWZ0ZXIgY2h1bmsgZXh0ZW5zaW9uIG5hbWUASW52YWxpZCBzdGF0dXMgY29kZQBQYXVzZSBvbiBDT05ORUNUL1VwZ3JhZGUAUGF1c2Ugb24gUFJJL1VwZ3JhZGUARXhwZWN0ZWQgSFRUUC8yIENvbm5lY3Rpb24gUHJlZmFjZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX21ldGhvZABFeHBlY3RlZCBzcGFjZSBhZnRlciBtZXRob2QAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfZmllbGQAUGF1c2VkAEludmFsaWQgd29yZCBlbmNvdW50ZXJlZABJbnZhbGlkIG1ldGhvZCBlbmNvdW50ZXJlZABNaXNzaW5nIGV4cGVjdGVkIENSIGFmdGVyIGNodW5rIGRhdGEARXhwZWN0ZWQgTEYgYWZ0ZXIgY2h1bmsgZGF0YQBVbmV4cGVjdGVkIGNoYXIgaW4gdXJsIHNjaGVtYQBSZXF1ZXN0IGhhcyBpbnZhbGlkIGBUcmFuc2Zlci1FbmNvZGluZ2AARGF0YSBhZnRlciBgQ29ubmVjdGlvbjogY2xvc2VgAFNXSVRDSF9QUk9YWQBVU0VfUFJPWFkATUtBQ1RJVklUWQBVTlBST0NFU1NBQkxFX0VOVElUWQBRVUVSWQBDT1BZAE1PVkVEX1BFUk1BTkVOVExZAFRPT19FQVJMWQBOT1RJRlkARkFJTEVEX0RFUEVOREVOQ1kAQkFEX0dBVEVXQVkAUExBWQBQVVQAQ0hFQ0tPVVQAR0FURVdBWV9USU1FT1VUAFJFUVVFU1RfVElNRU9VVABORVRXT1JLX0NPTk5FQ1RfVElNRU9VVABDT05ORUNUSU9OX1RJTUVPVVQATE9HSU5fVElNRU9VVABORVRXT1JLX1JFQURfVElNRU9VVABQT1NUAE1JU0RJUkVDVEVEX1JFUVVFU1QAQ0xJRU5UX0NMT1NFRF9SRVFVRVNUAENMSUVOVF9DTE9TRURfTE9BRF9CQUxBTkNFRF9SRVFVRVNUAEJBRF9SRVFVRVNUAEhUVFBfUkVRVUVTVF9TRU5UX1RPX0hUVFBTX1BPUlQAUkVQT1JUAElNX0FfVEVBUE9UAFJFU0VUX0NPTlRFTlQATk9fQ09OVEVOVABQQVJUSUFMX0NPTlRFTlQASFBFX0lOVkFMSURfQ09OU1RBTlQASFBFX0NCX1JFU0VUAEdFVABIUEVfU1RSSUNUAENPTkZMSUNUAFRFTVBPUkFSWV9SRURJUkVDVABQRVJNQU5FTlRfUkVESVJFQ1QAQ09OTkVDVABNVUxUSV9TVEFUVVMASFBFX0lOVkFMSURfU1RBVFVTAFRPT19NQU5ZX1JFUVVFU1RTAEVBUkxZX0hJTlRTAFVOQVZBSUxBQkxFX0ZPUl9MRUdBTF9SRUFTT05TAE9QVElPTlMAU1dJVENISU5HX1BST1RPQ09MUwBWQVJJQU5UX0FMU09fTkVHT1RJQVRFUwBNVUxUSVBMRV9DSE9JQ0VTAElOVEVSTkFMX1NFUlZFUl9FUlJPUgBXRUJfU0VSVkVSX1VOS05PV05fRVJST1IAUkFJTEdVTl9FUlJPUgBJREVOVElUWV9QUk9WSURFUl9BVVRIRU5USUNBVElPTl9FUlJPUgBTU0xfQ0VSVElGSUNBVEVfRVJST1IASU5WQUxJRF9YX0ZPUldBUkRFRF9GT1IAU0VUX1BBUkFNRVRFUgBHRVRfUEFSQU1FVEVSAEhQRV9VU0VSAFNFRV9PVEhFUgBIUEVfQ0JfQ0hVTktfSEVBREVSAEV4cGVjdGVkIExGIGFmdGVyIENSAE1LQ0FMRU5EQVIAU0VUVVAAV0VCX1NFUlZFUl9JU19ET1dOAFRFQVJET1dOAEhQRV9DTE9TRURfQ09OTkVDVElPTgBIRVVSSVNUSUNfRVhQSVJBVElPTgBESVNDT05ORUNURURfT1BFUkFUSU9OAE5PTl9BVVRIT1JJVEFUSVZFX0lORk9STUFUSU9OAEhQRV9JTlZBTElEX1ZFUlNJT04ASFBFX0NCX01FU1NBR0VfQkVHSU4AU0lURV9JU19GUk9aRU4ASFBFX0lOVkFMSURfSEVBREVSX1RPS0VOAElOVkFMSURfVE9LRU4ARk9SQklEREVOAEVOSEFOQ0VfWU9VUl9DQUxNAEhQRV9JTlZBTElEX1VSTABCTE9DS0VEX0JZX1BBUkVOVEFMX0NPTlRST0wATUtDT0wAQUNMAEhQRV9JTlRFUk5BTABSRVFVRVNUX0hFQURFUl9GSUVMRFNfVE9PX0xBUkdFX1VOT0ZGSUNJQUwASFBFX09LAFVOTElOSwBVTkxPQ0sAUFJJAFJFVFJZX1dJVEgASFBFX0lOVkFMSURfQ09OVEVOVF9MRU5HVEgASFBFX1VORVhQRUNURURfQ09OVEVOVF9MRU5HVEgARkxVU0gAUFJPUFBBVENIAE0tU0VBUkNIAFVSSV9UT09fTE9ORwBQUk9DRVNTSU5HAE1JU0NFTExBTkVPVVNfUEVSU0lTVEVOVF9XQVJOSU5HAE1JU0NFTExBTkVPVVNfV0FSTklORwBIUEVfSU5WQUxJRF9UUkFOU0ZFUl9FTkNPRElORwBFeHBlY3RlZCBDUkxGAEhQRV9JTlZBTElEX0NIVU5LX1NJWkUATU9WRQBDT05USU5VRQBIUEVfQ0JfU1RBVFVTX0NPTVBMRVRFAEhQRV9DQl9IRUFERVJTX0NPTVBMRVRFAEhQRV9DQl9WRVJTSU9OX0NPTVBMRVRFAEhQRV9DQl9VUkxfQ09NUExFVEUASFBFX0NCX1BST1RPQ09MX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19DT01QTEVURQBIUEVfQ0JfSEVBREVSX1ZBTFVFX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19FWFRFTlNJT05fVkFMVUVfQ09NUExFVEUASFBFX0NCX0NIVU5LX0VYVEVOU0lPTl9OQU1FX0NPTVBMRVRFAEhQRV9DQl9NRVNTQUdFX0NPTVBMRVRFAEhQRV9DQl9NRVRIT0RfQ09NUExFVEUASFBFX0NCX0hFQURFUl9GSUVMRF9DT01QTEVURQBERUxFVEUASFBFX0lOVkFMSURfRU9GX1NUQVRFAElOVkFMSURfU1NMX0NFUlRJRklDQVRFAFBBVVNFAE5PX1JFU1BPTlNFAFVOU1VQUE9SVEVEX01FRElBX1RZUEUAR09ORQBOT1RfQUNDRVBUQUJMRQBTRVJWSUNFX1VOQVZBSUxBQkxFAFJBTkdFX05PVF9TQVRJU0ZJQUJMRQBPUklHSU5fSVNfVU5SRUFDSEFCTEUAUkVTUE9OU0VfSVNfU1RBTEUAUFVSR0UATUVSR0UAUkVRVUVTVF9IRUFERVJfRklFTERTX1RPT19MQVJHRQBSRVFVRVNUX0hFQURFUl9UT09fTEFSR0UAUEFZTE9BRF9UT09fTEFSR0UASU5TVUZGSUNJRU5UX1NUT1JBR0UASFBFX1BBVVNFRF9VUEdSQURFAEhQRV9QQVVTRURfSDJfVVBHUkFERQBTT1VSQ0UAQU5OT1VOQ0UAVFJBQ0UASFBFX1VORVhQRUNURURfU1BBQ0UAREVTQ1JJQkUAVU5TVUJTQ1JJQkUAUkVDT1JEAEhQRV9JTlZBTElEX01FVEhPRABOT1RfRk9VTkQAUFJPUEZJTkQAVU5CSU5EAFJFQklORABVTkFVVEhPUklaRUQATUVUSE9EX05PVF9BTExPV0VEAEhUVFBfVkVSU0lPTl9OT1RfU1VQUE9SVEVEAEFMUkVBRFlfUkVQT1JURUQAQUNDRVBURUQATk9UX0lNUExFTUVOVEVEAExPT1BfREVURUNURUQASFBFX0NSX0VYUEVDVEVEAEhQRV9MRl9FWFBFQ1RFRABDUkVBVEVEAElNX1VTRUQASFBFX1BBVVNFRABUSU1FT1VUX09DQ1VSRUQAUEFZTUVOVF9SRVFVSVJFRABQUkVDT05ESVRJT05fUkVRVUlSRUQAUFJPWFlfQVVUSEVOVElDQVRJT05fUkVRVUlSRUQATkVUV09SS19BVVRIRU5USUNBVElPTl9SRVFVSVJFRABMRU5HVEhfUkVRVUlSRUQAU1NMX0NFUlRJRklDQVRFX1JFUVVJUkVEAFVQR1JBREVfUkVRVUlSRUQAUEFHRV9FWFBJUkVEAFBSRUNPTkRJVElPTl9GQUlMRUQARVhQRUNUQVRJT05fRkFJTEVEAFJFVkFMSURBVElPTl9GQUlMRUQAU1NMX0hBTkRTSEFLRV9GQUlMRUQATE9DS0VEAFRSQU5TRk9STUFUSU9OX0FQUExJRUQATk9UX01PRElGSUVEAE5PVF9FWFRFTkRFRABCQU5EV0lEVEhfTElNSVRfRVhDRUVERUQAU0lURV9JU19PVkVSTE9BREVEAEhFQUQARXhwZWN0ZWQgSFRUUC8sIFJUU1AvIG9yIElDRS8A5xUAAK8VAACkEgAAkhoAACYWAACeFAAA2xkAAHkVAAB+EgAA/hQAADYVAAALFgAA2BYAAPMSAABCGAAArBYAABIVAAAUFwAA7xcAAEgUAABxFwAAshoAAGsZAAB+GQAANRQAAIIaAABEFwAA/RYAAB4YAACHFwAAqhkAAJMSAAAHGAAALBcAAMoXAACkFwAA5xUAAOcVAABYFwAAOxgAAKASAAAtHAAAwxEAAEgRAADeEgAAQhMAAKQZAAD9EAAA9xUAAKUVAADvFgAA+BkAAEoWAABWFgAA9RUAAAoaAAAIGgAAARoAAKsVAABCEgAA1xAAAEwRAAAFGQAAVBYAAB4RAADKGQAAyBkAAE4WAAD/GAAAcRQAAPAVAADuFQAAlBkAAPwVAAC/GQAAmxkAAHwUAABDEQAAcBgAAJUUAAAnFAAAGRQAANUSAADUGQAARBYAAPcQAEG5OwsBAQBB0DsL4AEBAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBBuj0LBAEAAAIAQdE9C14DBAMDAwMDAAADAwADAwADAwMDAwMDAwMDAAUAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAwADAEG6PwsEAQAAAgBB0T8LXgMAAwMDAwMAAAMDAAMDAAMDAwMDAwMDAwMABAAFAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwADAAMAQbDBAAsNbG9zZWVlcC1hbGl2ZQBBycEACwEBAEHgwQAL4AEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBBycMACwEBAEHgwwAL5wEBAQEBAQEBAQEBAQECAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAWNodW5rZWQAQfHFAAteAQABAQEBAQAAAQEAAQEAAQEBAQEBAQEBAQAAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEAAQBB0McACyFlY3Rpb25lbnQtbGVuZ3Rob25yb3h5LWNvbm5lY3Rpb24AQYDIAAsgcmFuc2Zlci1lbmNvZGluZ3BncmFkZQ0KDQpTTQ0KDQoAQanIAAsFAQIAAQMAQcDIAAtfBAUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUAQanKAAsFAQIAAQMAQcDKAAtfBAUFBgUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUAQanMAAsEAQAAAQBBwcwAC14CAgACAgICAgICAgICAgICAgICAgICAgICAgICAgIAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAEGpzgALBQECAAEDAEHAzgALXwQFAAAFBQUFBQUFBQUFBQYFBQUFBQUFBQUFBQUABQAHCAUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQAFAAUABQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUAAAAFAEGp0AALBQEBAAEBAEHA0AALAQEAQdrQAAtBAgAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAQanSAAsFAQEAAQEAQcDSAAsBAQBBytIACwYCAAAAAAIAQeHSAAs6AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwBBoNQAC50BTk9VTkNFRUNLT1VUTkVDVEVURUNSSUJFTFVTSEVURUFEU0VBUkNIUkdFQ1RJVklUWUxFTkRBUlZFT1RJRllQVElPTlNDSFNFQVlTVEFUQ0hHRVVFUllPUkRJUkVDVE9SVFJDSFBBUkFNRVRFUlVSQ0VCU0NSSUJFQVJET1dOQUNFSU5ETktDS1VCU0NSSUJFVFRQQ0VUU1BBRFRQLw==";
    let wasmBuffer;
    Object.defineProperty(module, "exports", {
      get: () => {
        return wasmBuffer ? wasmBuffer : wasmBuffer = Buffer2.from(wasmBase64, "base64");
      }
    });
  })(llhttpWasm);
  return llhttpWasm.exports;
}
var llhttp_simdWasm = { exports: {} };
llhttp_simdWasm.exports;
var hasRequiredLlhttp_simdWasm;
function requireLlhttp_simdWasm() {
  if (hasRequiredLlhttp_simdWasm) return llhttp_simdWasm.exports;
  hasRequiredLlhttp_simdWasm = 1;
  (function(module) {
    const { Buffer: Buffer2 } = require$$0$5;
    const wasmBase64 = "AGFzbQEAAAABJwdgAX8Bf2ADf39/AX9gAn9/AGABfwBgBH9/f38Bf2AAAGADf39/AALLAQgDZW52GHdhc21fb25faGVhZGVyc19jb21wbGV0ZQAEA2VudhV3YXNtX29uX21lc3NhZ2VfYmVnaW4AAANlbnYLd2FzbV9vbl91cmwAAQNlbnYOd2FzbV9vbl9zdGF0dXMAAQNlbnYUd2FzbV9vbl9oZWFkZXJfZmllbGQAAQNlbnYUd2FzbV9vbl9oZWFkZXJfdmFsdWUAAQNlbnYMd2FzbV9vbl9ib2R5AAEDZW52GHdhc21fb25fbWVzc2FnZV9jb21wbGV0ZQAAAzU0BQYAAAMAAAAAAAADAQMAAwMDAAACAAAAAAICAgICAgICAgIBAQEBAQEBAQEBAwAAAwAAAAQFAXABExMFAwEAAgYIAX8BQcDZBAsHxQcoBm1lbW9yeQIAC19pbml0aWFsaXplAAgZX19pbmRpcmVjdF9mdW5jdGlvbl90YWJsZQEAC2xsaHR0cF9pbml0AAkYbGxodHRwX3Nob3VsZF9rZWVwX2FsaXZlADcMbGxodHRwX2FsbG9jAAsGbWFsbG9jADkLbGxodHRwX2ZyZWUADARmcmVlAAwPbGxodHRwX2dldF90eXBlAA0VbGxodHRwX2dldF9odHRwX21ham9yAA4VbGxodHRwX2dldF9odHRwX21pbm9yAA8RbGxodHRwX2dldF9tZXRob2QAEBZsbGh0dHBfZ2V0X3N0YXR1c19jb2RlABESbGxodHRwX2dldF91cGdyYWRlABIMbGxodHRwX3Jlc2V0ABMObGxodHRwX2V4ZWN1dGUAFBRsbGh0dHBfc2V0dGluZ3NfaW5pdAAVDWxsaHR0cF9maW5pc2gAFgxsbGh0dHBfcGF1c2UAFw1sbGh0dHBfcmVzdW1lABgbbGxodHRwX3Jlc3VtZV9hZnRlcl91cGdyYWRlABkQbGxodHRwX2dldF9lcnJubwAaF2xsaHR0cF9nZXRfZXJyb3JfcmVhc29uABsXbGxodHRwX3NldF9lcnJvcl9yZWFzb24AHBRsbGh0dHBfZ2V0X2Vycm9yX3BvcwAdEWxsaHR0cF9lcnJub19uYW1lAB4SbGxodHRwX21ldGhvZF9uYW1lAB8SbGxodHRwX3N0YXR1c19uYW1lACAabGxodHRw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AXRrQT5qIQILIAEgAjYCHCABQgA3AhAgAkECdEH01wBqIQACQEHI1QAoAgAiA0EBIAJ0IgdxRQRAIAAgATYCAEHI1QAgAyAHcjYCACABIAA2AhggASABNgIIIAEgATYCDAwBCyAEQRkgAkEBdmtBACACQR9HG3QhAiAAKAIAIQACQANAIAAiAygCBEF4cSAERg0BIAJBHXYhACACQQF0IQIgAyAAQQRxakEQaiIHKAIAIgANAAsgByABNgIAIAEgAzYCGCABIAE2AgwgASABNgIIDAELIAMoAggiACABNgIMIAMgATYCCCABQQA2AhggASADNgIMIAEgADYCCAtB5NUAQeTVACgCAEEBayIAQX8gABs2AgALCwcAIAAtACgLBwAgAC0AKgsHACAALQArCwcAIAAtACkLBwAgAC8BNAsHACAALQAwC0ABBH8gACgCGCEBIAAvAS4hAiAALQAoIQMgACgCOCEEIAAQOCAAIAQ2AjggACADOgAoIAAgAjsBLiAAIAE2AhgLhocCAwd/A34BeyABIAJqIQQCQCAAIgMoAgwiAA0AIAMoAgQEQCADIAE2AgQLIwBBEGsiCSQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC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DAgLQeMBDAcLQdcBDAYLQdgBDAULQdkBDAQLQdoBDAMLQdsBDAILQd0BDAELQdwBCyECA0ACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIAMCfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACfwJAAkACQAJAAkACQAJAAn8CQAJAAkACfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAwJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC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A0EXNgIcIAMgADYCDCADIAFBAWo2AhQM+AILIABBFUYNI0EAIQIgA0EANgIcIAMgATYCFCADQdYMNgIQIANBIzYCDAz3AgsgAygCBCEAQQAhAiADQQA2AgQgAyAAIAEQNCIARQRAIAFBAWohAQwdCyADQRk2AhwgAyAANgIMIAMgAUEBajYCFAz2AgsgAygCBCEAQQAhAiADQQA2AgQgAyAAIAEQNCIARQRAIAFBAWohAQzvAgsgA0EaNgIcIAMgADYCDCADIAFBAWo2AhQM9QILIABBFUYNH0EAIQIgA0EANgIcIAMgATYCFCADQdAPNgIQIANBIjYCDAz0AgsgAygCBCEAIANBADYCBCADIAAgARAzIgBFBEAgAUEBaiEBDBsLIANBHDYCHCADIAA2AgwgAyABQQFqNgIUQQAhAgzzAgsgAygCBCEAIANBADYCBCADIAAgARAzIgBFBEAgAUEBaiEBDOsCCyADQR02AhwgAyAANgIMIAMgAUEBajYCFEEAIQIM8gILIABBO0cNASABQQFqIQELQSYhAgzXAgtBACECIANBADYCHCADIAE2AhQgA0GfFTYCECADQQw2AgwM7wILIAEgBEcEQANAIAEtAABBIEcNhAIgBCABQQFqIgFHDQALQSwhAgzvAgtBLCECDO4CCyABIARGBEBBNCECDO4CCwJAAkADQAJAIAEtAABBCmsOBAIAAAMACyAEIAFBAWoiAUcNAAtBNCECDO8CCyADKAIEIQAgA0EANgIEIAMgACABEDEiAEUNnwIgA0EyNgIcIAMgATYCFCADIAA2AgxBACECDO4CCyADKAIEIQAgA0EANgIEIAMgACABEDEiAEUEQCABQQFqIQEMnwILIANBMjYCHCADIAA2AgwgAyABQQFqNgIUQQAhAgztAgsgASAERwRAAkADQCABLQAAQTBrIgBB/wFxQQpPBEBBOiECDNcCCyADKQMgIgtCmbPmzJmz5swZVg0BIAMgC0IKfiIKNwMgIAogAK1C/wGDIgtCf4VWDQEgAyAKIAt8NwMgIAQgAUEBaiIBRw0AC0HAACECDO4CCyADKAIEIQAgA0EANgIEIAMgACABQQFqIgEQMSIADRcM4gILQcAAIQIM7AILIAEgBEYEQEHJACECDOwCCwJAA0ACQCABLQAAQQlrDhgAAqICogKpAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAgCiAgsgBCABQQFqIgFHDQALQckAIQIM7AILIAFBAWohASADQS9qLQAAQQFxDaUCIANBADYCHCADIAE2AhQgA0GXEDYCECADQQo2AgxBACECDOsCCyABIARHBEADQCABLQAAQSBHDRUgBCABQQFqIgFHDQALQfgAIQIM6wILQfgAIQIM6gILIANBAjoAKAw4C0EAIQIgA0EANgIcIANBvws2AhAgA0ECNgIMIAMgAUEBajYCFAzoAgtBACECDM4CC0ENIQIMzQILQRMhAgzMAgtBFSECDMsCC0EWIQIMygILQRghAgzJAgtBGSECDMgCC0EaIQIMxwILQRshAgzGAgtBHCECDMUCC0EdIQIMxAILQR4hAgzDAgtBHyECDMICC0EgIQIMwQILQSIhAgzAAgtBIyECDL8CC0ElIQIMvgILQeUAIQIMvQILIANBPTYCHCADIAE2AhQgAyAANgIMQQAhAgzVAgsgA0EbNgIcIAMgATYCFCADQaQcNgIQIANBFTYCDEEAIQIM1AILIANBIDYCHCADIAE2AhQgA0GYGjYCECADQRU2AgxBACECDNMCCyADQRM2AhwgAyABNgIUIANBmBo2AhAgA0EVNgIMQQAhAgzSAgsgA0ELNgIcIAMgATYCFCADQZgaNgIQIANBFTYCDEEAIQIM0QILIANBEDYCHCADIAE2AhQgA0GYGjYCECADQRU2AgxBACECDNACCyADQSA2AhwgAyABNgIUIANBpBw2AhAgA0EVNgIMQQAhAgzPAgsgA0ELNgIcIAMgATYCFCADQaQcNgIQIANBFTYCDEEAIQIMzgILIANBDDYCHCADIAE2AhQgA0GkHDYCECADQRU2AgxBACECDM0CC0EAIQIgA0EANgIcIAMgATYCFCADQd0ONgIQIANBEjYCDAzMAgsCQANAAkAgAS0AAEEKaw4EAAICAAILIAQgAUEBaiIBRw0AC0H9ASECDMwCCwJAAkAgAy0ANkEBRw0AQQAhAAJAIAMoAjgiAkUNACACKAJgIgJFDQAgAyACEQAAIQALIABFDQAgAEEVRw0BIANB/AE2AhwgAyABNgIUIANB3Bk2AhAgA0EVNgIMQQAhAgzNAgtB3AEhAgyzAgsgA0EANgIcIAMgATYCFCADQfkLNgIQIANBHzYCDEEAIQIMywILAkACQCADLQAoQQFrDgIEAQALQdsBIQIMsgILQdQBIQIMsQILIANBAjoAMUEAIQACQCADKAI4IgJFDQAgAigCACICRQ0AIAMgAhEAACEACyAARQRAQd0BIQIMsQILIABBFUcEQCADQQA2AhwgAyABNgIUIANBtAw2AhAgA0EQNgIMQQAhAgzKAgsgA0H7ATYCHCADIAE2AhQgA0GBGjYCECADQRU2AgxBACECDMkCCyABIARGBEBB+gEhAgzJAgsgAS0AAEHIAEYNASADQQE6ACgLQcABIQIMrgILQdoBIQIMrQILIAEgBEcEQCADQQw2AgggAyABNgIEQdkBIQIMrQILQfkBIQIMxQILIAEgBEYEQEH4ASECDMUCCyABLQAAQcgARw0EIAFBAWohAUHYASECDKsCCyABIARGBEBB9wEhAgzEAgsCQAJAIAEtAABBxQBrDhAABQUFBQUFBQUFBQUFBQUBBQsgAUEBaiEBQdYBIQIMqwILIAFBAWohAUHXASECDKoCC0H2ASECIAEgBEYNwgIgAygCACIAIAQgAWtqIQUgASAAa0ECaiEGAkADQCABLQAAIABButUAai0AAEcNAyAAQQJGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAMwwILIAMoAgQhACADQgA3AwAgAyAAIAZBAWoiARAuIgBFBEBB4wEhAgyqAgsgA0H1ATYCHCADIAE2AhQgAyAANgIMQQAhAgzCAgtB9AEhAiABIARGDcECIAMoAgAiACAEIAFraiEFIAEgAGtBAWohBgJAA0AgAS0AACAAQbjVAGotAABHDQIgAEEBRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADMICCyADQYEEOwEoIAMoAgQhACADQgA3AwAgAyAAIAZBAWoiARAuIgANAwwCCyADQQA2AgALQQAhAiADQQA2AhwgAyABNgIUIANB5R82AhAgA0EINgIMDL8CC0HVASECDKUCCyADQfMBNgIcIAMgATYCFCADIAA2AgxBACECDL0CC0EAIQACQCADKAI4IgJFDQAgAigCQCICRQ0AIAMgAhEAACEACyAARQ1uIABBFUcEQCADQQA2AhwgAyABNgIUIANBgg82AhAgA0EgNgIMQQAhAgy9AgsgA0GPATYCHCADIAE2AhQgA0HsGzYCECADQRU2AgxBACECDLwCCyABIARHBEAgA0ENNgIIIAMgATYCBEHTASECDKMCC0HyASECDLsCCyABIARGBEBB8QEhAgy7AgsCQAJAAkAgAS0AAEHIAGsOCwABCAgICAgICAgCCAsgAUEBaiEBQdABIQIMowILIAFBAWohAUHRASECDKICCyABQQFqIQFB0gEhAgyhAgtB8AEhAiABIARGDbkCIAMoAgAiACAEIAFraiEGIAEgAGtBAmohBQNAIAEtAAAgAEG11QBqLQAARw0EIABBAkYNAyAAQQFqIQAgBCABQQFqIgFHDQALIAMgBjYCAAy5AgtB7wEhAiABIARGDbgCIAMoAgAiACAEIAFraiEGIAEgAGtBAWohBQNAIAEtAAAgAEGz1QBqLQAARw0DIABBAUYNAiAAQQFqIQAgBCABQQFqIgFHDQALIAMgBjYCAAy4AgtB7gEhAiABIARGDbcCIAMoAgAiACAEIAFraiEGIAEgAGtBAmohBQNAIAEtAAAgAEGw1QBqLQAARw0CIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBjYCAAy3AgsgAygCBCEAIANCADcDACADIAAgBUEBaiIBECsiAEUNAiADQewBNgIcIAMgATYCFCADIAA2AgxBACECDLYCCyADQQA2AgALIAMoAgQhACADQQA2AgQgAyAAIAEQKyIARQ2cAiADQe0BNgIcIAMgATYCFCADIAA2AgxBACECDLQCC0HPASECDJoCC0EAIQACQCADKAI4IgJFDQAgAigCNCICRQ0AIAMgAhEAACEACwJAIAAEQCAAQRVGDQEgA0EANgIcIAMgATYCFCADQeoNNgIQIANBJjYCDEEAIQIMtAILQc4BIQIMmgILIANB6wE2AhwgAyABNgIUIANBgBs2AhAgA0EVNgIMQQAhAgyyAgsgASAERgRAQesBIQIMsgILIAEtAABBL0YEQCABQQFqIQEMAQsgA0EANgIcIAMgATYCFCADQbI4NgIQIANBCDYCDEEAIQIMsQILQc0BIQIMlwILIAEgBEcEQCADQQ42AgggAyABNgIEQcwBIQIMlwILQeoBIQIMrwILIAEgBEYEQEHpASECDK8CCyABLQAAQTBrIgBB/wFxQQpJBEAgAyAAOgAqIAFBAWohAUHLASECDJYCCyADKAIEIQAgA0EANgIEIAMgACABEC8iAEUNlwIgA0HoATYCHCADIAE2AhQgAyAANgIMQQAhAgyuAgsgASAERgRAQecBIQIMrgILAkAgAS0AAEEuRgRAIAFBAWohAQwBCyADKAIEIQAgA0EANgIEIAMgACABEC8iAEUNmAIgA0HmATYCHCADIAE2AhQgAyAANgIMQQAhAgyuAgtBygEhAgyUAgsgASAERgRAQeUBIQIMrQILQQAhAEEBIQVBASEHQQAhAgJAAkACQAJAAkACfwJAAkACQAJAAkACQAJAIAEtAABBMGsOCgoJAAECAwQFBggLC0ECDAYLQQMMBQtBBAwEC0EFDAMLQQYMAgtBBwwBC0EICyECQQAhBUEAIQcMAgtBCSECQQEhAEEAIQVBACEHDAELQQAhBUEBIQILIAMgAjoAKyABQQFqIQECQAJAIAMtAC5BEHENAAJAAkACQCADLQAqDgMBAAIECyAHRQ0DDAILIAANAQwCCyAFRQ0BCyADKAIEIQAgA0EANgIEIAMgACABEC8iAEUNAiADQeIBNgIcIAMgATYCFCADIAA2AgxBACECDK8CCyADKAIEIQAgA0EANgIEIAMgACABEC8iAEUNmgIgA0HjATYCHCADIAE2AhQgAyAANgIMQQAhAgyuAgsgAygCBCEAIANBADYCBCADIAAgARAvIgBFDZgCIANB5AE2AhwgAyABNgIUIAMgADYCDAytAgtByQEhAgyTAgtBACEAAkAgAygCOCICRQ0AIAIoAkQiAkUNACADIAIRAAAhAAsCQCAABEAgAEEVRg0BIANBADYCHCADIAE2AhQgA0GkDTYCECADQSE2AgxBACECDK0CC0HIASECDJMCCyADQeEBNgIcIAMgATYCFCADQdAaNgIQIANBFTYCDEEAIQIMqwILIAEgBEYEQEHhASECDKsCCwJAIAEtAABBIEYEQCADQQA7ATQgAUEBaiEBDAELIANBADYCHCADIAE2AhQgA0GZETYCECADQQk2AgxBACECDKsCC0HHASECDJECCyABIARGBEBB4AEhAgyqAgsCQCABLQAAQTBrQf8BcSICQQpJBEAgAUEBaiEBAkAgAy8BNCIAQZkzSw0AIAMgAEEKbCIAOwE0IABB/v8DcSACQf//A3NLDQAgAyAAIAJqOwE0DAILQQAhAiADQQA2AhwgAyABNgIUIANBlR42AhAgA0ENNgIMDKsCCyADQQA2AhwgAyABNgIUIANBlR42AhAgA0ENNgIMQQAhAgyqAgtBxgEhAgyQAgsgASAERgRAQd8BIQIMqQILAkAgAS0AAEEwa0H/AXEiAkEKSQRAIAFBAWohAQJAIAMvATQiAEGZM0sNACADIABBCmwiADsBNCAAQf7/A3EgAkH//wNzSw0AIAMgACACajsBNAwCC0EAIQIgA0EANgIcIAMgATYCFCADQZUeNgIQIANBDTYCDAyqAgsgA0EANgIcIAMgATYCFCADQZUeNgIQIANBDTYCDEEAIQIMqQILQcUBIQIMjwILIAEgBEYEQEHeASECDKgCCwJAIAEtAABBMGtB/wFxIgJBCkkEQCABQQFqIQECQCADLwE0IgBBmTNLDQAgAyAAQQpsIgA7ATQgAEH+/wNxIAJB//8Dc0sNACADIAAgAmo7ATQMAgtBACECIANBADYCHCADIAE2AhQgA0GVHjYCECADQQ02AgwMqQILIANBADYCHCADIAE2AhQgA0GVHjYCECADQQ02AgxBACECDKgCC0HEASECDI4CCyABIARGBEBB3QEhAgynAgsCQAJAAkACQCABLQAAQQprDhcCAwMAAwMDAwMDAwMDAwMDAwMDAwMDAQMLIAFBAWoMBQsgAUEBaiEBQcMBIQIMjwILIAFBAWohASADQS9qLQAAQQFxDQggA0EANgIcIAMgATYCFCADQY0LNgIQIANBDTYCDEEAIQIMpwILIANBADYCHCADIAE2AhQgA0GNCzYCECADQQ02AgxBACECDKYCCyABIARHBEAgA0EPNgIIIAMgATYCBEEBIQIMjQILQdwBIQIMpQILAkACQANAAkAgAS0AAEEKaw4EAgAAAwALIAQgAUEBaiIBRw0AC0HbASECDKYCCyADKAIEIQAgA0EANgIEIAMgACABEC0iAEUEQCABQQFqIQEMBAsgA0HaATYCHCADIAA2AgwgAyABQQFqNgIUQQAhAgylAgsgAygCBCEAIANBADYCBCADIAAgARAtIgANASABQQFqCyEBQcEBIQIMigILIANB2QE2AhwgAyAANgIMIAMgAUEBajYCFEEAIQIMogILQcIBIQIMiAILIANBL2otAABBAXENASADQQA2AhwgAyABNgIUIANB5Bw2AhAgA0EZNgIMQQAhAgygAgsgASAERgRAQdkB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CyADIAU2AgAMkAILIANBADYCACAGQQFqIQFBGgw8C0HKASECIAEgBEYNjgIgAygCACIAIAQgAWtqIQUgASAAa0EDaiEGAkADQCABLQAAIABBjdUAai0AAEcNOyAAQQNGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAMjwILIANBADYCACAGQQFqIQFBIQw7CyABIARGBEBByQEhAgyOAgsCQAJAIAEtAABBwQBrDhQAPT09PT09PT09PT09PT09PT09AT0LIAFBAWohAUGtASECDPUBCyABQQFqIQFBsAEhAgz0AQsgASAERgRAQcgBIQIMjQILAkACQCABLQAAQdUAaw4LADw8PDw8PDw8PAE8CyABQQFqIQFBrgEhAgz0AQsgAUEBaiEBQa8BIQIM8wELQccBIQIgASAERg2LAiADKAIAIgAgBCABa2ohBSABIABrQQhqIQYCQANAIAEtAAAgAEGE1QBqLQAARw04IABBCEYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAyMAgsgA0EANgIAIAZBAWohAUEqDDgLIAEgBEYEQEHGASECDIsCCyABLQAAQdAARw04IAFBAWohAUElDDcLQcUBIQIgASAERg2JAiADKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGB1QBqLQAARw02IABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAyKAgsgA0EANgIAIAZBAWohAUEODDYLIAEgBEYEQEHEASECDIkCCyABLQAAQcUARw02IAFBAWohAUGrASECDO8BCyABIARGBEBBwwEhAgyIAgsCQAJAAkACQCABLQAAQcIAaw4PAAECOTk5OTk5OTk5OTkDOQsgAUEBaiEBQacBIQIM8QELIAFBAWohAUGoASECDPABCyABQQFqIQFBqQEhAgzvAQsgAUEBaiEBQaoBIQIM7gELQcIBIQIgASAERg2GAiADKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEH+1ABqLQAARw0zIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAyHAgsgA0EANgIAIAZBAWohAUEUDDMLQcEBIQIgASAERg2FAiADKAIAIgAgBCABa2ohBSABIABrQQRqIQYCQANA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BTYCAAzsAQsgA0EANgIAIAZBAWohAUEXDBgLQaYBIQIgASAERg3qASADKAIAIgAgBCABa2ohBSABIABrQQVqIQYCQANAIAEtAAAgAEHB1ABqLQAARw0XIABBBUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzrAQsgA0EANgIAIAZBAWohAUEYDBcLIAEgBEYEQEGlASECDOoBCwJAAkAgAS0AAEHJAGsOBwAZGRkZGQEZCyABQQFqIQFBiwEhAgzRAQsgAUEBaiEBQYwBIQIM0AELQaQBIQIgASAERg3oASADKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEGm1QBqLQAARw0VIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzpAQsgA0EANgIAIAZBAWohAUEJDBULQaMBIQIgASAERg3nASADKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEGk1QBqLQAARw0UIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzoAQsgA0EANgIAIAZBAWohAUEfDBQLQaIBIQIgASAERg3mASADKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEG+1ABqLQAARw0TIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAznAQsgA0EANgIAIAZBAWohAUECDBMLQaEBIQIgASAERg3lASADKAIAIgAgBCABa2ohBSABIABrQQFqIQYDQCABLQAAIABBvNQAai0AAEcNESAAQQFGDQIgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM5QELIAEgBEYEQEGgASECDOUBC0EBIAEtAABB3wBHDREaIAFBAWohAUGHASECDMsBCyADQQA2AgAgBkEBaiEBQYgBIQIMygELQZ8BIQIgASAERg3iASADKAIAIgAgBCABa2ohBSABIABrQQhqIQYCQANAIAEtAAAgAEGE1QBqLQAARw0PIABBCEYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAzjAQsgA0EANgIAIAZBAWohAUEpDA8LQZ4BIQIgASAERg3hASADKAIAIgAgBCABa2ohBSABIABrQQNqIQYCQANAIAEtAAAgAEG41ABqLQAARw0OIABBA0YNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAziAQsgA0EANgIAIAZBAWohAUEtDA4LIAEgBEYEQEGdASECDOEBCyABLQAAQcUARw0OIAFBAWohAUGEASECDMcBCyABIARGBEBBnAEhAgzgAQsCQAJAIAEtAABBzABrDggADw8PDw8PAQ8LIAFBAWohAUGCASECDMcBCyABQQFqIQFBgwEhAgzGAQtBmwEhAiABIARGDd4BIAMoAgAiACAEIAFraiEFIAEgAGtBBGohBgJAA0AgAS0AACAAQbPUAGotAABHDQsgAEEERg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADN8BCyADQQA2AgAgBkEBaiEBQSMMCwtBmgEhAiABIARGDd0BIAMoAgAiACAEIAFraiEFIAEgAGtBAmohBgJAA0AgAS0AACAAQbDUAGotAABHDQogAEECRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADN4BCyADQQA2AgAgBkEBaiEBQQAMCgsgASAERgRAQZkBIQIM3QELAkACQCABLQAAQcgAaw4IAAwMDAwMDAEMCyABQQFqIQFB/QAhAgzEAQsgAUEBaiEBQYABIQIMwwELIAEgBEYEQEGYASECDNwBCwJAAkAgAS0AAEHOAGsOAwALAQsLIAFBAWohAUH+ACECDMMBCyABQQFqIQFB/wAhAgzCAQsgASAERgRAQZcBIQIM2wELIAEtAABB2QBHDQggAUEBaiEBQQgMBwtBlgEhAiABIARGDdkBIAMoAgAiACAEIAFraiEFIAEgAGtBA2ohBgJAA0AgAS0AACAAQazUAGotAABHDQYgAEEDRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADNoBCyADQQA2AgAgBkEBaiEBQQUMBgtBlQEhAiABIARGDdgBIAMoAgAiACAEIAFraiEFIAEgAGtBBWohBgJAA0AgAS0AACAAQabUAGotAABHDQUgAEEFRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADNkBCyADQQA2AgAgBkEBaiEBQRYMBQtBlAEhAiABIARGDdcBIAMoAgAiACAEIAFraiEFIAEgAGtBAmohBgJAA0AgAS0AACAAQaHVAGotAABHDQQgAEECRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAyAFNgIADNgBCyADQQA2AgAgBkEBaiEBQRAMBAsgASAERgRAQZMBIQIM1wELAkACQCABLQAAQcMAaw4MAAYGBgYGBgYGBgYBBgsgAUEBaiEBQfkAIQIMvgELIAFBAWohAUH6ACECDL0BC0GSASECIAEgBEYN1QEgAygCACIAIAQgAWtqIQUgASAAa0EFaiEGAkADQCABLQAAIABBoNQAai0AAEcNAiAAQQVGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAM1gELIANBADYCACAGQQFqIQFBJAwCCyADQQA2AgAMAgsgASAERgRAQZEBIQIM1AELIAEtAABBzABHDQEgAUEBaiEBQRMLOgApIAMoAgQhACADQQA2AgQgAyAAIAEQLiIADQIMAQtBACECIANBADYCHCADIAE2AhQgA0H+HzYCECADQQY2AgwM0QELQfgAIQIMtwELIANBkAE2AhwgAyABNgIUIAMgADYCDEEAIQIMzwELQQAhAAJAIAMoAjgiAkUNACACKAJAIgJFDQAgAyACEQAAIQALIABFDQAgAEEVRg0BIANBADYCHCADIAE2AhQgA0GCDzYCECADQSA2AgxBACECDM4BC0H3ACECDLQBCyADQY8BNgIcIAMgATYCFCADQewbNgIQIANBFTYCDEEAIQIMzAELIAEgBEYEQEGPASECDMwBCwJAIAEtAABBIEYEQCABQQFqIQEMAQsgA0EANgIcIAMgATYCFCADQZsfNgIQIANBBjYCDEEAIQIMzAELQQIhAgyyAQsDQCABLQAAQSBHDQIgBCABQQFqIgFHDQALQY4BIQIMygELIAEgBEYEQEGNASECDMoBCwJAIAEtAABBCWsOBEoAAEoAC0H1ACECDLABCyADLQApQQVGBEBB9gAhAgywAQtB9AAhAgyvAQsgASAERgRAQYwBIQIMyAELIANBEDYCCCADIAE2AgQMCgsgASAERgRAQYsBIQIMxwELAkAgAS0AAEEJaw4ERwAARwALQfMAIQIMrQELIAEgBEcEQCADQRA2AgggAyABNgIEQfEAIQIMrQELQYoBIQIMxQELAkAgASAERwRAA0AgAS0AAEGg0ABqLQAAIgBBA0cEQAJAIABBAWsOAkkABAtB8AAhAgyvAQsgBCABQQFqIgFHDQALQYgBIQIMxgELQYgBIQIMxQELIANBADYCHCADIAE2AhQgA0HbIDYCECADQQc2AgxBACECDMQBCyABIARGBEBBiQEhAgzEAQsCQAJAAkAgAS0AAEGg0gBqLQAAQQFrDgNGAgABC0HyACECDKwBCyADQQA2AhwgAyABNgIUIANBtBI2AhAgA0EHNgIMQQAhAgzEAQtB6gAhAgyqAQsgASAERwRAIAFBAWohAUHvACECDKoBC0GHASECDMIBCyAEIAEiAEYEQEGGASECDMIBCyAALQAAIgFBL0YEQCAAQQFqIQFB7gAhAgypAQsgAUEJayICQRdLDQEgACEBQQEgAnRBm4CABHENQQwBCyAEIAEiAEYEQEGFASECDMEBCyAALQAAQS9HDQAgAEEBaiEBDAMLQQAhAiADQQA2AhwgAyAANgIUIANB2yA2AhAgA0EHNgIMDL8BCwJAAkACQAJAAkADQCABLQAAQaDOAGotAAAiAEEFRwRAAkACQCAAQQFrDghHBQYHCAAEAQgLQesAIQIMrQELIAFBAWohAUHtACECDKwBCyAEIAFBAWoiAUcNAAtBhAEhAgzDAQsgAUEBagwUCyADKAIEIQAgA0EANgIEIAMgACABECwiAEUNHiADQdsANgIcIAMgATYCFCADIAA2AgxBACECDMEBCyADKAIEIQAgA0EANgIEIAMgACABECwiAEUNHiADQd0ANgIcIAMgATYCFCADIAA2AgxBACECDMABCyADKAIEIQAgA0EANgIEIAMgACABECwiAEUNHiADQfoANgIcIAMgATYCFCADIAA2AgxBACECDL8BCyADQQA2AhwgAyABNgIUIANB+Q82AhAgA0EHNgIMQQAhAgy+AQsgASAERgRAQYMBIQIMvgELAkAgAS0AAEGgzgBqLQAAQQFrDgg+BAUGAAgCAwcLIAFBAWohAQtBAyECDKMBCyABQQFqDA0LQQAhAiADQQA2AhwgA0HREjYCECADQQc2AgwgAyABQQFqNgIUDLoBCyADKAIEIQAgA0EANgIEIAMgACABECwiAEUNFiADQdsANgIcIAMgATYCFCADIAA2AgxBACECDLkBCyADKAIEIQAgA0EANgIEIAMgACABECwiAEUNFiADQd0ANgIcIAMgATYCFCADIAA2AgxBACECDLgBCyADKAIEIQAgA0EANgIEIAMgACABECwiAEUNFiADQfoANgIcIAMgATYCFCADIAA2AgxBACECDLcBCyADQQA2AhwgAyABNgIUIANB+Q82AhAgA0EHNgIMQQAhAgy2AQtB7AAhAgycAQsgASAERgRAQYIBIQIMtQELIAFBAWoMAgsgASAERgRAQYEBIQIMtAELIAFBAWoMAQsgASAERg0BIAFBAWoLIQFBBCECDJgBC0GAASECDLABCwNAIAEtAABBoMwAai0AACIAQQJHBEAgAEEBRwRAQekAIQIMmQELDDELIAQgAUEBaiIBRw0AC0H/ACECDK8BCyABIARGBEBB/gAhAgyvAQsCQCABLQAAQQlrDjcvAwYvBAYGBgYGBgYGBgYGBgYGBgYGBgUGBgIGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYABgsgAUEBagshAUEFIQIMlAELIAFBAWoMBgsgAygCBCEAIANBADYCBCADIAAgARAsIgBFDQggA0HbADYCHCADIAE2AhQgAyAANgIMQQAhAgyrAQsgAygCBCEAIANBADYCBCADIAAgARAsIgBFDQggA0HdADYCHCADIAE2AhQgAyAANgIMQQAhAgyqAQsgAygCBCEAIANBADYCBCADIAAgARAsIgBFDQggA0H6ADYCHCADIAE2AhQgAyAANgIMQQAhAgypAQsgA0EANgIcIAMgATYCFCADQY0UNgIQIANBBzYCDEEAIQIMqAELAkACQAJAAkADQCABLQAAQaDKAGotAAAiAEEFRwRAAkAgAEEBaw4GLgMEBQYABgtB6AAhAgyUAQsgBCABQQFqIgFHDQALQf0AIQIMqwELIAMoAgQhACADQQA2AgQgAyAAIAEQLCIARQ0HIANB2wA2AhwgAyABNgIUIAMgADYCDEEAIQIMqgELIAMoAgQhACADQQA2AgQgAyAAIAEQLCIARQ0HIANB3QA2AhwgAyABNgIUIAMgADYCDEEAIQIMqQELIAMoAgQhACADQQA2AgQgAyAAIAEQLCIARQ0HIANB+gA2AhwgAyABNgIUIAMgADYCDEEAIQIMqAELIANBADYCHCADIAE2AhQgA0HkCDYCECADQQc2AgxBACECDKcBCyABIARGDQEgAUEBagshAUEGIQIMjAELQfwAIQIMpAELAkACQAJAAkADQCABLQAAQaDIAGotAAAiAEEFRwRAIABBAWsOBCkCAwQFCyAEIAFBAWoiAUcNAAtB+wAhAgynAQsgAygCBCEAIANBADYCBCADIAAgARAsIgBFDQMgA0HbADYCHCADIAE2AhQgAyAANgIMQQAhAgymAQsgAygCBCEAIANBADYCBCADIAAgARAsIgBFDQMgA0HdADYCHCADIAE2AhQgAyAANgIMQQAhAgylAQsgAygCBCEAIANBADYCBCADIAAgARAsIgBFDQMgA0H6ADYCHCADIAE2AhQgAyAANgIMQQAhAgykAQsgA0EANgIcIAMgATYCFCADQbwKNgIQIANBBzYCDEEAIQIMowELQc8AIQIMiQELQdEAIQIMiAELQecAIQIMhwELIAEgBEYEQEH6ACECDKABCwJAIAEtAABBCWsOBCAAACAACyABQQFqIQFB5gAhAgyGAQsgASAERgRAQfkAIQIMnwELAkAgAS0AAEEJaw4EHwAAHwALQQAhAAJAIAMoAjgiAkUNACACKAI4IgJFDQAgAyACEQAAIQALIABFBEBB4gEhAgyGAQsgAEEVRwRAIANBADYCHCADIAE2AhQgA0HJDTYCECADQRo2AgxBACECDJ8BCyADQfgANgIcIAMgATYCFCADQeoaNgIQIANBFTYCDEEAIQIMngELIAEgBEcEQCADQQ02AgggAyABNgIEQeQAIQIMhQELQfcAIQIMnQELIAEgBEYEQEH2ACECDJ0BCwJAAkACQCABLQAAQcgAaw4LAAELCwsLCwsLCwILCyABQQFqIQFB3QAhAgyFAQsgAUEBaiEBQeAAIQIMhAELIAFBAWohAUHjACECDIMBC0H1ACECIAEgBEYNmwEgAygCACIAIAQgAWtqIQUgASAAa0ECaiEGAkADQCABLQAAIABBtdUAai0AAEcNCCAAQQJGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAMnAELIAMoAgQhACADQgA3AwAgAyAAIAZBAWoiARArIgAEQCADQfQANgIcIAMgATYCFCADIAA2AgxBACECDJwBC0HiACECDIIBC0EAIQACQCADKAI4IgJFDQAgAigCNCICRQ0AIAMgAhEAACEACwJAIAAEQCAAQRVGDQEgA0EANgIcIAMgATYCFCADQeoNNgIQIANBJjYCDEEAIQIMnAELQeEAIQIMggELIANB8wA2AhwgAyABNgIUIANBgBs2AhAgA0EVNgIMQQAhAgyaAQsgAy0AKSIAQSNrQQtJDQkCQCAAQQZLDQBBASAAdEHKAHFFDQAMCgtBACECIANBADYCHCADIAE2AhQgA0HtCTYCECADQQg2AgwMmQELQfIAIQIgASAERg2YASADKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEGz1QBqLQAARw0FIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAMgBTYCAAyZAQsgAygCBCEAIANCADcDACADIAAgBkEBaiIBECsiAARAIANB8QA2AhwgAyABNgIUIAMgADYCDEEAIQIMmQELQd8AIQIMfwtBACEAAkAgAygCOCICRQ0AIAIoAjQiAkUNACADIAIRAAAhAAsCQCAABEAgAEEVRg0BIANBADYCHCADIAE2AhQgA0HqDTYCECADQSY2AgxBACECDJkBC0HeACECDH8LIANB8AA2AhwgAyABNgIUIANBgBs2AhAgA0EVNgIMQQAhAgyXAQsgAy0AKUEhRg0GIANBADYCHCADIAE2AhQgA0GRCjYCECADQQg2AgxBACECDJYBC0HvACECIAEgBEYNlQEgAygCACIAIAQgAWtqIQUgASAAa0ECaiEGAkADQCABLQAAIABBsNUAai0AAEcNAiAAQQJGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyADIAU2AgAMlgELIAMoAgQhACADQgA3AwAgAyAAIAZBAWoiARArIgBFDQIgA0HtADYCHCADIAE2AhQgAyAANgIMQQAhAgyVAQsgA0EANgIACyADKAIEIQAgA0EANgIEIAMgACABECsiAEUNgAEgA0HuADYCHCADIAE2AhQgAyAANgIMQQAhAgyTAQtB3AAhAgx5C0EAIQACQCADKAI4IgJFDQAgAigCNCICRQ0AIAMgAhEAACEACwJAIAAEQCAAQRVGDQEgA0EANgIcIAMgATYCFCADQeoNNgIQIANBJjYCDEEAIQIMkwELQdsAIQIMeQsgA0HsADYCHCADIAE2AhQgA0GAGzYCECADQRU2AgxBACECDJEBCyADLQApIgBBI0kNACAAQS5GDQAgA0EANgIcIAMgATYCFCADQckJNgIQIANBCDYCDEEAIQIMkAELQdoAIQIMdgsgASAERgRAQesAIQIMjwELAkAgAS0AAEEvRgRAIAFBAWohAQwBCyAD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ciBIVFRQL3gueCByZXF1ZXN0AEludmFsaWQgbWV0aG9kIGZvciBSVFNQL3gueCByZXF1ZXN0AEV4cGVjdGVkIFNPVVJDRSBtZXRob2QgZm9yIElDRS94LnggcmVxdWVzdABJbnZhbGlkIGNoYXIgaW4gdXJsIGZyYWdtZW50IHN0YXJ0AEV4cGVjdGVkIGRvdABTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3N0YXR1cwBJbnZhbGlkIHJlc3BvbnNlIHN0YXR1cwBFeHBlY3RlZCBMRiBhZnRlciBoZWFkZXJzAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMAVXNlciBjYWxsYmFjayBlcnJvcgBgb25fcmVzZXRgIGNhbGxiYWNrIGVycm9yAGBvbl9jaHVua19oZWFkZXJgIGNhbGxiYWNrIGVycm9yAGBvbl9tZXNzYWdlX2JlZ2luYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfZXh0ZW5zaW9uX3ZhbHVlYCBjYWxsYmFjayBlcnJvcgBgb25fc3RhdHVzX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fdmVyc2lvbl9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX3VybF9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX3Byb3RvY29sX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9oZWFkZXJfdmFsdWVfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9tZXNzYWdlX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fbWV0aG9kX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25faGVhZGVyX2ZpZWxkX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfZXh0ZW5zaW9uX25hbWVgIGNhbGxiYWNrIGVycm9yAFVuZXhwZWN0ZWQgY2hhciBpbiB1cmwgc2VydmVyAEludmFsaWQgaGVhZGVyIHZhbHVlIGNoYXIASW52YWxpZCBoZWFkZXIgZmllbGQgY2hhcgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3ZlcnNpb24ASW52YWxpZCBtaW5vciB2ZXJzaW9uAEludmFsaWQgbWFqb3IgdmVyc2lvbgBFeHBlY3RlZCBzcGFjZSBhZnRlciB2ZXJzaW9uAEV4cGVjdGVkIENSTEYgYWZ0ZXIgdmVyc2lvbgBJbnZhbGlkIEhUVFAgdmVyc2lvbgBJbnZhbGlkIGhlYWRlciB0b2tlbgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3VybABJbnZhbGlkIGNoYXJhY3RlcnMgaW4gdXJsAFVuZXhwZWN0ZWQgc3RhcnQgY2hhciBpbiB1cmwARG91YmxlIEAgaW4gdXJsAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fcHJvdG9jb2wARW1wdHkgQ29udGVudC1MZW5ndGgASW52YWxpZCBjaGFyYWN0ZXIgaW4gQ29udGVudC1MZW5ndGgAVHJhbnNmZXItRW5jb2RpbmcgY2FuJ3QgYmUgcHJlc2VudCB3aXRoIENvbnRlbnQtTGVuZ3RoAER1cGxpY2F0ZSBDb250ZW50LUxlbmd0aABJbnZhbGlkIGNoYXIgaW4gdXJsIHBhdGgAQ29udGVudC1MZW5ndGggY2FuJ3QgYmUgcHJlc2VudCB3aXRoIFRyYW5zZmVyLUVuY29kaW5nAE1pc3NpbmcgZXhwZWN0ZWQgQ1IgYWZ0ZXIgY2h1bmsgc2l6ZQBFeHBlY3RlZCBMRiBhZnRlciBjaHVuayBzaXplAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIHNpemUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfdmFsdWUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9jaHVua19leHRlbnNpb25fdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyB2YWx1ZQBVbmV4cGVjdGVkIHdoaXRlc3BhY2UgYWZ0ZXIgaGVhZGVyIHZhbHVlAE1pc3NpbmcgZXhwZWN0ZWQgQ1IgYWZ0ZXIgaGVhZGVyIHZhbHVlAE1pc3NpbmcgZXhwZWN0ZWQgTEYgYWZ0ZXIgaGVhZGVyIHZhbHVlAEludmFsaWQgYFRyYW5zZmVyLUVuY29kaW5nYCBoZWFkZXIgdmFsdWUATWlzc2luZyBleHBlY3RlZCBDUiBhZnRlciBjaHVuayBleHRlbnNpb24gdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBxdW90ZSB2YWx1ZQBJbnZhbGlkIHF1b3RlZC1wYWlyIGluIGNodW5rIGV4dGVuc2lvbnMgcXVvdGVkIHZhbHVlAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgcXVvdGVkIHZhbHVlAFBhdXNlZCBieSBvbl9oZWFkZXJzX2NvbXBsZXRlAEludmFsaWQgRU9GIHN0YXRlAG9uX3Jlc2V0IHBhdXNlAG9uX2NodW5rX2hlYWRlciBwYXVzZQBvbl9tZXNzYWdlX2JlZ2luIHBhdXNlAG9uX2NodW5rX2V4dGVuc2lvbl92YWx1ZSBwYXVzZQBvbl9zdGF0dXNfY29tcGxldGUgcGF1c2UAb25fdmVyc2lvbl9jb21wbGV0ZSBwYXVzZQBvbl91cmxfY29tcGxldGUgcGF1c2UAb25fcHJvdG9jb2xfY29tcGxldGUgcGF1c2UAb25fY2h1bmtfY29tcGxldGUgcGF1c2UAb25faGVhZGVyX3ZhbHVlX2NvbXBsZXRlIHBhdXNlAG9uX21lc3NhZ2VfY29tcGxldGUgcGF1c2UAb25fbWV0aG9kX2NvbXBsZXRlIHBhdXNlAG9uX2hlYWRlcl9maWVsZF9jb21wbGV0ZSBwYXVzZQBvbl9jaHVua19leHRlbnNpb25fbmFtZSBwYXVzZQBVbmV4cGVjdGVkIHNwYWNlIGFmdGVyIHN0YXJ0IGxpbmUATWlzc2luZyBleHBlY3RlZCBDUiBhZnRlciByZXNwb25zZSBsaW5lAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fY2h1bmtfZXh0ZW5zaW9uX25hbWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBuYW1lAE1pc3NpbmcgZXhwZWN0ZWQgQ1IgYWZ0ZXIgY2h1bmsgZXh0ZW5zaW9uIG5hbWUASW52YWxpZCBzdGF0dXMgY29kZQBQYXVzZSBvbiBDT05ORUNUL1VwZ3JhZGUAUGF1c2Ugb24gUFJJL1VwZ3JhZGUARXhwZWN0ZWQgSFRUUC8yIENvbm5lY3Rpb24gUHJlZmFjZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX21ldGhvZABFeHBlY3RlZCBzcGFjZSBhZnRlciBtZXRob2QAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfZmllbGQAUGF1c2VkAEludmFsaWQgd29yZCBlbmNvdW50ZXJlZABJbnZhbGlkIG1ldGhvZCBlbmNvdW50ZXJlZABNaXNzaW5nIGV4cGVjdGVkIENSIGFmdGVyIGNodW5rIGRhdGEARXhwZWN0ZWQgTEYgYWZ0ZXIgY2h1bmsgZGF0YQBVbmV4cGVjdGVkIGNoYXIgaW4gdXJsIHNjaGVtYQBSZXF1ZXN0IGhhcyBpbnZhbGlkIGBUcmFuc2Zlci1FbmNvZGluZ2AARGF0YSBhZnRlciBgQ29ubmVjdGlvbjogY2xvc2VgAFNXSVRDSF9QUk9YWQBVU0VfUFJPWFkATUtBQ1RJVklUWQBVTlBST0NFU1NBQkxFX0VOVElUWQBRVUVSWQBDT1BZAE1PVkVEX1BFUk1BTkVOVExZAFRPT19FQVJMWQBOT1RJRlkARkFJTEVEX0RFUEVOREVOQ1kAQkFEX0dBVEVXQVkAUExBWQBQVVQAQ0hFQ0tPVVQAR0FURVdBWV9USU1FT1VUAFJFUVVFU1RfVElNRU9VVABORVRXT1JLX0NPTk5FQ1RfVElNRU9VVABDT05ORUNUSU9OX1RJTUVPVVQATE9HSU5fVElNRU9VVABORVRXT1JLX1JFQURfVElNRU9VVABQT1NUAE1JU0RJUkVDVEVEX1JFUVVFU1QAQ0xJRU5UX0NMT1NFRF9SRVFVRVNUAENMSUVOVF9DTE9TRURfTE9BRF9CQUxBTkNFRF9SRVFVRVNUAEJBRF9SRVFVRVNUAEhUVFBfUkVRVUVTVF9TRU5UX1RPX0hUVFBTX1BPUlQAUkVQT1JUAElNX0FfVEVBUE9UAFJFU0VUX0NPTlRFTlQATk9fQ09OVEVOVABQQVJUSUFMX0NPTlRFTlQASFBFX0lOVkFMSURfQ09OU1RBTlQASFBFX0NCX1JFU0VUAEdFVABIUEVfU1RSSUNUAENPTkZMSUNUAFRFTVBPUkFSWV9SRURJUkVDVABQRVJNQU5FTlRfUkVESVJFQ1QAQ09OTkVDVABNVUxUSV9TVEFUVVMASFBFX0lOVkFMSURfU1RBVFVTAFRPT19NQU5ZX1JFUVVFU1RTAEVBUkxZX0hJTlRTAFVOQVZBSUxBQkxFX0ZPUl9MRUdBTF9SRUFTT05TAE9QVElPTlMAU1dJVENISU5HX1BST1RPQ09MUwBWQVJJQU5UX0FMU09fTkVHT1RJQVRFUwBNVUxUSVBMRV9DSE9JQ0VTAElOVEVSTkFMX1NFUlZFUl9FUlJPUgBXRUJfU0VSVkVSX1VOS05PV05fRVJST1IAUkFJTEdVTl9FUlJPUgBJREVOVElUWV9QUk9WSURFUl9BVVRIRU5USUNBVElPTl9FUlJPUgBTU0xfQ0VSVElGSUNBVEVfRVJST1IASU5WQUxJRF9YX0ZPUldBUkRFRF9GT1IAU0VUX1BBUkFNRVRFUgBHRVRfUEFSQU1FVEVSAEhQRV9VU0VSAFNFRV9PVEhFUgBIUEVfQ0JfQ0hVTktfSEVBREVSAEV4cGVjdGVkIExGIGFmdGVyIENSAE1LQ0FMRU5EQVIAU0VUVVAAV0VCX1NFUlZFUl9JU19ET1dOAFRFQVJET1dOAEhQRV9DTE9TRURfQ09OTkVDVElPTgBIRVVSSVNUSUNfRVhQSVJBVElPTgBESVNDT05ORUNURURfT1BFUkFUSU9OAE5PTl9BVVRIT1JJVEFUSVZFX0lORk9STUFUSU9OAEhQRV9JTlZBTElEX1ZFUlNJT04ASFBFX0NCX01FU1NBR0VfQkVHSU4AU0lURV9JU19GUk9aRU4ASFBFX0lOVkFMSURfSEVBREVSX1RPS0VOAElOVkFMSURfVE9LRU4ARk9SQklEREVOAEVOSEFOQ0VfWU9VUl9DQUxNAEhQRV9JTlZBTElEX1VSTABCTE9DS0VEX0JZX1BBUkVOVEFMX0NPTlRST0wATUtDT0wAQUNMAEhQRV9JTlRFUk5BTABSRVFVRVNUX0hFQURFUl9GSUVMRFNfVE9PX0xBUkdFX1VOT0ZGSUNJQUwASFBFX09LAFVOTElOSwBVTkxPQ0sAUFJJAFJFVFJZX1dJVEgASFBFX0lOVkFMSURfQ09OVEVOVF9MRU5HVEgASFBFX1VORVhQRUNURURfQ09OVEVOVF9MRU5HVEgARkxVU0gAUFJPUFBBVENIAE0tU0VBUkNIAFVSSV9UT09fTE9ORwBQUk9DRVNTSU5HAE1JU0NFTExBTkVPVVNfUEVSU0lTVEVOVF9XQVJOSU5HAE1JU0NFTExBTkVPVVNfV0FSTklORwBIUEVfSU5WQUxJRF9UUkFOU0ZFUl9FTkNPRElORwBFeHBlY3RlZCBDUkxGAEhQRV9JTlZBTElEX0NIVU5LX1NJWkUATU9WRQBDT05USU5VRQBIUEVfQ0JfU1RBVFVTX0NPTVBMRVRFAEhQRV9DQl9IRUFERVJTX0NPTVBMRVRFAEhQRV9DQl9WRVJTSU9OX0NPTVBMRVRFAEhQRV9DQl9VUkxfQ09NUExFVEUASFBFX0NCX1BST1RPQ09MX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19DT01QTEVURQBIUEVfQ0JfSEVBREVSX1ZBTFVFX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19FWFRFTlNJT05fVkFMVUVfQ09NUExFVEUASFBFX0NCX0NIVU5LX0VYVEVOU0lPTl9OQU1FX0NPTVBMRVRFAEhQRV9DQl9NRVNTQUdFX0NPTVBMRVRFAEhQRV9DQl9NRVRIT0RfQ09NUExFVEUASFBFX0NCX0hFQURFUl9GSUVMRF9DT01QTEVURQBERUxFVEUASFBFX0lOVkFMSURfRU9GX1NUQVRFAElOVkFMSURfU1NMX0NFUlRJRklDQVRFAFBBVVNFAE5PX1JFU1BPTlNFAFVOU1VQUE9SVEVEX01FRElBX1RZUEUAR09ORQBOT1RfQUNDRVBUQUJMRQBTRVJWSUNFX1VOQVZBSUxBQkxFAFJBTkdFX05PVF9TQVRJU0ZJQUJMRQBPUklHSU5fSVNfVU5SRUFDSEFCTEUAUkVTUE9OU0VfSVNfU1RBTEUAUFVSR0UATUVSR0UAUkVRVUVTVF9IRUFERVJfRklFTERTX1RPT19MQVJHRQBSRVFVRVNUX0hFQURFUl9UT09fTEFSR0UAUEFZTE9BRF9UT09fTEFSR0UASU5TVUZGSUNJRU5UX1NUT1JBR0UASFBFX1BBVVNFRF9VUEdSQURFAEhQRV9QQVVTRURfSDJfVVBHUkFERQBTT1VSQ0UAQU5OT1VOQ0UAVFJBQ0UASFBFX1VORVhQRUNURURfU1BBQ0UAREVTQ1JJQkUAVU5TVUJTQ1JJQkUAUkVDT1JEAEhQRV9JTlZBTElEX01FVEhPRABOT1RfRk9VTkQAUFJPUEZJTkQAVU5CSU5EAFJFQklORABVTkFVVEhPUklaRUQATUVUSE9EX05PVF9BTExPV0VEAEhUVFBfVkVSU0lPTl9OT1RfU1VQUE9SVEVEAEFMUkVBRFlfUkVQT1JURUQAQUNDRVBURUQATk9UX0lNUExFTUVOVEVEAExPT1BfREVURUNURUQASFBFX0NSX0VYUEVDVEVEAEhQRV9MRl9FWFBFQ1RFRABDUkVBVEVEAElNX1VTRUQASFBFX1BBVVNFRABUSU1FT1VUX09DQ1VSRUQAUEFZTUVOVF9SRVFVSVJFRABQUkVDT05ESVRJT05fUkVRVUlSRUQAUFJPWFlfQVVUSEVOVElDQVRJT05fUkVRVUlSRUQATkVUV09SS19BVVRIRU5USUNBVElPTl9SRVFVSVJFRABMRU5HVEhfUkVRVUlSRUQAU1NMX0NFUlRJRklDQVRFX1JFUVVJUkVEAFVQR1JBREVfUkVRVUlSRUQAUEFHRV9FWFBJUkVEAFBSRUNPTkRJVElPTl9GQUlMRUQARVhQRUNUQVRJT05fRkFJTEVEAFJFVkFMSURBVElPTl9GQUlMRUQAU1NMX0hBTkRTSEFLRV9GQUlMRUQATE9DS0VEAFRSQU5TRk9STUFUSU9OX0FQUExJRUQATk9UX01PRElGSUVEAE5PVF9FWFRFTkRFRABCQU5EV0lEVEhfTElNSVRfRVhDRUVERUQAU0lURV9JU19PVkVSTE9BREVEAEhFQUQARXhwZWN0ZWQgSFRUUC8sIFJUU1AvIG9yIElDRS8A5xUAAK8VAACkEgAAkhoAACYWAACeFAAA2xkAAHkVAAB+EgAA/hQAADYVAAALFgAA2BYAAPMSAABCGAAArBYAABIVAAAUFwAA7xcAAEgUAABxFwAAshoAAGsZAAB+GQAANRQAAIIaAABEFwAA/RYAAB4YAACHFwAAqhkAAJMSAAAHGAAALBcAAMoXAACkFwAA5xUAAOcVAABYFwAAOxgAAKASAAAtHAAAwxEAAEgRAADeEgAAQhMAAKQZAAD9EAAA9xUAAKUVAADvFgAA+BkAAEoWAABWFgAA9RUAAAoaAAAIGgAAARoAAKsVAABCEgAA1xAAAEwRAAAFGQAAVBYAAB4RAADKGQAAyBkAAE4WAAD/GAAAcRQAAPAVAADuFQAAlBkAAPwVAAC/GQAAmxkAAHwUAABDEQAAcBgAAJUUAAAnFAAAGRQAANUSAADUGQAARBYAAPcQAEG5OwsBAQBB0DsL4AEBAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBBuj0LBAEAAAIAQdE9C14DBAMDAwMDAAADAwADAwADAwMDAwMDAwMDAAUAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAwADAEG6PwsEAQAAAgBB0T8LXgMAAwMDAwMAAAMDAAMDAAMDAwMDAwMDAwMABAAFAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwADAAMAQbDBAAsNbG9zZWVlcC1hbGl2ZQBBycEACwEBAEHgwQAL4AEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBBycMACwEBAEHgwwAL5wEBAQEBAQEBAQEBAQECAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAWNodW5rZWQAQfHFAAteAQABAQEBAQAAAQEAAQEAAQEBAQEBAQEBAQAAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEAAQBB0McACyFlY3Rpb25lbnQtbGVuZ3Rob25yb3h5LWNvbm5lY3Rpb24AQYDIAAsgcmFuc2Zlci1lbmNvZGluZ3BncmFkZQ0KDQpTTQ0KDQoAQanIAAsFAQIAAQMAQcDIAAtfBAUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUAQanKAAsFAQIAAQMAQcDKAAtfBAUFBgUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUAQanMAAsEAQAAAQBBwcwAC14CAgACAgICAgICAgICAgICAgICAgICAgICAgICAgIAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAEGpzgALBQECAAEDAEHAzgALXwQFAAAFBQUFBQUFBQUFBQYFBQUFBQUFBQUFBQUABQAHCAUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQAFAAUABQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUAAAAFAEGp0AALBQEBAAEBAEHA0AALAQEAQdrQAAtBAgAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAQanSAAsFAQEAAQEAQcDSAAsBAQBBytIACwYCAAAAAAIAQeHSAAs6AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwBBoNQAC50BTk9VTkNFRUNLT1VUTkVDVEVURUNSSUJFTFVTSEVURUFEU0VBUkNIUkdFQ1RJVklUWUxFTkRBUlZFT1RJRllQVElPTlNDSFNFQVlTVEFUQ0hHRVVFUllPUkRJUkVDVE9SVFJDSFBBUkFNRVRFUlVSQ0VCU0NSSUJFQVJET1dOQUNFSU5ETktDS1VCU0NSSUJFVFRQQ0VUU1BBRFRQLw==";
    let wasmBuffer;
    Object.defineProperty(module, "exports", {
      get: () => {
        return wasmBuffer ? wasmBuffer : wasmBuffer = Buffer2.from(wasmBase64, "base64");
      }
    });
  })(llhttp_simdWasm);
  return llhttp_simdWasm.exports;
}
var constants$2;
var hasRequiredConstants$2;
function requireConstants$2() {
  if (hasRequiredConstants$2) return constants$2;
  hasRequiredConstants$2 = 1;
  const corsSafeListedMethods = (
    /** @type {const} */
    ["GET", "HEAD", "POST"]
  );
  const corsSafeListedMethodsSet = new Set(corsSafeListedMethods);
  const nullBodyStatus = (
    /** @type {const} */
    [101, 204, 205, 304]
  );
  const redirectStatus = (
    /** @type {const} */
    [301, 302, 303, 307, 308]
  );
  const redirectStatusSet = new Set(redirectStatus);
  const badPorts = (
    /** @type {const} */
    [
      "1",
      "7",
      "9",
      "11",
      "13",
      "15",
      "17",
      "19",
      "20",
      "21",
      "22",
      "23",
      "25",
      "37",
      "42",
      "43",
      "53",
      "69",
      "77",
      "79",
      "87",
      "95",
      "101",
      "102",
      "103",
      "104",
      "109",
      "110",
      "111",
      "113",
      "115",
      "117",
      "119",
      "123",
      "135",
      "137",
      "139",
      "143",
      "161",
      "179",
      "389",
      "427",
      "465",
      "512",
      "513",
      "514",
      "515",
      "526",
      "530",
      "531",
      "532",
      "540",
      "548",
      "554",
      "556",
      "563",
      "587",
      "601",
      "636",
      "989",
      "990",
      "993",
      "995",
      "1719",
      "1720",
      "1723",
      "2049",
      "3659",
      "4045",
      "4190",
      "5060",
      "5061",
      "6000",
      "6566",
      "6665",
      "6666",
      "6667",
      "6668",
      "6669",
      "6679",
      "6697",
      "10080"
    ]
  );
  const badPortsSet = new Set(badPorts);
  const referrerPolicyTokens = (
    /** @type {const} */
    [
      "no-referrer",
      "no-referrer-when-downgrade",
      "same-origin",
      "origin",
      "strict-origin",
      "origin-when-cross-origin",
      "strict-origin-when-cross-origin",
      "unsafe-url"
    ]
  );
  const referrerPolicy = (
    /** @type {const} */
    [
      "",
      ...referrerPolicyTokens
    ]
  );
  const referrerPolicyTokensSet = new Set(referrerPolicyTokens);
  const requestRedirect = (
    /** @type {const} */
    ["follow", "manual", "error"]
  );
  const safeMethods = (
    /** @type {const} */
    ["GET", "HEAD", "OPTIONS", "TRACE"]
  );
  const safeMethodsSet = new Set(safeMethods);
  const requestMode = (
    /** @type {const} */
    ["navigate", "same-origin", "no-cors", "cors"]
  );
  const requestCredentials = (
    /** @type {const} */
    ["omit", "same-origin", "include"]
  );
  const requestCache = (
    /** @type {const} */
    [
      "default",
      "no-store",
      "reload",
      "no-cache",
      "force-cache",
      "only-if-cached"
    ]
  );
  const requestBodyHeader = (
    /** @type {const} */
    [
      "content-encoding",
      "content-language",
      "content-location",
      "content-type",
      // See https://github.com/nodejs/undici/issues/2021
      // 'Content-Length' is a forbidden header name, which is typically
      // removed in the Headers implementation. However, undici doesn't
      // filter out headers, so we add it here.
      "content-length"
    ]
  );
  const requestDuplex = (
    /** @type {const} */
    [
      "half"
    ]
  );
  const forbiddenMethods = (
    /** @type {const} */
    ["CONNECT", "TRACE", "TRACK"]
  );
  const forbiddenMethodsSet = new Set(forbiddenMethods);
  const subresource = (
    /** @type {const} */
    [
      "audio",
      "audioworklet",
      "font",
      "image",
      "manifest",
      "paintworklet",
      "script",
      "style",
      "track",
      "video",
      "xslt",
      ""
    ]
  );
  const subresourceSet = new Set(subresource);
  constants$2 = {
    subresource,
    forbiddenMethods,
    requestBodyHeader,
    referrerPolicy,
    requestRedirect,
    requestMode,
    requestCredentials,
    requestCache,
    redirectStatus,
    corsSafeListedMethods,
    nullBodyStatus,
    safeMethods,
    badPorts,
    requestDuplex,
    subresourceSet,
    badPortsSet,
    redirectStatusSet,
    corsSafeListedMethodsSet,
    safeMethodsSet,
    forbiddenMethodsSet,
    referrerPolicyTokens: referrerPolicyTokensSet
  };
  return constants$2;
}
var global$1;
var hasRequiredGlobal$1;
function requireGlobal$1() {
  if (hasRequiredGlobal$1) return global$1;
  hasRequiredGlobal$1 = 1;
  const globalOrigin = Symbol.for("undici.globalOrigin.1");
  function getGlobalOrigin() {
    return globalThis[globalOrigin];
  }
  function setGlobalOrigin(newOrigin) {
    if (newOrigin === void 0) {
      Object.defineProperty(globalThis, globalOrigin, {
        value: void 0,
        writable: true,
        enumerable: false,
        configurable: false
      });
      return;
    }
    const parsedURL = new URL(newOrigin);
    if (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") {
      throw new TypeError(`Only http & https urls are allowed, received ${parsedURL.protocol}`);
    }
    Object.defineProperty(globalThis, globalOrigin, {
      value: parsedURL,
      writable: true,
      enumerable: false,
      configurable: false
    });
  }
  global$1 = {
    getGlobalOrigin,
    setGlobalOrigin
  };
  return global$1;
}
var encoding;
var hasRequiredEncoding;
function requireEncoding() {
  if (hasRequiredEncoding) return encoding;
  hasRequiredEncoding = 1;
  const textDecoder = new TextDecoder();
  function utf8DecodeBytes(buffer) {
    if (buffer.length === 0) {
      return "";
    }
    if (buffer[0] === 239 && buffer[1] === 187 && buffer[2] === 191) {
      buffer = buffer.subarray(3);
    }
    const output = textDecoder.decode(buffer);
    return output;
  }
  encoding = {
    utf8DecodeBytes
  };
  return encoding;
}
var infra;
var hasRequiredInfra;
function requireInfra() {
  if (hasRequiredInfra) return infra;
  hasRequiredInfra = 1;
  const assert = require$$0$1;
  const { utf8DecodeBytes } = /* @__PURE__ */ requireEncoding();
  function collectASequenceOfCodePoints(condition, input, position) {
    let result = "";
    while (position.position < input.length && condition(input[position.position])) {
      result += input[position.position];
      position.position++;
    }
    return result;
  }
  function collectASequenceOfCodePointsFast(char, input, position) {
    const idx = input.indexOf(char, position.position);
    const start = position.position;
    if (idx === -1) {
      position.position = input.length;
      return input.slice(start);
    }
    position.position = idx;
    return input.slice(start, position.position);
  }
  const ASCII_WHITESPACE_REPLACE_REGEX = /[\u0009\u000A\u000C\u000D\u0020]/g;
  function forgivingBase64(data) {
    data = data.replace(ASCII_WHITESPACE_REPLACE_REGEX, "");
    let dataLength = data.length;
    if (dataLength % 4 === 0) {
      if (data.charCodeAt(dataLength - 1) === 61) {
        --dataLength;
        if (data.charCodeAt(dataLength - 1) === 61) {
          --dataLength;
        }
      }
    }
    if (dataLength % 4 === 1) {
      return "failure";
    }
    if (/[^+/0-9A-Za-z]/.test(data.length === dataLength ? data : data.substring(0, dataLength))) {
      return "failure";
    }
    const buffer = Buffer.from(data, "base64");
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }
  function isASCIIWhitespace(char) {
    return char === 9 || // \t
    char === 10 || // \n
    char === 12 || // \f
    char === 13 || // \r
    char === 32;
  }
  function isomorphicDecode(input) {
    const length = input.length;
    if ((2 << 15) - 1 > length) {
      return String.fromCharCode.apply(null, input);
    }
    let result = "";
    let i = 0;
    let addition = (2 << 15) - 1;
    while (i < length) {
      if (i + addition > length) {
        addition = length - i;
      }
      result += String.fromCharCode.apply(null, input.subarray(i, i += addition));
    }
    return result;
  }
  const invalidIsomorphicEncodeValueRegex = /[^\x00-\xFF]/;
  function isomorphicEncode(input) {
    assert(!invalidIsomorphicEncodeValueRegex.test(input));
    return input;
  }
  function parseJSONFromBytes(bytes) {
    return JSON.parse(utf8DecodeBytes(bytes));
  }
  function removeASCIIWhitespace(str, leading = true, trailing = true) {
    return removeChars(str, leading, trailing, isASCIIWhitespace);
  }
  function removeChars(str, leading, trailing, predicate) {
    let lead = 0;
    let trail = str.length - 1;
    if (leading) {
      while (lead < str.length && predicate(str.charCodeAt(lead))) lead++;
    }
    if (trailing) {
      while (trail > 0 && predicate(str.charCodeAt(trail))) trail--;
    }
    return lead === 0 && trail === str.length - 1 ? str : str.slice(lead, trail + 1);
  }
  function serializeJavascriptValueToJSONString(value) {
    const result = JSON.stringify(value);
    if (result === void 0) {
      throw new TypeError("Value is not JSON serializable");
    }
    assert(typeof result === "string");
    return result;
  }
  infra = {
    collectASequenceOfCodePoints,
    collectASequenceOfCodePointsFast,
    forgivingBase64,
    isASCIIWhitespace,
    isomorphicDecode,
    isomorphicEncode,
    parseJSONFromBytes,
    removeASCIIWhitespace,
    removeChars,
    serializeJavascriptValueToJSONString
  };
  return infra;
}
var dataUrl;
var hasRequiredDataUrl;
function requireDataUrl() {
  if (hasRequiredDataUrl) return dataUrl;
  hasRequiredDataUrl = 1;
  const assert = require$$0$1;
  const { forgivingBase64, collectASequenceOfCodePoints, collectASequenceOfCodePointsFast, isomorphicDecode, removeASCIIWhitespace, removeChars } = /* @__PURE__ */ requireInfra();
  const encoder = new TextEncoder();
  const HTTP_TOKEN_CODEPOINTS = /^[-!#$%&'*+.^_|~A-Za-z0-9]+$/u;
  const HTTP_WHITESPACE_REGEX = /[\u000A\u000D\u0009\u0020]/u;
  const HTTP_QUOTED_STRING_TOKENS = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/u;
  function dataURLProcessor(dataURL) {
    assert(dataURL.protocol === "data:");
    let input = URLSerializer(dataURL, true);
    input = input.slice(5);
    const position = { position: 0 };
    let mimeType = collectASequenceOfCodePointsFast(
      ",",
      input,
      position
    );
    const mimeTypeLength = mimeType.length;
    mimeType = removeASCIIWhitespace(mimeType, true, true);
    if (position.position >= input.length) {
      return "failure";
    }
    position.position++;
    const encodedBody = input.slice(mimeTypeLength + 1);
    let body2 = stringPercentDecode(encodedBody);
    if (/;(?:\u0020*)base64$/ui.test(mimeType)) {
      const stringBody = isomorphicDecode(body2);
      body2 = forgivingBase64(stringBody);
      if (body2 === "failure") {
        return "failure";
      }
      mimeType = mimeType.slice(0, -6);
      mimeType = mimeType.replace(/(\u0020+)$/u, "");
      mimeType = mimeType.slice(0, -1);
    }
    if (mimeType.startsWith(";")) {
      mimeType = "text/plain" + mimeType;
    }
    let mimeTypeRecord = parseMIMEType(mimeType);
    if (mimeTypeRecord === "failure") {
      mimeTypeRecord = parseMIMEType("text/plain;charset=US-ASCII");
    }
    return { mimeType: mimeTypeRecord, body: body2 };
  }
  function URLSerializer(url, excludeFragment = false) {
    if (!excludeFragment) {
      return url.href;
    }
    const href = url.href;
    const hashLength = url.hash.length;
    const serialized = hashLength === 0 ? href : href.substring(0, href.length - hashLength);
    if (!hashLength && href.endsWith("#")) {
      return serialized.slice(0, -1);
    }
    return serialized;
  }
  function stringPercentDecode(input) {
    const bytes = encoder.encode(input);
    return percentDecode(bytes);
  }
  function isHexCharByte(byte) {
    return byte >= 48 && byte <= 57 || byte >= 65 && byte <= 70 || byte >= 97 && byte <= 102;
  }
  function hexByteToNumber(byte) {
    return (
      // 0-9
      byte >= 48 && byte <= 57 ? byte - 48 : (byte & 223) - 55
    );
  }
  function percentDecode(input) {
    const length = input.length;
    const output = new Uint8Array(length);
    let j = 0;
    let i = 0;
    while (i < length) {
      const byte = input[i];
      if (byte !== 37) {
        output[j++] = byte;
      } else if (byte === 37 && !(isHexCharByte(input[i + 1]) && isHexCharByte(input[i + 2]))) {
        output[j++] = 37;
      } else {
        output[j++] = hexByteToNumber(input[i + 1]) << 4 | hexByteToNumber(input[i + 2]);
        i += 2;
      }
      ++i;
    }
    return length === j ? output : output.subarray(0, j);
  }
  function parseMIMEType(input) {
    input = removeHTTPWhitespace(input, true, true);
    const position = { position: 0 };
    const type = collectASequenceOfCodePointsFast(
      "/",
      input,
      position
    );
    if (type.length === 0 || !HTTP_TOKEN_CODEPOINTS.test(type)) {
      return "failure";
    }
    if (position.position >= input.length) {
      return "failure";
    }
    position.position++;
    let subtype = collectASequenceOfCodePointsFast(
      ";",
      input,
      position
    );
    subtype = removeHTTPWhitespace(subtype, false, true);
    if (subtype.length === 0 || !HTTP_TOKEN_CODEPOINTS.test(subtype)) {
      return "failure";
    }
    const typeLowercase = type.toLowerCase();
    const subtypeLowercase = subtype.toLowerCase();
    const mimeType = {
      type: typeLowercase,
      subtype: subtypeLowercase,
      /** @type {Map<string, string>} */
      parameters: /* @__PURE__ */ new Map(),
      // https://mimesniff.spec.whatwg.org/#mime-type-essence
      essence: `${typeLowercase}/${subtypeLowercase}`
    };
    while (position.position < input.length) {
      position.position++;
      collectASequenceOfCodePoints(
        // https://fetch.spec.whatwg.org/#http-whitespace
        (char) => HTTP_WHITESPACE_REGEX.test(char),
        input,
        position
      );
      let parameterName = collectASequenceOfCodePoints(
        (char) => char !== ";" && char !== "=",
        input,
        position
      );
      parameterName = parameterName.toLowerCase();
      if (position.position < input.length) {
        if (input[position.position] === ";") {
          continue;
        }
        position.position++;
      }
      if (position.position >= input.length) {
        break;
      }
      let parameterValue = null;
      if (input[position.position] === '"') {
        parameterValue = collectAnHTTPQuotedString(input, position, true);
        collectASequenceOfCodePointsFast(
          ";",
          input,
          position
        );
      } else {
        parameterValue = collectASequenceOfCodePointsFast(
          ";",
          input,
          position
        );
        parameterValue = removeHTTPWhitespace(parameterValue, false, true);
        if (parameterValue.length === 0) {
          continue;
        }
      }
      if (parameterName.length !== 0 && HTTP_TOKEN_CODEPOINTS.test(parameterName) && (parameterValue.length === 0 || HTTP_QUOTED_STRING_TOKENS.test(parameterValue)) && !mimeType.parameters.has(parameterName)) {
        mimeType.parameters.set(parameterName, parameterValue);
      }
    }
    return mimeType;
  }
  function collectAnHTTPQuotedString(input, position, extractValue = false) {
    const positionStart = position.position;
    let value = "";
    assert(input[position.position] === '"');
    position.position++;
    while (true) {
      value += collectASequenceOfCodePoints(
        (char) => char !== '"' && char !== "\\",
        input,
        position
      );
      if (position.position >= input.length) {
        break;
      }
      const quoteOrBackslash = input[position.position];
      position.position++;
      if (quoteOrBackslash === "\\") {
        if (position.position >= input.length) {
          value += "\\";
          break;
        }
        value += input[position.position];
        position.position++;
      } else {
        assert(quoteOrBackslash === '"');
        break;
      }
    }
    if (extractValue) {
      return value;
    }
    return input.slice(positionStart, position.position);
  }
  function serializeAMimeType(mimeType) {
    assert(mimeType !== "failure");
    const { parameters, essence } = mimeType;
    let serialization = essence;
    for (let [name, value] of parameters.entries()) {
      serialization += ";";
      serialization += name;
      serialization += "=";
      if (!HTTP_TOKEN_CODEPOINTS.test(value)) {
        value = value.replace(/[\\"]/ug, "\\$&");
        value = '"' + value;
        value += '"';
      }
      serialization += value;
    }
    return serialization;
  }
  function isHTTPWhiteSpace(char) {
    return char === 13 || char === 10 || char === 9 || char === 32;
  }
  function removeHTTPWhitespace(str, leading = true, trailing = true) {
    return removeChars(str, leading, trailing, isHTTPWhiteSpace);
  }
  function minimizeSupportedMimeType(mimeType) {
    switch (mimeType.essence) {
      case "application/ecmascript":
      case "application/javascript":
      case "application/x-ecmascript":
      case "application/x-javascript":
      case "text/ecmascript":
      case "text/javascript":
      case "text/javascript1.0":
      case "text/javascript1.1":
      case "text/javascript1.2":
      case "text/javascript1.3":
      case "text/javascript1.4":
      case "text/javascript1.5":
      case "text/jscript":
      case "text/livescript":
      case "text/x-ecmascript":
      case "text/x-javascript":
        return "text/javascript";
      case "application/json":
      case "text/json":
        return "application/json";
      case "image/svg+xml":
        return "image/svg+xml";
      case "text/xml":
      case "application/xml":
        return "application/xml";
    }
    if (mimeType.subtype.endsWith("+json")) {
      return "application/json";
    }
    if (mimeType.subtype.endsWith("+xml")) {
      return "application/xml";
    }
    return "";
  }
  dataUrl = {
    dataURLProcessor,
    URLSerializer,
    stringPercentDecode,
    parseMIMEType,
    collectAnHTTPQuotedString,
    serializeAMimeType,
    removeHTTPWhitespace,
    minimizeSupportedMimeType,
    HTTP_TOKEN_CODEPOINTS
  };
  return dataUrl;
}
var runtimeFeatures = {};
var hasRequiredRuntimeFeatures;
function requireRuntimeFeatures() {
  if (hasRequiredRuntimeFeatures) return runtimeFeatures;
  hasRequiredRuntimeFeatures = 1;
  const lazyLoaders = {
    __proto__: null,
    "node:crypto": () => crypto,
    "node:sqlite": () => require$$1,
    "node:worker_threads": () => require$$2$1,
    "node:zlib": () => require$$3
  };
  function detectRuntimeFeatureByNodeModule(moduleName) {
    try {
      lazyLoaders[moduleName]();
      return true;
    } catch (err) {
      if (err.code !== "ERR_UNKNOWN_BUILTIN_MODULE" && err.code !== "ERR_NO_CRYPTO") {
        throw err;
      }
      return false;
    }
  }
  function detectRuntimeFeatureByExportedProperty(moduleName, property) {
    const module = lazyLoaders[moduleName]();
    return typeof module[property] !== "undefined";
  }
  const runtimeFeaturesByExportedProperty = (
    /** @type {const} */
    ["markAsUncloneable", "zstd"]
  );
  const exportedPropertyLookup = {
    markAsUncloneable: ["node:worker_threads", "markAsUncloneable"],
    zstd: ["node:zlib", "createZstdDecompress"]
  };
  const runtimeFeaturesAsNodeModule = (
    /** @type {const} */
    ["crypto", "sqlite"]
  );
  const features = (
    /** @type {const} */
    [
      ...runtimeFeaturesAsNodeModule,
      ...runtimeFeaturesByExportedProperty
    ]
  );
  function detectRuntimeFeature(feature) {
    if (runtimeFeaturesAsNodeModule.includes(
      /** @type {RuntimeFeatureByNodeModule} */
      feature
    )) {
      return detectRuntimeFeatureByNodeModule(`node:${feature}`);
    } else if (runtimeFeaturesByExportedProperty.includes(
      /** @type {RuntimeFeatureByExportedProperty} */
      feature
    )) {
      const [moduleName, property] = exportedPropertyLookup[feature];
      return detectRuntimeFeatureByExportedProperty(moduleName, property);
    }
    throw new TypeError(`unknown feature: ${feature}`);
  }
  class RuntimeFeatures {
    /** @type {Map<Feature, boolean>} */
    #map = /* @__PURE__ */ new Map();
    /**
     * Clears all cached feature detections.
     */
    clear() {
      this.#map.clear();
    }
    /**
     * @param {Feature} feature
     * @returns {boolean}
     */
    has(feature) {
      return this.#map.get(feature) ?? this.#detectRuntimeFeature(feature);
    }
    /**
     * @param {Feature} feature
     * @param {boolean} value
     */
    set(feature, value) {
      if (features.includes(feature) === false) {
        throw new TypeError(`unknown feature: ${feature}`);
      }
      this.#map.set(feature, value);
    }
    /**
     * @param {Feature} feature
     * @returns {boolean}
     */
    #detectRuntimeFeature(feature) {
      const result = detectRuntimeFeature(feature);
      this.#map.set(feature, result);
      return result;
    }
  }
  const instance = new RuntimeFeatures();
  runtimeFeatures.runtimeFeatures = instance;
  runtimeFeatures.default = instance;
  return runtimeFeatures;
}
var webidl_1;
var hasRequiredWebidl;
function requireWebidl() {
  if (hasRequiredWebidl) return webidl_1;
  hasRequiredWebidl = 1;
  const { types, inspect } = require$$0$3;
  const { runtimeFeatures: runtimeFeatures2 } = /* @__PURE__ */ requireRuntimeFeatures();
  const UNDEFINED = 1;
  const BOOLEAN = 2;
  const STRING = 3;
  const SYMBOL = 4;
  const NUMBER = 5;
  const BIGINT = 6;
  const NULL = 7;
  const OBJECT = 8;
  const FunctionPrototypeSymbolHasInstance = Function.call.bind(Function.prototype[Symbol.hasInstance]);
  const webidl = {
    converters: {},
    util: {},
    errors: {},
    is: {}
  };
  webidl.errors.exception = function(message) {
    return new TypeError(`${message.header}: ${message.message}`);
  };
  webidl.errors.conversionFailed = function(opts) {
    const plural = opts.types.length === 1 ? "" : " one of";
    const message = `${opts.argument} could not be converted to${plural}: ${opts.types.join(", ")}.`;
    return webidl.errors.exception({
      header: opts.prefix,
      message
    });
  };
  webidl.errors.invalidArgument = function(context) {
    return webidl.errors.exception({
      header: context.prefix,
      message: `"${context.value}" is an invalid ${context.type}.`
    });
  };
  webidl.brandCheck = function(V, I) {
    if (!FunctionPrototypeSymbolHasInstance(I, V)) {
      const err = new TypeError("Illegal invocation");
      err.code = "ERR_INVALID_THIS";
      throw err;
    }
  };
  webidl.brandCheckMultiple = function(List) {
    const prototypes = List.map((c) => webidl.util.MakeTypeAssertion(c));
    return (V) => {
      if (prototypes.every((typeCheck) => !typeCheck(V))) {
        const err = new TypeError("Illegal invocation");
        err.code = "ERR_INVALID_THIS";
        throw err;
      }
    };
  };
  webidl.argumentLengthCheck = function({ length }, min, ctx) {
    if (length < min) {
      throw webidl.errors.exception({
        message: `${min} argument${min !== 1 ? "s" : ""} required, but${length ? " only" : ""} ${length} found.`,
        header: ctx
      });
    }
  };
  webidl.illegalConstructor = function() {
    throw webidl.errors.exception({
      header: "TypeError",
      message: "Illegal constructor"
    });
  };
  webidl.util.MakeTypeAssertion = function(I) {
    return (O) => FunctionPrototypeSymbolHasInstance(I, O);
  };
  webidl.util.Type = function(V) {
    switch (typeof V) {
      case "undefined":
        return UNDEFINED;
      case "boolean":
        return BOOLEAN;
      case "string":
        return STRING;
      case "symbol":
        return SYMBOL;
      case "number":
        return NUMBER;
      case "bigint":
        return BIGINT;
      case "function":
      case "object": {
        if (V === null) {
          return NULL;
        }
        return OBJECT;
      }
    }
  };
  webidl.util.Types = {
    UNDEFINED,
    BOOLEAN,
    STRING,
    SYMBOL,
    NUMBER,
    BIGINT,
    NULL,
    OBJECT
  };
  webidl.util.TypeValueToString = function(o) {
    switch (webidl.util.Type(o)) {
      case UNDEFINED:
        return "Undefined";
      case BOOLEAN:
        return "Boolean";
      case STRING:
        return "String";
      case SYMBOL:
        return "Symbol";
      case NUMBER:
        return "Number";
      case BIGINT:
        return "BigInt";
      case NULL:
        return "Null";
      case OBJECT:
        return "Object";
    }
  };
  webidl.util.markAsUncloneable = runtimeFeatures2.has("markAsUncloneable") ? require$$2$1.markAsUncloneable : () => {
  };
  webidl.util.ConvertToInt = function(V, bitLength, signedness, flags) {
    let upperBound;
    let lowerBound;
    if (bitLength === 64) {
      upperBound = Math.pow(2, 53) - 1;
      if (signedness === "unsigned") {
        lowerBound = 0;
      } else {
        lowerBound = Math.pow(-2, 53) + 1;
      }
    } else if (signedness === "unsigned") {
      lowerBound = 0;
      upperBound = Math.pow(2, bitLength) - 1;
    } else {
      lowerBound = Math.pow(-2, bitLength) - 1;
      upperBound = Math.pow(2, bitLength - 1) - 1;
    }
    let x = Number(V);
    if (x === 0) {
      x = 0;
    }
    if (webidl.util.HasFlag(flags, webidl.attributes.EnforceRange)) {
      if (Number.isNaN(x) || x === Number.POSITIVE_INFINITY || x === Number.NEGATIVE_INFINITY) {
        throw webidl.errors.exception({
          header: "Integer conversion",
          message: `Could not convert ${webidl.util.Stringify(V)} to an integer.`
        });
      }
      x = webidl.util.IntegerPart(x);
      if (x < lowerBound || x > upperBound) {
        throw webidl.errors.exception({
          header: "Integer conversion",
          message: `Value must be between ${lowerBound}-${upperBound}, got ${x}.`
        });
      }
      return x;
    }
    if (!Number.isNaN(x) && webidl.util.HasFlag(flags, webidl.attributes.Clamp)) {
      x = Math.min(Math.max(x, lowerBound), upperBound);
      if (Math.floor(x) % 2 === 0) {
        x = Math.floor(x);
      } else {
        x = Math.ceil(x);
      }
      return x;
    }
    if (Number.isNaN(x) || x === 0 && Object.is(0, x) || x === Number.POSITIVE_INFINITY || x === Number.NEGATIVE_INFINITY) {
      return 0;
    }
    x = webidl.util.IntegerPart(x);
    x = x % Math.pow(2, bitLength);
    if (signedness === "signed" && x >= Math.pow(2, bitLength) - 1) {
      return x - Math.pow(2, bitLength);
    }
    return x;
  };
  webidl.util.IntegerPart = function(n) {
    const r = Math.floor(Math.abs(n));
    if (n < 0) {
      return -1 * r;
    }
    return r;
  };
  webidl.util.Stringify = function(V) {
    const type = webidl.util.Type(V);
    switch (type) {
      case SYMBOL:
        return `Symbol(${V.description})`;
      case OBJECT:
        return inspect(V);
      case STRING:
        return `"${V}"`;
      case BIGINT:
        return `${V}n`;
      default:
        return `${V}`;
    }
  };
  webidl.util.IsResizableArrayBuffer = function(V) {
    if (types.isArrayBuffer(V)) {
      return V.resizable;
    }
    if (types.isSharedArrayBuffer(V)) {
      return V.growable;
    }
    throw webidl.errors.exception({
      header: "IsResizableArrayBuffer",
      message: `"${webidl.util.Stringify(V)}" is not an array buffer.`
    });
  };
  webidl.util.HasFlag = function(flags, attributes) {
    return typeof flags === "number" && (flags & attributes) === attributes;
  };
  webidl.sequenceConverter = function(converter) {
    return (V, prefix, argument, Iterable) => {
      if (webidl.util.Type(V) !== OBJECT) {
        throw webidl.errors.exception({
          header: prefix,
          message: `${argument} (${webidl.util.Stringify(V)}) is not iterable.`
        });
      }
      const method = typeof Iterable === "function" ? Iterable() : V?.[Symbol.iterator]?.();
      const seq = [];
      let index2 = 0;
      if (method === void 0 || typeof method.next !== "function") {
        throw webidl.errors.exception({
          header: prefix,
          message: `${argument} is not iterable.`
        });
      }
      while (true) {
        const { done, value } = method.next();
        if (done) {
          break;
        }
        seq.push(converter(value, prefix, `${argument}[${index2++}]`));
      }
      return seq;
    };
  };
  webidl.recordConverter = function(keyConverter, valueConverter) {
    return (O, prefix, argument) => {
      if (webidl.util.Type(O) !== OBJECT) {
        throw webidl.errors.exception({
          header: prefix,
          message: `${argument} ("${webidl.util.TypeValueToString(O)}") is not an Object.`
        });
      }
      const result = {};
      if (!types.isProxy(O)) {
        const keys2 = [...Object.getOwnPropertyNames(O), ...Object.getOwnPropertySymbols(O)];
        for (const key of keys2) {
          const keyName = webidl.util.Stringify(key);
          const typedKey = keyConverter(key, prefix, `Key ${keyName} in ${argument}`);
          const typedValue = valueConverter(O[key], prefix, `${argument}[${keyName}]`);
          result[typedKey] = typedValue;
        }
        return result;
      }
      const keys = Reflect.ownKeys(O);
      for (const key of keys) {
        const desc = Reflect.getOwnPropertyDescriptor(O, key);
        if (desc?.enumerable) {
          const typedKey = keyConverter(key, prefix, argument);
          const typedValue = valueConverter(O[key], prefix, argument);
          result[typedKey] = typedValue;
        }
      }
      return result;
    };
  };
  webidl.interfaceConverter = function(TypeCheck, name) {
    return (V, prefix, argument) => {
      if (!TypeCheck(V)) {
        throw webidl.errors.exception({
          header: prefix,
          message: `Expected ${argument} ("${webidl.util.Stringify(V)}") to be an instance of ${name}.`
        });
      }
      return V;
    };
  };
  webidl.dictionaryConverter = function(converters) {
    return (dictionary, prefix, argument) => {
      const dict = {};
      if (dictionary != null && webidl.util.Type(dictionary) !== OBJECT) {
        throw webidl.errors.exception({
          header: prefix,
          message: `Expected ${dictionary} to be one of: Null, Undefined, Object.`
        });
      }
      for (const options of converters) {
        const { key, defaultValue, required, converter } = options;
        if (required === true) {
          if (dictionary == null || !Object.hasOwn(dictionary, key)) {
            throw webidl.errors.exception({
              header: prefix,
              message: `Missing required key "${key}".`
            });
          }
        }
        let value = dictionary?.[key];
        const hasDefault = defaultValue !== void 0;
        if (hasDefault && value === void 0) {
          value = defaultValue();
        }
        if (required || hasDefault || value !== void 0) {
          value = converter(value, prefix, `${argument}.${key}`);
          if (options.allowedValues && !options.allowedValues.includes(value)) {
            throw webidl.errors.exception({
              header: prefix,
              message: `${value} is not an accepted type. Expected one of ${options.allowedValues.join(", ")}.`
            });
          }
          dict[key] = value;
        }
      }
      return dict;
    };
  };
  webidl.nullableConverter = function(converter) {
    return (V, prefix, argument) => {
      if (V === null) {
        return V;
      }
      return converter(V, prefix, argument);
    };
  };
  webidl.is.USVString = function(value) {
    return typeof value === "string" && value.isWellFormed();
  };
  webidl.is.ReadableStream = webidl.util.MakeTypeAssertion(ReadableStream);
  webidl.is.Blob = webidl.util.MakeTypeAssertion(Blob);
  webidl.is.URLSearchParams = webidl.util.MakeTypeAssertion(URLSearchParams);
  webidl.is.File = webidl.util.MakeTypeAssertion(File);
  webidl.is.URL = webidl.util.MakeTypeAssertion(URL);
  webidl.is.AbortSignal = webidl.util.MakeTypeAssertion(AbortSignal);
  webidl.is.MessagePort = webidl.util.MakeTypeAssertion(MessagePort);
  webidl.is.BufferSource = function(V) {
    return types.isArrayBuffer(V) || ArrayBuffer.isView(V) && types.isArrayBuffer(V.buffer);
  };
  webidl.converters.DOMString = function(V, prefix, argument, flags) {
    if (V === null && webidl.util.HasFlag(flags, webidl.attributes.LegacyNullToEmptyString)) {
      return "";
    }
    if (typeof V === "symbol") {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} is a symbol, which cannot be converted to a DOMString.`
      });
    }
    return String(V);
  };
  webidl.converters.ByteString = function(V, prefix, argument) {
    if (typeof V === "symbol") {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} is a symbol, which cannot be converted to a ByteString.`
      });
    }
    const x = String(V);
    for (let index2 = 0; index2 < x.length; index2++) {
      if (x.charCodeAt(index2) > 255) {
        throw new TypeError(
          `Cannot convert argument to a ByteString because the character at index ${index2} has a value of ${x.charCodeAt(index2)} which is greater than 255.`
        );
      }
    }
    return x;
  };
  webidl.converters.USVString = function(value) {
    if (typeof value === "string") {
      return value.toWellFormed();
    }
    return `${value}`.toWellFormed();
  };
  webidl.converters.boolean = function(V) {
    const x = Boolean(V);
    return x;
  };
  webidl.converters.any = function(V) {
    return V;
  };
  webidl.converters["long long"] = function(V, prefix, argument) {
    const x = webidl.util.ConvertToInt(V, 64, "signed", 0, prefix, argument);
    return x;
  };
  webidl.converters["unsigned long long"] = function(V, prefix, argument) {
    const x = webidl.util.ConvertToInt(V, 64, "unsigned", 0, prefix, argument);
    return x;
  };
  webidl.converters["unsigned long"] = function(V, prefix, argument) {
    const x = webidl.util.ConvertToInt(V, 32, "unsigned", 0, prefix, argument);
    return x;
  };
  webidl.converters["unsigned short"] = function(V, prefix, argument, flags) {
    const x = webidl.util.ConvertToInt(V, 16, "unsigned", flags, prefix, argument);
    return x;
  };
  webidl.converters.ArrayBuffer = function(V, prefix, argument, flags) {
    if (webidl.util.Type(V) !== OBJECT || !types.isArrayBuffer(V)) {
      throw webidl.errors.conversionFailed({
        prefix,
        argument: `${argument} ("${webidl.util.Stringify(V)}")`,
        types: ["ArrayBuffer"]
      });
    }
    if (!webidl.util.HasFlag(flags, webidl.attributes.AllowResizable) && webidl.util.IsResizableArrayBuffer(V)) {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} cannot be a resizable ArrayBuffer.`
      });
    }
    return V;
  };
  webidl.converters.SharedArrayBuffer = function(V, prefix, argument, flags) {
    if (webidl.util.Type(V) !== OBJECT || !types.isSharedArrayBuffer(V)) {
      throw webidl.errors.conversionFailed({
        prefix,
        argument: `${argument} ("${webidl.util.Stringify(V)}")`,
        types: ["SharedArrayBuffer"]
      });
    }
    if (!webidl.util.HasFlag(flags, webidl.attributes.AllowResizable) && webidl.util.IsResizableArrayBuffer(V)) {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} cannot be a resizable SharedArrayBuffer.`
      });
    }
    return V;
  };
  webidl.converters.TypedArray = function(V, T, prefix, argument, flags) {
    if (webidl.util.Type(V) !== OBJECT || !types.isTypedArray(V) || V.constructor.name !== T.name) {
      throw webidl.errors.conversionFailed({
        prefix,
        argument: `${argument} ("${webidl.util.Stringify(V)}")`,
        types: [T.name]
      });
    }
    if (!webidl.util.HasFlag(flags, webidl.attributes.AllowShared) && types.isSharedArrayBuffer(V.buffer)) {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} cannot be a view on a shared array buffer.`
      });
    }
    if (!webidl.util.HasFlag(flags, webidl.attributes.AllowResizable) && webidl.util.IsResizableArrayBuffer(V.buffer)) {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} cannot be a view on a resizable array buffer.`
      });
    }
    return V;
  };
  webidl.converters.DataView = function(V, prefix, argument, flags) {
    if (webidl.util.Type(V) !== OBJECT || !types.isDataView(V)) {
      throw webidl.errors.conversionFailed({
        prefix,
        argument: `${argument} ("${webidl.util.Stringify(V)}")`,
        types: ["DataView"]
      });
    }
    if (!webidl.util.HasFlag(flags, webidl.attributes.AllowShared) && types.isSharedArrayBuffer(V.buffer)) {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} cannot be a view on a shared array buffer.`
      });
    }
    if (!webidl.util.HasFlag(flags, webidl.attributes.AllowResizable) && webidl.util.IsResizableArrayBuffer(V.buffer)) {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} cannot be a view on a resizable array buffer.`
      });
    }
    return V;
  };
  webidl.converters.ArrayBufferView = function(V, prefix, argument, flags) {
    if (webidl.util.Type(V) !== OBJECT || !types.isArrayBufferView(V)) {
      throw webidl.errors.conversionFailed({
        prefix,
        argument: `${argument} ("${webidl.util.Stringify(V)}")`,
        types: ["ArrayBufferView"]
      });
    }
    if (!webidl.util.HasFlag(flags, webidl.attributes.AllowShared) && types.isSharedArrayBuffer(V.buffer)) {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} cannot be a view on a shared array buffer.`
      });
    }
    if (!webidl.util.HasFlag(flags, webidl.attributes.AllowResizable) && webidl.util.IsResizableArrayBuffer(V.buffer)) {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} cannot be a view on a resizable array buffer.`
      });
    }
    return V;
  };
  webidl.converters.BufferSource = function(V, prefix, argument, flags) {
    if (types.isArrayBuffer(V)) {
      return webidl.converters.ArrayBuffer(V, prefix, argument, flags);
    }
    if (types.isArrayBufferView(V)) {
      flags &= ~webidl.attributes.AllowShared;
      return webidl.converters.ArrayBufferView(V, prefix, argument, flags);
    }
    if (types.isSharedArrayBuffer(V)) {
      throw webidl.errors.exception({
        header: prefix,
        message: `${argument} cannot be a SharedArrayBuffer.`
      });
    }
    throw webidl.errors.conversionFailed({
      prefix,
      argument: `${argument} ("${webidl.util.Stringify(V)}")`,
      types: ["ArrayBuffer", "ArrayBufferView"]
    });
  };
  webidl.converters.AllowSharedBufferSource = function(V, prefix, argument, flags) {
    if (types.isArrayBuffer(V)) {
      return webidl.converters.ArrayBuffer(V, prefix, argument, flags);
    }
    if (types.isSharedArrayBuffer(V)) {
      return webidl.converters.SharedArrayBuffer(V, prefix, argument, flags);
    }
    if (types.isArrayBufferView(V)) {
      flags |= webidl.attributes.AllowShared;
      return webidl.converters.ArrayBufferView(V, prefix, argument, flags);
    }
    throw webidl.errors.conversionFailed({
      prefix,
      argument: `${argument} ("${webidl.util.Stringify(V)}")`,
      types: ["ArrayBuffer", "SharedArrayBuffer", "ArrayBufferView"]
    });
  };
  webidl.converters["sequence<ByteString>"] = webidl.sequenceConverter(
    webidl.converters.ByteString
  );
  webidl.converters["sequence<sequence<ByteString>>"] = webidl.sequenceConverter(
    webidl.converters["sequence<ByteString>"]
  );
  webidl.converters["record<ByteString, ByteString>"] = webidl.recordConverter(
    webidl.converters.ByteString,
    webidl.converters.ByteString
  );
  webidl.converters.Blob = webidl.interfaceConverter(webidl.is.Blob, "Blob");
  webidl.converters.AbortSignal = webidl.interfaceConverter(
    webidl.is.AbortSignal,
    "AbortSignal"
  );
  webidl.converters.EventHandlerNonNull = function(V) {
    if (webidl.util.Type(V) !== OBJECT) {
      return null;
    }
    if (typeof V === "function") {
      return V;
    }
    return () => {
    };
  };
  webidl.attributes = {
    Clamp: 1 << 0,
    EnforceRange: 1 << 1,
    AllowShared: 1 << 2,
    AllowResizable: 1 << 3,
    LegacyNullToEmptyString: 1 << 4
  };
  webidl_1 = {
    webidl
  };
  return webidl_1;
}
var util$4;
var hasRequiredUtil$4;
function requireUtil$4() {
  if (hasRequiredUtil$4) return util$4;
  hasRequiredUtil$4 = 1;
  const { Transform } = require$$0;
  const zlib = require$$3;
  const { redirectStatusSet, referrerPolicyTokens, badPortsSet } = /* @__PURE__ */ requireConstants$2();
  const { getGlobalOrigin } = /* @__PURE__ */ requireGlobal$1();
  const { collectAnHTTPQuotedString, parseMIMEType } = /* @__PURE__ */ requireDataUrl();
  const { performance: performance2 } = require$$5$1;
  const { ReadableStreamFrom, isValidHTTPToken, normalizedMethodRecordsBase } = /* @__PURE__ */ requireUtil$5();
  const assert = require$$0$1;
  const { isUint8Array } = require$$8;
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { isomorphicEncode, collectASequenceOfCodePoints, removeChars } = /* @__PURE__ */ requireInfra();
  function responseURL(response2) {
    const urlList = response2.urlList;
    const length = urlList.length;
    return length === 0 ? null : urlList[length - 1].toString();
  }
  function responseLocationURL(response2, requestFragment) {
    if (!redirectStatusSet.has(response2.status)) {
      return null;
    }
    let location = response2.headersList.get("location", true);
    if (location !== null && isValidHeaderValue(location)) {
      if (!isValidEncodedURL(location)) {
        location = normalizeBinaryStringToUtf8(location);
      }
      location = new URL(location, responseURL(response2));
    }
    if (location && !location.hash) {
      location.hash = requestFragment;
    }
    return location;
  }
  function isValidEncodedURL(url) {
    for (let i = 0; i < url.length; ++i) {
      const code = url.charCodeAt(i);
      if (code > 126 || // Non-US-ASCII + DEL
      code < 32) {
        return false;
      }
    }
    return true;
  }
  function normalizeBinaryStringToUtf8(value) {
    return Buffer.from(value, "binary").toString("utf8");
  }
  function requestCurrentURL(request2) {
    return request2.urlList[request2.urlList.length - 1];
  }
  function requestBadPort(request2) {
    const url = requestCurrentURL(request2);
    if (urlIsHttpHttpsScheme(url) && badPortsSet.has(url.port)) {
      return "blocked";
    }
    return "allowed";
  }
  function isErrorLike(object) {
    return object instanceof Error || (object?.constructor?.name === "Error" || object?.constructor?.name === "DOMException");
  }
  function isValidReasonPhrase(statusText) {
    for (let i = 0; i < statusText.length; ++i) {
      const c = statusText.charCodeAt(i);
      if (!(c === 9 || // HTAB
      c >= 32 && c <= 126 || // SP / VCHAR
      c >= 128 && c <= 255)) {
        return false;
      }
    }
    return true;
  }
  const isValidHeaderName = isValidHTTPToken;
  function isValidHeaderValue(potentialValue) {
    return (potentialValue[0] === "	" || potentialValue[0] === " " || potentialValue[potentialValue.length - 1] === "	" || potentialValue[potentialValue.length - 1] === " " || potentialValue.includes("\n") || potentialValue.includes("\r") || potentialValue.includes("\0")) === false;
  }
  function parseReferrerPolicy(actualResponse) {
    const policyHeader = (actualResponse.headersList.get("referrer-policy", true) ?? "").split(",");
    let policy = "";
    if (policyHeader.length) {
      for (let i = policyHeader.length; i !== 0; i--) {
        const token = policyHeader[i - 1].trim();
        if (referrerPolicyTokens.has(token)) {
          policy = token;
          break;
        }
      }
    }
    return policy;
  }
  function setRequestReferrerPolicyOnRedirect(request2, actualResponse) {
    const policy = parseReferrerPolicy(actualResponse);
    if (policy !== "") {
      request2.referrerPolicy = policy;
    }
  }
  function crossOriginResourcePolicyCheck() {
    return "allowed";
  }
  function corsCheck() {
    return "success";
  }
  function TAOCheck() {
    return "success";
  }
  function appendFetchMetadata(httpRequest) {
    let header = null;
    header = httpRequest.mode;
    httpRequest.headersList.set("sec-fetch-mode", header, true);
  }
  function appendRequestOriginHeader(request2) {
    let serializedOrigin = request2.origin;
    if (serializedOrigin === "client" || serializedOrigin === void 0) {
      return;
    }
    if (request2.responseTainting === "cors" || request2.mode === "websocket") {
      request2.headersList.append("origin", serializedOrigin, true);
    } else if (request2.method !== "GET" && request2.method !== "HEAD") {
      switch (request2.referrerPolicy) {
        case "no-referrer":
          serializedOrigin = null;
          break;
        case "no-referrer-when-downgrade":
        case "strict-origin":
        case "strict-origin-when-cross-origin":
          if (request2.origin && urlHasHttpsScheme(request2.origin) && !urlHasHttpsScheme(requestCurrentURL(request2))) {
            serializedOrigin = null;
          }
          break;
        case "same-origin":
          if (!sameOrigin(request2, requestCurrentURL(request2))) {
            serializedOrigin = null;
          }
          break;
      }
      request2.headersList.append("origin", serializedOrigin, true);
    }
  }
  function coarsenTime(timestamp, crossOriginIsolatedCapability) {
    return timestamp;
  }
  function clampAndCoarsenConnectionTimingInfo(connectionTimingInfo, defaultStartTime, crossOriginIsolatedCapability) {
    if (!connectionTimingInfo?.startTime || connectionTimingInfo.startTime < defaultStartTime) {
      return {
        domainLookupStartTime: defaultStartTime,
        domainLookupEndTime: defaultStartTime,
        connectionStartTime: defaultStartTime,
        connectionEndTime: defaultStartTime,
        secureConnectionStartTime: defaultStartTime,
        ALPNNegotiatedProtocol: connectionTimingInfo?.ALPNNegotiatedProtocol
      };
    }
    return {
      domainLookupStartTime: coarsenTime(connectionTimingInfo.domainLookupStartTime),
      domainLookupEndTime: coarsenTime(connectionTimingInfo.domainLookupEndTime),
      connectionStartTime: coarsenTime(connectionTimingInfo.connectionStartTime),
      connectionEndTime: coarsenTime(connectionTimingInfo.connectionEndTime),
      secureConnectionStartTime: coarsenTime(connectionTimingInfo.secureConnectionStartTime),
      ALPNNegotiatedProtocol: connectionTimingInfo.ALPNNegotiatedProtocol
    };
  }
  function coarsenedSharedCurrentTime(crossOriginIsolatedCapability) {
    return coarsenTime(performance2.now());
  }
  function createOpaqueTimingInfo(timingInfo) {
    return {
      startTime: timingInfo.startTime ?? 0,
      redirectStartTime: 0,
      redirectEndTime: 0,
      postRedirectStartTime: timingInfo.startTime ?? 0,
      finalServiceWorkerStartTime: 0,
      finalNetworkResponseStartTime: 0,
      finalNetworkRequestStartTime: 0,
      endTime: 0,
      encodedBodySize: 0,
      decodedBodySize: 0,
      finalConnectionTimingInfo: null
    };
  }
  function makePolicyContainer() {
    return {
      referrerPolicy: "strict-origin-when-cross-origin"
    };
  }
  function clonePolicyContainer(policyContainer) {
    return {
      referrerPolicy: policyContainer.referrerPolicy
    };
  }
  function determineRequestsReferrer(request2) {
    const policy = request2.referrerPolicy;
    assert(policy);
    let referrerSource = null;
    if (request2.referrer === "client") {
      const globalOrigin = getGlobalOrigin();
      if (!globalOrigin || globalOrigin.origin === "null") {
        return "no-referrer";
      }
      referrerSource = new URL(globalOrigin);
    } else if (webidl.is.URL(request2.referrer)) {
      referrerSource = request2.referrer;
    }
    let referrerURL = stripURLForReferrer(referrerSource);
    const referrerOrigin = stripURLForReferrer(referrerSource, true);
    if (referrerURL.toString().length > 4096) {
      referrerURL = referrerOrigin;
    }
    switch (policy) {
      case "no-referrer":
        return "no-referrer";
      case "origin":
        if (referrerOrigin != null) {
          return referrerOrigin;
        }
        return stripURLForReferrer(referrerSource, true);
      case "unsafe-url":
        return referrerURL;
      case "strict-origin": {
        const currentURL = requestCurrentURL(request2);
        if (isURLPotentiallyTrustworthy(referrerURL) && !isURLPotentiallyTrustworthy(currentURL)) {
          return "no-referrer";
        }
        return referrerOrigin;
      }
      case "strict-origin-when-cross-origin": {
        const currentURL = requestCurrentURL(request2);
        if (sameOrigin(referrerURL, currentURL)) {
          return referrerURL;
        }
        if (isURLPotentiallyTrustworthy(referrerURL) && !isURLPotentiallyTrustworthy(currentURL)) {
          return "no-referrer";
        }
        return referrerOrigin;
      }
      case "same-origin":
        if (sameOrigin(request2, referrerURL)) {
          return referrerURL;
        }
        return "no-referrer";
      case "origin-when-cross-origin":
        if (sameOrigin(request2, referrerURL)) {
          return referrerURL;
        }
        return referrerOrigin;
      case "no-referrer-when-downgrade": {
        const currentURL = requestCurrentURL(request2);
        if (isURLPotentiallyTrustworthy(referrerURL) && !isURLPotentiallyTrustworthy(currentURL)) {
          return "no-referrer";
        }
        return referrerURL;
      }
    }
  }
  function stripURLForReferrer(url, originOnly = false) {
    assert(webidl.is.URL(url));
    url = new URL(url);
    if (urlIsLocal(url)) {
      return "no-referrer";
    }
    url.username = "";
    url.password = "";
    url.hash = "";
    if (originOnly === true) {
      url.pathname = "";
      url.search = "";
    }
    return url;
  }
  const isPotentialleTrustworthyIPv4 = RegExp.prototype.test.bind(/^127\.(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)\.){2}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)$/);
  const isPotentiallyTrustworthyIPv6 = RegExp.prototype.test.bind(/^(?:(?:0{1,4}:){7}|(?:0{1,4}:){1,6}:|::)0{0,3}1$/);
  function isOriginIPPotentiallyTrustworthy(origin) {
    if (origin.includes(":")) {
      if (origin[0] === "[" && origin[origin.length - 1] === "]") {
        origin = origin.slice(1, -1);
      }
      return isPotentiallyTrustworthyIPv6(origin);
    }
    return isPotentialleTrustworthyIPv4(origin);
  }
  function isOriginPotentiallyTrustworthy(origin) {
    if (origin == null || origin === "null") {
      return false;
    }
    origin = new URL(origin);
    if (origin.protocol === "https:" || origin.protocol === "wss:") {
      return true;
    }
    if (isOriginIPPotentiallyTrustworthy(origin.hostname)) {
      return true;
    }
    if (origin.hostname === "localhost" || origin.hostname === "localhost.") {
      return true;
    }
    if (origin.hostname.endsWith(".localhost") || origin.hostname.endsWith(".localhost.")) {
      return true;
    }
    if (origin.protocol === "file:") {
      return true;
    }
    return false;
  }
  function isURLPotentiallyTrustworthy(url) {
    if (!webidl.is.URL(url)) {
      return false;
    }
    if (url.href === "about:blank" || url.href === "about:srcdoc") {
      return true;
    }
    if (url.protocol === "data:") return true;
    if (url.protocol === "blob:") return true;
    return isOriginPotentiallyTrustworthy(url.origin);
  }
  function tryUpgradeRequestToAPotentiallyTrustworthyURL(request2) {
  }
  function sameOrigin(A, B) {
    if (A.origin === B.origin && A.origin === "null") {
      return true;
    }
    if (A.protocol === B.protocol && A.hostname === B.hostname && A.port === B.port) {
      return true;
    }
    return false;
  }
  function isAborted(fetchParams) {
    return fetchParams.controller.state === "aborted";
  }
  function isCancelled(fetchParams) {
    return fetchParams.controller.state === "aborted" || fetchParams.controller.state === "terminated";
  }
  function normalizeMethod(method) {
    return normalizedMethodRecordsBase[method.toLowerCase()] ?? method;
  }
  const esIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));
  function createIterator(name, kInternalIterator, keyIndex = 0, valueIndex = 1) {
    class FastIterableIterator {
      /** @type {any} */
      #target;
      /** @type {'key' | 'value' | 'key+value'} */
      #kind;
      /** @type {number} */
      #index;
      /**
       * @see https://webidl.spec.whatwg.org/#dfn-default-iterator-object
       * @param {unknown} target
       * @param {'key' | 'value' | 'key+value'} kind
       */
      constructor(target, kind) {
        this.#target = target;
        this.#kind = kind;
        this.#index = 0;
      }
      next() {
        if (typeof this !== "object" || this === null || !(#target in this)) {
          throw new TypeError(
            `'next' called on an object that does not implement interface ${name} Iterator.`
          );
        }
        const index2 = this.#index;
        const values = kInternalIterator(this.#target);
        const len = values.length;
        if (index2 >= len) {
          return {
            value: void 0,
            done: true
          };
        }
        const { [keyIndex]: key, [valueIndex]: value } = values[index2];
        this.#index = index2 + 1;
        let result;
        switch (this.#kind) {
          case "key":
            result = key;
            break;
          case "value":
            result = value;
            break;
          case "key+value":
            result = [key, value];
            break;
        }
        return {
          value: result,
          done: false
        };
      }
    }
    delete FastIterableIterator.prototype.constructor;
    Object.setPrototypeOf(FastIterableIterator.prototype, esIteratorPrototype);
    Object.defineProperties(FastIterableIterator.prototype, {
      [Symbol.toStringTag]: {
        writable: false,
        enumerable: false,
        configurable: true,
        value: `${name} Iterator`
      },
      next: { writable: true, enumerable: true, configurable: true }
    });
    return function(target, kind) {
      return new FastIterableIterator(target, kind);
    };
  }
  function iteratorMixin(name, object, kInternalIterator, keyIndex = 0, valueIndex = 1) {
    const makeIterator = createIterator(name, kInternalIterator, keyIndex, valueIndex);
    const properties = {
      keys: {
        writable: true,
        enumerable: true,
        configurable: true,
        value: function keys() {
          webidl.brandCheck(this, object);
          return makeIterator(this, "key");
        }
      },
      values: {
        writable: true,
        enumerable: true,
        configurable: true,
        value: function values() {
          webidl.brandCheck(this, object);
          return makeIterator(this, "value");
        }
      },
      entries: {
        writable: true,
        enumerable: true,
        configurable: true,
        value: function entries() {
          webidl.brandCheck(this, object);
          return makeIterator(this, "key+value");
        }
      },
      forEach: {
        writable: true,
        enumerable: true,
        configurable: true,
        value: function forEach(callbackfn, thisArg = globalThis) {
          webidl.brandCheck(this, object);
          webidl.argumentLengthCheck(arguments, 1, `${name}.forEach`);
          if (typeof callbackfn !== "function") {
            throw new TypeError(
              `Failed to execute 'forEach' on '${name}': parameter 1 is not of type 'Function'.`
            );
          }
          for (const { 0: key, 1: value } of makeIterator(this, "key+value")) {
            callbackfn.call(thisArg, value, key, this);
          }
        }
      }
    };
    return Object.defineProperties(object.prototype, {
      ...properties,
      [Symbol.iterator]: {
        writable: true,
        enumerable: false,
        configurable: true,
        value: properties.entries.value
      }
    });
  }
  function fullyReadBody(body2, processBody, processBodyError) {
    const successSteps = processBody;
    const errorSteps = processBodyError;
    try {
      const reader = body2.stream.getReader();
      readAllBytes(reader, successSteps, errorSteps);
    } catch (e) {
      errorSteps(e);
    }
  }
  function readableStreamClose(controller) {
    try {
      controller.close();
      controller.byobRequest?.respond(0);
    } catch (err) {
      if (!err.message.includes("Controller is already closed") && !err.message.includes("ReadableStream is already closed")) {
        throw err;
      }
    }
  }
  async function readAllBytes(reader, successSteps, failureSteps) {
    try {
      const bytes = [];
      let byteLength = 0;
      do {
        const { done, value: chunk } = await reader.read();
        if (done) {
          successSteps(Buffer.concat(bytes, byteLength));
          return;
        }
        if (!isUint8Array(chunk)) {
          failureSteps(new TypeError("Received non-Uint8Array chunk"));
          return;
        }
        bytes.push(chunk);
        byteLength += chunk.length;
      } while (true);
    } catch (e) {
      failureSteps(e);
    }
  }
  function urlIsLocal(url) {
    assert("protocol" in url);
    const protocol = url.protocol;
    return protocol === "about:" || protocol === "blob:" || protocol === "data:";
  }
  function urlHasHttpsScheme(url) {
    return typeof url === "string" && url[5] === ":" && url[0] === "h" && url[1] === "t" && url[2] === "t" && url[3] === "p" && url[4] === "s" || url.protocol === "https:";
  }
  function urlIsHttpHttpsScheme(url) {
    assert("protocol" in url);
    const protocol = url.protocol;
    return protocol === "http:" || protocol === "https:";
  }
  function simpleRangeHeaderValue(value, allowWhitespace) {
    const data = value;
    if (!data.startsWith("bytes")) {
      return "failure";
    }
    const position = { position: 5 };
    if (allowWhitespace) {
      collectASequenceOfCodePoints(
        (char) => char === "	" || char === " ",
        data,
        position
      );
    }
    if (data.charCodeAt(position.position) !== 61) {
      return "failure";
    }
    position.position++;
    if (allowWhitespace) {
      collectASequenceOfCodePoints(
        (char) => char === "	" || char === " ",
        data,
        position
      );
    }
    const rangeStart = collectASequenceOfCodePoints(
      (char) => {
        const code = char.charCodeAt(0);
        return code >= 48 && code <= 57;
      },
      data,
      position
    );
    const rangeStartValue = rangeStart.length ? Number(rangeStart) : null;
    if (allowWhitespace) {
      collectASequenceOfCodePoints(
        (char) => char === "	" || char === " ",
        data,
        position
      );
    }
    if (data.charCodeAt(position.position) !== 45) {
      return "failure";
    }
    position.position++;
    if (allowWhitespace) {
      collectASequenceOfCodePoints(
        (char) => char === "	" || char === " ",
        data,
        position
      );
    }
    const rangeEnd = collectASequenceOfCodePoints(
      (char) => {
        const code = char.charCodeAt(0);
        return code >= 48 && code <= 57;
      },
      data,
      position
    );
    const rangeEndValue = rangeEnd.length ? Number(rangeEnd) : null;
    if (position.position < data.length) {
      return "failure";
    }
    if (rangeEndValue === null && rangeStartValue === null) {
      return "failure";
    }
    if (rangeStartValue > rangeEndValue) {
      return "failure";
    }
    return { rangeStartValue, rangeEndValue };
  }
  function buildContentRange(rangeStart, rangeEnd, fullLength) {
    let contentRange = "bytes ";
    contentRange += isomorphicEncode(`${rangeStart}`);
    contentRange += "-";
    contentRange += isomorphicEncode(`${rangeEnd}`);
    contentRange += "/";
    contentRange += isomorphicEncode(`${fullLength}`);
    return contentRange;
  }
  class InflateStream extends Transform {
    #zlibOptions;
    /** @param {zlib.ZlibOptions} [zlibOptions] */
    constructor(zlibOptions) {
      super();
      this.#zlibOptions = zlibOptions;
    }
    _transform(chunk, encoding2, callback) {
      if (!this._inflateStream) {
        if (chunk.length === 0) {
          callback();
          return;
        }
        this._inflateStream = (chunk[0] & 15) === 8 ? zlib.createInflate(this.#zlibOptions) : zlib.createInflateRaw(this.#zlibOptions);
        this._inflateStream.on("data", this.push.bind(this));
        this._inflateStream.on("end", () => this.push(null));
        this._inflateStream.on("error", (err) => this.destroy(err));
      }
      this._inflateStream.write(chunk, encoding2, callback);
    }
    _final(callback) {
      if (this._inflateStream) {
        this._inflateStream.end();
        this._inflateStream = null;
      }
      callback();
    }
  }
  function createInflate(zlibOptions) {
    return new InflateStream(zlibOptions);
  }
  function extractMimeType(headers2) {
    let charset = null;
    let essence = null;
    let mimeType = null;
    const values = getDecodeSplit("content-type", headers2);
    if (values === null) {
      return "failure";
    }
    for (const value of values) {
      const temporaryMimeType = parseMIMEType(value);
      if (temporaryMimeType === "failure" || temporaryMimeType.essence === "*/*") {
        continue;
      }
      mimeType = temporaryMimeType;
      if (mimeType.essence !== essence) {
        charset = null;
        if (mimeType.parameters.has("charset")) {
          charset = mimeType.parameters.get("charset");
        }
        essence = mimeType.essence;
      } else if (!mimeType.parameters.has("charset") && charset !== null) {
        mimeType.parameters.set("charset", charset);
      }
    }
    if (mimeType == null) {
      return "failure";
    }
    return mimeType;
  }
  function gettingDecodingSplitting(value) {
    const input = value;
    const position = { position: 0 };
    const values = [];
    let temporaryValue = "";
    while (position.position < input.length) {
      temporaryValue += collectASequenceOfCodePoints(
        (char) => char !== '"' && char !== ",",
        input,
        position
      );
      if (position.position < input.length) {
        if (input.charCodeAt(position.position) === 34) {
          temporaryValue += collectAnHTTPQuotedString(
            input,
            position
          );
          if (position.position < input.length) {
            continue;
          }
        } else {
          assert(input.charCodeAt(position.position) === 44);
          position.position++;
        }
      }
      temporaryValue = removeChars(temporaryValue, true, true, (char) => char === 9 || char === 32);
      values.push(temporaryValue);
      temporaryValue = "";
    }
    return values;
  }
  function getDecodeSplit(name, list) {
    const value = list.get(name, true);
    if (value === null) {
      return null;
    }
    return gettingDecodingSplitting(value);
  }
  function hasAuthenticationEntry(request2) {
    return false;
  }
  function includesCredentials(url) {
    return !!(url.username && url.password);
  }
  function isTraversableNavigable(navigable) {
    return true;
  }
  class EnvironmentSettingsObjectBase {
    get baseUrl() {
      return getGlobalOrigin();
    }
    get origin() {
      return this.baseUrl?.origin;
    }
    policyContainer = makePolicyContainer();
  }
  class EnvironmentSettingsObject {
    settingsObject = new EnvironmentSettingsObjectBase();
  }
  const environmentSettingsObject = new EnvironmentSettingsObject();
  util$4 = {
    isAborted,
    isCancelled,
    isValidEncodedURL,
    ReadableStreamFrom,
    tryUpgradeRequestToAPotentiallyTrustworthyURL,
    clampAndCoarsenConnectionTimingInfo,
    coarsenedSharedCurrentTime,
    determineRequestsReferrer,
    makePolicyContainer,
    clonePolicyContainer,
    appendFetchMetadata,
    appendRequestOriginHeader,
    TAOCheck,
    corsCheck,
    crossOriginResourcePolicyCheck,
    createOpaqueTimingInfo,
    setRequestReferrerPolicyOnRedirect,
    isValidHTTPToken,
    requestBadPort,
    requestCurrentURL,
    responseURL,
    responseLocationURL,
    isURLPotentiallyTrustworthy,
    isValidReasonPhrase,
    sameOrigin,
    normalizeMethod,
    iteratorMixin,
    createIterator,
    isValidHeaderName,
    isValidHeaderValue,
    isErrorLike,
    fullyReadBody,
    readableStreamClose,
    urlIsLocal,
    urlHasHttpsScheme,
    urlIsHttpHttpsScheme,
    readAllBytes,
    simpleRangeHeaderValue,
    buildContentRange,
    createInflate,
    extractMimeType,
    getDecodeSplit,
    environmentSettingsObject,
    isOriginIPPotentiallyTrustworthy,
    hasAuthenticationEntry,
    includesCredentials,
    isTraversableNavigable
  };
  return util$4;
}
var formdata;
var hasRequiredFormdata;
function requireFormdata() {
  if (hasRequiredFormdata) return formdata;
  hasRequiredFormdata = 1;
  const { iteratorMixin } = /* @__PURE__ */ requireUtil$4();
  const { kEnumerableProperty } = /* @__PURE__ */ requireUtil$5();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const nodeUtil = require$$0$3;
  class FormData {
    #state = [];
    constructor(form = void 0) {
      webidl.util.markAsUncloneable(this);
      if (form !== void 0) {
        throw webidl.errors.conversionFailed({
          prefix: "FormData constructor",
          argument: "Argument 1",
          types: ["undefined"]
        });
      }
    }
    append(name, value, filename = void 0) {
      webidl.brandCheck(this, FormData);
      const prefix = "FormData.append";
      webidl.argumentLengthCheck(arguments, 2, prefix);
      name = webidl.converters.USVString(name);
      if (arguments.length === 3 || webidl.is.Blob(value)) {
        value = webidl.converters.Blob(value, prefix, "value");
        if (filename !== void 0) {
          filename = webidl.converters.USVString(filename);
        }
      } else {
        value = webidl.converters.USVString(value);
      }
      const entry = makeEntry(name, value, filename);
      this.#state.push(entry);
    }
    delete(name) {
      webidl.brandCheck(this, FormData);
      const prefix = "FormData.delete";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      name = webidl.converters.USVString(name);
      this.#state = this.#state.filter((entry) => entry.name !== name);
    }
    get(name) {
      webidl.brandCheck(this, FormData);
      const prefix = "FormData.get";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      name = webidl.converters.USVString(name);
      const idx = this.#state.findIndex((entry) => entry.name === name);
      if (idx === -1) {
        return null;
      }
      return this.#state[idx].value;
    }
    getAll(name) {
      webidl.brandCheck(this, FormData);
      const prefix = "FormData.getAll";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      name = webidl.converters.USVString(name);
      return this.#state.filter((entry) => entry.name === name).map((entry) => entry.value);
    }
    has(name) {
      webidl.brandCheck(this, FormData);
      const prefix = "FormData.has";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      name = webidl.converters.USVString(name);
      return this.#state.findIndex((entry) => entry.name === name) !== -1;
    }
    set(name, value, filename = void 0) {
      webidl.brandCheck(this, FormData);
      const prefix = "FormData.set";
      webidl.argumentLengthCheck(arguments, 2, prefix);
      name = webidl.converters.USVString(name);
      if (arguments.length === 3 || webidl.is.Blob(value)) {
        value = webidl.converters.Blob(value, prefix, "value");
        if (filename !== void 0) {
          filename = webidl.converters.USVString(filename);
        }
      } else {
        value = webidl.converters.USVString(value);
      }
      const entry = makeEntry(name, value, filename);
      const idx = this.#state.findIndex((entry2) => entry2.name === name);
      if (idx !== -1) {
        this.#state = [
          ...this.#state.slice(0, idx),
          entry,
          ...this.#state.slice(idx + 1).filter((entry2) => entry2.name !== name)
        ];
      } else {
        this.#state.push(entry);
      }
    }
    [nodeUtil.inspect.custom](depth, options) {
      const state = this.#state.reduce((a, b) => {
        if (a[b.name]) {
          if (Array.isArray(a[b.name])) {
            a[b.name].push(b.value);
          } else {
            a[b.name] = [a[b.name], b.value];
          }
        } else {
          a[b.name] = b.value;
        }
        return a;
      }, { __proto__: null });
      options.depth ??= depth;
      options.colors ??= true;
      const output = nodeUtil.formatWithOptions(options, state);
      return `FormData ${output.slice(output.indexOf("]") + 2)}`;
    }
    /**
     * @param {FormData} formData
     */
    static getFormDataState(formData) {
      return formData.#state;
    }
    /**
     * @param {FormData} formData
     * @param {any[]} newState
     */
    static setFormDataState(formData, newState) {
      formData.#state = newState;
    }
  }
  const { getFormDataState, setFormDataState } = FormData;
  Reflect.deleteProperty(FormData, "getFormDataState");
  Reflect.deleteProperty(FormData, "setFormDataState");
  iteratorMixin("FormData", FormData, getFormDataState, "name", "value");
  Object.defineProperties(FormData.prototype, {
    append: kEnumerableProperty,
    delete: kEnumerableProperty,
    get: kEnumerableProperty,
    getAll: kEnumerableProperty,
    has: kEnumerableProperty,
    set: kEnumerableProperty,
    [Symbol.toStringTag]: {
      value: "FormData",
      configurable: true
    }
  });
  function makeEntry(name, value, filename) {
    if (typeof value === "string") ;
    else {
      if (!webidl.is.File(value)) {
        value = new File([value], "blob", { type: value.type });
      }
      if (filename !== void 0) {
        const options = {
          type: value.type,
          lastModified: value.lastModified
        };
        value = new File([value], filename, options);
      }
    }
    return { name, value };
  }
  webidl.is.FormData = webidl.util.MakeTypeAssertion(FormData);
  formdata = { FormData, makeEntry, setFormDataState };
  return formdata;
}
var formdataParser;
var hasRequiredFormdataParser;
function requireFormdataParser() {
  if (hasRequiredFormdataParser) return formdataParser;
  hasRequiredFormdataParser = 1;
  const { bufferToLowerCasedHeaderName } = /* @__PURE__ */ requireUtil$5();
  const { HTTP_TOKEN_CODEPOINTS } = /* @__PURE__ */ requireDataUrl();
  const { makeEntry } = /* @__PURE__ */ requireFormdata();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const assert = require$$0$1;
  const { isomorphicDecode } = /* @__PURE__ */ requireInfra();
  const { utf8DecodeBytes } = /* @__PURE__ */ requireEncoding();
  const dd = Buffer.from("--");
  const decoder = new TextDecoder();
  function isAsciiString(chars) {
    for (let i = 0; i < chars.length; ++i) {
      if ((chars.charCodeAt(i) & -128) !== 0) {
        return false;
      }
    }
    return true;
  }
  function validateBoundary(boundary) {
    const length = boundary.length;
    if (length < 27 || length > 70) {
      return false;
    }
    for (let i = 0; i < length; ++i) {
      const cp = boundary.charCodeAt(i);
      if (!(cp >= 48 && cp <= 57 || cp >= 65 && cp <= 90 || cp >= 97 && cp <= 122 || cp === 39 || cp === 45 || cp === 95)) {
        return false;
      }
    }
    return true;
  }
  function multipartFormDataParser(input, mimeType) {
    assert(mimeType !== "failure" && mimeType.essence === "multipart/form-data");
    const boundaryString = mimeType.parameters.get("boundary");
    if (boundaryString === void 0) {
      throw parsingError("missing boundary in content-type header");
    }
    const boundary = Buffer.from(`--${boundaryString}`, "utf8");
    const entryList = [];
    const position = { position: 0 };
    const firstBoundaryIndex = input.indexOf(boundary);
    if (firstBoundaryIndex === -1) {
      throw parsingError("no boundary found in multipart body");
    }
    position.position = firstBoundaryIndex;
    while (true) {
      if (input.subarray(position.position, position.position + boundary.length).equals(boundary)) {
        position.position += boundary.length;
      } else {
        throw parsingError("expected a value starting with -- and the boundary");
      }
      if (bufferStartsWith(input, dd, position)) {
        return entryList;
      }
      if (input[position.position] !== 13 || input[position.position + 1] !== 10) {
        throw parsingError("expected CRLF");
      }
      position.position += 2;
      const result = parseMultipartFormDataHeaders(input, position);
      let { name, filename, contentType, encoding: encoding2 } = result;
      position.position += 2;
      let body2;
      {
        const boundaryIndex = input.indexOf(boundary.subarray(2), position.position);
        if (boundaryIndex === -1) {
          throw parsingError("expected boundary after body");
        }
        body2 = input.subarray(position.position, boundaryIndex - 4);
        position.position += body2.length;
        if (encoding2 === "base64") {
          body2 = Buffer.from(body2.toString(), "base64");
        }
      }
      if (input[position.position] !== 13 || input[position.position + 1] !== 10) {
        throw parsingError("expected CRLF");
      } else {
        position.position += 2;
      }
      let value;
      if (filename !== null) {
        contentType ??= "text/plain";
        if (!isAsciiString(contentType)) {
          contentType = "";
        }
        value = new File([body2], filename, { type: contentType });
      } else {
        value = utf8DecodeBytes(Buffer.from(body2));
      }
      assert(webidl.is.USVString(name));
      assert(typeof value === "string" && webidl.is.USVString(value) || webidl.is.File(value));
      entryList.push(makeEntry(name, value, filename));
    }
  }
  function parseContentDispositionAttribute(input, position) {
    if (input[position.position] === 59) {
      position.position++;
    }
    collectASequenceOfBytes(
      (char) => char === 32 || char === 9,
      input,
      position
    );
    const attributeName = collectASequenceOfBytes(
      (char) => isToken(char) && char !== 61 && char !== 42,
      // not = or *
      input,
      position
    );
    if (attributeName.length === 0) {
      return null;
    }
    const attrNameStr = attributeName.toString("ascii").toLowerCase();
    const isExtended = input[position.position] === 42;
    if (isExtended) {
      position.position++;
    }
    if (input[position.position] !== 61) {
      return null;
    }
    position.position++;
    collectASequenceOfBytes(
      (char) => char === 32 || char === 9,
      input,
      position
    );
    let value;
    if (isExtended) {
      const headerValue = collectASequenceOfBytes(
        (char) => char !== 32 && char !== 13 && char !== 10 && char !== 59,
        // not space, CRLF, or ;
        input,
        position
      );
      if (headerValue[0] !== 117 && headerValue[0] !== 85 || // u or U
      headerValue[1] !== 116 && headerValue[1] !== 84 || // t or T
      headerValue[2] !== 102 && headerValue[2] !== 70 || // f or F
      headerValue[3] !== 45 || // -
      headerValue[4] !== 56) {
        throw parsingError("unknown encoding, expected utf-8''");
      }
      value = decodeURIComponent(decoder.decode(headerValue.subarray(7)));
    } else if (input[position.position] === 34) {
      position.position++;
      const quotedValue = collectASequenceOfBytes(
        (char) => char !== 10 && char !== 13 && char !== 34,
        // not LF, CR, or "
        input,
        position
      );
      if (input[position.position] !== 34) {
        throw parsingError("Closing quote not found");
      }
      position.position++;
      value = decoder.decode(quotedValue).replace(/%0A/ig, "\n").replace(/%0D/ig, "\r").replace(/%22/g, '"');
    } else {
      const tokenValue = collectASequenceOfBytes(
        (char) => isToken(char) && char !== 59,
        // not ;
        input,
        position
      );
      value = decoder.decode(tokenValue);
    }
    return { name: attrNameStr, value };
  }
  function parseMultipartFormDataHeaders(input, position) {
    let name = null;
    let filename = null;
    let contentType = null;
    let encoding2 = null;
    while (true) {
      if (input[position.position] === 13 && input[position.position + 1] === 10) {
        if (name === null) {
          throw parsingError("header name is null");
        }
        return { name, filename, contentType, encoding: encoding2 };
      }
      let headerName = collectASequenceOfBytes(
        (char) => char !== 10 && char !== 13 && char !== 58,
        input,
        position
      );
      headerName = removeChars(headerName, true, true, (char) => char === 9 || char === 32);
      if (!HTTP_TOKEN_CODEPOINTS.test(headerName.toString())) {
        throw parsingError("header name does not match the field-name token production");
      }
      if (input[position.position] !== 58) {
        throw parsingError("expected :");
      }
      position.position++;
      collectASequenceOfBytes(
        (char) => char === 32 || char === 9,
        input,
        position
      );
      switch (bufferToLowerCasedHeaderName(headerName)) {
        case "content-disposition": {
          name = filename = null;
          const dispositionType = collectASequenceOfBytes(
            (char) => isToken(char),
            input,
            position
          );
          if (dispositionType.toString("ascii").toLowerCase() !== "form-data") {
            throw parsingError("expected form-data for content-disposition header");
          }
          while (position.position < input.length && input[position.position] !== 13 && input[position.position + 1] !== 10) {
            const attribute = parseContentDispositionAttribute(input, position);
            if (!attribute) {
              break;
            }
            if (attribute.name === "name") {
              name = attribute.value;
            } else if (attribute.name === "filename") {
              filename = attribute.value;
            }
          }
          if (name === null) {
            throw parsingError("name attribute is required in content-disposition header");
          }
          break;
        }
        case "content-type": {
          let headerValue = collectASequenceOfBytes(
            (char) => char !== 10 && char !== 13,
            input,
            position
          );
          headerValue = removeChars(headerValue, false, true, (char) => char === 9 || char === 32);
          contentType = isomorphicDecode(headerValue);
          break;
        }
        case "content-transfer-encoding": {
          let headerValue = collectASequenceOfBytes(
            (char) => char !== 10 && char !== 13,
            input,
            position
          );
          headerValue = removeChars(headerValue, false, true, (char) => char === 9 || char === 32);
          encoding2 = isomorphicDecode(headerValue);
          break;
        }
        default: {
          collectASequenceOfBytes(
            (char) => char !== 10 && char !== 13,
            input,
            position
          );
        }
      }
      if (input[position.position] !== 13 && input[position.position + 1] !== 10) {
        throw parsingError("expected CRLF");
      } else {
        position.position += 2;
      }
    }
  }
  function collectASequenceOfBytes(condition, input, position) {
    let start = position.position;
    while (start < input.length && condition(input[start])) {
      ++start;
    }
    return input.subarray(position.position, position.position = start);
  }
  function removeChars(buf, leading, trailing, predicate) {
    let lead = 0;
    let trail = buf.length - 1;
    if (leading) {
      while (lead < buf.length && predicate(buf[lead])) lead++;
    }
    {
      while (trail > 0 && predicate(buf[trail])) trail--;
    }
    return lead === 0 && trail === buf.length - 1 ? buf : buf.subarray(lead, trail + 1);
  }
  function bufferStartsWith(buffer, start, position) {
    if (buffer.length < start.length) {
      return false;
    }
    for (let i = 0; i < start.length; i++) {
      if (start[i] !== buffer[position.position + i]) {
        return false;
      }
    }
    return true;
  }
  function parsingError(cause) {
    return new TypeError("Failed to parse body as FormData.", { cause: new TypeError(cause) });
  }
  function isCTL(char) {
    return char <= 31 || char === 127;
  }
  function isTSpecial(char) {
    return char === 40 || // (
    char === 41 || // )
    char === 60 || // <
    char === 62 || // >
    char === 64 || // @
    char === 44 || // ,
    char === 59 || // ;
    char === 58 || // :
    char === 92 || // \
    char === 34 || // "
    char === 47 || // /
    char === 91 || // [
    char === 93 || // ]
    char === 63 || // ?
    char === 61;
  }
  function isToken(char) {
    return char <= 127 && // ascii
    char !== 32 && // space
    char !== 9 && !isCTL(char) && !isTSpecial(char);
  }
  formdataParser = {
    multipartFormDataParser,
    validateBoundary
  };
  return formdataParser;
}
var promise;
var hasRequiredPromise;
function requirePromise() {
  if (hasRequiredPromise) return promise;
  hasRequiredPromise = 1;
  function createDeferredPromise() {
    let res;
    let rej;
    const promise2 = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    return { promise: promise2, resolve: res, reject: rej };
  }
  promise = {
    createDeferredPromise
  };
  return promise;
}
var body;
var hasRequiredBody;
function requireBody() {
  if (hasRequiredBody) return body;
  hasRequiredBody = 1;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const {
    ReadableStreamFrom,
    readableStreamClose,
    fullyReadBody,
    extractMimeType
  } = /* @__PURE__ */ requireUtil$4();
  const { FormData, setFormDataState } = /* @__PURE__ */ requireFormdata();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const assert = require$$0$1;
  const { isErrored, isDisturbed } = require$$0;
  const { isArrayBuffer } = require$$8;
  const { serializeAMimeType } = /* @__PURE__ */ requireDataUrl();
  const { multipartFormDataParser } = /* @__PURE__ */ requireFormdataParser();
  const { createDeferredPromise } = /* @__PURE__ */ requirePromise();
  const { parseJSONFromBytes } = /* @__PURE__ */ requireInfra();
  const { utf8DecodeBytes } = /* @__PURE__ */ requireEncoding();
  const { runtimeFeatures: runtimeFeatures2 } = /* @__PURE__ */ requireRuntimeFeatures();
  const random = runtimeFeatures2.has("crypto") ? crypto.randomInt : (max) => Math.floor(Math.random() * max);
  const textEncoder = new TextEncoder();
  function noop() {
  }
  const streamRegistry = new FinalizationRegistry((weakRef) => {
    const stream = weakRef.deref();
    if (stream && !stream.locked && !isDisturbed(stream) && !isErrored(stream)) {
      stream.cancel("Response object has been garbage collected").catch(noop);
    }
  });
  function extractBody(object, keepalive = false) {
    let stream = null;
    if (webidl.is.ReadableStream(object)) {
      stream = object;
    } else if (webidl.is.Blob(object)) {
      stream = object.stream();
    } else {
      stream = new ReadableStream({
        pull(controller) {
          const buffer = typeof source === "string" ? textEncoder.encode(source) : source;
          if (buffer.byteLength) {
            controller.enqueue(buffer);
          }
          queueMicrotask(() => readableStreamClose(controller));
        },
        start() {
        },
        type: "bytes"
      });
    }
    assert(webidl.is.ReadableStream(stream));
    let action = null;
    let source = null;
    let length = null;
    let type = null;
    if (typeof object === "string") {
      source = object;
      type = "text/plain;charset=UTF-8";
    } else if (webidl.is.URLSearchParams(object)) {
      source = object.toString();
      type = "application/x-www-form-urlencoded;charset=UTF-8";
    } else if (webidl.is.BufferSource(object)) {
      source = isArrayBuffer(object) ? new Uint8Array(object.slice()) : new Uint8Array(object.buffer.slice(object.byteOffset, object.byteOffset + object.byteLength));
    } else if (webidl.is.FormData(object)) {
      const boundary = `----formdata-undici-0${`${random(1e11)}`.padStart(11, "0")}`;
      const prefix = `--${boundary}\r
Content-Disposition: form-data`;
      const formdataEscape = (str) => str.replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22");
      const normalizeLinefeeds = (value) => value.replace(/\r?\n|\r/g, "\r\n");
      const blobParts = [];
      const rn = new Uint8Array([13, 10]);
      length = 0;
      let hasUnknownSizeValue = false;
      for (const [name, value] of object) {
        if (typeof value === "string") {
          const chunk2 = textEncoder.encode(prefix + `; name="${formdataEscape(normalizeLinefeeds(name))}"\r
\r
${normalizeLinefeeds(value)}\r
`);
          blobParts.push(chunk2);
          length += chunk2.byteLength;
        } else {
          const chunk2 = textEncoder.encode(`${prefix}; name="${formdataEscape(normalizeLinefeeds(name))}"` + (value.name ? `; filename="${formdataEscape(value.name)}"` : "") + `\r
Content-Type: ${value.type || "application/octet-stream"}\r
\r
`);
          blobParts.push(chunk2, value, rn);
          if (typeof value.size === "number") {
            length += chunk2.byteLength + value.size + rn.byteLength;
          } else {
            hasUnknownSizeValue = true;
          }
        }
      }
      const chunk = textEncoder.encode(`--${boundary}--\r
`);
      blobParts.push(chunk);
      length += chunk.byteLength;
      if (hasUnknownSizeValue) {
        length = null;
      }
      source = object;
      action = async function* () {
        for (const part of blobParts) {
          if (part.stream) {
            yield* part.stream();
          } else {
            yield part;
          }
        }
      };
      type = `multipart/form-data; boundary=${boundary}`;
    } else if (webidl.is.Blob(object)) {
      source = object;
      length = object.size;
      if (object.type) {
        type = object.type;
      }
    } else if (typeof object[Symbol.asyncIterator] === "function") {
      if (keepalive) {
        throw new TypeError("keepalive");
      }
      if (util2.isDisturbed(object) || object.locked) {
        throw new TypeError(
          "Response body object should not be disturbed or locked"
        );
      }
      stream = webidl.is.ReadableStream(object) ? object : ReadableStreamFrom(object);
    }
    if (typeof source === "string" || util2.isBuffer(source)) {
      length = Buffer.byteLength(source);
    }
    if (action != null) {
      let iterator;
      stream = new ReadableStream({
        start() {
          iterator = action(object)[Symbol.asyncIterator]();
        },
        pull(controller) {
          return iterator.next().then(({ value, done }) => {
            if (done) {
              queueMicrotask(() => {
                controller.close();
                controller.byobRequest?.respond(0);
              });
            } else {
              if (!isErrored(stream)) {
                const buffer = new Uint8Array(value);
                if (buffer.byteLength) {
                  controller.enqueue(buffer);
                }
              }
            }
            return controller.desiredSize > 0;
          });
        },
        cancel(reason) {
          return iterator.return();
        },
        type: "bytes"
      });
    }
    const body2 = { stream, source, length };
    return [body2, type];
  }
  function safelyExtractBody(object, keepalive = false) {
    if (webidl.is.ReadableStream(object)) {
      assert(!util2.isDisturbed(object), "The body has already been consumed.");
      assert(!object.locked, "The stream is locked.");
    }
    return extractBody(object, keepalive);
  }
  function cloneBody(body2) {
    const { 0: out1, 1: out2 } = body2.stream.tee();
    body2.stream = out1;
    return {
      stream: out2,
      length: body2.length,
      source: body2.source
    };
  }
  function bodyMixinMethods(instance, getInternalState) {
    const methods = {
      blob() {
        return consumeBody(this, (bytes) => {
          let mimeType = bodyMimeType(getInternalState(this));
          if (mimeType === null) {
            mimeType = "";
          } else if (mimeType) {
            mimeType = serializeAMimeType(mimeType);
          }
          return new Blob([bytes], { type: mimeType });
        }, instance, getInternalState);
      },
      arrayBuffer() {
        return consumeBody(this, (bytes) => {
          return new Uint8Array(bytes).buffer;
        }, instance, getInternalState);
      },
      text() {
        return consumeBody(this, utf8DecodeBytes, instance, getInternalState);
      },
      json() {
        return consumeBody(this, parseJSONFromBytes, instance, getInternalState);
      },
      formData() {
        return consumeBody(this, (value) => {
          const mimeType = bodyMimeType(getInternalState(this));
          if (mimeType !== null) {
            switch (mimeType.essence) {
              case "multipart/form-data": {
                const parsed = multipartFormDataParser(value, mimeType);
                const fd = new FormData();
                setFormDataState(fd, parsed);
                return fd;
              }
              case "application/x-www-form-urlencoded": {
                const entries = new URLSearchParams(value.toString());
                const fd = new FormData();
                for (const [name, value2] of entries) {
                  fd.append(name, value2);
                }
                return fd;
              }
            }
          }
          throw new TypeError(
            'Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded".'
          );
        }, instance, getInternalState);
      },
      bytes() {
        return consumeBody(this, (bytes) => {
          return new Uint8Array(bytes);
        }, instance, getInternalState);
      }
    };
    return methods;
  }
  function mixinBody(prototype, getInternalState) {
    Object.assign(prototype.prototype, bodyMixinMethods(prototype, getInternalState));
  }
  function consumeBody(object, convertBytesToJSValue, instance, getInternalState) {
    try {
      webidl.brandCheck(object, instance);
    } catch (e) {
      return Promise.reject(e);
    }
    const state = getInternalState(object);
    if (bodyUnusable(state)) {
      return Promise.reject(new TypeError("Body is unusable: Body has already been read"));
    }
    if (state.aborted) {
      return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
    }
    const promise2 = createDeferredPromise();
    const errorSteps = promise2.reject;
    const successSteps = (data) => {
      try {
        promise2.resolve(convertBytesToJSValue(data));
      } catch (e) {
        errorSteps(e);
      }
    };
    if (state.body == null) {
      successSteps(Buffer.allocUnsafe(0));
      return promise2.promise;
    }
    fullyReadBody(state.body, successSteps, errorSteps);
    return promise2.promise;
  }
  function bodyUnusable(object) {
    const body2 = object.body;
    return body2 != null && (body2.stream.locked || util2.isDisturbed(body2.stream));
  }
  function bodyMimeType(requestOrResponse) {
    const headers2 = requestOrResponse.headersList;
    const mimeType = extractMimeType(headers2);
    if (mimeType === "failure") {
      return null;
    }
    return mimeType;
  }
  body = {
    extractBody,
    safelyExtractBody,
    cloneBody,
    mixinBody,
    streamRegistry,
    bodyUnusable
  };
  return body;
}
var clientH1;
var hasRequiredClientH1;
function requireClientH1() {
  if (hasRequiredClientH1) return clientH1;
  hasRequiredClientH1 = 1;
  const assert = require$$0$1;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { channels } = /* @__PURE__ */ requireDiagnostics();
  const timers2 = /* @__PURE__ */ requireTimers();
  const {
    RequestContentLengthMismatchError,
    ResponseContentLengthMismatchError,
    RequestAbortedError,
    HeadersTimeoutError,
    HeadersOverflowError,
    SocketError,
    InformationalError,
    BodyTimeoutError,
    HTTPParserError,
    ResponseExceededMaxSizeError
  } = /* @__PURE__ */ requireErrors();
  const {
    kUrl,
    kReset,
    kClient,
    kParser,
    kBlocking,
    kRunning,
    kPending,
    kSize,
    kWriting,
    kQueue,
    kNoRef,
    kKeepAliveDefaultTimeout,
    kHostHeader,
    kPendingIdx,
    kRunningIdx,
    kError,
    kPipelining,
    kSocket,
    kKeepAliveTimeoutValue,
    kMaxHeadersSize,
    kKeepAliveMaxTimeout,
    kKeepAliveTimeoutThreshold,
    kHeadersTimeout,
    kBodyTimeout,
    kStrictContentLength,
    kMaxRequests,
    kCounter,
    kMaxResponseSize,
    kOnError,
    kResume,
    kHTTPContext,
    kClosed
  } = /* @__PURE__ */ requireSymbols();
  const constants2 = /* @__PURE__ */ requireConstants$3();
  const EMPTY_BUF = Buffer.alloc(0);
  const FastBuffer = Buffer[Symbol.species];
  const removeAllListeners = util2.removeAllListeners;
  let extractBody;
  function lazyllhttp() {
    const llhttpWasmData = process.env.JEST_WORKER_ID ? /* @__PURE__ */ requireLlhttpWasm() : void 0;
    let mod;
    let useWasmSIMD = process.arch !== "ppc64";
    if (process.env.UNDICI_NO_WASM_SIMD === "1") {
      useWasmSIMD = true;
    } else if (process.env.UNDICI_NO_WASM_SIMD === "0") {
      useWasmSIMD = false;
    }
    if (useWasmSIMD) {
      try {
        mod = new WebAssembly.Module(/* @__PURE__ */ requireLlhttp_simdWasm());
      } catch {
      }
    }
    if (!mod) {
      mod = new WebAssembly.Module(llhttpWasmData || /* @__PURE__ */ requireLlhttpWasm());
    }
    return new WebAssembly.Instance(mod, {
      env: {
        /**
         * @param {number} p
         * @param {number} at
         * @param {number} len
         * @returns {number}
         */
        wasm_on_url: (p, at, len) => {
          return 0;
        },
        /**
         * @param {number} p
         * @param {number} at
         * @param {number} len
         * @returns {number}
         */
        wasm_on_status: (p, at, len) => {
          assert(currentParser.ptr === p);
          const start = at - currentBufferPtr + currentBufferRef.byteOffset;
          return currentParser.onStatus(new FastBuffer(currentBufferRef.buffer, start, len));
        },
        /**
         * @param {number} p
         * @returns {number}
         */
        wasm_on_message_begin: (p) => {
          assert(currentParser.ptr === p);
          return currentParser.onMessageBegin();
        },
        /**
         * @param {number} p
         * @param {number} at
         * @param {number} len
         * @returns {number}
         */
        wasm_on_header_field: (p, at, len) => {
          assert(currentParser.ptr === p);
          const start = at - currentBufferPtr + currentBufferRef.byteOffset;
          return currentParser.onHeaderField(new FastBuffer(currentBufferRef.buffer, start, len));
        },
        /**
         * @param {number} p
         * @param {number} at
         * @param {number} len
         * @returns {number}
         */
        wasm_on_header_value: (p, at, len) => {
          assert(currentParser.ptr === p);
          const start = at - currentBufferPtr + currentBufferRef.byteOffset;
          return currentParser.onHeaderValue(new FastBuffer(currentBufferRef.buffer, start, len));
        },
        /**
         * @param {number} p
         * @param {number} statusCode
         * @param {0|1} upgrade
         * @param {0|1} shouldKeepAlive
         * @returns {number}
         */
        wasm_on_headers_complete: (p, statusCode, upgrade, shouldKeepAlive) => {
          assert(currentParser.ptr === p);
          return currentParser.onHeadersComplete(statusCode, upgrade === 1, shouldKeepAlive === 1);
        },
        /**
         * @param {number} p
         * @param {number} at
         * @param {number} len
         * @returns {number}
         */
        wasm_on_body: (p, at, len) => {
          assert(currentParser.ptr === p);
          const start = at - currentBufferPtr + currentBufferRef.byteOffset;
          return currentParser.onBody(new FastBuffer(currentBufferRef.buffer, start, len));
        },
        /**
         * @param {number} p
         * @returns {number}
         */
        wasm_on_message_complete: (p) => {
          assert(currentParser.ptr === p);
          return currentParser.onMessageComplete();
        }
      }
    });
  }
  let llhttpInstance = null;
  let currentParser = null;
  let currentBufferRef = null;
  let currentBufferSize = 0;
  let currentBufferPtr = null;
  const USE_NATIVE_TIMER = 0;
  const USE_FAST_TIMER = 1;
  const TIMEOUT_HEADERS = 2 | USE_FAST_TIMER;
  const TIMEOUT_BODY = 4 | USE_FAST_TIMER;
  const TIMEOUT_KEEP_ALIVE = 8 | USE_NATIVE_TIMER;
  class Parser {
    /**
       * @param {import('./client.js')} client
       * @param {import('net').Socket} socket
       * @param {*} llhttp
       */
    constructor(client2, socket, { exports: exports$1 }) {
      this.llhttp = exports$1;
      this.ptr = this.llhttp.llhttp_alloc(constants2.TYPE.RESPONSE);
      this.client = client2;
      this.socket = socket;
      this.timeout = null;
      this.timeoutValue = null;
      this.timeoutType = null;
      this.statusCode = 0;
      this.statusText = "";
      this.upgrade = false;
      this.headers = [];
      this.headersSize = 0;
      this.headersMaxSize = client2[kMaxHeadersSize];
      this.shouldKeepAlive = false;
      this.paused = false;
      this.resume = this.resume.bind(this);
      this.bytesRead = 0;
      this.keepAlive = "";
      this.contentLength = "";
      this.connection = "";
      this.maxResponseSize = client2[kMaxResponseSize];
    }
    setTimeout(delay, type) {
      if (delay !== this.timeoutValue || type & USE_FAST_TIMER ^ this.timeoutType & USE_FAST_TIMER) {
        if (this.timeout) {
          timers2.clearTimeout(this.timeout);
          this.timeout = null;
        }
        if (delay) {
          if (type & USE_FAST_TIMER) {
            this.timeout = timers2.setFastTimeout(onParserTimeout, delay, new WeakRef(this));
          } else {
            this.timeout = setTimeout(onParserTimeout, delay, new WeakRef(this));
            this.timeout?.unref();
          }
        }
        this.timeoutValue = delay;
      } else if (this.timeout) {
        if (this.timeout.refresh) {
          this.timeout.refresh();
        }
      }
      this.timeoutType = type;
    }
    resume() {
      if (this.socket.destroyed || !this.paused) {
        return;
      }
      assert(this.ptr != null);
      assert(currentParser === null);
      this.llhttp.llhttp_resume(this.ptr);
      assert(this.timeoutType === TIMEOUT_BODY);
      if (this.timeout) {
        if (this.timeout.refresh) {
          this.timeout.refresh();
        }
      }
      this.paused = false;
      this.execute(this.socket.read() || EMPTY_BUF);
      this.readMore();
    }
    readMore() {
      while (!this.paused && this.ptr) {
        const chunk = this.socket.read();
        if (chunk === null) {
          break;
        }
        this.execute(chunk);
      }
    }
    /**
     * @param {Buffer} chunk
     */
    execute(chunk) {
      assert(currentParser === null);
      assert(this.ptr != null);
      assert(!this.paused);
      const { socket, llhttp } = this;
      if (chunk.length > currentBufferSize) {
        if (currentBufferPtr) {
          llhttp.free(currentBufferPtr);
        }
        currentBufferSize = Math.ceil(chunk.length / 4096) * 4096;
        currentBufferPtr = llhttp.malloc(currentBufferSize);
      }
      new Uint8Array(llhttp.memory.buffer, currentBufferPtr, currentBufferSize).set(chunk);
      try {
        let ret;
        try {
          currentBufferRef = chunk;
          currentParser = this;
          ret = llhttp.llhttp_execute(this.ptr, currentBufferPtr, chunk.length);
        } finally {
          currentParser = null;
          currentBufferRef = null;
        }
        if (ret !== constants2.ERROR.OK) {
          const data = chunk.subarray(llhttp.llhttp_get_error_pos(this.ptr) - currentBufferPtr);
          if (ret === constants2.ERROR.PAUSED_UPGRADE) {
            this.onUpgrade(data);
          } else if (ret === constants2.ERROR.PAUSED) {
            this.paused = true;
            socket.unshift(data);
          } else {
            const ptr = llhttp.llhttp_get_error_reason(this.ptr);
            let message = "";
            if (ptr) {
              const len = new Uint8Array(llhttp.memory.buffer, ptr).indexOf(0);
              message = "Response does not match the HTTP/1.1 protocol (" + Buffer.from(llhttp.memory.buffer, ptr, len).toString() + ")";
            }
            throw new HTTPParserError(message, constants2.ERROR[ret], data);
          }
        }
      } catch (err) {
        util2.destroy(socket, err);
      }
    }
    destroy() {
      assert(currentParser === null);
      assert(this.ptr != null);
      this.llhttp.llhttp_free(this.ptr);
      this.ptr = null;
      this.timeout && timers2.clearTimeout(this.timeout);
      this.timeout = null;
      this.timeoutValue = null;
      this.timeoutType = null;
      this.paused = false;
    }
    /**
     * @param {Buffer} buf
     * @returns {0}
     */
    onStatus(buf) {
      this.statusText = buf.toString();
      return 0;
    }
    /**
     * @returns {0|-1}
     */
    onMessageBegin() {
      const { socket, client: client2 } = this;
      if (socket.destroyed) {
        return -1;
      }
      const request2 = client2[kQueue][client2[kRunningIdx]];
      if (!request2) {
        return -1;
      }
      request2.onResponseStarted();
      return 0;
    }
    /**
     * @param {Buffer} buf
     * @returns {number}
     */
    onHeaderField(buf) {
      const len = this.headers.length;
      if ((len & 1) === 0) {
        this.headers.push(buf);
      } else {
        this.headers[len - 1] = Buffer.concat([this.headers[len - 1], buf]);
      }
      this.trackHeader(buf.length);
      return 0;
    }
    /**
     * @param {Buffer} buf
     * @returns {number}
     */
    onHeaderValue(buf) {
      let len = this.headers.length;
      if ((len & 1) === 1) {
        this.headers.push(buf);
        len += 1;
      } else {
        this.headers[len - 1] = Buffer.concat([this.headers[len - 1], buf]);
      }
      const key = this.headers[len - 2];
      if (key.length === 10) {
        const headerName = util2.bufferToLowerCasedHeaderName(key);
        if (headerName === "keep-alive") {
          this.keepAlive += buf.toString();
        } else if (headerName === "connection") {
          this.connection += buf.toString();
        }
      } else if (key.length === 14 && util2.bufferToLowerCasedHeaderName(key) === "content-length") {
        this.contentLength += buf.toString();
      }
      this.trackHeader(buf.length);
      return 0;
    }
    /**
     * @param {number} len
     */
    trackHeader(len) {
      this.headersSize += len;
      if (this.headersSize >= this.headersMaxSize) {
        util2.destroy(this.socket, new HeadersOverflowError());
      }
    }
    /**
     * @param {Buffer} head
     */
    onUpgrade(head) {
      const { upgrade, client: client2, socket, headers: headers2, statusCode } = this;
      assert(upgrade);
      assert(client2[kSocket] === socket);
      assert(!socket.destroyed);
      assert(!this.paused);
      assert((headers2.length & 1) === 0);
      const request2 = client2[kQueue][client2[kRunningIdx]];
      assert(request2);
      assert(request2.upgrade || request2.method === "CONNECT");
      this.statusCode = 0;
      this.statusText = "";
      this.shouldKeepAlive = false;
      this.headers = [];
      this.headersSize = 0;
      socket.unshift(head);
      socket[kParser].destroy();
      socket[kParser] = null;
      socket[kClient] = null;
      socket[kError] = null;
      removeAllListeners(socket);
      client2[kSocket] = null;
      client2[kHTTPContext] = null;
      client2[kQueue][client2[kRunningIdx]++] = null;
      client2.emit("disconnect", client2[kUrl], [client2], new InformationalError("upgrade"));
      try {
        request2.onUpgrade(statusCode, headers2, socket);
      } catch (err) {
        util2.destroy(socket, err);
      }
      client2[kResume]();
    }
    /**
     * @param {number} statusCode
     * @param {boolean} upgrade
     * @param {boolean} shouldKeepAlive
     * @returns {number}
     */
    onHeadersComplete(statusCode, upgrade, shouldKeepAlive) {
      const { client: client2, socket, headers: headers2, statusText } = this;
      if (socket.destroyed) {
        return -1;
      }
      const request2 = client2[kQueue][client2[kRunningIdx]];
      if (!request2) {
        return -1;
      }
      assert(!this.upgrade);
      assert(this.statusCode < 200);
      if (statusCode === 100) {
        util2.destroy(socket, new SocketError("bad response", util2.getSocketInfo(socket)));
        return -1;
      }
      if (upgrade && !request2.upgrade) {
        util2.destroy(socket, new SocketError("bad upgrade", util2.getSocketInfo(socket)));
        return -1;
      }
      assert(this.timeoutType === TIMEOUT_HEADERS);
      this.statusCode = statusCode;
      this.shouldKeepAlive = shouldKeepAlive || // Override llhttp value which does not allow keepAlive for HEAD.
      request2.method === "HEAD" && !socket[kReset] && this.connection.toLowerCase() === "keep-alive";
      if (this.statusCode >= 200) {
        const bodyTimeout = request2.bodyTimeout != null ? request2.bodyTimeout : client2[kBodyTimeout];
        this.setTimeout(bodyTimeout, TIMEOUT_BODY);
      } else if (this.timeout) {
        if (this.timeout.refresh) {
          this.timeout.refresh();
        }
      }
      if (request2.method === "CONNECT") {
        assert(client2[kRunning] === 1);
        this.upgrade = true;
        return 2;
      }
      if (upgrade) {
        assert(client2[kRunning] === 1);
        this.upgrade = true;
        return 2;
      }
      assert((this.headers.length & 1) === 0);
      this.headers = [];
      this.headersSize = 0;
      if (this.shouldKeepAlive && client2[kPipelining]) {
        const keepAliveTimeout = this.keepAlive ? util2.parseKeepAliveTimeout(this.keepAlive) : null;
        if (keepAliveTimeout != null) {
          const timeout = Math.min(
            keepAliveTimeout - client2[kKeepAliveTimeoutThreshold],
            client2[kKeepAliveMaxTimeout]
          );
          if (timeout <= 0) {
            socket[kReset] = true;
          } else {
            client2[kKeepAliveTimeoutValue] = timeout;
          }
        } else {
          client2[kKeepAliveTimeoutValue] = client2[kKeepAliveDefaultTimeout];
        }
      } else {
        socket[kReset] = true;
      }
      const pause = request2.onHeaders(statusCode, headers2, this.resume, statusText) === false;
      if (request2.aborted) {
        return -1;
      }
      if (request2.method === "HEAD") {
        return 1;
      }
      if (statusCode < 200) {
        return 1;
      }
      if (socket[kBlocking]) {
        socket[kBlocking] = false;
        client2[kResume]();
      }
      return pause ? constants2.ERROR.PAUSED : 0;
    }
    /**
     * @param {Buffer} buf
     * @returns {number}
     */
    onBody(buf) {
      const { client: client2, socket, statusCode, maxResponseSize } = this;
      if (socket.destroyed) {
        return -1;
      }
      const request2 = client2[kQueue][client2[kRunningIdx]];
      assert(request2);
      assert(this.timeoutType === TIMEOUT_BODY);
      if (this.timeout) {
        if (this.timeout.refresh) {
          this.timeout.refresh();
        }
      }
      assert(statusCode >= 200);
      if (maxResponseSize > -1 && this.bytesRead + buf.length > maxResponseSize) {
        util2.destroy(socket, new ResponseExceededMaxSizeError());
        return -1;
      }
      this.bytesRead += buf.length;
      if (request2.onData(buf) === false) {
        return constants2.ERROR.PAUSED;
      }
      return 0;
    }
    /**
     * @returns {number}
     */
    onMessageComplete() {
      const { client: client2, socket, statusCode, upgrade, headers: headers2, contentLength, bytesRead, shouldKeepAlive } = this;
      if (socket.destroyed && (!statusCode || shouldKeepAlive)) {
        return -1;
      }
      if (upgrade) {
        return 0;
      }
      assert(statusCode >= 100);
      assert((this.headers.length & 1) === 0);
      const request2 = client2[kQueue][client2[kRunningIdx]];
      assert(request2);
      this.statusCode = 0;
      this.statusText = "";
      this.bytesRead = 0;
      this.contentLength = "";
      this.keepAlive = "";
      this.connection = "";
      this.headers = [];
      this.headersSize = 0;
      if (statusCode < 200) {
        return 0;
      }
      if (request2.method !== "HEAD" && contentLength && bytesRead !== parseInt(contentLength, 10)) {
        util2.destroy(socket, new ResponseContentLengthMismatchError());
        return -1;
      }
      request2.onComplete(headers2);
      client2[kQueue][client2[kRunningIdx]++] = null;
      if (socket[kWriting]) {
        assert(client2[kRunning] === 0);
        util2.destroy(socket, new InformationalError("reset"));
        return constants2.ERROR.PAUSED;
      } else if (!shouldKeepAlive) {
        util2.destroy(socket, new InformationalError("reset"));
        return constants2.ERROR.PAUSED;
      } else if (socket[kReset] && client2[kRunning] === 0) {
        util2.destroy(socket, new InformationalError("reset"));
        return constants2.ERROR.PAUSED;
      } else if (client2[kPipelining] == null || client2[kPipelining] === 1) {
        setImmediate(client2[kResume]);
      } else {
        client2[kResume]();
      }
      return 0;
    }
  }
  function onParserTimeout(parser) {
    const { socket, timeoutType, client: client2, paused } = parser.deref();
    if (timeoutType === TIMEOUT_HEADERS) {
      if (!socket[kWriting] || socket.writableNeedDrain || client2[kRunning] > 1) {
        assert(!paused, "cannot be paused while waiting for headers");
        util2.destroy(socket, new HeadersTimeoutError());
      }
    } else if (timeoutType === TIMEOUT_BODY) {
      if (!paused) {
        util2.destroy(socket, new BodyTimeoutError());
      }
    } else if (timeoutType === TIMEOUT_KEEP_ALIVE) {
      assert(client2[kRunning] === 0 && client2[kKeepAliveTimeoutValue]);
      util2.destroy(socket, new InformationalError("socket idle timeout"));
    }
  }
  function connectH1(client2, socket) {
    client2[kSocket] = socket;
    if (!llhttpInstance) {
      llhttpInstance = lazyllhttp();
    }
    if (socket.errored) {
      throw socket.errored;
    }
    if (socket.destroyed) {
      throw new SocketError("destroyed");
    }
    socket[kNoRef] = false;
    socket[kWriting] = false;
    socket[kReset] = false;
    socket[kBlocking] = false;
    socket[kParser] = new Parser(client2, socket, llhttpInstance);
    util2.addListener(socket, "error", onHttpSocketError);
    util2.addListener(socket, "readable", onHttpSocketReadable);
    util2.addListener(socket, "end", onHttpSocketEnd);
    util2.addListener(socket, "close", onHttpSocketClose);
    socket[kClosed] = false;
    socket.on("close", onSocketClose);
    return {
      version: "h1",
      defaultPipelining: 1,
      write(request2) {
        return writeH1(client2, request2);
      },
      resume() {
        resumeH1(client2);
      },
      /**
       * @param {Error|undefined} err
       * @param {() => void} callback
       */
      destroy(err, callback) {
        if (socket[kClosed]) {
          queueMicrotask(callback);
        } else {
          socket.on("close", callback);
          socket.destroy(err);
        }
      },
      /**
       * @returns {boolean}
       */
      get destroyed() {
        return socket.destroyed;
      },
      /**
       * @param {import('../core/request.js')} request
       * @returns {boolean}
       */
      busy(request2) {
        if (socket[kWriting] || socket[kReset] || socket[kBlocking]) {
          return true;
        }
        if (request2) {
          if (client2[kRunning] > 0 && !request2.idempotent) {
            return true;
          }
          if (client2[kRunning] > 0 && (request2.upgrade || request2.method === "CONNECT")) {
            return true;
          }
          if (client2[kRunning] > 0 && util2.bodyLength(request2.body) !== 0 && (util2.isStream(request2.body) || util2.isAsyncIterable(request2.body) || util2.isFormDataLike(request2.body))) {
            return true;
          }
        }
        return false;
      }
    };
  }
  function onHttpSocketError(err) {
    assert(err.code !== "ERR_TLS_CERT_ALTNAME_INVALID");
    const parser = this[kParser];
    if (err.code === "ECONNRESET" && parser.statusCode && !parser.shouldKeepAlive) {
      parser.onMessageComplete();
      return;
    }
    this[kError] = err;
    this[kClient][kOnError](err);
  }
  function onHttpSocketReadable() {
    this[kParser]?.readMore();
  }
  function onHttpSocketEnd() {
    const parser = this[kParser];
    if (parser.statusCode && !parser.shouldKeepAlive) {
      parser.onMessageComplete();
      return;
    }
    util2.destroy(this, new SocketError("other side closed", util2.getSocketInfo(this)));
  }
  function onHttpSocketClose() {
    const parser = this[kParser];
    if (parser) {
      if (!this[kError] && parser.statusCode && !parser.shouldKeepAlive) {
        parser.onMessageComplete();
      }
      this[kParser].destroy();
      this[kParser] = null;
    }
    const err = this[kError] || new SocketError("closed", util2.getSocketInfo(this));
    const client2 = this[kClient];
    client2[kSocket] = null;
    client2[kHTTPContext] = null;
    if (client2.destroyed) {
      assert(client2[kPending] === 0);
      const requests = client2[kQueue].splice(client2[kRunningIdx]);
      for (let i = 0; i < requests.length; i++) {
        const request2 = requests[i];
        util2.errorRequest(client2, request2, err);
      }
    } else if (client2[kRunning] > 0 && err.code !== "UND_ERR_INFO") {
      const request2 = client2[kQueue][client2[kRunningIdx]];
      client2[kQueue][client2[kRunningIdx]++] = null;
      util2.errorRequest(client2, request2, err);
    }
    client2[kPendingIdx] = client2[kRunningIdx];
    assert(client2[kRunning] === 0);
    client2.emit("disconnect", client2[kUrl], [client2], err);
    client2[kResume]();
  }
  function onSocketClose() {
    this[kClosed] = true;
  }
  function resumeH1(client2) {
    const socket = client2[kSocket];
    if (socket && !socket.destroyed) {
      if (client2[kSize] === 0) {
        if (!socket[kNoRef] && socket.unref) {
          socket.unref();
          socket[kNoRef] = true;
        }
      } else if (socket[kNoRef] && socket.ref) {
        socket.ref();
        socket[kNoRef] = false;
      }
      if (client2[kSize] === 0) {
        if (socket[kParser].timeoutType !== TIMEOUT_KEEP_ALIVE) {
          socket[kParser].setTimeout(client2[kKeepAliveTimeoutValue], TIMEOUT_KEEP_ALIVE);
        }
      } else if (client2[kRunning] > 0 && socket[kParser].statusCode < 200) {
        if (socket[kParser].timeoutType !== TIMEOUT_HEADERS) {
          const request2 = client2[kQueue][client2[kRunningIdx]];
          const headersTimeout = request2.headersTimeout != null ? request2.headersTimeout : client2[kHeadersTimeout];
          socket[kParser].setTimeout(headersTimeout, TIMEOUT_HEADERS);
        }
      }
    }
  }
  function shouldSendContentLength(method) {
    return method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && method !== "TRACE" && method !== "CONNECT";
  }
  function writeH1(client2, request2) {
    const { method, path, host, upgrade, blocking, reset } = request2;
    let { body: body2, headers: headers2, contentLength } = request2;
    const expectsPayload = method === "PUT" || method === "POST" || method === "PATCH" || method === "QUERY" || method === "PROPFIND" || method === "PROPPATCH";
    if (util2.isFormDataLike(body2)) {
      if (!extractBody) {
        extractBody = requireBody().extractBody;
      }
      const [bodyStream, contentType] = extractBody(body2);
      if (request2.contentType == null) {
        headers2.push("content-type", contentType);
      }
      body2 = bodyStream.stream;
      contentLength = bodyStream.length;
    } else if (util2.isBlobLike(body2) && request2.contentType == null && body2.type) {
      headers2.push("content-type", body2.type);
    }
    if (body2 && typeof body2.read === "function") {
      body2.read(0);
    }
    const bodyLength = util2.bodyLength(body2);
    contentLength = bodyLength ?? contentLength;
    if (contentLength === null) {
      contentLength = request2.contentLength;
    }
    if (contentLength === 0 && !expectsPayload) {
      contentLength = null;
    }
    if (shouldSendContentLength(method) && contentLength > 0 && request2.contentLength !== null && request2.contentLength !== contentLength) {
      if (client2[kStrictContentLength]) {
        util2.errorRequest(client2, request2, new RequestContentLengthMismatchError());
        return false;
      }
      process.emitWarning(new RequestContentLengthMismatchError());
    }
    const socket = client2[kSocket];
    const abort = (err) => {
      if (request2.aborted || request2.completed) {
        return;
      }
      util2.errorRequest(client2, request2, err || new RequestAbortedError());
      util2.destroy(body2);
      util2.destroy(socket, new InformationalError("aborted"));
    };
    try {
      request2.onConnect(abort);
    } catch (err) {
      util2.errorRequest(client2, request2, err);
    }
    if (request2.aborted) {
      return false;
    }
    if (method === "HEAD") {
      socket[kReset] = true;
    }
    if (upgrade || method === "CONNECT") {
      socket[kReset] = true;
    }
    if (reset != null) {
      socket[kReset] = reset;
    }
    if (client2[kMaxRequests] && socket[kCounter]++ >= client2[kMaxRequests]) {
      socket[kReset] = true;
    }
    if (blocking) {
      socket[kBlocking] = true;
    }
    let header = `${method} ${path} HTTP/1.1\r
`;
    if (typeof host === "string") {
      header += `host: ${host}\r
`;
    } else {
      header += client2[kHostHeader];
    }
    if (upgrade) {
      header += `connection: upgrade\r
upgrade: ${upgrade}\r
`;
    } else if (client2[kPipelining] && !socket[kReset]) {
      header += "connection: keep-alive\r\n";
    } else {
      header += "connection: close\r\n";
    }
    if (Array.isArray(headers2)) {
      for (let n = 0; n < headers2.length; n += 2) {
        const key = headers2[n + 0];
        const val = headers2[n + 1];
        if (Array.isArray(val)) {
          for (let i = 0; i < val.length; i++) {
            header += `${key}: ${val[i]}\r
`;
          }
        } else {
          header += `${key}: ${val}\r
`;
        }
      }
    }
    if (channels.sendHeaders.hasSubscribers) {
      channels.sendHeaders.publish({ request: request2, headers: header, socket });
    }
    if (!body2 || bodyLength === 0) {
      writeBuffer(abort, null, client2, request2, socket, contentLength, header, expectsPayload);
    } else if (util2.isBuffer(body2)) {
      writeBuffer(abort, body2, client2, request2, socket, contentLength, header, expectsPayload);
    } else if (util2.isBlobLike(body2)) {
      if (typeof body2.stream === "function") {
        writeIterable(abort, body2.stream(), client2, request2, socket, contentLength, header, expectsPayload);
      } else {
        writeBlob(abort, body2, client2, request2, socket, contentLength, header, expectsPayload);
      }
    } else if (util2.isStream(body2)) {
      writeStream(abort, body2, client2, request2, socket, contentLength, header, expectsPayload);
    } else if (util2.isIterable(body2)) {
      writeIterable(abort, body2, client2, request2, socket, contentLength, header, expectsPayload);
    } else {
      assert(false);
    }
    return true;
  }
  function writeStream(abort, body2, client2, request2, socket, contentLength, header, expectsPayload) {
    assert(contentLength !== 0 || client2[kRunning] === 0, "stream body cannot be pipelined");
    let finished = false;
    const writer = new AsyncWriter({ abort, socket, request: request2, contentLength, client: client2, expectsPayload, header });
    const onData = function(chunk) {
      if (finished) {
        return;
      }
      try {
        if (!writer.write(chunk) && this.pause) {
          this.pause();
        }
      } catch (err) {
        util2.destroy(this, err);
      }
    };
    const onDrain = function() {
      if (finished) {
        return;
      }
      if (body2.resume) {
        body2.resume();
      }
    };
    const onClose = function() {
      queueMicrotask(() => {
        body2.removeListener("error", onFinished);
      });
      if (!finished) {
        const err = new RequestAbortedError();
        queueMicrotask(() => onFinished(err));
      }
    };
    const onFinished = function(err) {
      if (finished) {
        return;
      }
      finished = true;
      assert(socket.destroyed || socket[kWriting] && client2[kRunning] <= 1);
      socket.off("drain", onDrain).off("error", onFinished);
      body2.removeListener("data", onData).removeListener("end", onFinished).removeListener("close", onClose);
      if (!err) {
        try {
          writer.end();
        } catch (er) {
          err = er;
        }
      }
      writer.destroy(err);
      if (err && (err.code !== "UND_ERR_INFO" || err.message !== "reset")) {
        util2.destroy(body2, err);
      } else {
        util2.destroy(body2);
      }
    };
    body2.on("data", onData).on("end", onFinished).on("error", onFinished).on("close", onClose);
    if (body2.resume) {
      body2.resume();
    }
    socket.on("drain", onDrain).on("error", onFinished);
    if (body2.errorEmitted ?? body2.errored) {
      setImmediate(onFinished, body2.errored);
    } else if (body2.endEmitted ?? body2.readableEnded) {
      setImmediate(onFinished, null);
    }
    if (body2.closeEmitted ?? body2.closed) {
      setImmediate(onClose);
    }
  }
  function writeBuffer(abort, body2, client2, request2, socket, contentLength, header, expectsPayload) {
    try {
      if (!body2) {
        if (contentLength === 0) {
          socket.write(`${header}content-length: 0\r
\r
`, "latin1");
        } else {
          assert(contentLength === null, "no body must not have content length");
          socket.write(`${header}\r
`, "latin1");
        }
      } else if (util2.isBuffer(body2)) {
        assert(contentLength === body2.byteLength, "buffer body must have content length");
        socket.cork();
        socket.write(`${header}content-length: ${contentLength}\r
\r
`, "latin1");
        socket.write(body2);
        socket.uncork();
        request2.onBodySent(body2);
        if (!expectsPayload && request2.reset !== false) {
          socket[kReset] = true;
        }
      }
      request2.onRequestSent();
      client2[kResume]();
    } catch (err) {
      abort(err);
    }
  }
  async function writeBlob(abort, body2, client2, request2, socket, contentLength, header, expectsPayload) {
    assert(contentLength === body2.size, "blob body must have content length");
    try {
      if (contentLength != null && contentLength !== body2.size) {
        throw new RequestContentLengthMismatchError();
      }
      const buffer = Buffer.from(await body2.arrayBuffer());
      socket.cork();
      socket.write(`${header}content-length: ${contentLength}\r
\r
`, "latin1");
      socket.write(buffer);
      socket.uncork();
      request2.onBodySent(buffer);
      request2.onRequestSent();
      if (!expectsPayload && request2.reset !== false) {
        socket[kReset] = true;
      }
      client2[kResume]();
    } catch (err) {
      abort(err);
    }
  }
  async function writeIterable(abort, body2, client2, request2, socket, contentLength, header, expectsPayload) {
    assert(contentLength !== 0 || client2[kRunning] === 0, "iterator body cannot be pipelined");
    let callback = null;
    function onDrain() {
      if (callback) {
        const cb = callback;
        callback = null;
        cb();
      }
    }
    const waitForDrain = () => new Promise((resolve, reject) => {
      assert(callback === null);
      if (socket[kError]) {
        reject(socket[kError]);
      } else {
        callback = resolve;
      }
    });
    socket.on("close", onDrain).on("drain", onDrain);
    const writer = new AsyncWriter({ abort, socket, request: request2, contentLength, client: client2, expectsPayload, header });
    try {
      for await (const chunk of body2) {
        if (socket[kError]) {
          throw socket[kError];
        }
        if (!writer.write(chunk)) {
          await waitForDrain();
        }
      }
      writer.end();
    } catch (err) {
      writer.destroy(err);
    } finally {
      socket.off("close", onDrain).off("drain", onDrain);
    }
  }
  class AsyncWriter {
    /**
     *
     * @param {object} arg
     * @param {AbortCallback} arg.abort
     * @param {import('net').Socket} arg.socket
     * @param {import('../core/request.js')} arg.request
     * @param {number} arg.contentLength
     * @param {import('./client.js')} arg.client
     * @param {boolean} arg.expectsPayload
     * @param {string} arg.header
     */
    constructor({ abort, socket, request: request2, contentLength, client: client2, expectsPayload, header }) {
      this.socket = socket;
      this.request = request2;
      this.contentLength = contentLength;
      this.client = client2;
      this.bytesWritten = 0;
      this.expectsPayload = expectsPayload;
      this.header = header;
      this.abort = abort;
      socket[kWriting] = true;
    }
    /**
     * @param {Buffer} chunk
     * @returns
     */
    write(chunk) {
      const { socket, request: request2, contentLength, client: client2, bytesWritten, expectsPayload, header } = this;
      if (socket[kError]) {
        throw socket[kError];
      }
      if (socket.destroyed) {
        return false;
      }
      const len = Buffer.byteLength(chunk);
      if (!len) {
        return true;
      }
      if (contentLength !== null && bytesWritten + len > contentLength) {
        if (client2[kStrictContentLength]) {
          throw new RequestContentLengthMismatchError();
        }
        process.emitWarning(new RequestContentLengthMismatchError());
      }
      socket.cork();
      if (bytesWritten === 0) {
        if (!expectsPayload && request2.reset !== false) {
          socket[kReset] = true;
        }
        if (contentLength === null) {
          socket.write(`${header}transfer-encoding: chunked\r
`, "latin1");
        } else {
          socket.write(`${header}content-length: ${contentLength}\r
\r
`, "latin1");
        }
      }
      if (contentLength === null) {
        socket.write(`\r
${len.toString(16)}\r
`, "latin1");
      }
      this.bytesWritten += len;
      const ret = socket.write(chunk);
      socket.uncork();
      request2.onBodySent(chunk);
      if (!ret) {
        if (socket[kParser].timeout && socket[kParser].timeoutType === TIMEOUT_HEADERS) {
          if (socket[kParser].timeout.refresh) {
            socket[kParser].timeout.refresh();
          }
        }
      }
      return ret;
    }
    /**
     * @returns {void}
     */
    end() {
      const { socket, contentLength, client: client2, bytesWritten, expectsPayload, header, request: request2 } = this;
      request2.onRequestSent();
      socket[kWriting] = false;
      if (socket[kError]) {
        throw socket[kError];
      }
      if (socket.destroyed) {
        return;
      }
      if (bytesWritten === 0) {
        if (expectsPayload) {
          socket.write(`${header}content-length: 0\r
\r
`, "latin1");
        } else {
          socket.write(`${header}\r
`, "latin1");
        }
      } else if (contentLength === null) {
        socket.write("\r\n0\r\n\r\n", "latin1");
      }
      if (contentLength !== null && bytesWritten !== contentLength) {
        if (client2[kStrictContentLength]) {
          throw new RequestContentLengthMismatchError();
        } else {
          process.emitWarning(new RequestContentLengthMismatchError());
        }
      }
      if (socket[kParser].timeout && socket[kParser].timeoutType === TIMEOUT_HEADERS) {
        if (socket[kParser].timeout.refresh) {
          socket[kParser].timeout.refresh();
        }
      }
      client2[kResume]();
    }
    /**
     * @param {Error} [err]
     * @returns {void}
     */
    destroy(err) {
      const { socket, client: client2, abort } = this;
      socket[kWriting] = false;
      if (err) {
        assert(client2[kRunning] <= 1, "pipeline should only contain this request");
        abort(err);
      }
    }
  }
  clientH1 = connectH1;
  return clientH1;
}
var clientH2;
var hasRequiredClientH2;
function requireClientH2() {
  if (hasRequiredClientH2) return clientH2;
  hasRequiredClientH2 = 1;
  const assert = require$$0$1;
  const { pipeline } = require$$0;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const {
    RequestContentLengthMismatchError,
    RequestAbortedError,
    SocketError,
    InformationalError,
    InvalidArgumentError
  } = /* @__PURE__ */ requireErrors();
  const {
    kUrl,
    kReset,
    kClient,
    kRunning,
    kPending,
    kQueue,
    kPendingIdx,
    kRunningIdx,
    kError,
    kSocket,
    kStrictContentLength,
    kOnError,
    kMaxConcurrentStreams,
    kHTTP2Session,
    kHTTP2InitialWindowSize,
    kHTTP2ConnectionWindowSize,
    kResume,
    kSize,
    kHTTPContext,
    kClosed,
    kBodyTimeout,
    kEnableConnectProtocol,
    kRemoteSettings,
    kHTTP2Stream
  } = /* @__PURE__ */ requireSymbols();
  const { channels } = /* @__PURE__ */ requireDiagnostics();
  const kOpenStreams = Symbol("open streams");
  let extractBody;
  let http2;
  try {
    http2 = require("node:http2");
  } catch {
    http2 = { constants: {} };
  }
  const {
    constants: {
      HTTP2_HEADER_AUTHORITY,
      HTTP2_HEADER_METHOD,
      HTTP2_HEADER_PATH,
      HTTP2_HEADER_SCHEME,
      HTTP2_HEADER_CONTENT_LENGTH,
      HTTP2_HEADER_EXPECT,
      HTTP2_HEADER_STATUS,
      HTTP2_HEADER_PROTOCOL,
      NGHTTP2_REFUSED_STREAM,
      NGHTTP2_CANCEL
    }
  } = http2;
  function parseH2Headers(headers2) {
    const result = [];
    for (const [name, value] of Object.entries(headers2)) {
      if (Array.isArray(value)) {
        for (const subvalue of value) {
          result.push(Buffer.from(name), Buffer.from(subvalue));
        }
      } else {
        result.push(Buffer.from(name), Buffer.from(value));
      }
    }
    return result;
  }
  function connectH2(client2, socket) {
    client2[kSocket] = socket;
    const http2InitialWindowSize = client2[kHTTP2InitialWindowSize];
    const http2ConnectionWindowSize = client2[kHTTP2ConnectionWindowSize];
    const session = http2.connect(client2[kUrl], {
      createConnection: () => socket,
      peerMaxConcurrentStreams: client2[kMaxConcurrentStreams],
      settings: {
        // TODO(metcoder95): add support for PUSH
        enablePush: false,
        ...http2InitialWindowSize != null ? { initialWindowSize: http2InitialWindowSize } : null
      }
    });
    session[kOpenStreams] = 0;
    session[kClient] = client2;
    session[kSocket] = socket;
    session[kHTTP2Session] = null;
    session[kEnableConnectProtocol] = false;
    session[kRemoteSettings] = false;
    if (http2ConnectionWindowSize) {
      util2.addListener(session, "connect", applyConnectionWindowSize.bind(session, http2ConnectionWindowSize));
    }
    util2.addListener(session, "error", onHttp2SessionError);
    util2.addListener(session, "frameError", onHttp2FrameError);
    util2.addListener(session, "end", onHttp2SessionEnd);
    util2.addListener(session, "goaway", onHttp2SessionGoAway);
    util2.addListener(session, "close", onHttp2SessionClose);
    util2.addListener(session, "remoteSettings", onHttp2RemoteSettings);
    session.unref();
    client2[kHTTP2Session] = session;
    socket[kHTTP2Session] = session;
    util2.addListener(socket, "error", onHttp2SocketError);
    util2.addListener(socket, "end", onHttp2SocketEnd);
    util2.addListener(socket, "close", onHttp2SocketClose);
    socket[kClosed] = false;
    socket.on("close", onSocketClose);
    return {
      version: "h2",
      defaultPipelining: Infinity,
      /**
       * @param {import('../core/request.js')} request
       * @returns {boolean}
      */
      write(request2) {
        return writeH2(client2, request2);
      },
      /**
       * @returns {void}
       */
      resume() {
        resumeH2(client2);
      },
      /**
       * @param {Error | null} err
       * @param {() => void} callback
       */
      destroy(err, callback) {
        if (socket[kClosed]) {
          queueMicrotask(callback);
        } else {
          socket.destroy(err).on("close", callback);
        }
      },
      /**
       * @type {boolean}
       */
      get destroyed() {
        return socket.destroyed;
      },
      /**
       * @param {import('../core/request.js')} request
       * @returns {boolean}
      */
      busy(request2) {
        if (request2 != null) {
          if (client2[kRunning] > 0) {
            if (request2.idempotent === false) return true;
            if ((request2.upgrade === "websocket" || request2.method === "CONNECT") && session[kRemoteSettings] === false) return true;
            if (util2.bodyLength(request2.body) !== 0 && (util2.isStream(request2.body) || util2.isAsyncIterable(request2.body) || util2.isFormDataLike(request2.body))) return true;
          } else {
            return (request2.upgrade === "websocket" || request2.method === "CONNECT") && session[kRemoteSettings] === false;
          }
        }
        return false;
      }
    };
  }
  function resumeH2(client2) {
    const socket = client2[kSocket];
    if (socket?.destroyed === false) {
      if (client2[kSize] === 0 || client2[kMaxConcurrentStreams] === 0) {
        socket.unref();
        client2[kHTTP2Session].unref();
      } else {
        socket.ref();
        client2[kHTTP2Session].ref();
      }
    }
  }
  function applyConnectionWindowSize(connectionWindowSize) {
    try {
      if (typeof this.setLocalWindowSize === "function") {
        this.setLocalWindowSize(connectionWindowSize);
      }
    } catch {
    }
  }
  function onHttp2RemoteSettings(settings) {
    this[kClient][kMaxConcurrentStreams] = settings.maxConcurrentStreams ?? this[kClient][kMaxConcurrentStreams];
    if (this[kRemoteSettings] === true && this[kEnableConnectProtocol] === true && settings.enableConnectProtocol === false) {
      const err = new InformationalError("HTTP/2: Server disabled extended CONNECT protocol against RFC-8441");
      this[kSocket][kError] = err;
      this[kClient][kOnError](err);
      return;
    }
    this[kEnableConnectProtocol] = settings.enableConnectProtocol ?? this[kEnableConnectProtocol];
    this[kRemoteSettings] = true;
    this[kClient][kResume]();
  }
  function onHttp2SessionError(err) {
    assert(err.code !== "ERR_TLS_CERT_ALTNAME_INVALID");
    this[kSocket][kError] = err;
    this[kClient][kOnError](err);
  }
  function onHttp2FrameError(type, code, id) {
    if (id === 0) {
      const err = new InformationalError(`HTTP/2: "frameError" received - type ${type}, code ${code}`);
      this[kSocket][kError] = err;
      this[kClient][kOnError](err);
    }
  }
  function onHttp2SessionEnd() {
    const err = new SocketError("other side closed", util2.getSocketInfo(this[kSocket]));
    this.destroy(err);
    util2.destroy(this[kSocket], err);
  }
  function onHttp2SessionGoAway(errorCode) {
    const err = this[kError] || new SocketError(`HTTP/2: "GOAWAY" frame received with code ${errorCode}`, util2.getSocketInfo(this[kSocket]));
    const client2 = this[kClient];
    client2[kSocket] = null;
    client2[kHTTPContext] = null;
    this.close();
    this[kHTTP2Session] = null;
    util2.destroy(this[kSocket], err);
    if (client2[kRunningIdx] < client2[kQueue].length) {
      const request2 = client2[kQueue][client2[kRunningIdx]];
      client2[kQueue][client2[kRunningIdx]++] = null;
      util2.errorRequest(client2, request2, err);
      client2[kPendingIdx] = client2[kRunningIdx];
    }
    assert(client2[kRunning] === 0);
    client2.emit("disconnect", client2[kUrl], [client2], err);
    client2.emit("connectionError", client2[kUrl], [client2], err);
    client2[kResume]();
  }
  function onHttp2SessionClose() {
    const { [kClient]: client2 } = this;
    const { [kSocket]: socket } = client2;
    const err = this[kSocket][kError] || this[kError] || new SocketError("closed", util2.getSocketInfo(socket));
    client2[kSocket] = null;
    client2[kHTTPContext] = null;
    if (client2.destroyed) {
      assert(client2[kPending] === 0);
      const requests = client2[kQueue].splice(client2[kRunningIdx]);
      for (let i = 0; i < requests.length; i++) {
        const request2 = requests[i];
        util2.errorRequest(client2, request2, err);
      }
    }
  }
  function onHttp2SocketClose() {
    const err = this[kError] || new SocketError("closed", util2.getSocketInfo(this));
    const client2 = this[kHTTP2Session][kClient];
    client2[kSocket] = null;
    client2[kHTTPContext] = null;
    if (this[kHTTP2Session] !== null) {
      this[kHTTP2Session].destroy(err);
    }
    client2[kPendingIdx] = client2[kRunningIdx];
    assert(client2[kRunning] === 0);
    client2.emit("disconnect", client2[kUrl], [client2], err);
    client2[kResume]();
  }
  function onHttp2SocketError(err) {
    assert(err.code !== "ERR_TLS_CERT_ALTNAME_INVALID");
    this[kError] = err;
    this[kClient][kOnError](err);
  }
  function onHttp2SocketEnd() {
    util2.destroy(this, new SocketError("other side closed", util2.getSocketInfo(this)));
  }
  function onSocketClose() {
    this[kClosed] = true;
  }
  function shouldSendContentLength(method) {
    return method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && method !== "TRACE" && method !== "CONNECT";
  }
  function writeH2(client2, request2) {
    const requestTimeout = request2.bodyTimeout ?? client2[kBodyTimeout];
    const session = client2[kHTTP2Session];
    const { method, path, host, upgrade, expectContinue, signal, protocol, headers: reqHeaders } = request2;
    let { body: body2 } = request2;
    if (upgrade != null && upgrade !== "websocket") {
      util2.errorRequest(client2, request2, new InvalidArgumentError(`Custom upgrade "${upgrade}" not supported over HTTP/2`));
      return false;
    }
    const headers2 = {};
    for (let n = 0; n < reqHeaders.length; n += 2) {
      const key = reqHeaders[n + 0];
      const val = reqHeaders[n + 1];
      if (key === "cookie") {
        if (headers2[key] != null) {
          headers2[key] = Array.isArray(headers2[key]) ? (headers2[key].push(val), headers2[key]) : [headers2[key], val];
        } else {
          headers2[key] = val;
        }
        continue;
      }
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          if (headers2[key]) {
            headers2[key] += `, ${val[i]}`;
          } else {
            headers2[key] = val[i];
          }
        }
      } else if (headers2[key]) {
        headers2[key] += `, ${val}`;
      } else {
        headers2[key] = val;
      }
    }
    let stream = null;
    const { hostname, port } = client2[kUrl];
    headers2[HTTP2_HEADER_AUTHORITY] = host || `${hostname}${port ? `:${port}` : ""}`;
    headers2[HTTP2_HEADER_METHOD] = method;
    const abort = (err) => {
      if (request2.aborted || request2.completed) {
        return;
      }
      err = err || new RequestAbortedError();
      util2.errorRequest(client2, request2, err);
      if (stream != null) {
        stream.removeAllListeners("data");
        stream.close();
        client2[kOnError](err);
        client2[kResume]();
      }
      util2.destroy(body2, err);
    };
    try {
      request2.onConnect(abort);
    } catch (err) {
      util2.errorRequest(client2, request2, err);
    }
    if (request2.aborted) {
      return false;
    }
    if (upgrade || method === "CONNECT") {
      session.ref();
      if (upgrade === "websocket") {
        if (session[kEnableConnectProtocol] === false) {
          util2.errorRequest(client2, request2, new InformationalError("HTTP/2: Extended CONNECT protocol not supported by server"));
          session.unref();
          return false;
        }
        headers2[HTTP2_HEADER_METHOD] = "CONNECT";
        headers2[HTTP2_HEADER_PROTOCOL] = "websocket";
        headers2[HTTP2_HEADER_PATH] = path;
        if (protocol === "ws:" || protocol === "wss:") {
          headers2[HTTP2_HEADER_SCHEME] = protocol === "ws:" ? "http" : "https";
        } else {
          headers2[HTTP2_HEADER_SCHEME] = protocol === "http:" ? "http" : "https";
        }
        stream = session.request(headers2, { endStream: false, signal });
        stream[kHTTP2Stream] = true;
        stream.once("response", (headers3, _flags) => {
          const { [HTTP2_HEADER_STATUS]: statusCode, ...realHeaders } = headers3;
          request2.onUpgrade(statusCode, parseH2Headers(realHeaders), stream);
          ++session[kOpenStreams];
          client2[kQueue][client2[kRunningIdx]++] = null;
        });
        stream.on("error", () => {
          if (stream.rstCode === NGHTTP2_REFUSED_STREAM || stream.rstCode === NGHTTP2_CANCEL) {
            abort(new InformationalError(`HTTP/2: "stream error" received - code ${stream.rstCode}`));
          }
        });
        stream.once("close", () => {
          session[kOpenStreams] -= 1;
          if (session[kOpenStreams] === 0) session.unref();
        });
        stream.setTimeout(requestTimeout);
        return true;
      }
      stream = session.request(headers2, { endStream: false, signal });
      stream[kHTTP2Stream] = true;
      stream.on("response", (headers3) => {
        const { [HTTP2_HEADER_STATUS]: statusCode, ...realHeaders } = headers3;
        request2.onUpgrade(statusCode, parseH2Headers(realHeaders), stream);
        ++session[kOpenStreams];
        client2[kQueue][client2[kRunningIdx]++] = null;
      });
      stream.once("close", () => {
        session[kOpenStreams] -= 1;
        if (session[kOpenStreams] === 0) session.unref();
      });
      stream.setTimeout(requestTimeout);
      return true;
    }
    headers2[HTTP2_HEADER_PATH] = path;
    headers2[HTTP2_HEADER_SCHEME] = protocol === "http:" ? "http" : "https";
    const expectsPayload = method === "PUT" || method === "POST" || method === "PATCH";
    if (body2 && typeof body2.read === "function") {
      body2.read(0);
    }
    let contentLength = util2.bodyLength(body2);
    if (util2.isFormDataLike(body2)) {
      extractBody ??= requireBody().extractBody;
      const [bodyStream, contentType] = extractBody(body2);
      headers2["content-type"] = contentType;
      body2 = bodyStream.stream;
      contentLength = bodyStream.length;
    }
    if (contentLength == null) {
      contentLength = request2.contentLength;
    }
    if (!expectsPayload) {
      contentLength = null;
    }
    if (shouldSendContentLength(method) && contentLength > 0 && request2.contentLength != null && request2.contentLength !== contentLength) {
      if (client2[kStrictContentLength]) {
        util2.errorRequest(client2, request2, new RequestContentLengthMismatchError());
        return false;
      }
      process.emitWarning(new RequestContentLengthMismatchError());
    }
    if (contentLength != null) {
      assert(body2 || contentLength === 0, "no body must not have content length");
      headers2[HTTP2_HEADER_CONTENT_LENGTH] = `${contentLength}`;
    }
    session.ref();
    if (channels.sendHeaders.hasSubscribers) {
      let header = "";
      for (const key in headers2) {
        header += `${key}: ${headers2[key]}\r
`;
      }
      channels.sendHeaders.publish({ request: request2, headers: header, socket: session[kSocket] });
    }
    const shouldEndStream = method === "GET" || method === "HEAD" || body2 === null;
    if (expectContinue) {
      headers2[HTTP2_HEADER_EXPECT] = "100-continue";
      stream = session.request(headers2, { endStream: shouldEndStream, signal });
      stream[kHTTP2Stream] = true;
      stream.once("continue", writeBodyH2);
    } else {
      stream = session.request(headers2, {
        endStream: shouldEndStream,
        signal
      });
      stream[kHTTP2Stream] = true;
      writeBodyH2();
    }
    ++session[kOpenStreams];
    stream.setTimeout(requestTimeout);
    stream.once("response", (headers3) => {
      const { [HTTP2_HEADER_STATUS]: statusCode, ...realHeaders } = headers3;
      request2.onResponseStarted();
      if (request2.aborted) {
        stream.removeAllListeners("data");
        return;
      }
      if (request2.onHeaders(Number(statusCode), parseH2Headers(realHeaders), stream.resume.bind(stream), "") === false) {
        stream.pause();
      }
    });
    stream.on("data", (chunk) => {
      if (request2.onData(chunk) === false) {
        stream.pause();
      }
    });
    stream.once("end", (err) => {
      stream.removeAllListeners("data");
      if (stream.state?.state == null || stream.state.state < 6) {
        if (!request2.aborted && !request2.completed) {
          request2.onComplete({});
        }
        client2[kQueue][client2[kRunningIdx]++] = null;
        client2[kResume]();
      } else {
        --session[kOpenStreams];
        if (session[kOpenStreams] === 0) {
          session.unref();
        }
        abort(err ?? new InformationalError("HTTP/2: stream half-closed (remote)"));
        client2[kQueue][client2[kRunningIdx]++] = null;
        client2[kPendingIdx] = client2[kRunningIdx];
        client2[kResume]();
      }
    });
    stream.once("close", () => {
      stream.removeAllListeners("data");
      session[kOpenStreams] -= 1;
      if (session[kOpenStreams] === 0) {
        session.unref();
      }
    });
    stream.once("error", function(err) {
      stream.removeAllListeners("data");
      abort(err);
    });
    stream.once("frameError", (type, code) => {
      stream.removeAllListeners("data");
      abort(new InformationalError(`HTTP/2: "frameError" received - type ${type}, code ${code}`));
    });
    stream.on("aborted", () => {
      stream.removeAllListeners("data");
    });
    stream.on("timeout", () => {
      const err = new InformationalError(`HTTP/2: "stream timeout after ${requestTimeout}"`);
      stream.removeAllListeners("data");
      session[kOpenStreams] -= 1;
      if (session[kOpenStreams] === 0) {
        session.unref();
      }
      abort(err);
    });
    stream.once("trailers", (trailers) => {
      if (request2.aborted || request2.completed) {
        return;
      }
      request2.onComplete(trailers);
    });
    return true;
    function writeBodyH2() {
      if (!body2 || contentLength === 0) {
        writeBuffer(
          abort,
          stream,
          null,
          client2,
          request2,
          client2[kSocket],
          contentLength,
          expectsPayload
        );
      } else if (util2.isBuffer(body2)) {
        writeBuffer(
          abort,
          stream,
          body2,
          client2,
          request2,
          client2[kSocket],
          contentLength,
          expectsPayload
        );
      } else if (util2.isBlobLike(body2)) {
        if (typeof body2.stream === "function") {
          writeIterable(
            abort,
            stream,
            body2.stream(),
            client2,
            request2,
            client2[kSocket],
            contentLength,
            expectsPayload
          );
        } else {
          writeBlob(
            abort,
            stream,
            body2,
            client2,
            request2,
            client2[kSocket],
            contentLength,
            expectsPayload
          );
        }
      } else if (util2.isStream(body2)) {
        writeStream(
          abort,
          client2[kSocket],
          expectsPayload,
          stream,
          body2,
          client2,
          request2,
          contentLength
        );
      } else if (util2.isIterable(body2)) {
        writeIterable(
          abort,
          stream,
          body2,
          client2,
          request2,
          client2[kSocket],
          contentLength,
          expectsPayload
        );
      } else {
        assert(false);
      }
    }
  }
  function writeBuffer(abort, h2stream, body2, client2, request2, socket, contentLength, expectsPayload) {
    try {
      if (body2 != null && util2.isBuffer(body2)) {
        assert(contentLength === body2.byteLength, "buffer body must have content length");
        h2stream.cork();
        h2stream.write(body2);
        h2stream.uncork();
        h2stream.end();
        request2.onBodySent(body2);
      }
      if (!expectsPayload) {
        socket[kReset] = true;
      }
      request2.onRequestSent();
      client2[kResume]();
    } catch (error) {
      abort(error);
    }
  }
  function writeStream(abort, socket, expectsPayload, h2stream, body2, client2, request2, contentLength) {
    assert(contentLength !== 0 || client2[kRunning] === 0, "stream body cannot be pipelined");
    const pipe = pipeline(
      body2,
      h2stream,
      (err) => {
        if (err) {
          util2.destroy(pipe, err);
          abort(err);
        } else {
          util2.removeAllListeners(pipe);
          request2.onRequestSent();
          if (!expectsPayload) {
            socket[kReset] = true;
          }
          client2[kResume]();
        }
      }
    );
    util2.addListener(pipe, "data", onPipeData);
    function onPipeData(chunk) {
      request2.onBodySent(chunk);
    }
  }
  async function writeBlob(abort, h2stream, body2, client2, request2, socket, contentLength, expectsPayload) {
    assert(contentLength === body2.size, "blob body must have content length");
    try {
      if (contentLength != null && contentLength !== body2.size) {
        throw new RequestContentLengthMismatchError();
      }
      const buffer = Buffer.from(await body2.arrayBuffer());
      h2stream.cork();
      h2stream.write(buffer);
      h2stream.uncork();
      h2stream.end();
      request2.onBodySent(buffer);
      request2.onRequestSent();
      if (!expectsPayload) {
        socket[kReset] = true;
      }
      client2[kResume]();
    } catch (err) {
      abort(err);
    }
  }
  async function writeIterable(abort, h2stream, body2, client2, request2, socket, contentLength, expectsPayload) {
    assert(contentLength !== 0 || client2[kRunning] === 0, "iterator body cannot be pipelined");
    let callback = null;
    function onDrain() {
      if (callback) {
        const cb = callback;
        callback = null;
        cb();
      }
    }
    const waitForDrain = () => new Promise((resolve, reject) => {
      assert(callback === null);
      if (socket[kError]) {
        reject(socket[kError]);
      } else {
        callback = resolve;
      }
    });
    h2stream.on("close", onDrain).on("drain", onDrain);
    try {
      for await (const chunk of body2) {
        if (socket[kError]) {
          throw socket[kError];
        }
        const res = h2stream.write(chunk);
        request2.onBodySent(chunk);
        if (!res) {
          await waitForDrain();
        }
      }
      h2stream.end();
      request2.onRequestSent();
      if (!expectsPayload) {
        socket[kReset] = true;
      }
      client2[kResume]();
    } catch (err) {
      abort(err);
    } finally {
      h2stream.off("close", onDrain).off("drain", onDrain);
    }
  }
  clientH2 = connectH2;
  return clientH2;
}
var client;
var hasRequiredClient;
function requireClient() {
  if (hasRequiredClient) return client;
  hasRequiredClient = 1;
  const assert = require$$0$1;
  const net = require$$0$2;
  const http = require$$2;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { ClientStats } = /* @__PURE__ */ requireStats();
  const { channels } = /* @__PURE__ */ requireDiagnostics();
  const Request = /* @__PURE__ */ requireRequest$1();
  const DispatcherBase = /* @__PURE__ */ requireDispatcherBase();
  const {
    InvalidArgumentError,
    InformationalError,
    ClientDestroyedError
  } = /* @__PURE__ */ requireErrors();
  const buildConnector = /* @__PURE__ */ requireConnect();
  const {
    kUrl,
    kServerName,
    kClient,
    kBusy,
    kConnect,
    kResuming,
    kRunning,
    kPending,
    kSize,
    kQueue,
    kConnected,
    kConnecting,
    kNeedDrain,
    kKeepAliveDefaultTimeout,
    kHostHeader,
    kPendingIdx,
    kRunningIdx,
    kError,
    kPipelining,
    kKeepAliveTimeoutValue,
    kMaxHeadersSize,
    kKeepAliveMaxTimeout,
    kKeepAliveTimeoutThreshold,
    kHeadersTimeout,
    kBodyTimeout,
    kStrictContentLength,
    kConnector,
    kMaxRequests,
    kCounter,
    kClose,
    kDestroy,
    kDispatch,
    kLocalAddress,
    kMaxResponseSize,
    kOnError,
    kHTTPContext,
    kMaxConcurrentStreams,
    kHTTP2InitialWindowSize,
    kHTTP2ConnectionWindowSize,
    kResume
  } = /* @__PURE__ */ requireSymbols();
  const connectH1 = /* @__PURE__ */ requireClientH1();
  const connectH2 = /* @__PURE__ */ requireClientH2();
  const kClosedResolve = Symbol("kClosedResolve");
  const getDefaultNodeMaxHeaderSize = http && http.maxHeaderSize && Number.isInteger(http.maxHeaderSize) && http.maxHeaderSize > 0 ? () => http.maxHeaderSize : () => {
    throw new InvalidArgumentError("http module not available or http.maxHeaderSize invalid");
  };
  const noop = () => {
  };
  function getPipelining(client2) {
    return client2[kPipelining] ?? client2[kHTTPContext]?.defaultPipelining ?? 1;
  }
  class Client extends DispatcherBase {
    /**
     *
     * @param {string|URL} url
     * @param {import('../../types/client.js').Client.Options} options
     */
    constructor(url, {
      maxHeaderSize,
      headersTimeout,
      socketTimeout,
      requestTimeout,
      connectTimeout,
      bodyTimeout,
      idleTimeout,
      keepAlive,
      keepAliveTimeout,
      maxKeepAliveTimeout,
      keepAliveMaxTimeout,
      keepAliveTimeoutThreshold,
      socketPath,
      pipelining,
      tls,
      strictContentLength,
      maxCachedSessions,
      connect: connect3,
      maxRequestsPerClient,
      localAddress,
      maxResponseSize,
      autoSelectFamily,
      autoSelectFamilyAttemptTimeout,
      // h2
      maxConcurrentStreams,
      allowH2,
      useH2c,
      initialWindowSize,
      connectionWindowSize
    } = {}) {
      if (keepAlive !== void 0) {
        throw new InvalidArgumentError("unsupported keepAlive, use pipelining=0 instead");
      }
      if (socketTimeout !== void 0) {
        throw new InvalidArgumentError("unsupported socketTimeout, use headersTimeout & bodyTimeout instead");
      }
      if (requestTimeout !== void 0) {
        throw new InvalidArgumentError("unsupported requestTimeout, use headersTimeout & bodyTimeout instead");
      }
      if (idleTimeout !== void 0) {
        throw new InvalidArgumentError("unsupported idleTimeout, use keepAliveTimeout instead");
      }
      if (maxKeepAliveTimeout !== void 0) {
        throw new InvalidArgumentError("unsupported maxKeepAliveTimeout, use keepAliveMaxTimeout instead");
      }
      if (maxHeaderSize != null) {
        if (!Number.isInteger(maxHeaderSize) || maxHeaderSize < 1) {
          throw new InvalidArgumentError("invalid maxHeaderSize");
        }
      } else {
        maxHeaderSize = getDefaultNodeMaxHeaderSize();
      }
      if (socketPath != null && typeof socketPath !== "string") {
        throw new InvalidArgumentError("invalid socketPath");
      }
      if (connectTimeout != null && (!Number.isFinite(connectTimeout) || connectTimeout < 0)) {
        throw new InvalidArgumentError("invalid connectTimeout");
      }
      if (keepAliveTimeout != null && (!Number.isFinite(keepAliveTimeout) || keepAliveTimeout <= 0)) {
        throw new InvalidArgumentError("invalid keepAliveTimeout");
      }
      if (keepAliveMaxTimeout != null && (!Number.isFinite(keepAliveMaxTimeout) || keepAliveMaxTimeout <= 0)) {
        throw new InvalidArgumentError("invalid keepAliveMaxTimeout");
      }
      if (keepAliveTimeoutThreshold != null && !Number.isFinite(keepAliveTimeoutThreshold)) {
        throw new InvalidArgumentError("invalid keepAliveTimeoutThreshold");
      }
      if (headersTimeout != null && (!Number.isInteger(headersTimeout) || headersTimeout < 0)) {
        throw new InvalidArgumentError("headersTimeout must be a positive integer or zero");
      }
      if (bodyTimeout != null && (!Number.isInteger(bodyTimeout) || bodyTimeout < 0)) {
        throw new InvalidArgumentError("bodyTimeout must be a positive integer or zero");
      }
      if (connect3 != null && typeof connect3 !== "function" && typeof connect3 !== "object") {
        throw new InvalidArgumentError("connect must be a function or an object");
      }
      if (maxRequestsPerClient != null && (!Number.isInteger(maxRequestsPerClient) || maxRequestsPerClient < 0)) {
        throw new InvalidArgumentError("maxRequestsPerClient must be a positive number");
      }
      if (localAddress != null && (typeof localAddress !== "string" || net.isIP(localAddress) === 0)) {
        throw new InvalidArgumentError("localAddress must be valid string IP address");
      }
      if (maxResponseSize != null && (!Number.isInteger(maxResponseSize) || maxResponseSize < -1)) {
        throw new InvalidArgumentError("maxResponseSize must be a positive number");
      }
      if (autoSelectFamilyAttemptTimeout != null && (!Number.isInteger(autoSelectFamilyAttemptTimeout) || autoSelectFamilyAttemptTimeout < -1)) {
        throw new InvalidArgumentError("autoSelectFamilyAttemptTimeout must be a positive number");
      }
      if (allowH2 != null && typeof allowH2 !== "boolean") {
        throw new InvalidArgumentError("allowH2 must be a valid boolean value");
      }
      if (maxConcurrentStreams != null && (typeof maxConcurrentStreams !== "number" || maxConcurrentStreams < 1)) {
        throw new InvalidArgumentError("maxConcurrentStreams must be a positive integer, greater than 0");
      }
      if (useH2c != null && typeof useH2c !== "boolean") {
        throw new InvalidArgumentError("useH2c must be a valid boolean value");
      }
      if (initialWindowSize != null && (!Number.isInteger(initialWindowSize) || initialWindowSize < 1)) {
        throw new InvalidArgumentError("initialWindowSize must be a positive integer, greater than 0");
      }
      if (connectionWindowSize != null && (!Number.isInteger(connectionWindowSize) || connectionWindowSize < 1)) {
        throw new InvalidArgumentError("connectionWindowSize must be a positive integer, greater than 0");
      }
      super();
      if (typeof connect3 !== "function") {
        connect3 = buildConnector({
          ...tls,
          maxCachedSessions,
          allowH2,
          useH2c,
          socketPath,
          timeout: connectTimeout,
          ...typeof autoSelectFamily === "boolean" ? { autoSelectFamily, autoSelectFamilyAttemptTimeout } : void 0,
          ...connect3
        });
      }
      this[kUrl] = util2.parseOrigin(url);
      this[kConnector] = connect3;
      this[kPipelining] = pipelining != null ? pipelining : 1;
      this[kMaxHeadersSize] = maxHeaderSize;
      this[kKeepAliveDefaultTimeout] = keepAliveTimeout == null ? 4e3 : keepAliveTimeout;
      this[kKeepAliveMaxTimeout] = keepAliveMaxTimeout == null ? 6e5 : keepAliveMaxTimeout;
      this[kKeepAliveTimeoutThreshold] = keepAliveTimeoutThreshold == null ? 2e3 : keepAliveTimeoutThreshold;
      this[kKeepAliveTimeoutValue] = this[kKeepAliveDefaultTimeout];
      this[kServerName] = null;
      this[kLocalAddress] = localAddress != null ? localAddress : null;
      this[kResuming] = 0;
      this[kNeedDrain] = 0;
      this[kHostHeader] = `host: ${this[kUrl].hostname}${this[kUrl].port ? `:${this[kUrl].port}` : ""}\r
`;
      this[kBodyTimeout] = bodyTimeout != null ? bodyTimeout : 3e5;
      this[kHeadersTimeout] = headersTimeout != null ? headersTimeout : 3e5;
      this[kStrictContentLength] = strictContentLength == null ? true : strictContentLength;
      this[kMaxRequests] = maxRequestsPerClient;
      this[kClosedResolve] = null;
      this[kMaxResponseSize] = maxResponseSize > -1 ? maxResponseSize : -1;
      this[kMaxConcurrentStreams] = maxConcurrentStreams != null ? maxConcurrentStreams : 100;
      this[kHTTP2InitialWindowSize] = initialWindowSize != null ? initialWindowSize : 262144;
      this[kHTTP2ConnectionWindowSize] = connectionWindowSize != null ? connectionWindowSize : 524288;
      this[kHTTPContext] = null;
      this[kQueue] = [];
      this[kRunningIdx] = 0;
      this[kPendingIdx] = 0;
      this[kResume] = (sync) => resume(this, sync);
      this[kOnError] = (err) => onError(this, err);
    }
    get pipelining() {
      return this[kPipelining];
    }
    set pipelining(value) {
      this[kPipelining] = value;
      this[kResume](true);
    }
    get stats() {
      return new ClientStats(this);
    }
    get [kPending]() {
      return this[kQueue].length - this[kPendingIdx];
    }
    get [kRunning]() {
      return this[kPendingIdx] - this[kRunningIdx];
    }
    get [kSize]() {
      return this[kQueue].length - this[kRunningIdx];
    }
    get [kConnected]() {
      return !!this[kHTTPContext] && !this[kConnecting] && !this[kHTTPContext].destroyed;
    }
    get [kBusy]() {
      return Boolean(
        this[kHTTPContext]?.busy(null) || this[kSize] >= (getPipelining(this) || 1) || this[kPending] > 0
      );
    }
    [kConnect](cb) {
      connect2(this);
      this.once("connect", cb);
    }
    [kDispatch](opts, handler) {
      const request2 = new Request(this[kUrl].origin, opts, handler);
      this[kQueue].push(request2);
      if (this[kResuming]) ;
      else if (util2.bodyLength(request2.body) == null && util2.isIterable(request2.body)) {
        this[kResuming] = 1;
        queueMicrotask(() => resume(this));
      } else {
        this[kResume](true);
      }
      if (this[kResuming] && this[kNeedDrain] !== 2 && this[kBusy]) {
        this[kNeedDrain] = 2;
      }
      return this[kNeedDrain] < 2;
    }
    [kClose]() {
      return new Promise((resolve) => {
        if (this[kSize]) {
          this[kClosedResolve] = resolve;
        } else {
          resolve(null);
        }
      });
    }
    [kDestroy](err) {
      return new Promise((resolve) => {
        const requests = this[kQueue].splice(this[kPendingIdx]);
        for (let i = 0; i < requests.length; i++) {
          const request2 = requests[i];
          util2.errorRequest(this, request2, err);
        }
        const callback = () => {
          if (this[kClosedResolve]) {
            this[kClosedResolve]();
            this[kClosedResolve] = null;
          }
          resolve(null);
        };
        if (this[kHTTPContext]) {
          this[kHTTPContext].destroy(err, callback);
          this[kHTTPContext] = null;
        } else {
          queueMicrotask(callback);
        }
        this[kResume]();
      });
    }
  }
  function onError(client2, err) {
    if (client2[kRunning] === 0 && err.code !== "UND_ERR_INFO" && err.code !== "UND_ERR_SOCKET") {
      assert(client2[kPendingIdx] === client2[kRunningIdx]);
      const requests = client2[kQueue].splice(client2[kRunningIdx]);
      for (let i = 0; i < requests.length; i++) {
        const request2 = requests[i];
        util2.errorRequest(client2, request2, err);
      }
      assert(client2[kSize] === 0);
    }
  }
  function connect2(client2) {
    assert(!client2[kConnecting]);
    assert(!client2[kHTTPContext]);
    let { host, hostname, protocol, port } = client2[kUrl];
    if (hostname[0] === "[") {
      const idx = hostname.indexOf("]");
      assert(idx !== -1);
      const ip = hostname.substring(1, idx);
      assert(net.isIPv6(ip));
      hostname = ip;
    }
    client2[kConnecting] = true;
    if (channels.beforeConnect.hasSubscribers) {
      channels.beforeConnect.publish({
        connectParams: {
          host,
          hostname,
          protocol,
          port,
          version: client2[kHTTPContext]?.version,
          servername: client2[kServerName],
          localAddress: client2[kLocalAddress]
        },
        connector: client2[kConnector]
      });
    }
    client2[kConnector]({
      host,
      hostname,
      protocol,
      port,
      servername: client2[kServerName],
      localAddress: client2[kLocalAddress]
    }, (err, socket) => {
      if (err) {
        handleConnectError(client2, err, { host, hostname, protocol, port });
        client2[kResume]();
        return;
      }
      if (client2.destroyed) {
        util2.destroy(socket.on("error", noop), new ClientDestroyedError());
        client2[kResume]();
        return;
      }
      assert(socket);
      try {
        client2[kHTTPContext] = socket.alpnProtocol === "h2" ? connectH2(client2, socket) : connectH1(client2, socket);
      } catch (err2) {
        socket.destroy().on("error", noop);
        handleConnectError(client2, err2, { host, hostname, protocol, port });
        client2[kResume]();
        return;
      }
      client2[kConnecting] = false;
      socket[kCounter] = 0;
      socket[kMaxRequests] = client2[kMaxRequests];
      socket[kClient] = client2;
      socket[kError] = null;
      if (channels.connected.hasSubscribers) {
        channels.connected.publish({
          connectParams: {
            host,
            hostname,
            protocol,
            port,
            version: client2[kHTTPContext]?.version,
            servername: client2[kServerName],
            localAddress: client2[kLocalAddress]
          },
          connector: client2[kConnector],
          socket
        });
      }
      client2.emit("connect", client2[kUrl], [client2]);
      client2[kResume]();
    });
  }
  function handleConnectError(client2, err, { host, hostname, protocol, port }) {
    if (client2.destroyed) {
      return;
    }
    client2[kConnecting] = false;
    if (channels.connectError.hasSubscribers) {
      channels.connectError.publish({
        connectParams: {
          host,
          hostname,
          protocol,
          port,
          version: client2[kHTTPContext]?.version,
          servername: client2[kServerName],
          localAddress: client2[kLocalAddress]
        },
        connector: client2[kConnector],
        error: err
      });
    }
    if (err.code === "ERR_TLS_CERT_ALTNAME_INVALID") {
      assert(client2[kRunning] === 0);
      while (client2[kPending] > 0 && client2[kQueue][client2[kPendingIdx]].servername === client2[kServerName]) {
        const request2 = client2[kQueue][client2[kPendingIdx]++];
        util2.errorRequest(client2, request2, err);
      }
    } else {
      onError(client2, err);
    }
    client2.emit("connectionError", client2[kUrl], [client2], err);
  }
  function emitDrain(client2) {
    client2[kNeedDrain] = 0;
    client2.emit("drain", client2[kUrl], [client2]);
  }
  function resume(client2, sync) {
    if (client2[kResuming] === 2) {
      return;
    }
    client2[kResuming] = 2;
    _resume(client2, sync);
    client2[kResuming] = 0;
    if (client2[kRunningIdx] > 256) {
      client2[kQueue].splice(0, client2[kRunningIdx]);
      client2[kPendingIdx] -= client2[kRunningIdx];
      client2[kRunningIdx] = 0;
    }
  }
  function _resume(client2, sync) {
    while (true) {
      if (client2.destroyed) {
        assert(client2[kPending] === 0);
        return;
      }
      if (client2[kClosedResolve] && !client2[kSize]) {
        client2[kClosedResolve]();
        client2[kClosedResolve] = null;
        return;
      }
      if (client2[kHTTPContext]) {
        client2[kHTTPContext].resume();
      }
      if (client2[kBusy]) {
        client2[kNeedDrain] = 2;
      } else if (client2[kNeedDrain] === 2) {
        if (sync) {
          client2[kNeedDrain] = 1;
          queueMicrotask(() => emitDrain(client2));
        } else {
          emitDrain(client2);
        }
        continue;
      }
      if (client2[kPending] === 0) {
        return;
      }
      if (client2[kRunning] >= (getPipelining(client2) || 1)) {
        return;
      }
      const request2 = client2[kQueue][client2[kPendingIdx]];
      if (client2[kUrl].protocol === "https:" && client2[kServerName] !== request2.servername) {
        if (client2[kRunning] > 0) {
          return;
        }
        client2[kServerName] = request2.servername;
        client2[kHTTPContext]?.destroy(new InformationalError("servername changed"), () => {
          client2[kHTTPContext] = null;
          resume(client2);
        });
      }
      if (client2[kConnecting]) {
        return;
      }
      if (!client2[kHTTPContext]) {
        connect2(client2);
        return;
      }
      if (client2[kHTTPContext].destroyed) {
        return;
      }
      if (client2[kHTTPContext].busy(request2)) {
        return;
      }
      if (!request2.aborted && client2[kHTTPContext].write(request2)) {
        client2[kPendingIdx]++;
      } else {
        client2[kQueue].splice(client2[kPendingIdx], 1);
      }
    }
  }
  client = Client;
  return client;
}
var fixedQueue;
var hasRequiredFixedQueue;
function requireFixedQueue() {
  if (hasRequiredFixedQueue) return fixedQueue;
  hasRequiredFixedQueue = 1;
  const kSize = 2048;
  const kMask = kSize - 1;
  class FixedCircularBuffer {
    /** @type {number} */
    bottom = 0;
    /** @type {number} */
    top = 0;
    /** @type {Array<T|undefined>} */
    list = new Array(kSize).fill(void 0);
    /** @type {T|null} */
    next = null;
    /** @returns {boolean} */
    isEmpty() {
      return this.top === this.bottom;
    }
    /** @returns {boolean} */
    isFull() {
      return (this.top + 1 & kMask) === this.bottom;
    }
    /**
     * @param {T} data
     * @returns {void}
     */
    push(data) {
      this.list[this.top] = data;
      this.top = this.top + 1 & kMask;
    }
    /** @returns {T|null} */
    shift() {
      const nextItem = this.list[this.bottom];
      if (nextItem === void 0) {
        return null;
      }
      this.list[this.bottom] = void 0;
      this.bottom = this.bottom + 1 & kMask;
      return nextItem;
    }
  }
  fixedQueue = class FixedQueue {
    constructor() {
      this.head = this.tail = new FixedCircularBuffer();
    }
    /** @returns {boolean} */
    isEmpty() {
      return this.head.isEmpty();
    }
    /** @param {T} data */
    push(data) {
      if (this.head.isFull()) {
        this.head = this.head.next = new FixedCircularBuffer();
      }
      this.head.push(data);
    }
    /** @returns {T|null} */
    shift() {
      const tail = this.tail;
      const next = tail.shift();
      if (tail.isEmpty() && tail.next !== null) {
        this.tail = tail.next;
        tail.next = null;
      }
      return next;
    }
  };
  return fixedQueue;
}
var poolBase;
var hasRequiredPoolBase;
function requirePoolBase() {
  if (hasRequiredPoolBase) return poolBase;
  hasRequiredPoolBase = 1;
  const { PoolStats } = /* @__PURE__ */ requireStats();
  const DispatcherBase = /* @__PURE__ */ requireDispatcherBase();
  const FixedQueue = /* @__PURE__ */ requireFixedQueue();
  const { kConnected, kSize, kRunning, kPending, kQueued, kBusy, kFree, kUrl, kClose, kDestroy, kDispatch } = /* @__PURE__ */ requireSymbols();
  const kClients = Symbol("clients");
  const kNeedDrain = Symbol("needDrain");
  const kQueue = Symbol("queue");
  const kClosedResolve = Symbol("closed resolve");
  const kOnDrain = Symbol("onDrain");
  const kOnConnect = Symbol("onConnect");
  const kOnDisconnect = Symbol("onDisconnect");
  const kOnConnectionError = Symbol("onConnectionError");
  const kGetDispatcher = Symbol("get dispatcher");
  const kAddClient = Symbol("add client");
  const kRemoveClient = Symbol("remove client");
  class PoolBase extends DispatcherBase {
    [kQueue] = new FixedQueue();
    [kQueued] = 0;
    [kClients] = [];
    [kNeedDrain] = false;
    [kOnDrain](client2, origin, targets) {
      const queue = this[kQueue];
      let needDrain = false;
      while (!needDrain) {
        const item = queue.shift();
        if (!item) {
          break;
        }
        this[kQueued]--;
        needDrain = !client2.dispatch(item.opts, item.handler);
      }
      client2[kNeedDrain] = needDrain;
      if (!needDrain && this[kNeedDrain]) {
        this[kNeedDrain] = false;
        this.emit("drain", origin, [this, ...targets]);
      }
      if (this[kClosedResolve] && queue.isEmpty()) {
        const closeAll = new Array(this[kClients].length);
        for (let i = 0; i < this[kClients].length; i++) {
          closeAll[i] = this[kClients][i].close();
        }
        return Promise.all(closeAll).then(this[kClosedResolve]);
      }
    }
    [kOnConnect] = (origin, targets) => {
      this.emit("connect", origin, [this, ...targets]);
    };
    [kOnDisconnect] = (origin, targets, err) => {
      this.emit("disconnect", origin, [this, ...targets], err);
    };
    [kOnConnectionError] = (origin, targets, err) => {
      this.emit("connectionError", origin, [this, ...targets], err);
    };
    get [kBusy]() {
      return this[kNeedDrain];
    }
    get [kConnected]() {
      let ret = 0;
      for (const { [kConnected]: connected } of this[kClients]) {
        ret += connected;
      }
      return ret;
    }
    get [kFree]() {
      let ret = 0;
      for (const { [kConnected]: connected, [kNeedDrain]: needDrain } of this[kClients]) {
        ret += connected && !needDrain;
      }
      return ret;
    }
    get [kPending]() {
      let ret = this[kQueued];
      for (const { [kPending]: pending } of this[kClients]) {
        ret += pending;
      }
      return ret;
    }
    get [kRunning]() {
      let ret = 0;
      for (const { [kRunning]: running } of this[kClients]) {
        ret += running;
      }
      return ret;
    }
    get [kSize]() {
      let ret = this[kQueued];
      for (const { [kSize]: size } of this[kClients]) {
        ret += size;
      }
      return ret;
    }
    get stats() {
      return new PoolStats(this);
    }
    [kClose]() {
      if (this[kQueue].isEmpty()) {
        const closeAll = new Array(this[kClients].length);
        for (let i = 0; i < this[kClients].length; i++) {
          closeAll[i] = this[kClients][i].close();
        }
        return Promise.all(closeAll);
      } else {
        return new Promise((resolve) => {
          this[kClosedResolve] = resolve;
        });
      }
    }
    [kDestroy](err) {
      while (true) {
        const item = this[kQueue].shift();
        if (!item) {
          break;
        }
        item.handler.onError(err);
      }
      const destroyAll = new Array(this[kClients].length);
      for (let i = 0; i < this[kClients].length; i++) {
        destroyAll[i] = this[kClients][i].destroy(err);
      }
      return Promise.all(destroyAll);
    }
    [kDispatch](opts, handler) {
      const dispatcher2 = this[kGetDispatcher]();
      if (!dispatcher2) {
        this[kNeedDrain] = true;
        this[kQueue].push({ opts, handler });
        this[kQueued]++;
      } else if (!dispatcher2.dispatch(opts, handler)) {
        dispatcher2[kNeedDrain] = true;
        this[kNeedDrain] = !this[kGetDispatcher]();
      }
      return !this[kNeedDrain];
    }
    [kAddClient](client2) {
      client2.on("drain", this[kOnDrain].bind(this, client2)).on("connect", this[kOnConnect]).on("disconnect", this[kOnDisconnect]).on("connectionError", this[kOnConnectionError]);
      this[kClients].push(client2);
      if (this[kNeedDrain]) {
        queueMicrotask(() => {
          if (this[kNeedDrain]) {
            this[kOnDrain](client2, client2[kUrl], [client2, this]);
          }
        });
      }
      return this;
    }
    [kRemoveClient](client2) {
      client2.close(() => {
        const idx = this[kClients].indexOf(client2);
        if (idx !== -1) {
          this[kClients].splice(idx, 1);
        }
      });
      this[kNeedDrain] = this[kClients].some((dispatcher2) => !dispatcher2[kNeedDrain] && dispatcher2.closed !== true && dispatcher2.destroyed !== true);
    }
  }
  poolBase = {
    PoolBase,
    kClients,
    kNeedDrain,
    kAddClient,
    kRemoveClient,
    kGetDispatcher
  };
  return poolBase;
}
var pool;
var hasRequiredPool;
function requirePool() {
  if (hasRequiredPool) return pool;
  hasRequiredPool = 1;
  const {
    PoolBase,
    kClients,
    kNeedDrain,
    kAddClient,
    kGetDispatcher,
    kRemoveClient
  } = /* @__PURE__ */ requirePoolBase();
  const Client = /* @__PURE__ */ requireClient();
  const {
    InvalidArgumentError
  } = /* @__PURE__ */ requireErrors();
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { kUrl } = /* @__PURE__ */ requireSymbols();
  const buildConnector = /* @__PURE__ */ requireConnect();
  const kOptions = Symbol("options");
  const kConnections = Symbol("connections");
  const kFactory = Symbol("factory");
  function defaultFactory(origin, opts) {
    return new Client(origin, opts);
  }
  class Pool extends PoolBase {
    constructor(origin, {
      connections,
      factory = defaultFactory,
      connect: connect2,
      connectTimeout,
      tls,
      maxCachedSessions,
      socketPath,
      autoSelectFamily,
      autoSelectFamilyAttemptTimeout,
      allowH2,
      clientTtl,
      ...options
    } = {}) {
      if (connections != null && (!Number.isFinite(connections) || connections < 0)) {
        throw new InvalidArgumentError("invalid connections");
      }
      if (typeof factory !== "function") {
        throw new InvalidArgumentError("factory must be a function.");
      }
      if (connect2 != null && typeof connect2 !== "function" && typeof connect2 !== "object") {
        throw new InvalidArgumentError("connect must be a function or an object");
      }
      if (typeof connect2 !== "function") {
        connect2 = buildConnector({
          ...tls,
          maxCachedSessions,
          allowH2,
          socketPath,
          timeout: connectTimeout,
          ...typeof autoSelectFamily === "boolean" ? { autoSelectFamily, autoSelectFamilyAttemptTimeout } : void 0,
          ...connect2
        });
      }
      super();
      this[kConnections] = connections || null;
      this[kUrl] = util2.parseOrigin(origin);
      this[kOptions] = { ...util2.deepClone(options), connect: connect2, allowH2, clientTtl };
      this[kOptions].interceptors = options.interceptors ? { ...options.interceptors } : void 0;
      this[kFactory] = factory;
      this.on("connect", (origin2, targets) => {
        if (clientTtl != null && clientTtl > 0) {
          for (const target of targets) {
            Object.assign(target, { ttl: Date.now() });
          }
        }
      });
      this.on("connectionError", (origin2, targets, error) => {
        for (const target of targets) {
          const idx = this[kClients].indexOf(target);
          if (idx !== -1) {
            this[kClients].splice(idx, 1);
          }
        }
      });
    }
    [kGetDispatcher]() {
      const clientTtlOption = this[kOptions].clientTtl;
      for (const client2 of this[kClients]) {
        if (clientTtlOption != null && clientTtlOption > 0 && client2.ttl && Date.now() - client2.ttl > clientTtlOption) {
          this[kRemoveClient](client2);
        } else if (!client2[kNeedDrain]) {
          return client2;
        }
      }
      if (!this[kConnections] || this[kClients].length < this[kConnections]) {
        const dispatcher2 = this[kFactory](this[kUrl], this[kOptions]);
        this[kAddClient](dispatcher2);
        return dispatcher2;
      }
    }
  }
  pool = Pool;
  return pool;
}
var balancedPool;
var hasRequiredBalancedPool;
function requireBalancedPool() {
  if (hasRequiredBalancedPool) return balancedPool;
  hasRequiredBalancedPool = 1;
  const {
    BalancedPoolMissingUpstreamError,
    InvalidArgumentError
  } = /* @__PURE__ */ requireErrors();
  const {
    PoolBase,
    kClients,
    kNeedDrain,
    kAddClient,
    kRemoveClient,
    kGetDispatcher
  } = /* @__PURE__ */ requirePoolBase();
  const Pool = /* @__PURE__ */ requirePool();
  const { kUrl } = /* @__PURE__ */ requireSymbols();
  const { parseOrigin } = /* @__PURE__ */ requireUtil$5();
  const kFactory = Symbol("factory");
  const kOptions = Symbol("options");
  const kGreatestCommonDivisor = Symbol("kGreatestCommonDivisor");
  const kCurrentWeight = Symbol("kCurrentWeight");
  const kIndex = Symbol("kIndex");
  const kWeight = Symbol("kWeight");
  const kMaxWeightPerServer = Symbol("kMaxWeightPerServer");
  const kErrorPenalty = Symbol("kErrorPenalty");
  function getGreatestCommonDivisor(a, b) {
    if (a === 0) return b;
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }
  function defaultFactory(origin, opts) {
    return new Pool(origin, opts);
  }
  class BalancedPool extends PoolBase {
    constructor(upstreams = [], { factory = defaultFactory, ...opts } = {}) {
      if (typeof factory !== "function") {
        throw new InvalidArgumentError("factory must be a function.");
      }
      super();
      this[kOptions] = opts;
      this[kIndex] = -1;
      this[kCurrentWeight] = 0;
      this[kMaxWeightPerServer] = this[kOptions].maxWeightPerServer || 100;
      this[kErrorPenalty] = this[kOptions].errorPenalty || 15;
      if (!Array.isArray(upstreams)) {
        upstreams = [upstreams];
      }
      this[kFactory] = factory;
      for (const upstream of upstreams) {
        this.addUpstream(upstream);
      }
      this._updateBalancedPoolStats();
    }
    addUpstream(upstream) {
      const upstreamOrigin = parseOrigin(upstream).origin;
      if (this[kClients].find((pool3) => pool3[kUrl].origin === upstreamOrigin && pool3.closed !== true && pool3.destroyed !== true)) {
        return this;
      }
      const pool2 = this[kFactory](upstreamOrigin, Object.assign({}, this[kOptions]));
      this[kAddClient](pool2);
      pool2.on("connect", () => {
        pool2[kWeight] = Math.min(this[kMaxWeightPerServer], pool2[kWeight] + this[kErrorPenalty]);
      });
      pool2.on("connectionError", () => {
        pool2[kWeight] = Math.max(1, pool2[kWeight] - this[kErrorPenalty]);
        this._updateBalancedPoolStats();
      });
      pool2.on("disconnect", (...args) => {
        const err = args[2];
        if (err && err.code === "UND_ERR_SOCKET") {
          pool2[kWeight] = Math.max(1, pool2[kWeight] - this[kErrorPenalty]);
          this._updateBalancedPoolStats();
        }
      });
      for (const client2 of this[kClients]) {
        client2[kWeight] = this[kMaxWeightPerServer];
      }
      this._updateBalancedPoolStats();
      return this;
    }
    _updateBalancedPoolStats() {
      let result = 0;
      for (let i = 0; i < this[kClients].length; i++) {
        result = getGreatestCommonDivisor(this[kClients][i][kWeight], result);
      }
      this[kGreatestCommonDivisor] = result;
    }
    removeUpstream(upstream) {
      const upstreamOrigin = parseOrigin(upstream).origin;
      const pool2 = this[kClients].find((pool3) => pool3[kUrl].origin === upstreamOrigin && pool3.closed !== true && pool3.destroyed !== true);
      if (pool2) {
        this[kRemoveClient](pool2);
      }
      return this;
    }
    getUpstream(upstream) {
      const upstreamOrigin = parseOrigin(upstream).origin;
      return this[kClients].find((pool2) => pool2[kUrl].origin === upstreamOrigin && pool2.closed !== true && pool2.destroyed !== true);
    }
    get upstreams() {
      return this[kClients].filter((dispatcher2) => dispatcher2.closed !== true && dispatcher2.destroyed !== true).map((p) => p[kUrl].origin);
    }
    [kGetDispatcher]() {
      if (this[kClients].length === 0) {
        throw new BalancedPoolMissingUpstreamError();
      }
      const dispatcher2 = this[kClients].find((dispatcher3) => !dispatcher3[kNeedDrain] && dispatcher3.closed !== true && dispatcher3.destroyed !== true);
      if (!dispatcher2) {
        return;
      }
      const allClientsBusy = this[kClients].map((pool2) => pool2[kNeedDrain]).reduce((a, b) => a && b, true);
      if (allClientsBusy) {
        return;
      }
      let counter = 0;
      let maxWeightIndex = this[kClients].findIndex((pool2) => !pool2[kNeedDrain]);
      while (counter++ < this[kClients].length) {
        this[kIndex] = (this[kIndex] + 1) % this[kClients].length;
        const pool2 = this[kClients][this[kIndex]];
        if (pool2[kWeight] > this[kClients][maxWeightIndex][kWeight] && !pool2[kNeedDrain]) {
          maxWeightIndex = this[kIndex];
        }
        if (this[kIndex] === 0) {
          this[kCurrentWeight] = this[kCurrentWeight] - this[kGreatestCommonDivisor];
          if (this[kCurrentWeight] <= 0) {
            this[kCurrentWeight] = this[kMaxWeightPerServer];
          }
        }
        if (pool2[kWeight] >= this[kCurrentWeight] && !pool2[kNeedDrain]) {
          return pool2;
        }
      }
      this[kCurrentWeight] = this[kClients][maxWeightIndex][kWeight];
      this[kIndex] = maxWeightIndex;
      return this[kClients][maxWeightIndex];
    }
  }
  balancedPool = BalancedPool;
  return balancedPool;
}
var roundRobinPool;
var hasRequiredRoundRobinPool;
function requireRoundRobinPool() {
  if (hasRequiredRoundRobinPool) return roundRobinPool;
  hasRequiredRoundRobinPool = 1;
  const {
    PoolBase,
    kClients,
    kNeedDrain,
    kAddClient,
    kGetDispatcher,
    kRemoveClient
  } = /* @__PURE__ */ requirePoolBase();
  const Client = /* @__PURE__ */ requireClient();
  const {
    InvalidArgumentError
  } = /* @__PURE__ */ requireErrors();
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { kUrl } = /* @__PURE__ */ requireSymbols();
  const buildConnector = /* @__PURE__ */ requireConnect();
  const kOptions = Symbol("options");
  const kConnections = Symbol("connections");
  const kFactory = Symbol("factory");
  const kIndex = Symbol("index");
  function defaultFactory(origin, opts) {
    return new Client(origin, opts);
  }
  class RoundRobinPool extends PoolBase {
    constructor(origin, {
      connections,
      factory = defaultFactory,
      connect: connect2,
      connectTimeout,
      tls,
      maxCachedSessions,
      socketPath,
      autoSelectFamily,
      autoSelectFamilyAttemptTimeout,
      allowH2,
      clientTtl,
      ...options
    } = {}) {
      if (connections != null && (!Number.isFinite(connections) || connections < 0)) {
        throw new InvalidArgumentError("invalid connections");
      }
      if (typeof factory !== "function") {
        throw new InvalidArgumentError("factory must be a function.");
      }
      if (connect2 != null && typeof connect2 !== "function" && typeof connect2 !== "object") {
        throw new InvalidArgumentError("connect must be a function or an object");
      }
      if (typeof connect2 !== "function") {
        connect2 = buildConnector({
          ...tls,
          maxCachedSessions,
          allowH2,
          socketPath,
          timeout: connectTimeout,
          ...typeof autoSelectFamily === "boolean" ? { autoSelectFamily, autoSelectFamilyAttemptTimeout } : void 0,
          ...connect2
        });
      }
      super();
      this[kConnections] = connections || null;
      this[kUrl] = util2.parseOrigin(origin);
      this[kOptions] = { ...util2.deepClone(options), connect: connect2, allowH2, clientTtl };
      this[kOptions].interceptors = options.interceptors ? { ...options.interceptors } : void 0;
      this[kFactory] = factory;
      this[kIndex] = -1;
      this.on("connect", (origin2, targets) => {
        if (clientTtl != null && clientTtl > 0) {
          for (const target of targets) {
            Object.assign(target, { ttl: Date.now() });
          }
        }
      });
      this.on("connectionError", (origin2, targets, error) => {
        for (const target of targets) {
          const idx = this[kClients].indexOf(target);
          if (idx !== -1) {
            this[kClients].splice(idx, 1);
          }
        }
      });
    }
    [kGetDispatcher]() {
      const clientTtlOption = this[kOptions].clientTtl;
      const clientsLength = this[kClients].length;
      if (clientsLength === 0) {
        const dispatcher2 = this[kFactory](this[kUrl], this[kOptions]);
        this[kAddClient](dispatcher2);
        return dispatcher2;
      }
      let checked = 0;
      while (checked < clientsLength) {
        this[kIndex] = (this[kIndex] + 1) % clientsLength;
        const client2 = this[kClients][this[kIndex]];
        if (clientTtlOption != null && clientTtlOption > 0 && client2.ttl && Date.now() - client2.ttl > clientTtlOption) {
          this[kRemoveClient](client2);
          checked++;
          continue;
        }
        if (!client2[kNeedDrain]) {
          return client2;
        }
        checked++;
      }
      if (!this[kConnections] || clientsLength < this[kConnections]) {
        const dispatcher2 = this[kFactory](this[kUrl], this[kOptions]);
        this[kAddClient](dispatcher2);
        return dispatcher2;
      }
    }
  }
  roundRobinPool = RoundRobinPool;
  return roundRobinPool;
}
var agent;
var hasRequiredAgent;
function requireAgent() {
  if (hasRequiredAgent) return agent;
  hasRequiredAgent = 1;
  const { InvalidArgumentError, MaxOriginsReachedError } = /* @__PURE__ */ requireErrors();
  const { kClients, kRunning, kClose, kDestroy, kDispatch, kUrl } = /* @__PURE__ */ requireSymbols();
  const DispatcherBase = /* @__PURE__ */ requireDispatcherBase();
  const Pool = /* @__PURE__ */ requirePool();
  const Client = /* @__PURE__ */ requireClient();
  const util2 = /* @__PURE__ */ requireUtil$5();
  const kOnConnect = Symbol("onConnect");
  const kOnDisconnect = Symbol("onDisconnect");
  const kOnConnectionError = Symbol("onConnectionError");
  const kOnDrain = Symbol("onDrain");
  const kFactory = Symbol("factory");
  const kOptions = Symbol("options");
  const kOrigins = Symbol("origins");
  function defaultFactory(origin, opts) {
    return opts && opts.connections === 1 ? new Client(origin, opts) : new Pool(origin, opts);
  }
  class Agent extends DispatcherBase {
    constructor({ factory = defaultFactory, maxOrigins = Infinity, connect: connect2, ...options } = {}) {
      if (typeof factory !== "function") {
        throw new InvalidArgumentError("factory must be a function.");
      }
      if (connect2 != null && typeof connect2 !== "function" && typeof connect2 !== "object") {
        throw new InvalidArgumentError("connect must be a function or an object");
      }
      if (typeof maxOrigins !== "number" || Number.isNaN(maxOrigins) || maxOrigins <= 0) {
        throw new InvalidArgumentError("maxOrigins must be a number greater than 0");
      }
      super();
      if (connect2 && typeof connect2 !== "function") {
        connect2 = { ...connect2 };
      }
      this[kOptions] = { ...util2.deepClone(options), maxOrigins, connect: connect2 };
      this[kFactory] = factory;
      this[kClients] = /* @__PURE__ */ new Map();
      this[kOrigins] = /* @__PURE__ */ new Set();
      this[kOnDrain] = (origin, targets) => {
        this.emit("drain", origin, [this, ...targets]);
      };
      this[kOnConnect] = (origin, targets) => {
        this.emit("connect", origin, [this, ...targets]);
      };
      this[kOnDisconnect] = (origin, targets, err) => {
        this.emit("disconnect", origin, [this, ...targets], err);
      };
      this[kOnConnectionError] = (origin, targets, err) => {
        this.emit("connectionError", origin, [this, ...targets], err);
      };
    }
    get [kRunning]() {
      let ret = 0;
      for (const { dispatcher: dispatcher2 } of this[kClients].values()) {
        ret += dispatcher2[kRunning];
      }
      return ret;
    }
    [kDispatch](opts, handler) {
      let key;
      if (opts.origin && (typeof opts.origin === "string" || opts.origin instanceof URL)) {
        key = String(opts.origin);
      } else {
        throw new InvalidArgumentError("opts.origin must be a non-empty string or URL.");
      }
      if (this[kOrigins].size >= this[kOptions].maxOrigins && !this[kOrigins].has(key)) {
        throw new MaxOriginsReachedError();
      }
      const result = this[kClients].get(key);
      let dispatcher2 = result && result.dispatcher;
      if (!dispatcher2) {
        const closeClientIfUnused = (connected) => {
          const result2 = this[kClients].get(key);
          if (result2) {
            if (connected) result2.count -= 1;
            if (result2.count <= 0) {
              this[kClients].delete(key);
              result2.dispatcher.close();
            }
            this[kOrigins].delete(key);
          }
        };
        dispatcher2 = this[kFactory](opts.origin, this[kOptions]).on("drain", this[kOnDrain]).on("connect", (origin, targets) => {
          const result2 = this[kClients].get(key);
          if (result2) {
            result2.count += 1;
          }
          this[kOnConnect](origin, targets);
        }).on("disconnect", (origin, targets, err) => {
          closeClientIfUnused(true);
          this[kOnDisconnect](origin, targets, err);
        }).on("connectionError", (origin, targets, err) => {
          closeClientIfUnused(false);
          this[kOnConnectionError](origin, targets, err);
        });
        this[kClients].set(key, { count: 0, dispatcher: dispatcher2 });
        this[kOrigins].add(key);
      }
      return dispatcher2.dispatch(opts, handler);
    }
    [kClose]() {
      const closePromises = [];
      for (const { dispatcher: dispatcher2 } of this[kClients].values()) {
        closePromises.push(dispatcher2.close());
      }
      this[kClients].clear();
      return Promise.all(closePromises);
    }
    [kDestroy](err) {
      const destroyPromises = [];
      for (const { dispatcher: dispatcher2 } of this[kClients].values()) {
        destroyPromises.push(dispatcher2.destroy(err));
      }
      this[kClients].clear();
      return Promise.all(destroyPromises);
    }
    get stats() {
      const allClientStats = {};
      for (const { dispatcher: dispatcher2 } of this[kClients].values()) {
        if (dispatcher2.stats) {
          allClientStats[dispatcher2[kUrl].origin] = dispatcher2.stats;
        }
      }
      return allClientStats;
    }
  }
  agent = Agent;
  return agent;
}
var proxyAgent;
var hasRequiredProxyAgent;
function requireProxyAgent() {
  if (hasRequiredProxyAgent) return proxyAgent;
  hasRequiredProxyAgent = 1;
  const { kProxy, kClose, kDestroy, kDispatch } = /* @__PURE__ */ requireSymbols();
  const Agent = /* @__PURE__ */ requireAgent();
  const Pool = /* @__PURE__ */ requirePool();
  const DispatcherBase = /* @__PURE__ */ requireDispatcherBase();
  const { InvalidArgumentError, RequestAbortedError, SecureProxyConnectionError } = /* @__PURE__ */ requireErrors();
  const buildConnector = /* @__PURE__ */ requireConnect();
  const Client = /* @__PURE__ */ requireClient();
  const { channels } = /* @__PURE__ */ requireDiagnostics();
  const kAgent = Symbol("proxy agent");
  const kClient = Symbol("proxy client");
  const kProxyHeaders = Symbol("proxy headers");
  const kRequestTls = Symbol("request tls settings");
  const kProxyTls = Symbol("proxy tls settings");
  const kConnectEndpoint = Symbol("connect endpoint function");
  const kTunnelProxy = Symbol("tunnel proxy");
  function defaultProtocolPort(protocol) {
    return protocol === "https:" ? 443 : 80;
  }
  function defaultFactory(origin, opts) {
    return new Pool(origin, opts);
  }
  const noop = () => {
  };
  function defaultAgentFactory(origin, opts) {
    if (opts.connections === 1) {
      return new Client(origin, opts);
    }
    return new Pool(origin, opts);
  }
  class Http1ProxyWrapper extends DispatcherBase {
    #client;
    constructor(proxyUrl, { headers: headers2 = {}, connect: connect2, factory }) {
      if (!proxyUrl) {
        throw new InvalidArgumentError("Proxy URL is mandatory");
      }
      super();
      this[kProxyHeaders] = headers2;
      if (factory) {
        this.#client = factory(proxyUrl, { connect: connect2 });
      } else {
        this.#client = new Client(proxyUrl, { connect: connect2 });
      }
    }
    [kDispatch](opts, handler) {
      const onHeaders = handler.onHeaders;
      handler.onHeaders = function(statusCode, data, resume) {
        if (statusCode === 407) {
          if (typeof handler.onError === "function") {
            handler.onError(new InvalidArgumentError("Proxy Authentication Required (407)"));
          }
          return;
        }
        if (onHeaders) onHeaders.call(this, statusCode, data, resume);
      };
      const {
        origin,
        path = "/",
        headers: headers2 = {}
      } = opts;
      opts.path = origin + path;
      if (!("host" in headers2) && !("Host" in headers2)) {
        const { host } = new URL(origin);
        headers2.host = host;
      }
      opts.headers = { ...this[kProxyHeaders], ...headers2 };
      return this.#client[kDispatch](opts, handler);
    }
    [kClose]() {
      return this.#client.close();
    }
    [kDestroy](err) {
      return this.#client.destroy(err);
    }
  }
  class ProxyAgent extends DispatcherBase {
    constructor(opts) {
      if (!opts || typeof opts === "object" && !(opts instanceof URL) && !opts.uri) {
        throw new InvalidArgumentError("Proxy uri is mandatory");
      }
      const { clientFactory = defaultFactory } = opts;
      if (typeof clientFactory !== "function") {
        throw new InvalidArgumentError("Proxy opts.clientFactory must be a function.");
      }
      const { proxyTunnel = true } = opts;
      super();
      const url = this.#getUrl(opts);
      const { href, origin, port, protocol, username, password, hostname: proxyHostname } = url;
      this[kProxy] = { uri: href, protocol };
      this[kRequestTls] = opts.requestTls;
      this[kProxyTls] = opts.proxyTls;
      this[kProxyHeaders] = opts.headers || {};
      this[kTunnelProxy] = proxyTunnel;
      if (opts.auth && opts.token) {
        throw new InvalidArgumentError("opts.auth cannot be used in combination with opts.token");
      } else if (opts.auth) {
        this[kProxyHeaders]["proxy-authorization"] = `Basic ${opts.auth}`;
      } else if (opts.token) {
        this[kProxyHeaders]["proxy-authorization"] = opts.token;
      } else if (username && password) {
        this[kProxyHeaders]["proxy-authorization"] = `Basic ${Buffer.from(`${decodeURIComponent(username)}:${decodeURIComponent(password)}`).toString("base64")}`;
      }
      const connect2 = buildConnector({ ...opts.proxyTls });
      this[kConnectEndpoint] = buildConnector({ ...opts.requestTls });
      const agentFactory = opts.factory || defaultAgentFactory;
      const factory = (origin2, options) => {
        const { protocol: protocol2 } = new URL(origin2);
        if (!this[kTunnelProxy] && protocol2 === "http:" && this[kProxy].protocol === "http:") {
          return new Http1ProxyWrapper(this[kProxy].uri, {
            headers: this[kProxyHeaders],
            connect: connect2,
            factory: agentFactory
          });
        }
        return agentFactory(origin2, options);
      };
      this[kClient] = clientFactory(url, { connect: connect2 });
      this[kAgent] = new Agent({
        ...opts,
        factory,
        connect: async (opts2, callback) => {
          let requestedPath = opts2.host;
          if (!opts2.port) {
            requestedPath += `:${defaultProtocolPort(opts2.protocol)}`;
          }
          try {
            const connectParams = {
              origin,
              port,
              path: requestedPath,
              signal: opts2.signal,
              headers: {
                ...this[kProxyHeaders],
                host: opts2.host,
                ...opts2.connections == null || opts2.connections > 0 ? { "proxy-connection": "keep-alive" } : {}
              },
              servername: this[kProxyTls]?.servername || proxyHostname
            };
            const { socket, statusCode } = await this[kClient].connect(connectParams);
            if (statusCode !== 200) {
              socket.on("error", noop).destroy();
              callback(new RequestAbortedError(`Proxy response (${statusCode}) !== 200 when HTTP Tunneling`));
              return;
            }
            if (channels.proxyConnected.hasSubscribers) {
              channels.proxyConnected.publish({
                socket,
                connectParams
              });
            }
            if (opts2.protocol !== "https:") {
              callback(null, socket);
              return;
            }
            let servername;
            if (this[kRequestTls]) {
              servername = this[kRequestTls].servername;
            } else {
              servername = opts2.servername;
            }
            this[kConnectEndpoint]({ ...opts2, servername, httpSocket: socket }, callback);
          } catch (err) {
            if (err.code === "ERR_TLS_CERT_ALTNAME_INVALID") {
              callback(new SecureProxyConnectionError(err));
            } else {
              callback(err);
            }
          }
        }
      });
    }
    dispatch(opts, handler) {
      const headers2 = buildHeaders(opts.headers);
      throwIfProxyAuthIsSent(headers2);
      if (headers2 && !("host" in headers2) && !("Host" in headers2)) {
        const { host } = new URL(opts.origin);
        headers2.host = host;
      }
      return this[kAgent].dispatch(
        {
          ...opts,
          headers: headers2
        },
        handler
      );
    }
    /**
     * @param {import('../../types/proxy-agent').ProxyAgent.Options | string | URL} opts
     * @returns {URL}
     */
    #getUrl(opts) {
      if (typeof opts === "string") {
        return new URL(opts);
      } else if (opts instanceof URL) {
        return opts;
      } else {
        return new URL(opts.uri);
      }
    }
    [kClose]() {
      return Promise.all([
        this[kAgent].close(),
        this[kClient].close()
      ]);
    }
    [kDestroy]() {
      return Promise.all([
        this[kAgent].destroy(),
        this[kClient].destroy()
      ]);
    }
  }
  function buildHeaders(headers2) {
    if (Array.isArray(headers2)) {
      const headersPair = {};
      for (let i = 0; i < headers2.length; i += 2) {
        headersPair[headers2[i]] = headers2[i + 1];
      }
      return headersPair;
    }
    return headers2;
  }
  function throwIfProxyAuthIsSent(headers2) {
    const existProxyAuth = headers2 && Object.keys(headers2).find((key) => key.toLowerCase() === "proxy-authorization");
    if (existProxyAuth) {
      throw new InvalidArgumentError("Proxy-Authorization should be sent in ProxyAgent constructor");
    }
  }
  proxyAgent = ProxyAgent;
  return proxyAgent;
}
var envHttpProxyAgent;
var hasRequiredEnvHttpProxyAgent;
function requireEnvHttpProxyAgent() {
  if (hasRequiredEnvHttpProxyAgent) return envHttpProxyAgent;
  hasRequiredEnvHttpProxyAgent = 1;
  const DispatcherBase = /* @__PURE__ */ requireDispatcherBase();
  const { kClose, kDestroy, kClosed, kDestroyed, kDispatch, kNoProxyAgent, kHttpProxyAgent, kHttpsProxyAgent } = /* @__PURE__ */ requireSymbols();
  const ProxyAgent = /* @__PURE__ */ requireProxyAgent();
  const Agent = /* @__PURE__ */ requireAgent();
  const DEFAULT_PORTS = {
    "http:": 80,
    "https:": 443
  };
  class EnvHttpProxyAgent extends DispatcherBase {
    #noProxyValue = null;
    #noProxyEntries = null;
    #opts = null;
    constructor(opts = {}) {
      super();
      this.#opts = opts;
      const { httpProxy, httpsProxy, noProxy, ...agentOpts } = opts;
      this[kNoProxyAgent] = new Agent(agentOpts);
      const HTTP_PROXY = httpProxy ?? process.env.http_proxy ?? process.env.HTTP_PROXY;
      if (HTTP_PROXY) {
        this[kHttpProxyAgent] = new ProxyAgent({ ...agentOpts, uri: HTTP_PROXY });
      } else {
        this[kHttpProxyAgent] = this[kNoProxyAgent];
      }
      const HTTPS_PROXY = httpsProxy ?? process.env.https_proxy ?? process.env.HTTPS_PROXY;
      if (HTTPS_PROXY) {
        this[kHttpsProxyAgent] = new ProxyAgent({ ...agentOpts, uri: HTTPS_PROXY });
      } else {
        this[kHttpsProxyAgent] = this[kHttpProxyAgent];
      }
      this.#parseNoProxy();
    }
    [kDispatch](opts, handler) {
      const url = new URL(opts.origin);
      const agent2 = this.#getProxyAgentForUrl(url);
      return agent2.dispatch(opts, handler);
    }
    [kClose]() {
      return Promise.all([
        this[kNoProxyAgent].close(),
        !this[kHttpProxyAgent][kClosed] && this[kHttpProxyAgent].close(),
        !this[kHttpsProxyAgent][kClosed] && this[kHttpsProxyAgent].close()
      ]);
    }
    [kDestroy](err) {
      return Promise.all([
        this[kNoProxyAgent].destroy(err),
        !this[kHttpProxyAgent][kDestroyed] && this[kHttpProxyAgent].destroy(err),
        !this[kHttpsProxyAgent][kDestroyed] && this[kHttpsProxyAgent].destroy(err)
      ]);
    }
    #getProxyAgentForUrl(url) {
      let { protocol, host: hostname, port } = url;
      hostname = hostname.replace(/:\d*$/, "").toLowerCase();
      port = Number.parseInt(port, 10) || DEFAULT_PORTS[protocol] || 0;
      if (!this.#shouldProxy(hostname, port)) {
        return this[kNoProxyAgent];
      }
      if (protocol === "https:") {
        return this[kHttpsProxyAgent];
      }
      return this[kHttpProxyAgent];
    }
    #shouldProxy(hostname, port) {
      if (this.#noProxyChanged) {
        this.#parseNoProxy();
      }
      if (this.#noProxyEntries.length === 0) {
        return true;
      }
      if (this.#noProxyValue === "*") {
        return false;
      }
      for (let i = 0; i < this.#noProxyEntries.length; i++) {
        const entry = this.#noProxyEntries[i];
        if (entry.port && entry.port !== port) {
          continue;
        }
        if (!/^[.*]/.test(entry.hostname)) {
          if (hostname === entry.hostname) {
            return false;
          }
        } else {
          if (hostname.endsWith(entry.hostname.replace(/^\*/, ""))) {
            return false;
          }
        }
      }
      return true;
    }
    #parseNoProxy() {
      const noProxyValue = this.#opts.noProxy ?? this.#noProxyEnv;
      const noProxySplit = noProxyValue.split(/[,\s]/);
      const noProxyEntries = [];
      for (let i = 0; i < noProxySplit.length; i++) {
        const entry = noProxySplit[i];
        if (!entry) {
          continue;
        }
        const parsed = entry.match(/^(.+):(\d+)$/);
        noProxyEntries.push({
          hostname: (parsed ? parsed[1] : entry).toLowerCase(),
          port: parsed ? Number.parseInt(parsed[2], 10) : 0
        });
      }
      this.#noProxyValue = noProxyValue;
      this.#noProxyEntries = noProxyEntries;
    }
    get #noProxyChanged() {
      if (this.#opts.noProxy !== void 0) {
        return false;
      }
      return this.#noProxyValue !== this.#noProxyEnv;
    }
    get #noProxyEnv() {
      return process.env.no_proxy ?? process.env.NO_PROXY ?? "";
    }
  }
  envHttpProxyAgent = EnvHttpProxyAgent;
  return envHttpProxyAgent;
}
var retryHandler;
var hasRequiredRetryHandler;
function requireRetryHandler() {
  if (hasRequiredRetryHandler) return retryHandler;
  hasRequiredRetryHandler = 1;
  const assert = require$$0$1;
  const { kRetryHandlerDefaultRetry } = /* @__PURE__ */ requireSymbols();
  const { RequestRetryError } = /* @__PURE__ */ requireErrors();
  const WrapHandler = /* @__PURE__ */ requireWrapHandler();
  const {
    isDisturbed,
    parseRangeHeader,
    wrapRequestBody
  } = /* @__PURE__ */ requireUtil$5();
  function calculateRetryAfterHeader(retryAfter) {
    const retryTime = new Date(retryAfter).getTime();
    return isNaN(retryTime) ? 0 : retryTime - Date.now();
  }
  class RetryHandler {
    constructor(opts, { dispatch, handler }) {
      const { retryOptions, ...dispatchOpts } = opts;
      const {
        // Retry scoped
        retry: retryFn,
        maxRetries,
        maxTimeout,
        minTimeout,
        timeoutFactor,
        // Response scoped
        methods,
        errorCodes,
        retryAfter,
        statusCodes,
        throwOnError
      } = retryOptions ?? {};
      this.error = null;
      this.dispatch = dispatch;
      this.handler = WrapHandler.wrap(handler);
      this.opts = { ...dispatchOpts, body: wrapRequestBody(opts.body) };
      this.retryOpts = {
        throwOnError: throwOnError ?? true,
        retry: retryFn ?? RetryHandler[kRetryHandlerDefaultRetry],
        retryAfter: retryAfter ?? true,
        maxTimeout: maxTimeout ?? 30 * 1e3,
        // 30s,
        minTimeout: minTimeout ?? 500,
        // .5s
        timeoutFactor: timeoutFactor ?? 2,
        maxRetries: maxRetries ?? 5,
        // What errors we should retry
        methods: methods ?? ["GET", "HEAD", "OPTIONS", "PUT", "DELETE", "TRACE"],
        // Indicates which errors to retry
        statusCodes: statusCodes ?? [500, 502, 503, 504, 429],
        // List of errors to retry
        errorCodes: errorCodes ?? [
          "ECONNRESET",
          "ECONNREFUSED",
          "ENOTFOUND",
          "ENETDOWN",
          "ENETUNREACH",
          "EHOSTDOWN",
          "EHOSTUNREACH",
          "EPIPE",
          "UND_ERR_SOCKET"
        ]
      };
      this.retryCount = 0;
      this.retryCountCheckpoint = 0;
      this.headersSent = false;
      this.start = 0;
      this.end = null;
      this.etag = null;
    }
    onResponseStartWithRetry(controller, statusCode, headers2, statusMessage, err) {
      if (this.retryOpts.throwOnError) {
        if (this.retryOpts.statusCodes.includes(statusCode) === false) {
          this.headersSent = true;
          this.handler.onResponseStart?.(controller, statusCode, headers2, statusMessage);
        } else {
          this.error = err;
        }
        return;
      }
      if (isDisturbed(this.opts.body)) {
        this.headersSent = true;
        this.handler.onResponseStart?.(controller, statusCode, headers2, statusMessage);
        return;
      }
      function shouldRetry(passedErr) {
        if (passedErr) {
          this.headersSent = true;
          this.handler.onResponseStart?.(controller, statusCode, headers2, statusMessage);
          controller.resume();
          return;
        }
        this.error = err;
        controller.resume();
      }
      controller.pause();
      this.retryOpts.retry(
        err,
        {
          state: { counter: this.retryCount },
          opts: { retryOptions: this.retryOpts, ...this.opts }
        },
        shouldRetry.bind(this)
      );
    }
    onRequestStart(controller, context) {
      if (!this.headersSent) {
        this.handler.onRequestStart?.(controller, context);
      }
    }
    onRequestUpgrade(controller, statusCode, headers2, socket) {
      this.handler.onRequestUpgrade?.(controller, statusCode, headers2, socket);
    }
    static [kRetryHandlerDefaultRetry](err, { state, opts }, cb) {
      const { statusCode, code, headers: headers2 } = err;
      const { method, retryOptions } = opts;
      const {
        maxRetries,
        minTimeout,
        maxTimeout,
        timeoutFactor,
        statusCodes,
        errorCodes,
        methods
      } = retryOptions;
      const { counter } = state;
      if (code && code !== "UND_ERR_REQ_RETRY" && !errorCodes.includes(code)) {
        cb(err);
        return;
      }
      if (Array.isArray(methods) && !methods.includes(method)) {
        cb(err);
        return;
      }
      if (statusCode != null && Array.isArray(statusCodes) && !statusCodes.includes(statusCode)) {
        cb(err);
        return;
      }
      if (counter > maxRetries) {
        cb(err);
        return;
      }
      let retryAfterHeader = headers2?.["retry-after"];
      if (retryAfterHeader) {
        retryAfterHeader = Number(retryAfterHeader);
        retryAfterHeader = Number.isNaN(retryAfterHeader) ? calculateRetryAfterHeader(headers2["retry-after"]) : retryAfterHeader * 1e3;
      }
      const retryTimeout = retryAfterHeader > 0 ? Math.min(retryAfterHeader, maxTimeout) : Math.min(minTimeout * timeoutFactor ** (counter - 1), maxTimeout);
      setTimeout(() => cb(null), retryTimeout);
    }
    onResponseStart(controller, statusCode, headers2, statusMessage) {
      this.error = null;
      this.retryCount += 1;
      if (statusCode >= 300) {
        const err = new RequestRetryError("Request failed", statusCode, {
          headers: headers2,
          data: {
            count: this.retryCount
          }
        });
        this.onResponseStartWithRetry(controller, statusCode, headers2, statusMessage, err);
        return;
      }
      if (this.headersSent) {
        if (statusCode !== 206 && (this.start > 0 || statusCode !== 200)) {
          throw new RequestRetryError("server does not support the range header and the payload was partially consumed", statusCode, {
            headers: headers2,
            data: { count: this.retryCount }
          });
        }
        const contentRange = parseRangeHeader(headers2["content-range"]);
        if (!contentRange) {
          throw new RequestRetryError("Content-Range mismatch", statusCode, {
            headers: headers2,
            data: { count: this.retryCount }
          });
        }
        if (this.etag != null && this.etag !== headers2.etag) {
          throw new RequestRetryError("ETag mismatch", statusCode, {
            headers: headers2,
            data: { count: this.retryCount }
          });
        }
        const { start, size, end = size ? size - 1 : null } = contentRange;
        assert(this.start === start, "content-range mismatch");
        assert(this.end == null || this.end === end, "content-range mismatch");
        return;
      }
      if (this.end == null) {
        if (statusCode === 206) {
          const range = parseRangeHeader(headers2["content-range"]);
          if (range == null) {
            this.headersSent = true;
            this.handler.onResponseStart?.(
              controller,
              statusCode,
              headers2,
              statusMessage
            );
            return;
          }
          const { start, size, end = size ? size - 1 : null } = range;
          assert(
            start != null && Number.isFinite(start),
            "content-range mismatch"
          );
          assert(end != null && Number.isFinite(end), "invalid content-length");
          this.start = start;
          this.end = end;
        }
        if (this.end == null) {
          const contentLength = headers2["content-length"];
          this.end = contentLength != null ? Number(contentLength) - 1 : null;
        }
        assert(Number.isFinite(this.start));
        assert(
          this.end == null || Number.isFinite(this.end),
          "invalid content-length"
        );
        this.resume = true;
        this.etag = headers2.etag != null ? headers2.etag : null;
        if (this.etag != null && this.etag[0] === "W" && this.etag[1] === "/") {
          this.etag = null;
        }
        this.headersSent = true;
        this.handler.onResponseStart?.(
          controller,
          statusCode,
          headers2,
          statusMessage
        );
      } else {
        throw new RequestRetryError("Request failed", statusCode, {
          headers: headers2,
          data: { count: this.retryCount }
        });
      }
    }
    onResponseData(controller, chunk) {
      if (this.error) {
        return;
      }
      this.start += chunk.length;
      this.handler.onResponseData?.(controller, chunk);
    }
    onResponseEnd(controller, trailers) {
      if (this.error && this.retryOpts.throwOnError) {
        throw this.error;
      }
      if (!this.error) {
        this.retryCount = 0;
        return this.handler.onResponseEnd?.(controller, trailers);
      }
      this.retry(controller);
    }
    retry(controller) {
      if (this.start !== 0) {
        const headers2 = { range: `bytes=${this.start}-${this.end ?? ""}` };
        if (this.etag != null) {
          headers2["if-match"] = this.etag;
        }
        this.opts = {
          ...this.opts,
          headers: {
            ...this.opts.headers,
            ...headers2
          }
        };
      }
      try {
        this.retryCountCheckpoint = this.retryCount;
        this.dispatch(this.opts, this);
      } catch (err) {
        this.handler.onResponseError?.(controller, err);
      }
    }
    onResponseError(controller, err) {
      if (controller?.aborted || isDisturbed(this.opts.body)) {
        this.handler.onResponseError?.(controller, err);
        return;
      }
      function shouldRetry(returnedErr) {
        if (!returnedErr) {
          this.retry(controller);
          return;
        }
        this.handler?.onResponseError?.(controller, returnedErr);
      }
      if (this.retryCount - this.retryCountCheckpoint > 0) {
        this.retryCount = this.retryCountCheckpoint + (this.retryCount - this.retryCountCheckpoint);
      } else {
        this.retryCount += 1;
      }
      this.retryOpts.retry(
        err,
        {
          state: { counter: this.retryCount },
          opts: { retryOptions: this.retryOpts, ...this.opts }
        },
        shouldRetry.bind(this)
      );
    }
  }
  retryHandler = RetryHandler;
  return retryHandler;
}
var retryAgent;
var hasRequiredRetryAgent;
function requireRetryAgent() {
  if (hasRequiredRetryAgent) return retryAgent;
  hasRequiredRetryAgent = 1;
  const Dispatcher = /* @__PURE__ */ requireDispatcher();
  const RetryHandler = /* @__PURE__ */ requireRetryHandler();
  class RetryAgent extends Dispatcher {
    #agent = null;
    #options = null;
    constructor(agent2, options = {}) {
      super(options);
      this.#agent = agent2;
      this.#options = options;
    }
    dispatch(opts, handler) {
      const retry2 = new RetryHandler({
        ...opts,
        retryOptions: this.#options
      }, {
        dispatch: this.#agent.dispatch.bind(this.#agent),
        handler
      });
      return this.#agent.dispatch(opts, retry2);
    }
    close() {
      return this.#agent.close();
    }
    destroy() {
      return this.#agent.destroy();
    }
  }
  retryAgent = RetryAgent;
  return retryAgent;
}
var h2cClient;
var hasRequiredH2cClient;
function requireH2cClient() {
  if (hasRequiredH2cClient) return h2cClient;
  hasRequiredH2cClient = 1;
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  const Client = /* @__PURE__ */ requireClient();
  class H2CClient extends Client {
    constructor(origin, clientOpts) {
      if (typeof origin === "string") {
        origin = new URL(origin);
      }
      if (origin.protocol !== "http:") {
        throw new InvalidArgumentError(
          "h2c-client: Only h2c protocol is supported"
        );
      }
      const { connect: connect2, maxConcurrentStreams, pipelining, ...opts } = clientOpts ?? {};
      let defaultMaxConcurrentStreams = 100;
      let defaultPipelining = 100;
      if (maxConcurrentStreams != null && Number.isInteger(maxConcurrentStreams) && maxConcurrentStreams > 0) {
        defaultMaxConcurrentStreams = maxConcurrentStreams;
      }
      if (pipelining != null && Number.isInteger(pipelining) && pipelining > 0) {
        defaultPipelining = pipelining;
      }
      if (defaultPipelining > defaultMaxConcurrentStreams) {
        throw new InvalidArgumentError(
          "h2c-client: pipelining cannot be greater than maxConcurrentStreams"
        );
      }
      super(origin, {
        ...opts,
        maxConcurrentStreams: defaultMaxConcurrentStreams,
        pipelining: defaultPipelining,
        allowH2: true,
        useH2c: true
      });
    }
  }
  h2cClient = H2CClient;
  return h2cClient;
}
var api = {};
var apiRequest = { exports: {} };
var readable;
var hasRequiredReadable;
function requireReadable() {
  if (hasRequiredReadable) return readable;
  hasRequiredReadable = 1;
  const assert = require$$0$1;
  const { Readable } = require$$0;
  const { RequestAbortedError, NotSupportedError, InvalidArgumentError, AbortError } = /* @__PURE__ */ requireErrors();
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { ReadableStreamFrom } = /* @__PURE__ */ requireUtil$5();
  const kConsume = Symbol("kConsume");
  const kReading = Symbol("kReading");
  const kBody = Symbol("kBody");
  const kAbort = Symbol("kAbort");
  const kContentType = Symbol("kContentType");
  const kContentLength = Symbol("kContentLength");
  const kUsed = Symbol("kUsed");
  const kBytesRead = Symbol("kBytesRead");
  const noop = () => {
  };
  class BodyReadable extends Readable {
    /**
     * @param {object} opts
     * @param {(this: Readable, size: number) => void} opts.resume
     * @param {() => (void | null)} opts.abort
     * @param {string} [opts.contentType = '']
     * @param {number} [opts.contentLength]
     * @param {number} [opts.highWaterMark = 64 * 1024]
     */
    constructor({
      resume,
      abort,
      contentType = "",
      contentLength,
      highWaterMark = 64 * 1024
      // Same as nodejs fs streams.
    }) {
      super({
        autoDestroy: true,
        read: resume,
        highWaterMark
      });
      this._readableState.dataEmitted = false;
      this[kAbort] = abort;
      this[kConsume] = null;
      this[kBytesRead] = 0;
      this[kBody] = null;
      this[kUsed] = false;
      this[kContentType] = contentType;
      this[kContentLength] = Number.isFinite(contentLength) ? contentLength : null;
      this[kReading] = false;
    }
    /**
     * @param {Error|null} err
     * @param {(error:(Error|null)) => void} callback
     * @returns {void}
     */
    _destroy(err, callback) {
      if (!err && !this._readableState.endEmitted) {
        err = new RequestAbortedError();
      }
      if (err) {
        this[kAbort]();
      }
      if (!this[kUsed]) {
        setImmediate(callback, err);
      } else {
        callback(err);
      }
    }
    /**
     * @param {string|symbol} event
     * @param {(...args: any[]) => void} listener
     * @returns {this}
     */
    on(event, listener) {
      if (event === "data" || event === "readable") {
        this[kReading] = true;
        this[kUsed] = true;
      }
      return super.on(event, listener);
    }
    /**
     * @param {string|symbol} event
     * @param {(...args: any[]) => void} listener
     * @returns {this}
     */
    addListener(event, listener) {
      return this.on(event, listener);
    }
    /**
     * @param {string|symbol} event
     * @param {(...args: any[]) => void} listener
     * @returns {this}
     */
    off(event, listener) {
      const ret = super.off(event, listener);
      if (event === "data" || event === "readable") {
        this[kReading] = this.listenerCount("data") > 0 || this.listenerCount("readable") > 0;
      }
      return ret;
    }
    /**
     * @param {string|symbol} event
     * @param {(...args: any[]) => void} listener
     * @returns {this}
     */
    removeListener(event, listener) {
      return this.off(event, listener);
    }
    /**
     * @param {Buffer|null} chunk
     * @returns {boolean}
     */
    push(chunk) {
      if (chunk) {
        this[kBytesRead] += chunk.length;
        if (this[kConsume]) {
          consumePush(this[kConsume], chunk);
          return this[kReading] ? super.push(chunk) : true;
        }
      }
      return super.push(chunk);
    }
    /**
     * Consumes and returns the body as a string.
     *
     * @see https://fetch.spec.whatwg.org/#dom-body-text
     * @returns {Promise<string>}
     */
    text() {
      return consume(this, "text");
    }
    /**
     * Consumes and returns the body as a JavaScript Object.
     *
     * @see https://fetch.spec.whatwg.org/#dom-body-json
     * @returns {Promise<unknown>}
     */
    json() {
      return consume(this, "json");
    }
    /**
     * Consumes and returns the body as a Blob
     *
     * @see https://fetch.spec.whatwg.org/#dom-body-blob
     * @returns {Promise<Blob>}
     */
    blob() {
      return consume(this, "blob");
    }
    /**
     * Consumes and returns the body as an Uint8Array.
     *
     * @see https://fetch.spec.whatwg.org/#dom-body-bytes
     * @returns {Promise<Uint8Array>}
     */
    bytes() {
      return consume(this, "bytes");
    }
    /**
     * Consumes and returns the body as an ArrayBuffer.
     *
     * @see https://fetch.spec.whatwg.org/#dom-body-arraybuffer
     * @returns {Promise<ArrayBuffer>}
     */
    arrayBuffer() {
      return consume(this, "arrayBuffer");
    }
    /**
     * Not implemented
     *
     * @see https://fetch.spec.whatwg.org/#dom-body-formdata
     * @throws {NotSupportedError}
     */
    async formData() {
      throw new NotSupportedError();
    }
    /**
     * Returns true if the body is not null and the body has been consumed.
     * Otherwise, returns false.
     *
     * @see https://fetch.spec.whatwg.org/#dom-body-bodyused
     * @readonly
     * @returns {boolean}
     */
    get bodyUsed() {
      return util2.isDisturbed(this);
    }
    /**
     * @see https://fetch.spec.whatwg.org/#dom-body-body
     * @readonly
     * @returns {ReadableStream}
     */
    get body() {
      if (!this[kBody]) {
        this[kBody] = ReadableStreamFrom(this);
        if (this[kConsume]) {
          this[kBody].getReader();
          assert(this[kBody].locked);
        }
      }
      return this[kBody];
    }
    /**
     * Dumps the response body by reading `limit` number of bytes.
     * @param {object} opts
     * @param {number} [opts.limit = 131072] Number of bytes to read.
     * @param {AbortSignal} [opts.signal] An AbortSignal to cancel the dump.
     * @returns {Promise<null>}
     */
    dump(opts) {
      const signal = opts?.signal;
      if (signal != null && (typeof signal !== "object" || !("aborted" in signal))) {
        return Promise.reject(new InvalidArgumentError("signal must be an AbortSignal"));
      }
      const limit = opts?.limit && Number.isFinite(opts.limit) ? opts.limit : 128 * 1024;
      if (signal?.aborted) {
        return Promise.reject(signal.reason ?? new AbortError());
      }
      if (this._readableState.closeEmitted) {
        return Promise.resolve(null);
      }
      return new Promise((resolve, reject) => {
        if (this[kContentLength] && this[kContentLength] > limit || this[kBytesRead] > limit) {
          this.destroy(new AbortError());
        }
        if (signal) {
          const onAbort = () => {
            this.destroy(signal.reason ?? new AbortError());
          };
          signal.addEventListener("abort", onAbort);
          this.on("close", function() {
            signal.removeEventListener("abort", onAbort);
            if (signal.aborted) {
              reject(signal.reason ?? new AbortError());
            } else {
              resolve(null);
            }
          });
        } else {
          this.on("close", resolve);
        }
        this.on("error", noop).on("data", () => {
          if (this[kBytesRead] > limit) {
            this.destroy();
          }
        }).resume();
      });
    }
    /**
     * @param {BufferEncoding} encoding
     * @returns {this}
     */
    setEncoding(encoding2) {
      if (Buffer.isEncoding(encoding2)) {
        this._readableState.encoding = encoding2;
      }
      return this;
    }
  }
  function isLocked(bodyReadable) {
    return bodyReadable[kBody]?.locked === true || bodyReadable[kConsume] !== null;
  }
  function isUnusable(bodyReadable) {
    return util2.isDisturbed(bodyReadable) || isLocked(bodyReadable);
  }
  function consume(stream, type) {
    assert(!stream[kConsume]);
    return new Promise((resolve, reject) => {
      if (isUnusable(stream)) {
        const rState = stream._readableState;
        if (rState.destroyed && rState.closeEmitted === false) {
          stream.on("error", reject).on("close", () => {
            reject(new TypeError("unusable"));
          });
        } else {
          reject(rState.errored ?? new TypeError("unusable"));
        }
      } else {
        queueMicrotask(() => {
          stream[kConsume] = {
            type,
            stream,
            resolve,
            reject,
            length: 0,
            body: []
          };
          stream.on("error", function(err) {
            consumeFinish(this[kConsume], err);
          }).on("close", function() {
            if (this[kConsume].body !== null) {
              consumeFinish(this[kConsume], new RequestAbortedError());
            }
          });
          consumeStart(stream[kConsume]);
        });
      }
    });
  }
  function consumeStart(consume2) {
    if (consume2.body === null) {
      return;
    }
    const { _readableState: state } = consume2.stream;
    if (state.bufferIndex) {
      const start = state.bufferIndex;
      const end = state.buffer.length;
      for (let n = start; n < end; n++) {
        consumePush(consume2, state.buffer[n]);
      }
    } else {
      for (const chunk of state.buffer) {
        consumePush(consume2, chunk);
      }
    }
    if (state.endEmitted) {
      consumeEnd(this[kConsume], this._readableState.encoding);
    } else {
      consume2.stream.on("end", function() {
        consumeEnd(this[kConsume], this._readableState.encoding);
      });
    }
    consume2.stream.resume();
    while (consume2.stream.read() != null) {
    }
  }
  function chunksDecode(chunks, length, encoding2) {
    if (chunks.length === 0 || length === 0) {
      return "";
    }
    const buffer = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, length);
    const bufferLength = buffer.length;
    const start = bufferLength > 2 && buffer[0] === 239 && buffer[1] === 187 && buffer[2] === 191 ? 3 : 0;
    if (!encoding2 || encoding2 === "utf8" || encoding2 === "utf-8") {
      return buffer.utf8Slice(start, bufferLength);
    } else {
      return buffer.subarray(start, bufferLength).toString(encoding2);
    }
  }
  function chunksConcat(chunks, length) {
    if (chunks.length === 0 || length === 0) {
      return new Uint8Array(0);
    }
    if (chunks.length === 1) {
      return new Uint8Array(chunks[0]);
    }
    const buffer = new Uint8Array(Buffer.allocUnsafeSlow(length).buffer);
    let offset = 0;
    for (let i = 0; i < chunks.length; ++i) {
      const chunk = chunks[i];
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    return buffer;
  }
  function consumeEnd(consume2, encoding2) {
    const { type, body: body2, resolve, stream, length } = consume2;
    try {
      if (type === "text") {
        resolve(chunksDecode(body2, length, encoding2));
      } else if (type === "json") {
        resolve(JSON.parse(chunksDecode(body2, length, encoding2)));
      } else if (type === "arrayBuffer") {
        resolve(chunksConcat(body2, length).buffer);
      } else if (type === "blob") {
        resolve(new Blob(body2, { type: stream[kContentType] }));
      } else if (type === "bytes") {
        resolve(chunksConcat(body2, length));
      }
      consumeFinish(consume2);
    } catch (err) {
      stream.destroy(err);
    }
  }
  function consumePush(consume2, chunk) {
    consume2.length += chunk.length;
    consume2.body.push(chunk);
  }
  function consumeFinish(consume2, err) {
    if (consume2.body === null) {
      return;
    }
    if (err) {
      consume2.reject(err);
    } else {
      consume2.resolve();
    }
    consume2.type = null;
    consume2.stream = null;
    consume2.resolve = null;
    consume2.reject = null;
    consume2.length = 0;
    consume2.body = null;
  }
  readable = {
    Readable: BodyReadable,
    chunksDecode
  };
  return readable;
}
var hasRequiredApiRequest;
function requireApiRequest() {
  if (hasRequiredApiRequest) return apiRequest.exports;
  hasRequiredApiRequest = 1;
  const assert = require$$0$1;
  const { AsyncResource } = require$$1$1;
  const { Readable } = /* @__PURE__ */ requireReadable();
  const { InvalidArgumentError, RequestAbortedError } = /* @__PURE__ */ requireErrors();
  const util2 = /* @__PURE__ */ requireUtil$5();
  function noop() {
  }
  class RequestHandler extends AsyncResource {
    constructor(opts, callback) {
      if (!opts || typeof opts !== "object") {
        throw new InvalidArgumentError("invalid opts");
      }
      const { signal, method, opaque, body: body2, onInfo, responseHeaders, highWaterMark } = opts;
      try {
        if (typeof callback !== "function") {
          throw new InvalidArgumentError("invalid callback");
        }
        if (highWaterMark && (typeof highWaterMark !== "number" || highWaterMark < 0)) {
          throw new InvalidArgumentError("invalid highWaterMark");
        }
        if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") {
          throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
        }
        if (method === "CONNECT") {
          throw new InvalidArgumentError("invalid method");
        }
        if (onInfo && typeof onInfo !== "function") {
          throw new InvalidArgumentError("invalid onInfo callback");
        }
        super("UNDICI_REQUEST");
      } catch (err) {
        if (util2.isStream(body2)) {
          util2.destroy(body2.on("error", noop), err);
        }
        throw err;
      }
      this.method = method;
      this.responseHeaders = responseHeaders || null;
      this.opaque = opaque || null;
      this.callback = callback;
      this.res = null;
      this.abort = null;
      this.body = body2;
      this.trailers = {};
      this.context = null;
      this.onInfo = onInfo || null;
      this.highWaterMark = highWaterMark;
      this.reason = null;
      this.removeAbortListener = null;
      if (signal?.aborted) {
        this.reason = signal.reason ?? new RequestAbortedError();
      } else if (signal) {
        this.removeAbortListener = util2.addAbortListener(signal, () => {
          this.reason = signal.reason ?? new RequestAbortedError();
          if (this.res) {
            util2.destroy(this.res.on("error", noop), this.reason);
          } else if (this.abort) {
            this.abort(this.reason);
          }
        });
      }
    }
    onConnect(abort, context) {
      if (this.reason) {
        abort(this.reason);
        return;
      }
      assert(this.callback);
      this.abort = abort;
      this.context = context;
    }
    onHeaders(statusCode, rawHeaders, resume, statusMessage) {
      const { callback, opaque, abort, context, responseHeaders, highWaterMark } = this;
      const headers2 = responseHeaders === "raw" ? util2.parseRawHeaders(rawHeaders) : util2.parseHeaders(rawHeaders);
      if (statusCode < 200) {
        if (this.onInfo) {
          this.onInfo({ statusCode, headers: headers2 });
        }
        return;
      }
      const parsedHeaders = responseHeaders === "raw" ? util2.parseHeaders(rawHeaders) : headers2;
      const contentType = parsedHeaders["content-type"];
      const contentLength = parsedHeaders["content-length"];
      const res = new Readable({
        resume,
        abort,
        contentType,
        contentLength: this.method !== "HEAD" && contentLength ? Number(contentLength) : null,
        highWaterMark
      });
      if (this.removeAbortListener) {
        res.on("close", this.removeAbortListener);
        this.removeAbortListener = null;
      }
      this.callback = null;
      this.res = res;
      if (callback !== null) {
        try {
          this.runInAsyncScope(callback, null, null, {
            statusCode,
            headers: headers2,
            trailers: this.trailers,
            opaque,
            body: res,
            context
          });
        } catch (err) {
          this.res = null;
          util2.destroy(res.on("error", noop), err);
          queueMicrotask(() => {
            throw err;
          });
        }
      }
    }
    onData(chunk) {
      return this.res.push(chunk);
    }
    onComplete(trailers) {
      util2.parseHeaders(trailers, this.trailers);
      this.res.push(null);
    }
    onError(err) {
      const { res, callback, body: body2, opaque } = this;
      if (callback) {
        this.callback = null;
        queueMicrotask(() => {
          this.runInAsyncScope(callback, null, err, { opaque });
        });
      }
      if (res) {
        this.res = null;
        queueMicrotask(() => {
          util2.destroy(res.on("error", noop), err);
        });
      }
      if (body2) {
        this.body = null;
        if (util2.isStream(body2)) {
          body2.on("error", noop);
          util2.destroy(body2, err);
        }
      }
      if (this.removeAbortListener) {
        this.removeAbortListener();
        this.removeAbortListener = null;
      }
    }
  }
  function request2(opts, callback) {
    if (callback === void 0) {
      return new Promise((resolve, reject) => {
        request2.call(this, opts, (err, data) => {
          return err ? reject(err) : resolve(data);
        });
      });
    }
    try {
      const handler = new RequestHandler(opts, callback);
      this.dispatch(opts, handler);
    } catch (err) {
      if (typeof callback !== "function") {
        throw err;
      }
      const opaque = opts?.opaque;
      queueMicrotask(() => callback(err, { opaque }));
    }
  }
  apiRequest.exports = request2;
  apiRequest.exports.RequestHandler = RequestHandler;
  return apiRequest.exports;
}
var abortSignal;
var hasRequiredAbortSignal;
function requireAbortSignal() {
  if (hasRequiredAbortSignal) return abortSignal;
  hasRequiredAbortSignal = 1;
  const { addAbortListener } = /* @__PURE__ */ requireUtil$5();
  const { RequestAbortedError } = /* @__PURE__ */ requireErrors();
  const kListener = Symbol("kListener");
  const kSignal = Symbol("kSignal");
  function abort(self) {
    if (self.abort) {
      self.abort(self[kSignal]?.reason);
    } else {
      self.reason = self[kSignal]?.reason ?? new RequestAbortedError();
    }
    removeSignal(self);
  }
  function addSignal(self, signal) {
    self.reason = null;
    self[kSignal] = null;
    self[kListener] = null;
    if (!signal) {
      return;
    }
    if (signal.aborted) {
      abort(self);
      return;
    }
    self[kSignal] = signal;
    self[kListener] = () => {
      abort(self);
    };
    addAbortListener(self[kSignal], self[kListener]);
  }
  function removeSignal(self) {
    if (!self[kSignal]) {
      return;
    }
    if ("removeEventListener" in self[kSignal]) {
      self[kSignal].removeEventListener("abort", self[kListener]);
    } else {
      self[kSignal].removeListener("abort", self[kListener]);
    }
    self[kSignal] = null;
    self[kListener] = null;
  }
  abortSignal = {
    addSignal,
    removeSignal
  };
  return abortSignal;
}
var apiStream;
var hasRequiredApiStream;
function requireApiStream() {
  if (hasRequiredApiStream) return apiStream;
  hasRequiredApiStream = 1;
  const assert = require$$0$1;
  const { finished } = require$$0;
  const { AsyncResource } = require$$1$1;
  const { InvalidArgumentError, InvalidReturnValueError } = /* @__PURE__ */ requireErrors();
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { addSignal, removeSignal } = /* @__PURE__ */ requireAbortSignal();
  function noop() {
  }
  class StreamHandler extends AsyncResource {
    constructor(opts, factory, callback) {
      if (!opts || typeof opts !== "object") {
        throw new InvalidArgumentError("invalid opts");
      }
      const { signal, method, opaque, body: body2, onInfo, responseHeaders } = opts;
      try {
        if (typeof callback !== "function") {
          throw new InvalidArgumentError("invalid callback");
        }
        if (typeof factory !== "function") {
          throw new InvalidArgumentError("invalid factory");
        }
        if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") {
          throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
        }
        if (method === "CONNECT") {
          throw new InvalidArgumentError("invalid method");
        }
        if (onInfo && typeof onInfo !== "function") {
          throw new InvalidArgumentError("invalid onInfo callback");
        }
        super("UNDICI_STREAM");
      } catch (err) {
        if (util2.isStream(body2)) {
          util2.destroy(body2.on("error", noop), err);
        }
        throw err;
      }
      this.responseHeaders = responseHeaders || null;
      this.opaque = opaque || null;
      this.factory = factory;
      this.callback = callback;
      this.res = null;
      this.abort = null;
      this.context = null;
      this.trailers = null;
      this.body = body2;
      this.onInfo = onInfo || null;
      if (util2.isStream(body2)) {
        body2.on("error", (err) => {
          this.onError(err);
        });
      }
      addSignal(this, signal);
    }
    onConnect(abort, context) {
      if (this.reason) {
        abort(this.reason);
        return;
      }
      assert(this.callback);
      this.abort = abort;
      this.context = context;
    }
    onHeaders(statusCode, rawHeaders, resume, statusMessage) {
      const { factory, opaque, context, responseHeaders } = this;
      const headers2 = responseHeaders === "raw" ? util2.parseRawHeaders(rawHeaders) : util2.parseHeaders(rawHeaders);
      if (statusCode < 200) {
        if (this.onInfo) {
          this.onInfo({ statusCode, headers: headers2 });
        }
        return;
      }
      this.factory = null;
      if (factory === null) {
        return;
      }
      const res = this.runInAsyncScope(factory, null, {
        statusCode,
        headers: headers2,
        opaque,
        context
      });
      if (!res || typeof res.write !== "function" || typeof res.end !== "function" || typeof res.on !== "function") {
        throw new InvalidReturnValueError("expected Writable");
      }
      finished(res, { readable: false }, (err) => {
        const { callback, res: res2, opaque: opaque2, trailers, abort } = this;
        this.res = null;
        if (err || !res2?.readable) {
          util2.destroy(res2, err);
        }
        this.callback = null;
        this.runInAsyncScope(callback, null, err || null, { opaque: opaque2, trailers });
        if (err) {
          abort();
        }
      });
      res.on("drain", resume);
      this.res = res;
      const needDrain = res.writableNeedDrain !== void 0 ? res.writableNeedDrain : res._writableState?.needDrain;
      return needDrain !== true;
    }
    onData(chunk) {
      const { res } = this;
      return res ? res.write(chunk) : true;
    }
    onComplete(trailers) {
      const { res } = this;
      removeSignal(this);
      if (!res) {
        return;
      }
      this.trailers = util2.parseHeaders(trailers);
      res.end();
    }
    onError(err) {
      const { res, callback, opaque, body: body2 } = this;
      removeSignal(this);
      this.factory = null;
      if (res) {
        this.res = null;
        util2.destroy(res, err);
      } else if (callback) {
        this.callback = null;
        queueMicrotask(() => {
          this.runInAsyncScope(callback, null, err, { opaque });
        });
      }
      if (body2) {
        this.body = null;
        util2.destroy(body2, err);
      }
    }
  }
  function stream(opts, factory, callback) {
    if (callback === void 0) {
      return new Promise((resolve, reject) => {
        stream.call(this, opts, factory, (err, data) => {
          return err ? reject(err) : resolve(data);
        });
      });
    }
    try {
      const handler = new StreamHandler(opts, factory, callback);
      this.dispatch(opts, handler);
    } catch (err) {
      if (typeof callback !== "function") {
        throw err;
      }
      const opaque = opts?.opaque;
      queueMicrotask(() => callback(err, { opaque }));
    }
  }
  apiStream = stream;
  return apiStream;
}
var apiPipeline;
var hasRequiredApiPipeline;
function requireApiPipeline() {
  if (hasRequiredApiPipeline) return apiPipeline;
  hasRequiredApiPipeline = 1;
  const {
    Readable,
    Duplex,
    PassThrough
  } = require$$0;
  const assert = require$$0$1;
  const { AsyncResource } = require$$1$1;
  const {
    InvalidArgumentError,
    InvalidReturnValueError,
    RequestAbortedError
  } = /* @__PURE__ */ requireErrors();
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { addSignal, removeSignal } = /* @__PURE__ */ requireAbortSignal();
  function noop() {
  }
  const kResume = Symbol("resume");
  class PipelineRequest extends Readable {
    constructor() {
      super({ autoDestroy: true });
      this[kResume] = null;
    }
    _read() {
      const { [kResume]: resume } = this;
      if (resume) {
        this[kResume] = null;
        resume();
      }
    }
    _destroy(err, callback) {
      this._read();
      callback(err);
    }
  }
  class PipelineResponse extends Readable {
    constructor(resume) {
      super({ autoDestroy: true });
      this[kResume] = resume;
    }
    _read() {
      this[kResume]();
    }
    _destroy(err, callback) {
      if (!err && !this._readableState.endEmitted) {
        err = new RequestAbortedError();
      }
      callback(err);
    }
  }
  class PipelineHandler extends AsyncResource {
    constructor(opts, handler) {
      if (!opts || typeof opts !== "object") {
        throw new InvalidArgumentError("invalid opts");
      }
      if (typeof handler !== "function") {
        throw new InvalidArgumentError("invalid handler");
      }
      const { signal, method, opaque, onInfo, responseHeaders } = opts;
      if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") {
        throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
      }
      if (method === "CONNECT") {
        throw new InvalidArgumentError("invalid method");
      }
      if (onInfo && typeof onInfo !== "function") {
        throw new InvalidArgumentError("invalid onInfo callback");
      }
      super("UNDICI_PIPELINE");
      this.opaque = opaque || null;
      this.responseHeaders = responseHeaders || null;
      this.handler = handler;
      this.abort = null;
      this.context = null;
      this.onInfo = onInfo || null;
      this.req = new PipelineRequest().on("error", noop);
      this.ret = new Duplex({
        readableObjectMode: opts.objectMode,
        autoDestroy: true,
        read: () => {
          const { body: body2 } = this;
          if (body2?.resume) {
            body2.resume();
          }
        },
        write: (chunk, encoding2, callback) => {
          const { req } = this;
          if (req.push(chunk, encoding2) || req._readableState.destroyed) {
            callback();
          } else {
            req[kResume] = callback;
          }
        },
        destroy: (err, callback) => {
          const { body: body2, req, res, ret, abort } = this;
          if (!err && !ret._readableState.endEmitted) {
            err = new RequestAbortedError();
          }
          if (abort && err) {
            abort();
          }
          util2.destroy(body2, err);
          util2.destroy(req, err);
          util2.destroy(res, err);
          removeSignal(this);
          callback(err);
        }
      }).on("prefinish", () => {
        const { req } = this;
        req.push(null);
      });
      this.res = null;
      addSignal(this, signal);
    }
    onConnect(abort, context) {
      const { res } = this;
      if (this.reason) {
        abort(this.reason);
        return;
      }
      assert(!res, "pipeline cannot be retried");
      this.abort = abort;
      this.context = context;
    }
    onHeaders(statusCode, rawHeaders, resume) {
      const { opaque, handler, context } = this;
      if (statusCode < 200) {
        if (this.onInfo) {
          const headers2 = this.responseHeaders === "raw" ? util2.parseRawHeaders(rawHeaders) : util2.parseHeaders(rawHeaders);
          this.onInfo({ statusCode, headers: headers2 });
        }
        return;
      }
      this.res = new PipelineResponse(resume);
      let body2;
      try {
        this.handler = null;
        const headers2 = this.responseHeaders === "raw" ? util2.parseRawHeaders(rawHeaders) : util2.parseHeaders(rawHeaders);
        body2 = this.runInAsyncScope(handler, null, {
          statusCode,
          headers: headers2,
          opaque,
          body: this.res,
          context
        });
      } catch (err) {
        this.res.on("error", noop);
        throw err;
      }
      if (!body2 || typeof body2.on !== "function") {
        throw new InvalidReturnValueError("expected Readable");
      }
      body2.on("data", (chunk) => {
        const { ret, body: body3 } = this;
        if (!ret.push(chunk) && body3.pause) {
          body3.pause();
        }
      }).on("error", (err) => {
        const { ret } = this;
        util2.destroy(ret, err);
      }).on("end", () => {
        const { ret } = this;
        ret.push(null);
      }).on("close", () => {
        const { ret } = this;
        if (!ret._readableState.ended) {
          util2.destroy(ret, new RequestAbortedError());
        }
      });
      this.body = body2;
    }
    onData(chunk) {
      const { res } = this;
      return res.push(chunk);
    }
    onComplete(trailers) {
      const { res } = this;
      res.push(null);
    }
    onError(err) {
      const { ret } = this;
      this.handler = null;
      util2.destroy(ret, err);
    }
  }
  function pipeline(opts, handler) {
    try {
      const pipelineHandler = new PipelineHandler(opts, handler);
      this.dispatch({ ...opts, body: pipelineHandler.req }, pipelineHandler);
      return pipelineHandler.ret;
    } catch (err) {
      return new PassThrough().destroy(err);
    }
  }
  apiPipeline = pipeline;
  return apiPipeline;
}
var apiUpgrade;
var hasRequiredApiUpgrade;
function requireApiUpgrade() {
  if (hasRequiredApiUpgrade) return apiUpgrade;
  hasRequiredApiUpgrade = 1;
  const { InvalidArgumentError, SocketError } = /* @__PURE__ */ requireErrors();
  const { AsyncResource } = require$$1$1;
  const assert = require$$0$1;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { kHTTP2Stream } = /* @__PURE__ */ requireSymbols();
  const { addSignal, removeSignal } = /* @__PURE__ */ requireAbortSignal();
  class UpgradeHandler extends AsyncResource {
    constructor(opts, callback) {
      if (!opts || typeof opts !== "object") {
        throw new InvalidArgumentError("invalid opts");
      }
      if (typeof callback !== "function") {
        throw new InvalidArgumentError("invalid callback");
      }
      const { signal, opaque, responseHeaders } = opts;
      if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") {
        throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
      }
      super("UNDICI_UPGRADE");
      this.responseHeaders = responseHeaders || null;
      this.opaque = opaque || null;
      this.callback = callback;
      this.abort = null;
      this.context = null;
      addSignal(this, signal);
    }
    onConnect(abort, context) {
      if (this.reason) {
        abort(this.reason);
        return;
      }
      assert(this.callback);
      this.abort = abort;
      this.context = null;
    }
    onHeaders() {
      throw new SocketError("bad upgrade", null);
    }
    onUpgrade(statusCode, rawHeaders, socket) {
      assert(socket[kHTTP2Stream] === true ? statusCode === 200 : statusCode === 101);
      const { callback, opaque, context } = this;
      removeSignal(this);
      this.callback = null;
      const headers2 = this.responseHeaders === "raw" ? util2.parseRawHeaders(rawHeaders) : util2.parseHeaders(rawHeaders);
      this.runInAsyncScope(callback, null, null, {
        headers: headers2,
        socket,
        opaque,
        context
      });
    }
    onError(err) {
      const { callback, opaque } = this;
      removeSignal(this);
      if (callback) {
        this.callback = null;
        queueMicrotask(() => {
          this.runInAsyncScope(callback, null, err, { opaque });
        });
      }
    }
  }
  function upgrade(opts, callback) {
    if (callback === void 0) {
      return new Promise((resolve, reject) => {
        upgrade.call(this, opts, (err, data) => {
          return err ? reject(err) : resolve(data);
        });
      });
    }
    try {
      const upgradeHandler = new UpgradeHandler(opts, callback);
      const upgradeOpts = {
        ...opts,
        method: opts.method || "GET",
        upgrade: opts.protocol || "Websocket"
      };
      this.dispatch(upgradeOpts, upgradeHandler);
    } catch (err) {
      if (typeof callback !== "function") {
        throw err;
      }
      const opaque = opts?.opaque;
      queueMicrotask(() => callback(err, { opaque }));
    }
  }
  apiUpgrade = upgrade;
  return apiUpgrade;
}
var apiConnect;
var hasRequiredApiConnect;
function requireApiConnect() {
  if (hasRequiredApiConnect) return apiConnect;
  hasRequiredApiConnect = 1;
  const assert = require$$0$1;
  const { AsyncResource } = require$$1$1;
  const { InvalidArgumentError, SocketError } = /* @__PURE__ */ requireErrors();
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { addSignal, removeSignal } = /* @__PURE__ */ requireAbortSignal();
  class ConnectHandler extends AsyncResource {
    constructor(opts, callback) {
      if (!opts || typeof opts !== "object") {
        throw new InvalidArgumentError("invalid opts");
      }
      if (typeof callback !== "function") {
        throw new InvalidArgumentError("invalid callback");
      }
      const { signal, opaque, responseHeaders } = opts;
      if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") {
        throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
      }
      super("UNDICI_CONNECT");
      this.opaque = opaque || null;
      this.responseHeaders = responseHeaders || null;
      this.callback = callback;
      this.abort = null;
      addSignal(this, signal);
    }
    onConnect(abort, context) {
      if (this.reason) {
        abort(this.reason);
        return;
      }
      assert(this.callback);
      this.abort = abort;
      this.context = context;
    }
    onHeaders() {
      throw new SocketError("bad connect", null);
    }
    onUpgrade(statusCode, rawHeaders, socket) {
      const { callback, opaque, context } = this;
      removeSignal(this);
      this.callback = null;
      let headers2 = rawHeaders;
      if (headers2 != null) {
        headers2 = this.responseHeaders === "raw" ? util2.parseRawHeaders(rawHeaders) : util2.parseHeaders(rawHeaders);
      }
      this.runInAsyncScope(callback, null, null, {
        statusCode,
        headers: headers2,
        socket,
        opaque,
        context
      });
    }
    onError(err) {
      const { callback, opaque } = this;
      removeSignal(this);
      if (callback) {
        this.callback = null;
        queueMicrotask(() => {
          this.runInAsyncScope(callback, null, err, { opaque });
        });
      }
    }
  }
  function connect2(opts, callback) {
    if (callback === void 0) {
      return new Promise((resolve, reject) => {
        connect2.call(this, opts, (err, data) => {
          return err ? reject(err) : resolve(data);
        });
      });
    }
    try {
      const connectHandler = new ConnectHandler(opts, callback);
      const connectOptions = { ...opts, method: "CONNECT" };
      this.dispatch(connectOptions, connectHandler);
    } catch (err) {
      if (typeof callback !== "function") {
        throw err;
      }
      const opaque = opts?.opaque;
      queueMicrotask(() => callback(err, { opaque }));
    }
  }
  apiConnect = connect2;
  return apiConnect;
}
var hasRequiredApi;
function requireApi() {
  if (hasRequiredApi) return api;
  hasRequiredApi = 1;
  api.request = /* @__PURE__ */ requireApiRequest();
  api.stream = /* @__PURE__ */ requireApiStream();
  api.pipeline = /* @__PURE__ */ requireApiPipeline();
  api.upgrade = /* @__PURE__ */ requireApiUpgrade();
  api.connect = /* @__PURE__ */ requireApiConnect();
  return api;
}
var mockErrors;
var hasRequiredMockErrors;
function requireMockErrors() {
  if (hasRequiredMockErrors) return mockErrors;
  hasRequiredMockErrors = 1;
  const { UndiciError } = /* @__PURE__ */ requireErrors();
  const kMockNotMatchedError = Symbol.for("undici.error.UND_MOCK_ERR_MOCK_NOT_MATCHED");
  class MockNotMatchedError extends UndiciError {
    constructor(message) {
      super(message);
      this.name = "MockNotMatchedError";
      this.message = message || "The request does not match any registered mock dispatches";
      this.code = "UND_MOCK_ERR_MOCK_NOT_MATCHED";
    }
    static [Symbol.hasInstance](instance) {
      return instance && instance[kMockNotMatchedError] === true;
    }
    get [kMockNotMatchedError]() {
      return true;
    }
  }
  mockErrors = {
    MockNotMatchedError
  };
  return mockErrors;
}
var mockSymbols;
var hasRequiredMockSymbols;
function requireMockSymbols() {
  if (hasRequiredMockSymbols) return mockSymbols;
  hasRequiredMockSymbols = 1;
  mockSymbols = {
    kAgent: Symbol("agent"),
    kOptions: Symbol("options"),
    kFactory: Symbol("factory"),
    kDispatches: Symbol("dispatches"),
    kDispatchKey: Symbol("dispatch key"),
    kDefaultHeaders: Symbol("default headers"),
    kDefaultTrailers: Symbol("default trailers"),
    kContentLength: Symbol("content length"),
    kMockAgent: Symbol("mock agent"),
    kMockAgentSet: Symbol("mock agent set"),
    kMockAgentGet: Symbol("mock agent get"),
    kMockDispatch: Symbol("mock dispatch"),
    kClose: Symbol("close"),
    kOriginalClose: Symbol("original agent close"),
    kOriginalDispatch: Symbol("original dispatch"),
    kOrigin: Symbol("origin"),
    kIsMockActive: Symbol("is mock active"),
    kNetConnect: Symbol("net connect"),
    kGetNetConnect: Symbol("get net connect"),
    kConnected: Symbol("connected"),
    kIgnoreTrailingSlash: Symbol("ignore trailing slash"),
    kMockAgentMockCallHistoryInstance: Symbol("mock agent mock call history name"),
    kMockAgentRegisterCallHistory: Symbol("mock agent register mock call history"),
    kMockAgentAddCallHistoryLog: Symbol("mock agent add call history log"),
    kMockAgentIsCallHistoryEnabled: Symbol("mock agent is call history enabled"),
    kMockAgentAcceptsNonStandardSearchParameters: Symbol("mock agent accepts non standard search parameters"),
    kMockCallHistoryAddLog: Symbol("mock call history add log")
  };
  return mockSymbols;
}
var mockUtils;
var hasRequiredMockUtils;
function requireMockUtils() {
  if (hasRequiredMockUtils) return mockUtils;
  hasRequiredMockUtils = 1;
  const { MockNotMatchedError } = /* @__PURE__ */ requireMockErrors();
  const {
    kDispatches,
    kMockAgent,
    kOriginalDispatch,
    kOrigin,
    kGetNetConnect
  } = /* @__PURE__ */ requireMockSymbols();
  const { serializePathWithQuery } = /* @__PURE__ */ requireUtil$5();
  const { STATUS_CODES } = require$$2;
  const {
    types: {
      isPromise
    }
  } = require$$0$3;
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  function matchValue(match, value) {
    if (typeof match === "string") {
      return match === value;
    }
    if (match instanceof RegExp) {
      return match.test(value);
    }
    if (typeof match === "function") {
      return match(value) === true;
    }
    return false;
  }
  function lowerCaseEntries(headers2) {
    return Object.fromEntries(
      Object.entries(headers2).map(([headerName, headerValue]) => {
        return [headerName.toLocaleLowerCase(), headerValue];
      })
    );
  }
  function getHeaderByName(headers2, key) {
    if (Array.isArray(headers2)) {
      for (let i = 0; i < headers2.length; i += 2) {
        if (headers2[i].toLocaleLowerCase() === key.toLocaleLowerCase()) {
          return headers2[i + 1];
        }
      }
      return void 0;
    } else if (typeof headers2.get === "function") {
      return headers2.get(key);
    } else {
      return lowerCaseEntries(headers2)[key.toLocaleLowerCase()];
    }
  }
  function buildHeadersFromArray(headers2) {
    const clone = headers2.slice();
    const entries = [];
    for (let index2 = 0; index2 < clone.length; index2 += 2) {
      entries.push([clone[index2], clone[index2 + 1]]);
    }
    return Object.fromEntries(entries);
  }
  function matchHeaders(mockDispatch2, headers2) {
    if (typeof mockDispatch2.headers === "function") {
      if (Array.isArray(headers2)) {
        headers2 = buildHeadersFromArray(headers2);
      }
      return mockDispatch2.headers(headers2 ? lowerCaseEntries(headers2) : {});
    }
    if (typeof mockDispatch2.headers === "undefined") {
      return true;
    }
    if (typeof headers2 !== "object" || typeof mockDispatch2.headers !== "object") {
      return false;
    }
    for (const [matchHeaderName, matchHeaderValue] of Object.entries(mockDispatch2.headers)) {
      const headerValue = getHeaderByName(headers2, matchHeaderName);
      if (!matchValue(matchHeaderValue, headerValue)) {
        return false;
      }
    }
    return true;
  }
  function normalizeSearchParams(query) {
    if (typeof query !== "string") {
      return query;
    }
    const originalQp = new URLSearchParams(query);
    const normalizedQp = new URLSearchParams();
    for (let [key, value] of originalQp.entries()) {
      key = key.replace("[]", "");
      const valueRepresentsString = /^(['"]).*\1$/.test(value);
      if (valueRepresentsString) {
        normalizedQp.append(key, value);
        continue;
      }
      if (value.includes(",")) {
        const values = value.split(",");
        for (const v of values) {
          normalizedQp.append(key, v);
        }
        continue;
      }
      normalizedQp.append(key, value);
    }
    return normalizedQp;
  }
  function safeUrl(path) {
    if (typeof path !== "string") {
      return path;
    }
    const pathSegments = path.split("?", 3);
    if (pathSegments.length !== 2) {
      return path;
    }
    const qp = new URLSearchParams(pathSegments.pop());
    qp.sort();
    return [...pathSegments, qp.toString()].join("?");
  }
  function matchKey(mockDispatch2, { path, method, body: body2, headers: headers2 }) {
    const pathMatch = matchValue(mockDispatch2.path, path);
    const methodMatch = matchValue(mockDispatch2.method, method);
    const bodyMatch = typeof mockDispatch2.body !== "undefined" ? matchValue(mockDispatch2.body, body2) : true;
    const headersMatch = matchHeaders(mockDispatch2, headers2);
    return pathMatch && methodMatch && bodyMatch && headersMatch;
  }
  function getResponseData(data) {
    if (Buffer.isBuffer(data)) {
      return data;
    } else if (data instanceof Uint8Array) {
      return data;
    } else if (data instanceof ArrayBuffer) {
      return data;
    } else if (typeof data === "object") {
      return JSON.stringify(data);
    } else if (data) {
      return data.toString();
    } else {
      return "";
    }
  }
  function getMockDispatch(mockDispatches, key) {
    const basePath = key.query ? serializePathWithQuery(key.path, key.query) : key.path;
    const resolvedPath = typeof basePath === "string" ? safeUrl(basePath) : basePath;
    const resolvedPathWithoutTrailingSlash = removeTrailingSlash(resolvedPath);
    let matchedMockDispatches = mockDispatches.filter(({ consumed }) => !consumed).filter(({ path, ignoreTrailingSlash }) => {
      return ignoreTrailingSlash ? matchValue(removeTrailingSlash(safeUrl(path)), resolvedPathWithoutTrailingSlash) : matchValue(safeUrl(path), resolvedPath);
    });
    if (matchedMockDispatches.length === 0) {
      throw new MockNotMatchedError(`Mock dispatch not matched for path '${resolvedPath}'`);
    }
    matchedMockDispatches = matchedMockDispatches.filter(({ method }) => matchValue(method, key.method));
    if (matchedMockDispatches.length === 0) {
      throw new MockNotMatchedError(`Mock dispatch not matched for method '${key.method}' on path '${resolvedPath}'`);
    }
    matchedMockDispatches = matchedMockDispatches.filter(({ body: body2 }) => typeof body2 !== "undefined" ? matchValue(body2, key.body) : true);
    if (matchedMockDispatches.length === 0) {
      throw new MockNotMatchedError(`Mock dispatch not matched for body '${key.body}' on path '${resolvedPath}'`);
    }
    matchedMockDispatches = matchedMockDispatches.filter((mockDispatch2) => matchHeaders(mockDispatch2, key.headers));
    if (matchedMockDispatches.length === 0) {
      const headers2 = typeof key.headers === "object" ? JSON.stringify(key.headers) : key.headers;
      throw new MockNotMatchedError(`Mock dispatch not matched for headers '${headers2}' on path '${resolvedPath}'`);
    }
    return matchedMockDispatches[0];
  }
  function addMockDispatch(mockDispatches, key, data, opts) {
    const baseData = { timesInvoked: 0, times: 1, persist: false, consumed: false, ...opts };
    const replyData = typeof data === "function" ? { callback: data } : { ...data };
    const newMockDispatch = { ...baseData, ...key, pending: true, data: { error: null, ...replyData } };
    mockDispatches.push(newMockDispatch);
    return newMockDispatch;
  }
  function deleteMockDispatch(mockDispatches, key) {
    const index2 = mockDispatches.findIndex((dispatch) => {
      if (!dispatch.consumed) {
        return false;
      }
      return matchKey(dispatch, key);
    });
    if (index2 !== -1) {
      mockDispatches.splice(index2, 1);
    }
  }
  function removeTrailingSlash(path) {
    while (path.endsWith("/")) {
      path = path.slice(0, -1);
    }
    if (path.length === 0) {
      path = "/";
    }
    return path;
  }
  function buildKey(opts) {
    const { path, method, body: body2, headers: headers2, query } = opts;
    return {
      path,
      method,
      body: body2,
      headers: headers2,
      query
    };
  }
  function generateKeyValues(data) {
    const keys = Object.keys(data);
    const result = [];
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      const value = data[key];
      const name = Buffer.from(`${key}`);
      if (Array.isArray(value)) {
        for (let j = 0; j < value.length; ++j) {
          result.push(name, Buffer.from(`${value[j]}`));
        }
      } else {
        result.push(name, Buffer.from(`${value}`));
      }
    }
    return result;
  }
  function getStatusText(statusCode) {
    return STATUS_CODES[statusCode] || "unknown";
  }
  async function getResponse(body2) {
    const buffers = [];
    for await (const data of body2) {
      buffers.push(data);
    }
    return Buffer.concat(buffers).toString("utf8");
  }
  function mockDispatch(opts, handler) {
    const key = buildKey(opts);
    const mockDispatch2 = getMockDispatch(this[kDispatches], key);
    mockDispatch2.timesInvoked++;
    if (mockDispatch2.data.callback) {
      mockDispatch2.data = { ...mockDispatch2.data, ...mockDispatch2.data.callback(opts) };
    }
    const { data: { statusCode, data, headers: headers2, trailers, error }, delay, persist } = mockDispatch2;
    const { timesInvoked, times } = mockDispatch2;
    mockDispatch2.consumed = !persist && timesInvoked >= times;
    mockDispatch2.pending = timesInvoked < times;
    if (error !== null) {
      deleteMockDispatch(this[kDispatches], key);
      handler.onError(error);
      return true;
    }
    if (typeof delay === "number" && delay > 0) {
      setTimeout(() => {
        handleReply(this[kDispatches]);
      }, delay);
    } else {
      handleReply(this[kDispatches]);
    }
    function handleReply(mockDispatches, _data = data) {
      const optsHeaders = Array.isArray(opts.headers) ? buildHeadersFromArray(opts.headers) : opts.headers;
      const body2 = typeof _data === "function" ? _data({ ...opts, headers: optsHeaders }) : _data;
      if (isPromise(body2)) {
        return body2.then((newData) => handleReply(mockDispatches, newData));
      }
      const responseData = getResponseData(body2);
      const responseHeaders = generateKeyValues(headers2);
      const responseTrailers = generateKeyValues(trailers);
      handler.onConnect?.((err) => handler.onError(err), null);
      handler.onHeaders?.(statusCode, responseHeaders, resume, getStatusText(statusCode));
      handler.onData?.(Buffer.from(responseData));
      handler.onComplete?.(responseTrailers);
      deleteMockDispatch(mockDispatches, key);
    }
    function resume() {
    }
    return true;
  }
  function buildMockDispatch() {
    const agent2 = this[kMockAgent];
    const origin = this[kOrigin];
    const originalDispatch = this[kOriginalDispatch];
    return function dispatch(opts, handler) {
      if (agent2.isMockActive) {
        try {
          mockDispatch.call(this, opts, handler);
        } catch (error) {
          if (error.code === "UND_MOCK_ERR_MOCK_NOT_MATCHED") {
            const netConnect = agent2[kGetNetConnect]();
            if (netConnect === false) {
              throw new MockNotMatchedError(`${error.message}: subsequent request to origin ${origin} was not allowed (net.connect disabled)`);
            }
            if (checkNetConnect(netConnect, origin)) {
              originalDispatch.call(this, opts, handler);
            } else {
              throw new MockNotMatchedError(`${error.message}: subsequent request to origin ${origin} was not allowed (net.connect is not enabled for this origin)`);
            }
          } else {
            throw error;
          }
        }
      } else {
        originalDispatch.call(this, opts, handler);
      }
    };
  }
  function checkNetConnect(netConnect, origin) {
    const url = new URL(origin);
    if (netConnect === true) {
      return true;
    } else if (Array.isArray(netConnect) && netConnect.some((matcher) => matchValue(matcher, url.host))) {
      return true;
    }
    return false;
  }
  function normalizeOrigin(origin) {
    if (typeof origin !== "string" && !(origin instanceof URL)) {
      return origin;
    }
    if (origin instanceof URL) {
      return origin.origin;
    }
    return origin.toLowerCase();
  }
  function buildAndValidateMockOptions(opts) {
    const { agent: agent2, ...mockOptions } = opts;
    if ("enableCallHistory" in mockOptions && typeof mockOptions.enableCallHistory !== "boolean") {
      throw new InvalidArgumentError("options.enableCallHistory must to be a boolean");
    }
    if ("acceptNonStandardSearchParameters" in mockOptions && typeof mockOptions.acceptNonStandardSearchParameters !== "boolean") {
      throw new InvalidArgumentError("options.acceptNonStandardSearchParameters must to be a boolean");
    }
    if ("ignoreTrailingSlash" in mockOptions && typeof mockOptions.ignoreTrailingSlash !== "boolean") {
      throw new InvalidArgumentError("options.ignoreTrailingSlash must to be a boolean");
    }
    return mockOptions;
  }
  mockUtils = {
    getResponseData,
    getMockDispatch,
    addMockDispatch,
    deleteMockDispatch,
    buildKey,
    generateKeyValues,
    matchValue,
    getResponse,
    getStatusText,
    mockDispatch,
    buildMockDispatch,
    checkNetConnect,
    buildAndValidateMockOptions,
    getHeaderByName,
    buildHeadersFromArray,
    normalizeSearchParams,
    normalizeOrigin
  };
  return mockUtils;
}
var mockInterceptor = {};
var hasRequiredMockInterceptor;
function requireMockInterceptor() {
  if (hasRequiredMockInterceptor) return mockInterceptor;
  hasRequiredMockInterceptor = 1;
  const { getResponseData, buildKey, addMockDispatch } = /* @__PURE__ */ requireMockUtils();
  const {
    kDispatches,
    kDispatchKey,
    kDefaultHeaders,
    kDefaultTrailers,
    kContentLength,
    kMockDispatch,
    kIgnoreTrailingSlash
  } = /* @__PURE__ */ requireMockSymbols();
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  const { serializePathWithQuery } = /* @__PURE__ */ requireUtil$5();
  class MockScope {
    constructor(mockDispatch) {
      this[kMockDispatch] = mockDispatch;
    }
    /**
     * Delay a reply by a set amount in ms.
     */
    delay(waitInMs) {
      if (typeof waitInMs !== "number" || !Number.isInteger(waitInMs) || waitInMs <= 0) {
        throw new InvalidArgumentError("waitInMs must be a valid integer > 0");
      }
      this[kMockDispatch].delay = waitInMs;
      return this;
    }
    /**
     * For a defined reply, never mark as consumed.
     */
    persist() {
      this[kMockDispatch].persist = true;
      return this;
    }
    /**
     * Allow one to define a reply for a set amount of matching requests.
     */
    times(repeatTimes) {
      if (typeof repeatTimes !== "number" || !Number.isInteger(repeatTimes) || repeatTimes <= 0) {
        throw new InvalidArgumentError("repeatTimes must be a valid integer > 0");
      }
      this[kMockDispatch].times = repeatTimes;
      return this;
    }
  }
  class MockInterceptor {
    constructor(opts, mockDispatches) {
      if (typeof opts !== "object") {
        throw new InvalidArgumentError("opts must be an object");
      }
      if (typeof opts.path === "undefined") {
        throw new InvalidArgumentError("opts.path must be defined");
      }
      if (typeof opts.method === "undefined") {
        opts.method = "GET";
      }
      if (typeof opts.path === "string") {
        if (opts.query) {
          opts.path = serializePathWithQuery(opts.path, opts.query);
        } else {
          const parsedURL = new URL(opts.path, "data://");
          opts.path = parsedURL.pathname + parsedURL.search;
        }
      }
      if (typeof opts.method === "string") {
        opts.method = opts.method.toUpperCase();
      }
      this[kDispatchKey] = buildKey(opts);
      this[kDispatches] = mockDispatches;
      this[kIgnoreTrailingSlash] = opts.ignoreTrailingSlash ?? false;
      this[kDefaultHeaders] = {};
      this[kDefaultTrailers] = {};
      this[kContentLength] = false;
    }
    createMockScopeDispatchData({ statusCode, data, responseOptions }) {
      const responseData = getResponseData(data);
      const contentLength = this[kContentLength] ? { "content-length": responseData.length } : {};
      const headers2 = { ...this[kDefaultHeaders], ...contentLength, ...responseOptions.headers };
      const trailers = { ...this[kDefaultTrailers], ...responseOptions.trailers };
      return { statusCode, data, headers: headers2, trailers };
    }
    validateReplyParameters(replyParameters) {
      if (typeof replyParameters.statusCode === "undefined") {
        throw new InvalidArgumentError("statusCode must be defined");
      }
      if (typeof replyParameters.responseOptions !== "object" || replyParameters.responseOptions === null) {
        throw new InvalidArgumentError("responseOptions must be an object");
      }
    }
    /**
     * Mock an undici request with a defined reply.
     */
    reply(replyOptionsCallbackOrStatusCode) {
      if (typeof replyOptionsCallbackOrStatusCode === "function") {
        const wrappedDefaultsCallback = (opts) => {
          const resolvedData = replyOptionsCallbackOrStatusCode(opts);
          if (typeof resolvedData !== "object" || resolvedData === null) {
            throw new InvalidArgumentError("reply options callback must return an object");
          }
          const replyParameters2 = { data: "", responseOptions: {}, ...resolvedData };
          this.validateReplyParameters(replyParameters2);
          return {
            ...this.createMockScopeDispatchData(replyParameters2)
          };
        };
        const newMockDispatch2 = addMockDispatch(this[kDispatches], this[kDispatchKey], wrappedDefaultsCallback, { ignoreTrailingSlash: this[kIgnoreTrailingSlash] });
        return new MockScope(newMockDispatch2);
      }
      const replyParameters = {
        statusCode: replyOptionsCallbackOrStatusCode,
        data: arguments[1] === void 0 ? "" : arguments[1],
        responseOptions: arguments[2] === void 0 ? {} : arguments[2]
      };
      this.validateReplyParameters(replyParameters);
      const dispatchData = this.createMockScopeDispatchData(replyParameters);
      const newMockDispatch = addMockDispatch(this[kDispatches], this[kDispatchKey], dispatchData, { ignoreTrailingSlash: this[kIgnoreTrailingSlash] });
      return new MockScope(newMockDispatch);
    }
    /**
     * Mock an undici request with a defined error.
     */
    replyWithError(error) {
      if (typeof error === "undefined") {
        throw new InvalidArgumentError("error must be defined");
      }
      const newMockDispatch = addMockDispatch(this[kDispatches], this[kDispatchKey], { error }, { ignoreTrailingSlash: this[kIgnoreTrailingSlash] });
      return new MockScope(newMockDispatch);
    }
    /**
     * Set default reply headers on the interceptor for subsequent replies
     */
    defaultReplyHeaders(headers2) {
      if (typeof headers2 === "undefined") {
        throw new InvalidArgumentError("headers must be defined");
      }
      this[kDefaultHeaders] = headers2;
      return this;
    }
    /**
     * Set default reply trailers on the interceptor for subsequent replies
     */
    defaultReplyTrailers(trailers) {
      if (typeof trailers === "undefined") {
        throw new InvalidArgumentError("trailers must be defined");
      }
      this[kDefaultTrailers] = trailers;
      return this;
    }
    /**
     * Set reply content length header for replies on the interceptor
     */
    replyContentLength() {
      this[kContentLength] = true;
      return this;
    }
  }
  mockInterceptor.MockInterceptor = MockInterceptor;
  mockInterceptor.MockScope = MockScope;
  return mockInterceptor;
}
var mockClient;
var hasRequiredMockClient;
function requireMockClient() {
  if (hasRequiredMockClient) return mockClient;
  hasRequiredMockClient = 1;
  const { promisify } = require$$0$3;
  const Client = /* @__PURE__ */ requireClient();
  const { buildMockDispatch } = /* @__PURE__ */ requireMockUtils();
  const {
    kDispatches,
    kMockAgent,
    kClose,
    kOriginalClose,
    kOrigin,
    kOriginalDispatch,
    kConnected,
    kIgnoreTrailingSlash
  } = /* @__PURE__ */ requireMockSymbols();
  const { MockInterceptor } = /* @__PURE__ */ requireMockInterceptor();
  const Symbols = /* @__PURE__ */ requireSymbols();
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  class MockClient extends Client {
    constructor(origin, opts) {
      if (!opts || !opts.agent || typeof opts.agent.dispatch !== "function") {
        throw new InvalidArgumentError("Argument opts.agent must implement Agent");
      }
      super(origin, opts);
      this[kMockAgent] = opts.agent;
      this[kOrigin] = origin;
      this[kIgnoreTrailingSlash] = opts.ignoreTrailingSlash ?? false;
      this[kDispatches] = [];
      this[kConnected] = 1;
      this[kOriginalDispatch] = this.dispatch;
      this[kOriginalClose] = this.close.bind(this);
      this.dispatch = buildMockDispatch.call(this);
      this.close = this[kClose];
    }
    get [Symbols.kConnected]() {
      return this[kConnected];
    }
    /**
     * Sets up the base interceptor for mocking replies from undici.
     */
    intercept(opts) {
      return new MockInterceptor(
        opts && { ignoreTrailingSlash: this[kIgnoreTrailingSlash], ...opts },
        this[kDispatches]
      );
    }
    cleanMocks() {
      this[kDispatches] = [];
    }
    async [kClose]() {
      await promisify(this[kOriginalClose])();
      this[kConnected] = 0;
      this[kMockAgent][Symbols.kClients].delete(this[kOrigin]);
    }
  }
  mockClient = MockClient;
  return mockClient;
}
var mockCallHistory = {};
var hasRequiredMockCallHistory;
function requireMockCallHistory() {
  if (hasRequiredMockCallHistory) return mockCallHistory;
  hasRequiredMockCallHistory = 1;
  const { kMockCallHistoryAddLog } = /* @__PURE__ */ requireMockSymbols();
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  function handleFilterCallsWithOptions(criteria, options, handler, store) {
    switch (options.operator) {
      case "OR":
        store.push(...handler(criteria));
        return store;
      case "AND":
        return handler.call({ logs: store }, criteria);
      default:
        throw new InvalidArgumentError("options.operator must to be a case insensitive string equal to 'OR' or 'AND'");
    }
  }
  function buildAndValidateFilterCallsOptions(options = {}) {
    const finalOptions = {};
    if ("operator" in options) {
      if (typeof options.operator !== "string" || options.operator.toUpperCase() !== "OR" && options.operator.toUpperCase() !== "AND") {
        throw new InvalidArgumentError("options.operator must to be a case insensitive string equal to 'OR' or 'AND'");
      }
      return {
        ...finalOptions,
        operator: options.operator.toUpperCase()
      };
    }
    return finalOptions;
  }
  function makeFilterCalls(parameterName) {
    return (parameterValue) => {
      if (typeof parameterValue === "string" || parameterValue == null) {
        return this.logs.filter((log) => {
          return log[parameterName] === parameterValue;
        });
      }
      if (parameterValue instanceof RegExp) {
        return this.logs.filter((log) => {
          return parameterValue.test(log[parameterName]);
        });
      }
      throw new InvalidArgumentError(`${parameterName} parameter should be one of string, regexp, undefined or null`);
    };
  }
  function computeUrlWithMaybeSearchParameters(requestInit) {
    try {
      const url = new URL(requestInit.path, requestInit.origin);
      if (url.search.length !== 0) {
        return url;
      }
      url.search = new URLSearchParams(requestInit.query).toString();
      return url;
    } catch (error) {
      throw new InvalidArgumentError("An error occurred when computing MockCallHistoryLog.url", { cause: error });
    }
  }
  class MockCallHistoryLog {
    constructor(requestInit = {}) {
      this.body = requestInit.body;
      this.headers = requestInit.headers;
      this.method = requestInit.method;
      const url = computeUrlWithMaybeSearchParameters(requestInit);
      this.fullUrl = url.toString();
      this.origin = url.origin;
      this.path = url.pathname;
      this.searchParams = Object.fromEntries(url.searchParams);
      this.protocol = url.protocol;
      this.host = url.host;
      this.port = url.port;
      this.hash = url.hash;
    }
    toMap() {
      return /* @__PURE__ */ new Map(
        [
          ["protocol", this.protocol],
          ["host", this.host],
          ["port", this.port],
          ["origin", this.origin],
          ["path", this.path],
          ["hash", this.hash],
          ["searchParams", this.searchParams],
          ["fullUrl", this.fullUrl],
          ["method", this.method],
          ["body", this.body],
          ["headers", this.headers]
        ]
      );
    }
    toString() {
      const options = { betweenKeyValueSeparator: "->", betweenPairSeparator: "|" };
      let result = "";
      this.toMap().forEach((value, key) => {
        if (typeof value === "string" || value === void 0 || value === null) {
          result = `${result}${key}${options.betweenKeyValueSeparator}${value}${options.betweenPairSeparator}`;
        }
        if (typeof value === "object" && value !== null || Array.isArray(value)) {
          result = `${result}${key}${options.betweenKeyValueSeparator}${JSON.stringify(value)}${options.betweenPairSeparator}`;
        }
      });
      return result.slice(0, -1);
    }
  }
  class MockCallHistory {
    logs = [];
    calls() {
      return this.logs;
    }
    firstCall() {
      return this.logs.at(0);
    }
    lastCall() {
      return this.logs.at(-1);
    }
    nthCall(number) {
      if (typeof number !== "number") {
        throw new InvalidArgumentError("nthCall must be called with a number");
      }
      if (!Number.isInteger(number)) {
        throw new InvalidArgumentError("nthCall must be called with an integer");
      }
      if (Math.sign(number) !== 1) {
        throw new InvalidArgumentError("nthCall must be called with a positive value. use firstCall or lastCall instead");
      }
      return this.logs.at(number - 1);
    }
    filterCalls(criteria, options) {
      if (this.logs.length === 0) {
        return this.logs;
      }
      if (typeof criteria === "function") {
        return this.logs.filter(criteria);
      }
      if (criteria instanceof RegExp) {
        return this.logs.filter((log) => {
          return criteria.test(log.toString());
        });
      }
      if (typeof criteria === "object" && criteria !== null) {
        if (Object.keys(criteria).length === 0) {
          return this.logs;
        }
        const finalOptions = { operator: "OR", ...buildAndValidateFilterCallsOptions(options) };
        let maybeDuplicatedLogsFiltered = [];
        if ("protocol" in criteria) {
          maybeDuplicatedLogsFiltered = handleFilterCallsWithOptions(criteria.protocol, finalOptions, this.filterCallsByProtocol, maybeDuplicatedLogsFiltered);
        }
        if ("host" in criteria) {
          maybeDuplicatedLogsFiltered = handleFilterCallsWithOptions(criteria.host, finalOptions, this.filterCallsByHost, maybeDuplicatedLogsFiltered);
        }
        if ("port" in criteria) {
          maybeDuplicatedLogsFiltered = handleFilterCallsWithOptions(criteria.port, finalOptions, this.filterCallsByPort, maybeDuplicatedLogsFiltered);
        }
        if ("origin" in criteria) {
          maybeDuplicatedLogsFiltered = handleFilterCallsWithOptions(criteria.origin, finalOptions, this.filterCallsByOrigin, maybeDuplicatedLogsFiltered);
        }
        if ("path" in criteria) {
          maybeDuplicatedLogsFiltered = handleFilterCallsWithOptions(criteria.path, finalOptions, this.filterCallsByPath, maybeDuplicatedLogsFiltered);
        }
        if ("hash" in criteria) {
          maybeDuplicatedLogsFiltered = handleFilterCallsWithOptions(criteria.hash, finalOptions, this.filterCallsByHash, maybeDuplicatedLogsFiltered);
        }
        if ("fullUrl" in criteria) {
          maybeDuplicatedLogsFiltered = handleFilterCallsWithOptions(criteria.fullUrl, finalOptions, this.filterCallsByFullUrl, maybeDuplicatedLogsFiltered);
        }
        if ("method" in criteria) {
          maybeDuplicatedLogsFiltered = handleFilterCallsWithOptions(criteria.method, finalOptions, this.filterCallsByMethod, maybeDuplicatedLogsFiltered);
        }
        const uniqLogsFiltered = [...new Set(maybeDuplicatedLogsFiltered)];
        return uniqLogsFiltered;
      }
      throw new InvalidArgumentError("criteria parameter should be one of function, regexp, or object");
    }
    filterCallsByProtocol = makeFilterCalls.call(this, "protocol");
    filterCallsByHost = makeFilterCalls.call(this, "host");
    filterCallsByPort = makeFilterCalls.call(this, "port");
    filterCallsByOrigin = makeFilterCalls.call(this, "origin");
    filterCallsByPath = makeFilterCalls.call(this, "path");
    filterCallsByHash = makeFilterCalls.call(this, "hash");
    filterCallsByFullUrl = makeFilterCalls.call(this, "fullUrl");
    filterCallsByMethod = makeFilterCalls.call(this, "method");
    clear() {
      this.logs = [];
    }
    [kMockCallHistoryAddLog](requestInit) {
      const log = new MockCallHistoryLog(requestInit);
      this.logs.push(log);
      return log;
    }
    *[Symbol.iterator]() {
      for (const log of this.calls()) {
        yield log;
      }
    }
  }
  mockCallHistory.MockCallHistory = MockCallHistory;
  mockCallHistory.MockCallHistoryLog = MockCallHistoryLog;
  return mockCallHistory;
}
var mockPool;
var hasRequiredMockPool;
function requireMockPool() {
  if (hasRequiredMockPool) return mockPool;
  hasRequiredMockPool = 1;
  const { promisify } = require$$0$3;
  const Pool = /* @__PURE__ */ requirePool();
  const { buildMockDispatch } = /* @__PURE__ */ requireMockUtils();
  const {
    kDispatches,
    kMockAgent,
    kClose,
    kOriginalClose,
    kOrigin,
    kOriginalDispatch,
    kConnected,
    kIgnoreTrailingSlash
  } = /* @__PURE__ */ requireMockSymbols();
  const { MockInterceptor } = /* @__PURE__ */ requireMockInterceptor();
  const Symbols = /* @__PURE__ */ requireSymbols();
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  class MockPool extends Pool {
    constructor(origin, opts) {
      if (!opts || !opts.agent || typeof opts.agent.dispatch !== "function") {
        throw new InvalidArgumentError("Argument opts.agent must implement Agent");
      }
      super(origin, opts);
      this[kMockAgent] = opts.agent;
      this[kOrigin] = origin;
      this[kIgnoreTrailingSlash] = opts.ignoreTrailingSlash ?? false;
      this[kDispatches] = [];
      this[kConnected] = 1;
      this[kOriginalDispatch] = this.dispatch;
      this[kOriginalClose] = this.close.bind(this);
      this.dispatch = buildMockDispatch.call(this);
      this.close = this[kClose];
    }
    get [Symbols.kConnected]() {
      return this[kConnected];
    }
    /**
     * Sets up the base interceptor for mocking replies from undici.
     */
    intercept(opts) {
      return new MockInterceptor(
        opts && { ignoreTrailingSlash: this[kIgnoreTrailingSlash], ...opts },
        this[kDispatches]
      );
    }
    cleanMocks() {
      this[kDispatches] = [];
    }
    async [kClose]() {
      await promisify(this[kOriginalClose])();
      this[kConnected] = 0;
      this[kMockAgent][Symbols.kClients].delete(this[kOrigin]);
    }
  }
  mockPool = MockPool;
  return mockPool;
}
var pendingInterceptorsFormatter;
var hasRequiredPendingInterceptorsFormatter;
function requirePendingInterceptorsFormatter() {
  if (hasRequiredPendingInterceptorsFormatter) return pendingInterceptorsFormatter;
  hasRequiredPendingInterceptorsFormatter = 1;
  const { Transform } = require$$0;
  const { Console } = require$$1$2;
  const PERSISTENT = process.versions.icu ? "✅" : "Y ";
  const NOT_PERSISTENT = process.versions.icu ? "❌" : "N ";
  pendingInterceptorsFormatter = class PendingInterceptorsFormatter {
    constructor({ disableColors } = {}) {
      this.transform = new Transform({
        transform(chunk, _enc, cb) {
          cb(null, chunk);
        }
      });
      this.logger = new Console({
        stdout: this.transform,
        inspectOptions: {
          colors: !disableColors && !process.env.CI
        }
      });
    }
    format(pendingInterceptors) {
      const withPrettyHeaders = pendingInterceptors.map(
        ({ method, path, data: { statusCode }, persist, times, timesInvoked, origin }) => ({
          Method: method,
          Origin: origin,
          Path: path,
          "Status code": statusCode,
          Persistent: persist ? PERSISTENT : NOT_PERSISTENT,
          Invocations: timesInvoked,
          Remaining: persist ? Infinity : times - timesInvoked
        })
      );
      this.logger.table(withPrettyHeaders);
      return this.transform.read().toString();
    }
  };
  return pendingInterceptorsFormatter;
}
var mockAgent;
var hasRequiredMockAgent;
function requireMockAgent() {
  if (hasRequiredMockAgent) return mockAgent;
  hasRequiredMockAgent = 1;
  const { kClients } = /* @__PURE__ */ requireSymbols();
  const Agent = /* @__PURE__ */ requireAgent();
  const {
    kAgent,
    kMockAgentSet,
    kMockAgentGet,
    kDispatches,
    kIsMockActive,
    kNetConnect,
    kGetNetConnect,
    kOptions,
    kFactory,
    kMockAgentRegisterCallHistory,
    kMockAgentIsCallHistoryEnabled,
    kMockAgentAddCallHistoryLog,
    kMockAgentMockCallHistoryInstance,
    kMockAgentAcceptsNonStandardSearchParameters,
    kMockCallHistoryAddLog,
    kIgnoreTrailingSlash
  } = /* @__PURE__ */ requireMockSymbols();
  const MockClient = /* @__PURE__ */ requireMockClient();
  const MockPool = /* @__PURE__ */ requireMockPool();
  const { matchValue, normalizeSearchParams, buildAndValidateMockOptions, normalizeOrigin } = /* @__PURE__ */ requireMockUtils();
  const { InvalidArgumentError, UndiciError } = /* @__PURE__ */ requireErrors();
  const Dispatcher = /* @__PURE__ */ requireDispatcher();
  const PendingInterceptorsFormatter = /* @__PURE__ */ requirePendingInterceptorsFormatter();
  const { MockCallHistory } = /* @__PURE__ */ requireMockCallHistory();
  class MockAgent extends Dispatcher {
    constructor(opts = {}) {
      super(opts);
      const mockOptions = buildAndValidateMockOptions(opts);
      this[kNetConnect] = true;
      this[kIsMockActive] = true;
      this[kMockAgentIsCallHistoryEnabled] = mockOptions.enableCallHistory ?? false;
      this[kMockAgentAcceptsNonStandardSearchParameters] = mockOptions.acceptNonStandardSearchParameters ?? false;
      this[kIgnoreTrailingSlash] = mockOptions.ignoreTrailingSlash ?? false;
      if (opts?.agent && typeof opts.agent.dispatch !== "function") {
        throw new InvalidArgumentError("Argument opts.agent must implement Agent");
      }
      const agent2 = opts?.agent ? opts.agent : new Agent(opts);
      this[kAgent] = agent2;
      this[kClients] = agent2[kClients];
      this[kOptions] = mockOptions;
      if (this[kMockAgentIsCallHistoryEnabled]) {
        this[kMockAgentRegisterCallHistory]();
      }
    }
    get(origin) {
      const normalizedOrigin = normalizeOrigin(origin);
      const originKey = this[kIgnoreTrailingSlash] ? normalizedOrigin.replace(/\/$/, "") : normalizedOrigin;
      let dispatcher2 = this[kMockAgentGet](originKey);
      if (!dispatcher2) {
        dispatcher2 = this[kFactory](originKey);
        this[kMockAgentSet](originKey, dispatcher2);
      }
      return dispatcher2;
    }
    dispatch(opts, handler) {
      opts.origin = normalizeOrigin(opts.origin);
      this.get(opts.origin);
      this[kMockAgentAddCallHistoryLog](opts);
      const acceptNonStandardSearchParameters = this[kMockAgentAcceptsNonStandardSearchParameters];
      const dispatchOpts = { ...opts };
      if (acceptNonStandardSearchParameters && dispatchOpts.path) {
        const [path, searchParams] = dispatchOpts.path.split("?");
        const normalizedSearchParams = normalizeSearchParams(searchParams, acceptNonStandardSearchParameters);
        dispatchOpts.path = `${path}?${normalizedSearchParams}`;
      }
      return this[kAgent].dispatch(dispatchOpts, handler);
    }
    async close() {
      this.clearCallHistory();
      await this[kAgent].close();
      this[kClients].clear();
    }
    deactivate() {
      this[kIsMockActive] = false;
    }
    activate() {
      this[kIsMockActive] = true;
    }
    enableNetConnect(matcher) {
      if (typeof matcher === "string" || typeof matcher === "function" || matcher instanceof RegExp) {
        if (Array.isArray(this[kNetConnect])) {
          this[kNetConnect].push(matcher);
        } else {
          this[kNetConnect] = [matcher];
        }
      } else if (typeof matcher === "undefined") {
        this[kNetConnect] = true;
      } else {
        throw new InvalidArgumentError("Unsupported matcher. Must be one of String|Function|RegExp.");
      }
    }
    disableNetConnect() {
      this[kNetConnect] = false;
    }
    enableCallHistory() {
      this[kMockAgentIsCallHistoryEnabled] = true;
      return this;
    }
    disableCallHistory() {
      this[kMockAgentIsCallHistoryEnabled] = false;
      return this;
    }
    getCallHistory() {
      return this[kMockAgentMockCallHistoryInstance];
    }
    clearCallHistory() {
      if (this[kMockAgentMockCallHistoryInstance] !== void 0) {
        this[kMockAgentMockCallHistoryInstance].clear();
      }
    }
    // This is required to bypass issues caused by using global symbols - see:
    // https://github.com/nodejs/undici/issues/1447
    get isMockActive() {
      return this[kIsMockActive];
    }
    [kMockAgentRegisterCallHistory]() {
      if (this[kMockAgentMockCallHistoryInstance] === void 0) {
        this[kMockAgentMockCallHistoryInstance] = new MockCallHistory();
      }
    }
    [kMockAgentAddCallHistoryLog](opts) {
      if (this[kMockAgentIsCallHistoryEnabled]) {
        this[kMockAgentRegisterCallHistory]();
        this[kMockAgentMockCallHistoryInstance][kMockCallHistoryAddLog](opts);
      }
    }
    [kMockAgentSet](origin, dispatcher2) {
      this[kClients].set(origin, { count: 0, dispatcher: dispatcher2 });
    }
    [kFactory](origin) {
      const mockOptions = Object.assign({ agent: this }, this[kOptions]);
      return this[kOptions] && this[kOptions].connections === 1 ? new MockClient(origin, mockOptions) : new MockPool(origin, mockOptions);
    }
    [kMockAgentGet](origin) {
      const result = this[kClients].get(origin);
      if (result?.dispatcher) {
        return result.dispatcher;
      }
      if (typeof origin !== "string") {
        const dispatcher2 = this[kFactory]("http://localhost:9999");
        this[kMockAgentSet](origin, dispatcher2);
        return dispatcher2;
      }
      for (const [keyMatcher, result2] of Array.from(this[kClients])) {
        if (result2 && typeof keyMatcher !== "string" && matchValue(keyMatcher, origin)) {
          const dispatcher2 = this[kFactory](origin);
          this[kMockAgentSet](origin, dispatcher2);
          dispatcher2[kDispatches] = result2.dispatcher[kDispatches];
          return dispatcher2;
        }
      }
    }
    [kGetNetConnect]() {
      return this[kNetConnect];
    }
    pendingInterceptors() {
      const mockAgentClients = this[kClients];
      return Array.from(mockAgentClients.entries()).flatMap(([origin, result]) => result.dispatcher[kDispatches].map((dispatch) => ({ ...dispatch, origin }))).filter(({ pending }) => pending);
    }
    assertNoPendingInterceptors({ pendingInterceptorsFormatter: pendingInterceptorsFormatter2 = new PendingInterceptorsFormatter() } = {}) {
      const pending = this.pendingInterceptors();
      if (pending.length === 0) {
        return;
      }
      throw new UndiciError(
        pending.length === 1 ? `1 interceptor is pending:

${pendingInterceptorsFormatter2.format(pending)}`.trim() : `${pending.length} interceptors are pending:

${pendingInterceptorsFormatter2.format(pending)}`.trim()
      );
    }
  }
  mockAgent = MockAgent;
  return mockAgent;
}
var snapshotUtils;
var hasRequiredSnapshotUtils;
function requireSnapshotUtils() {
  if (hasRequiredSnapshotUtils) return snapshotUtils;
  hasRequiredSnapshotUtils = 1;
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  const { runtimeFeatures: runtimeFeatures2 } = /* @__PURE__ */ requireRuntimeFeatures();
  function createHeaderFilters(matchOptions = {}) {
    const { ignoreHeaders = [], excludeHeaders = [], matchHeaders = [], caseSensitive = false } = matchOptions;
    return {
      ignore: new Set(ignoreHeaders.map((header) => caseSensitive ? header : header.toLowerCase())),
      exclude: new Set(excludeHeaders.map((header) => caseSensitive ? header : header.toLowerCase())),
      match: new Set(matchHeaders.map((header) => caseSensitive ? header : header.toLowerCase()))
    };
  }
  const crypto$1 = runtimeFeatures2.has("crypto") ? crypto : null;
  const hashId = crypto$1?.hash ? (value) => crypto$1.hash("sha256", value, "base64url") : (value) => Buffer.from(value).toString("base64url");
  function isUndiciHeaders(headers2) {
    return Array.isArray(headers2) && (headers2.length & 1) === 0;
  }
  function isUrlExcludedFactory(excludePatterns = []) {
    if (excludePatterns.length === 0) {
      return () => false;
    }
    return function isUrlExcluded(url) {
      let urlLowerCased;
      for (const pattern of excludePatterns) {
        if (typeof pattern === "string") {
          if (!urlLowerCased) {
            urlLowerCased = url.toLowerCase();
          }
          if (urlLowerCased.includes(pattern.toLowerCase())) {
            return true;
          }
        } else if (pattern instanceof RegExp) {
          if (pattern.test(url)) {
            return true;
          }
        }
      }
      return false;
    };
  }
  function normalizeHeaders(headers2) {
    const normalizedHeaders = {};
    if (!headers2) return normalizedHeaders;
    if (isUndiciHeaders(headers2)) {
      for (let i = 0; i < headers2.length; i += 2) {
        const key = headers2[i];
        const value = headers2[i + 1];
        if (key && value !== void 0) {
          const keyStr = Buffer.isBuffer(key) ? key.toString() : key;
          const valueStr = Buffer.isBuffer(value) ? value.toString() : value;
          normalizedHeaders[keyStr.toLowerCase()] = valueStr;
        }
      }
      return normalizedHeaders;
    }
    if (headers2 && typeof headers2 === "object") {
      for (const [key, value] of Object.entries(headers2)) {
        if (key && typeof key === "string") {
          normalizedHeaders[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
        }
      }
    }
    return normalizedHeaders;
  }
  const validSnapshotModes = (
    /** @type {const} */
    ["record", "playback", "update"]
  );
  function validateSnapshotMode(mode) {
    if (!validSnapshotModes.includes(mode)) {
      throw new InvalidArgumentError(`Invalid snapshot mode: ${mode}. Must be one of: ${validSnapshotModes.join(", ")}`);
    }
  }
  snapshotUtils = {
    createHeaderFilters,
    hashId,
    isUndiciHeaders,
    normalizeHeaders,
    isUrlExcludedFactory,
    validateSnapshotMode
  };
  return snapshotUtils;
}
var snapshotRecorder;
var hasRequiredSnapshotRecorder;
function requireSnapshotRecorder() {
  if (hasRequiredSnapshotRecorder) return snapshotRecorder;
  hasRequiredSnapshotRecorder = 1;
  const { writeFile, readFile, mkdir } = require$$0$6;
  const { dirname, resolve } = require$$1$3;
  const { setTimeout: setTimeout2, clearTimeout: clearTimeout2 } = require$$2$2;
  const { InvalidArgumentError, UndiciError } = /* @__PURE__ */ requireErrors();
  const { hashId, isUrlExcludedFactory, normalizeHeaders, createHeaderFilters } = /* @__PURE__ */ requireSnapshotUtils();
  function formatRequestKey(opts, headerFilters, matchOptions = {}) {
    const url = new URL(opts.path, opts.origin);
    const normalized = opts._normalizedHeaders || normalizeHeaders(opts.headers);
    if (!opts._normalizedHeaders) {
      opts._normalizedHeaders = normalized;
    }
    return {
      method: opts.method || "GET",
      url: matchOptions.matchQuery !== false ? url.toString() : `${url.origin}${url.pathname}`,
      headers: filterHeadersForMatching(normalized, headerFilters, matchOptions),
      body: matchOptions.matchBody !== false && opts.body ? String(opts.body) : ""
    };
  }
  function filterHeadersForMatching(headers2, headerFilters, matchOptions = {}) {
    if (!headers2 || typeof headers2 !== "object") return {};
    const {
      caseSensitive = false
    } = matchOptions;
    const filtered = {};
    const { ignore, exclude, match } = headerFilters;
    for (const [key, value] of Object.entries(headers2)) {
      const headerKey = caseSensitive ? key : key.toLowerCase();
      if (exclude.has(headerKey)) continue;
      if (ignore.has(headerKey)) continue;
      if (match.size !== 0) {
        if (!match.has(headerKey)) continue;
      }
      filtered[headerKey] = value;
    }
    return filtered;
  }
  function filterHeadersForStorage(headers2, headerFilters, matchOptions = {}) {
    if (!headers2 || typeof headers2 !== "object") return {};
    const {
      caseSensitive = false
    } = matchOptions;
    const filtered = {};
    const { exclude: excludeSet } = headerFilters;
    for (const [key, value] of Object.entries(headers2)) {
      const headerKey = caseSensitive ? key : key.toLowerCase();
      if (excludeSet.has(headerKey)) continue;
      filtered[headerKey] = value;
    }
    return filtered;
  }
  function createRequestHash(formattedRequest) {
    const parts = [
      formattedRequest.method,
      formattedRequest.url
    ];
    if (formattedRequest.headers && typeof formattedRequest.headers === "object") {
      const headerKeys = Object.keys(formattedRequest.headers).sort();
      for (const key of headerKeys) {
        const values = Array.isArray(formattedRequest.headers[key]) ? formattedRequest.headers[key] : [formattedRequest.headers[key]];
        parts.push(key);
        for (const value of values.sort()) {
          parts.push(String(value));
        }
      }
    }
    parts.push(formattedRequest.body);
    const content = parts.join("|");
    return hashId(content);
  }
  class SnapshotRecorder {
    /** @type {NodeJS.Timeout | null} */
    #flushTimeout;
    /** @type {import('./snapshot-utils').IsUrlExcluded} */
    #isUrlExcluded;
    /** @type {Map<string, SnapshotEntry>} */
    #snapshots = /* @__PURE__ */ new Map();
    /** @type {string|undefined} */
    #snapshotPath;
    /** @type {number} */
    #maxSnapshots = Infinity;
    /** @type {boolean} */
    #autoFlush = false;
    /** @type {import('./snapshot-utils').HeaderFilters} */
    #headerFilters;
    /**
     * Creates a new SnapshotRecorder instance
     * @param {SnapshotRecorderOptions&SnapshotRecorderMatchOptions} [options={}] - Configuration options for the recorder
     */
    constructor(options = {}) {
      this.#snapshotPath = options.snapshotPath;
      this.#maxSnapshots = options.maxSnapshots || Infinity;
      this.#autoFlush = options.autoFlush || false;
      this.flushInterval = options.flushInterval || 3e4;
      this._flushTimer = null;
      this.matchOptions = {
        matchHeaders: options.matchHeaders || [],
        // empty means match all headers
        ignoreHeaders: options.ignoreHeaders || [],
        excludeHeaders: options.excludeHeaders || [],
        matchBody: options.matchBody !== false,
        // default: true
        matchQuery: options.matchQuery !== false,
        // default: true
        caseSensitive: options.caseSensitive || false
      };
      this.#headerFilters = createHeaderFilters(this.matchOptions);
      this.shouldRecord = options.shouldRecord || (() => true);
      this.shouldPlayback = options.shouldPlayback || (() => true);
      this.#isUrlExcluded = isUrlExcludedFactory(options.excludeUrls);
      if (this.#autoFlush && this.#snapshotPath) {
        this.#startAutoFlush();
      }
    }
    /**
     * Records a request-response interaction
     * @param {SnapshotRequestOptions} requestOpts - Request options
     * @param {SnapshotEntryResponse} response - Response data to record
     * @return {Promise<void>} - Resolves when the recording is complete
     */
    async record(requestOpts, response2) {
      if (!this.shouldRecord(requestOpts)) {
        return;
      }
      if (this.isUrlExcluded(requestOpts)) {
        return;
      }
      const request2 = formatRequestKey(requestOpts, this.#headerFilters, this.matchOptions);
      const hash = createRequestHash(request2);
      const normalizedHeaders = normalizeHeaders(response2.headers);
      const responseData = {
        statusCode: response2.statusCode,
        headers: filterHeadersForStorage(normalizedHeaders, this.#headerFilters, this.matchOptions),
        body: Buffer.isBuffer(response2.body) ? response2.body.toString("base64") : Buffer.from(String(response2.body || "")).toString("base64"),
        trailers: response2.trailers
      };
      if (this.#snapshots.size >= this.#maxSnapshots && !this.#snapshots.has(hash)) {
        const oldestKey = this.#snapshots.keys().next().value;
        this.#snapshots.delete(oldestKey);
      }
      const existingSnapshot = this.#snapshots.get(hash);
      if (existingSnapshot && existingSnapshot.responses) {
        existingSnapshot.responses.push(responseData);
        existingSnapshot.timestamp = (/* @__PURE__ */ new Date()).toISOString();
      } else {
        this.#snapshots.set(hash, {
          request: request2,
          responses: [responseData],
          // Always store as array for consistency
          callCount: 0,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      if (this.#autoFlush && this.#snapshotPath) {
        this.#scheduleFlush();
      }
    }
    /**
     * Checks if a URL should be excluded from recording/playback
     * @param {SnapshotRequestOptions} requestOpts - Request options to check
     * @returns {boolean} - True if URL is excluded
     */
    isUrlExcluded(requestOpts) {
      const url = new URL(requestOpts.path, requestOpts.origin).toString();
      return this.#isUrlExcluded(url);
    }
    /**
     * Finds a matching snapshot for the given request
     * Returns the appropriate response based on call count for sequential responses
     *
     * @param {SnapshotRequestOptions} requestOpts - Request options to match
     * @returns {SnapshotEntry&Record<'response', SnapshotEntryResponse>|undefined} - Matching snapshot response or undefined if not found
     */
    findSnapshot(requestOpts) {
      if (!this.shouldPlayback(requestOpts)) {
        return void 0;
      }
      if (this.isUrlExcluded(requestOpts)) {
        return void 0;
      }
      const request2 = formatRequestKey(requestOpts, this.#headerFilters, this.matchOptions);
      const hash = createRequestHash(request2);
      const snapshot = this.#snapshots.get(hash);
      if (!snapshot) return void 0;
      const currentCallCount = snapshot.callCount || 0;
      const responseIndex = Math.min(currentCallCount, snapshot.responses.length - 1);
      snapshot.callCount = currentCallCount + 1;
      return {
        ...snapshot,
        response: snapshot.responses[responseIndex]
      };
    }
    /**
     * Loads snapshots from file
     * @param {string} [filePath] - Optional file path to load snapshots from
     * @return {Promise<void>} - Resolves when snapshots are loaded
     */
    async loadSnapshots(filePath) {
      const path = filePath || this.#snapshotPath;
      if (!path) {
        throw new InvalidArgumentError("Snapshot path is required");
      }
      try {
        const data = await readFile(resolve(path), "utf8");
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.#snapshots.clear();
          for (const { hash, snapshot } of parsed) {
            this.#snapshots.set(hash, snapshot);
          }
        } else {
          this.#snapshots = new Map(Object.entries(parsed));
        }
      } catch (error) {
        if (error.code === "ENOENT") {
          this.#snapshots.clear();
        } else {
          throw new UndiciError(`Failed to load snapshots from ${path}`, { cause: error });
        }
      }
    }
    /**
     * Saves snapshots to file
     *
     * @param {string} [filePath] - Optional file path to save snapshots
     * @returns {Promise<void>} - Resolves when snapshots are saved
     */
    async saveSnapshots(filePath) {
      const path = filePath || this.#snapshotPath;
      if (!path) {
        throw new InvalidArgumentError("Snapshot path is required");
      }
      const resolvedPath = resolve(path);
      await mkdir(dirname(resolvedPath), { recursive: true });
      const data = Array.from(this.#snapshots.entries()).map(([hash, snapshot]) => ({
        hash,
        snapshot
      }));
      await writeFile(resolvedPath, JSON.stringify(data, null, 2), { flush: true });
    }
    /**
     * Clears all recorded snapshots
     * @returns {void}
     */
    clear() {
      this.#snapshots.clear();
    }
    /**
     * Gets all recorded snapshots
     * @return {Array<SnapshotEntry>} - Array of all recorded snapshots
     */
    getSnapshots() {
      return Array.from(this.#snapshots.values());
    }
    /**
     * Gets snapshot count
     * @return {number} - Number of recorded snapshots
     */
    size() {
      return this.#snapshots.size;
    }
    /**
     * Resets call counts for all snapshots (useful for test cleanup)
     * @returns {void}
     */
    resetCallCounts() {
      for (const snapshot of this.#snapshots.values()) {
        snapshot.callCount = 0;
      }
    }
    /**
     * Deletes a specific snapshot by request options
     * @param {SnapshotRequestOptions} requestOpts - Request options to match
     * @returns {boolean} - True if snapshot was deleted, false if not found
     */
    deleteSnapshot(requestOpts) {
      const request2 = formatRequestKey(requestOpts, this.#headerFilters, this.matchOptions);
      const hash = createRequestHash(request2);
      return this.#snapshots.delete(hash);
    }
    /**
     * Gets information about a specific snapshot
     * @param {SnapshotRequestOptions} requestOpts - Request options to match
     * @returns {SnapshotInfo|null} - Snapshot information or null if not found
     */
    getSnapshotInfo(requestOpts) {
      const request2 = formatRequestKey(requestOpts, this.#headerFilters, this.matchOptions);
      const hash = createRequestHash(request2);
      const snapshot = this.#snapshots.get(hash);
      if (!snapshot) return null;
      return {
        hash,
        request: snapshot.request,
        responseCount: snapshot.responses ? snapshot.responses.length : snapshot.response ? 1 : 0,
        // .response for legacy snapshots
        callCount: snapshot.callCount || 0,
        timestamp: snapshot.timestamp
      };
    }
    /**
     * Replaces all snapshots with new data (full replacement)
     * @param {Array<{hash: string; snapshot: SnapshotEntry}>|Record<string, SnapshotEntry>} snapshotData - New snapshot data to replace existing ones
     * @returns {void}
     */
    replaceSnapshots(snapshotData) {
      this.#snapshots.clear();
      if (Array.isArray(snapshotData)) {
        for (const { hash, snapshot } of snapshotData) {
          this.#snapshots.set(hash, snapshot);
        }
      } else if (snapshotData && typeof snapshotData === "object") {
        this.#snapshots = new Map(Object.entries(snapshotData));
      }
    }
    /**
     * Starts the auto-flush timer
     * @returns {void}
     */
    #startAutoFlush() {
      return this.#scheduleFlush();
    }
    /**
     * Stops the auto-flush timer
     * @returns {void}
     */
    #stopAutoFlush() {
      if (this.#flushTimeout) {
        clearTimeout2(this.#flushTimeout);
        this.saveSnapshots().catch(() => {
        });
        this.#flushTimeout = null;
      }
    }
    /**
     * Schedules a flush (debounced to avoid excessive writes)
     */
    #scheduleFlush() {
      this.#flushTimeout = setTimeout2(() => {
        this.saveSnapshots().catch(() => {
        });
        if (this.#autoFlush) {
          this.#flushTimeout?.refresh();
        } else {
          this.#flushTimeout = null;
        }
      }, 1e3);
    }
    /**
     * Cleanup method to stop timers
     * @returns {void}
     */
    destroy() {
      this.#stopAutoFlush();
      if (this.#flushTimeout) {
        clearTimeout2(this.#flushTimeout);
        this.#flushTimeout = null;
      }
    }
    /**
     * Async close method that saves all recordings and performs cleanup
     * @returns {Promise<void>}
     */
    async close() {
      if (this.#snapshotPath && this.#snapshots.size !== 0) {
        await this.saveSnapshots();
      }
      this.destroy();
    }
  }
  snapshotRecorder = { SnapshotRecorder, formatRequestKey, createRequestHash, filterHeadersForMatching, filterHeadersForStorage, createHeaderFilters };
  return snapshotRecorder;
}
var snapshotAgent;
var hasRequiredSnapshotAgent;
function requireSnapshotAgent() {
  if (hasRequiredSnapshotAgent) return snapshotAgent;
  hasRequiredSnapshotAgent = 1;
  const Agent = /* @__PURE__ */ requireAgent();
  const MockAgent = /* @__PURE__ */ requireMockAgent();
  const { SnapshotRecorder } = /* @__PURE__ */ requireSnapshotRecorder();
  const WrapHandler = /* @__PURE__ */ requireWrapHandler();
  const { InvalidArgumentError, UndiciError } = /* @__PURE__ */ requireErrors();
  const { validateSnapshotMode } = /* @__PURE__ */ requireSnapshotUtils();
  const kSnapshotRecorder = Symbol("kSnapshotRecorder");
  const kSnapshotMode = Symbol("kSnapshotMode");
  const kSnapshotPath = Symbol("kSnapshotPath");
  const kSnapshotLoaded = Symbol("kSnapshotLoaded");
  const kRealAgent = Symbol("kRealAgent");
  let warningEmitted = false;
  class SnapshotAgent extends MockAgent {
    constructor(opts = {}) {
      if (!warningEmitted) {
        process.emitWarning(
          "SnapshotAgent is experimental and subject to change",
          "ExperimentalWarning"
        );
        warningEmitted = true;
      }
      const {
        mode = "record",
        snapshotPath = null,
        ...mockAgentOpts
      } = opts;
      super(mockAgentOpts);
      validateSnapshotMode(mode);
      if ((mode === "playback" || mode === "update") && !snapshotPath) {
        throw new InvalidArgumentError(`snapshotPath is required when mode is '${mode}'`);
      }
      this[kSnapshotMode] = mode;
      this[kSnapshotPath] = snapshotPath;
      this[kSnapshotRecorder] = new SnapshotRecorder({
        snapshotPath: this[kSnapshotPath],
        mode: this[kSnapshotMode],
        maxSnapshots: opts.maxSnapshots,
        autoFlush: opts.autoFlush,
        flushInterval: opts.flushInterval,
        matchHeaders: opts.matchHeaders,
        ignoreHeaders: opts.ignoreHeaders,
        excludeHeaders: opts.excludeHeaders,
        matchBody: opts.matchBody,
        matchQuery: opts.matchQuery,
        caseSensitive: opts.caseSensitive,
        shouldRecord: opts.shouldRecord,
        shouldPlayback: opts.shouldPlayback,
        excludeUrls: opts.excludeUrls
      });
      this[kSnapshotLoaded] = false;
      if (this[kSnapshotMode] === "record" || this[kSnapshotMode] === "update" || this[kSnapshotMode] === "playback" && opts.excludeUrls && opts.excludeUrls.length > 0) {
        this[kRealAgent] = new Agent(opts);
      }
      if ((this[kSnapshotMode] === "playback" || this[kSnapshotMode] === "update") && this[kSnapshotPath]) {
        this.loadSnapshots().catch(() => {
        });
      }
    }
    dispatch(opts, handler) {
      handler = WrapHandler.wrap(handler);
      const mode = this[kSnapshotMode];
      if (this[kSnapshotRecorder].isUrlExcluded(opts)) {
        return this[kRealAgent].dispatch(opts, handler);
      }
      if (mode === "playback" || mode === "update") {
        if (!this[kSnapshotLoaded]) {
          return this.#asyncDispatch(opts, handler);
        }
        const snapshot = this[kSnapshotRecorder].findSnapshot(opts);
        if (snapshot) {
          return this.#replaySnapshot(snapshot, handler);
        } else if (mode === "update") {
          return this.#recordAndReplay(opts, handler);
        } else {
          const error = new UndiciError(`No snapshot found for ${opts.method || "GET"} ${opts.path}`);
          if (handler.onError) {
            handler.onError(error);
            return;
          }
          throw error;
        }
      } else if (mode === "record") {
        return this.#recordAndReplay(opts, handler);
      }
    }
    /**
     * Async version of dispatch for when we need to load snapshots first
     */
    async #asyncDispatch(opts, handler) {
      await this.loadSnapshots();
      return this.dispatch(opts, handler);
    }
    /**
     * Records a real request and replays the response
     */
    #recordAndReplay(opts, handler) {
      const responseData = {
        statusCode: null,
        headers: {},
        trailers: {},
        body: []
      };
      const self = this;
      const recordingHandler = {
        onRequestStart(controller, context) {
          return handler.onRequestStart(controller, { ...context, history: this.history });
        },
        onRequestUpgrade(controller, statusCode, headers2, socket) {
          return handler.onRequestUpgrade(controller, statusCode, headers2, socket);
        },
        onResponseStart(controller, statusCode, headers2, statusMessage) {
          responseData.statusCode = statusCode;
          responseData.headers = headers2;
          return handler.onResponseStart(controller, statusCode, headers2, statusMessage);
        },
        onResponseData(controller, chunk) {
          responseData.body.push(chunk);
          return handler.onResponseData(controller, chunk);
        },
        onResponseEnd(controller, trailers) {
          responseData.trailers = trailers;
          const responseBody = Buffer.concat(responseData.body);
          self[kSnapshotRecorder].record(opts, {
            statusCode: responseData.statusCode,
            headers: responseData.headers,
            body: responseBody,
            trailers: responseData.trailers
          }).then(() => handler.onResponseEnd(controller, trailers)).catch((error) => handler.onResponseError(controller, error));
        }
      };
      const agent2 = this[kRealAgent];
      return agent2.dispatch(opts, recordingHandler);
    }
    /**
     * Replays a recorded response
     *
     * @param {Object} snapshot - The recorded snapshot to replay.
     * @param {Object} handler - The handler to call with the response data.
     * @returns {void}
     */
    #replaySnapshot(snapshot, handler) {
      try {
        const { response: response2 } = snapshot;
        const controller = {
          pause() {
          },
          resume() {
          },
          abort(reason) {
            this.aborted = true;
            this.reason = reason;
          },
          aborted: false,
          paused: false
        };
        handler.onRequestStart(controller);
        handler.onResponseStart(controller, response2.statusCode, response2.headers);
        const body2 = Buffer.from(response2.body, "base64");
        handler.onResponseData(controller, body2);
        handler.onResponseEnd(controller, response2.trailers);
      } catch (error) {
        handler.onError?.(error);
      }
    }
    /**
     * Loads snapshots from file
     *
     * @param {string} [filePath] - Optional file path to load snapshots from.
     * @returns {Promise<void>} - Resolves when snapshots are loaded.
     */
    async loadSnapshots(filePath) {
      await this[kSnapshotRecorder].loadSnapshots(filePath || this[kSnapshotPath]);
      this[kSnapshotLoaded] = true;
      if (this[kSnapshotMode] === "playback") {
        this.#setupMockInterceptors();
      }
    }
    /**
     * Saves snapshots to file
     *
     * @param {string} [filePath] - Optional file path to save snapshots to.
     * @returns {Promise<void>} - Resolves when snapshots are saved.
     */
    async saveSnapshots(filePath) {
      return this[kSnapshotRecorder].saveSnapshots(filePath || this[kSnapshotPath]);
    }
    /**
     * Sets up MockAgent interceptors based on recorded snapshots.
     *
     * This method creates MockAgent interceptors for each recorded snapshot,
     * allowing the SnapshotAgent to fall back to MockAgent's standard intercept
     * mechanism in playback mode. Each interceptor is configured to persist
     * (remain active for multiple requests) and responds with the recorded
     * response data.
     *
     * Called automatically when loading snapshots in playback mode.
     *
     * @returns {void}
     */
    #setupMockInterceptors() {
      for (const snapshot of this[kSnapshotRecorder].getSnapshots()) {
        const { request: request2, responses, response: response2 } = snapshot;
        const url = new URL(request2.url);
        const mockPool2 = this.get(url.origin);
        const responseData = responses ? responses[0] : response2;
        if (!responseData) continue;
        mockPool2.intercept({
          path: url.pathname + url.search,
          method: request2.method,
          headers: request2.headers,
          body: request2.body
        }).reply(responseData.statusCode, responseData.body, {
          headers: responseData.headers,
          trailers: responseData.trailers
        }).persist();
      }
    }
    /**
     * Gets the snapshot recorder
     * @return {SnapshotRecorder} - The snapshot recorder instance
     */
    getRecorder() {
      return this[kSnapshotRecorder];
    }
    /**
     * Gets the current mode
     * @return {import('./snapshot-utils').SnapshotMode} - The current snapshot mode
     */
    getMode() {
      return this[kSnapshotMode];
    }
    /**
     * Clears all snapshots
     * @returns {void}
     */
    clearSnapshots() {
      this[kSnapshotRecorder].clear();
    }
    /**
     * Resets call counts for all snapshots (useful for test cleanup)
     * @returns {void}
     */
    resetCallCounts() {
      this[kSnapshotRecorder].resetCallCounts();
    }
    /**
     * Deletes a specific snapshot by request options
     * @param {import('./snapshot-recorder').SnapshotRequestOptions} requestOpts - Request options to identify the snapshot
     * @return {Promise<boolean>} - Returns true if the snapshot was deleted, false if not found
     */
    deleteSnapshot(requestOpts) {
      return this[kSnapshotRecorder].deleteSnapshot(requestOpts);
    }
    /**
     * Gets information about a specific snapshot
     * @returns {import('./snapshot-recorder').SnapshotInfo|null} - Snapshot information or null if not found
     */
    getSnapshotInfo(requestOpts) {
      return this[kSnapshotRecorder].getSnapshotInfo(requestOpts);
    }
    /**
     * Replaces all snapshots with new data (full replacement)
     * @param {Array<{hash: string; snapshot: import('./snapshot-recorder').SnapshotEntryshotEntry}>|Record<string, import('./snapshot-recorder').SnapshotEntry>} snapshotData - New snapshot data to replace existing snapshots
     * @returns {void}
     */
    replaceSnapshots(snapshotData) {
      this[kSnapshotRecorder].replaceSnapshots(snapshotData);
    }
    /**
     * Closes the agent, saving snapshots and cleaning up resources.
     *
     * @returns {Promise<void>}
     */
    async close() {
      await this[kSnapshotRecorder].close();
      await this[kRealAgent]?.close();
      await super.close();
    }
  }
  snapshotAgent = SnapshotAgent;
  return snapshotAgent;
}
var global;
var hasRequiredGlobal;
function requireGlobal() {
  if (hasRequiredGlobal) return global;
  hasRequiredGlobal = 1;
  const globalDispatcher = Symbol.for("undici.globalDispatcher.1");
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  const Agent = /* @__PURE__ */ requireAgent();
  if (getGlobalDispatcher() === void 0) {
    setGlobalDispatcher(new Agent());
  }
  function setGlobalDispatcher(agent2) {
    if (!agent2 || typeof agent2.dispatch !== "function") {
      throw new InvalidArgumentError("Argument agent must implement Agent");
    }
    Object.defineProperty(globalThis, globalDispatcher, {
      value: agent2,
      writable: true,
      enumerable: false,
      configurable: false
    });
  }
  function getGlobalDispatcher() {
    return globalThis[globalDispatcher];
  }
  const installedExports = (
    /** @type {const} */
    [
      "fetch",
      "Headers",
      "Response",
      "Request",
      "FormData",
      "WebSocket",
      "CloseEvent",
      "ErrorEvent",
      "MessageEvent",
      "EventSource"
    ]
  );
  global = {
    setGlobalDispatcher,
    getGlobalDispatcher,
    installedExports
  };
  return global;
}
var decoratorHandler;
var hasRequiredDecoratorHandler;
function requireDecoratorHandler() {
  if (hasRequiredDecoratorHandler) return decoratorHandler;
  hasRequiredDecoratorHandler = 1;
  const assert = require$$0$1;
  const WrapHandler = /* @__PURE__ */ requireWrapHandler();
  decoratorHandler = class DecoratorHandler {
    #handler;
    #onCompleteCalled = false;
    #onErrorCalled = false;
    #onResponseStartCalled = false;
    constructor(handler) {
      if (typeof handler !== "object" || handler === null) {
        throw new TypeError("handler must be an object");
      }
      this.#handler = WrapHandler.wrap(handler);
    }
    onRequestStart(...args) {
      this.#handler.onRequestStart?.(...args);
    }
    onRequestUpgrade(...args) {
      assert(!this.#onCompleteCalled);
      assert(!this.#onErrorCalled);
      return this.#handler.onRequestUpgrade?.(...args);
    }
    onResponseStart(...args) {
      assert(!this.#onCompleteCalled);
      assert(!this.#onErrorCalled);
      assert(!this.#onResponseStartCalled);
      this.#onResponseStartCalled = true;
      return this.#handler.onResponseStart?.(...args);
    }
    onResponseData(...args) {
      assert(!this.#onCompleteCalled);
      assert(!this.#onErrorCalled);
      return this.#handler.onResponseData?.(...args);
    }
    onResponseEnd(...args) {
      assert(!this.#onCompleteCalled);
      assert(!this.#onErrorCalled);
      this.#onCompleteCalled = true;
      return this.#handler.onResponseEnd?.(...args);
    }
    onResponseError(...args) {
      this.#onErrorCalled = true;
      return this.#handler.onResponseError?.(...args);
    }
    /**
     * @deprecated
     */
    onBodySent() {
    }
  };
  return decoratorHandler;
}
var redirectHandler;
var hasRequiredRedirectHandler;
function requireRedirectHandler() {
  if (hasRequiredRedirectHandler) return redirectHandler;
  hasRequiredRedirectHandler = 1;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const { kBodyUsed } = /* @__PURE__ */ requireSymbols();
  const assert = require$$0$1;
  const { InvalidArgumentError } = /* @__PURE__ */ requireErrors();
  const EE = require$$6;
  const redirectableStatusCodes = [300, 301, 302, 303, 307, 308];
  const kBody = Symbol("body");
  const noop = () => {
  };
  class BodyAsyncIterable {
    constructor(body2) {
      this[kBody] = body2;
      this[kBodyUsed] = false;
    }
    async *[Symbol.asyncIterator]() {
      assert(!this[kBodyUsed], "disturbed");
      this[kBodyUsed] = true;
      yield* this[kBody];
    }
  }
  class RedirectHandler {
    static buildDispatch(dispatcher2, maxRedirections) {
      if (maxRedirections != null && (!Number.isInteger(maxRedirections) || maxRedirections < 0)) {
        throw new InvalidArgumentError("maxRedirections must be a positive number");
      }
      const dispatch = dispatcher2.dispatch.bind(dispatcher2);
      return (opts, originalHandler) => dispatch(opts, new RedirectHandler(dispatch, maxRedirections, opts, originalHandler));
    }
    constructor(dispatch, maxRedirections, opts, handler) {
      if (maxRedirections != null && (!Number.isInteger(maxRedirections) || maxRedirections < 0)) {
        throw new InvalidArgumentError("maxRedirections must be a positive number");
      }
      this.dispatch = dispatch;
      this.location = null;
      const { maxRedirections: _, ...cleanOpts } = opts;
      this.opts = cleanOpts;
      this.maxRedirections = maxRedirections;
      this.handler = handler;
      this.history = [];
      if (util2.isStream(this.opts.body)) {
        if (util2.bodyLength(this.opts.body) === 0) {
          this.opts.body.on("data", function() {
            assert(false);
          });
        }
        if (typeof this.opts.body.readableDidRead !== "boolean") {
          this.opts.body[kBodyUsed] = false;
          EE.prototype.on.call(this.opts.body, "data", function() {
            this[kBodyUsed] = true;
          });
        }
      } else if (this.opts.body && typeof this.opts.body.pipeTo === "function") {
        this.opts.body = new BodyAsyncIterable(this.opts.body);
      } else if (this.opts.body && typeof this.opts.body !== "string" && !ArrayBuffer.isView(this.opts.body) && util2.isIterable(this.opts.body) && !util2.isFormDataLike(this.opts.body)) {
        this.opts.body = new BodyAsyncIterable(this.opts.body);
      }
    }
    onRequestStart(controller, context) {
      this.handler.onRequestStart?.(controller, { ...context, history: this.history });
    }
    onRequestUpgrade(controller, statusCode, headers2, socket) {
      this.handler.onRequestUpgrade?.(controller, statusCode, headers2, socket);
    }
    onResponseStart(controller, statusCode, headers2, statusMessage) {
      if (this.opts.throwOnMaxRedirect && this.history.length >= this.maxRedirections) {
        throw new Error("max redirects");
      }
      if ((statusCode === 301 || statusCode === 302) && this.opts.method === "POST") {
        this.opts.method = "GET";
        if (util2.isStream(this.opts.body)) {
          util2.destroy(this.opts.body.on("error", noop));
        }
        this.opts.body = null;
      }
      if (statusCode === 303 && this.opts.method !== "HEAD") {
        this.opts.method = "GET";
        if (util2.isStream(this.opts.body)) {
          util2.destroy(this.opts.body.on("error", noop));
        }
        this.opts.body = null;
      }
      this.location = this.history.length >= this.maxRedirections || util2.isDisturbed(this.opts.body) || redirectableStatusCodes.indexOf(statusCode) === -1 ? null : headers2.location;
      if (this.opts.origin) {
        this.history.push(new URL(this.opts.path, this.opts.origin));
      }
      if (!this.location) {
        this.handler.onResponseStart?.(controller, statusCode, headers2, statusMessage);
        return;
      }
      const { origin, pathname, search } = util2.parseURL(new URL(this.location, this.opts.origin && new URL(this.opts.path, this.opts.origin)));
      const path = search ? `${pathname}${search}` : pathname;
      const redirectUrlString = `${origin}${path}`;
      for (const historyUrl of this.history) {
        if (historyUrl.toString() === redirectUrlString) {
          throw new InvalidArgumentError(`Redirect loop detected. Cannot redirect to ${origin}. This typically happens when using a Client or Pool with cross-origin redirects. Use an Agent for cross-origin redirects.`);
        }
      }
      this.opts.headers = cleanRequestHeaders(this.opts.headers, statusCode === 303, this.opts.origin !== origin);
      this.opts.path = path;
      this.opts.origin = origin;
      this.opts.query = null;
    }
    onResponseData(controller, chunk) {
      if (this.location) ;
      else {
        this.handler.onResponseData?.(controller, chunk);
      }
    }
    onResponseEnd(controller, trailers) {
      if (this.location) {
        this.dispatch(this.opts, this);
      } else {
        this.handler.onResponseEnd(controller, trailers);
      }
    }
    onResponseError(controller, error) {
      this.handler.onResponseError?.(controller, error);
    }
  }
  function shouldRemoveHeader(header, removeContent, unknownOrigin) {
    if (header.length === 4) {
      return util2.headerNameToString(header) === "host";
    }
    if (removeContent && util2.headerNameToString(header).startsWith("content-")) {
      return true;
    }
    if (unknownOrigin && (header.length === 13 || header.length === 6 || header.length === 19)) {
      const name = util2.headerNameToString(header);
      return name === "authorization" || name === "cookie" || name === "proxy-authorization";
    }
    return false;
  }
  function cleanRequestHeaders(headers2, removeContent, unknownOrigin) {
    const ret = [];
    if (Array.isArray(headers2)) {
      for (let i = 0; i < headers2.length; i += 2) {
        if (!shouldRemoveHeader(headers2[i], removeContent, unknownOrigin)) {
          ret.push(headers2[i], headers2[i + 1]);
        }
      }
    } else if (headers2 && typeof headers2 === "object") {
      const entries = typeof headers2[Symbol.iterator] === "function" ? headers2 : Object.entries(headers2);
      for (const [key, value] of entries) {
        if (!shouldRemoveHeader(key, removeContent, unknownOrigin)) {
          ret.push(key, value);
        }
      }
    } else {
      assert(headers2 == null, "headers must be an object or an array");
    }
    return ret;
  }
  redirectHandler = RedirectHandler;
  return redirectHandler;
}
var redirect;
var hasRequiredRedirect;
function requireRedirect() {
  if (hasRequiredRedirect) return redirect;
  hasRequiredRedirect = 1;
  const RedirectHandler = /* @__PURE__ */ requireRedirectHandler();
  function createRedirectInterceptor({ maxRedirections: defaultMaxRedirections } = {}) {
    return (dispatch) => {
      return function Intercept(opts, handler) {
        const { maxRedirections = defaultMaxRedirections, ...rest } = opts;
        if (maxRedirections == null || maxRedirections === 0) {
          return dispatch(opts, handler);
        }
        const dispatchOpts = { ...rest };
        const redirectHandler2 = new RedirectHandler(dispatch, maxRedirections, dispatchOpts, handler);
        return dispatch(dispatchOpts, redirectHandler2);
      };
    };
  }
  redirect = createRedirectInterceptor;
  return redirect;
}
var responseError;
var hasRequiredResponseError;
function requireResponseError() {
  if (hasRequiredResponseError) return responseError;
  hasRequiredResponseError = 1;
  const DecoratorHandler = /* @__PURE__ */ requireDecoratorHandler();
  const { ResponseError } = /* @__PURE__ */ requireErrors();
  class ResponseErrorHandler extends DecoratorHandler {
    #statusCode;
    #contentType;
    #decoder;
    #headers;
    #body;
    constructor(_opts, { handler }) {
      super(handler);
    }
    #checkContentType(contentType) {
      return (this.#contentType ?? "").indexOf(contentType) === 0;
    }
    onRequestStart(controller, context) {
      this.#statusCode = 0;
      this.#contentType = null;
      this.#decoder = null;
      this.#headers = null;
      this.#body = "";
      return super.onRequestStart(controller, context);
    }
    onResponseStart(controller, statusCode, headers2, statusMessage) {
      this.#statusCode = statusCode;
      this.#headers = headers2;
      this.#contentType = headers2["content-type"];
      if (this.#statusCode < 400) {
        return super.onResponseStart(controller, statusCode, headers2, statusMessage);
      }
      if (this.#checkContentType("application/json") || this.#checkContentType("text/plain")) {
        this.#decoder = new TextDecoder("utf-8");
      }
    }
    onResponseData(controller, chunk) {
      if (this.#statusCode < 400) {
        return super.onResponseData(controller, chunk);
      }
      this.#body += this.#decoder?.decode(chunk, { stream: true }) ?? "";
    }
    onResponseEnd(controller, trailers) {
      if (this.#statusCode >= 400) {
        this.#body += this.#decoder?.decode(void 0, { stream: false }) ?? "";
        if (this.#checkContentType("application/json")) {
          try {
            this.#body = JSON.parse(this.#body);
          } catch {
          }
        }
        let err;
        const stackTraceLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = 0;
        try {
          err = new ResponseError("Response Error", this.#statusCode, {
            body: this.#body,
            headers: this.#headers
          });
        } finally {
          Error.stackTraceLimit = stackTraceLimit;
        }
        super.onResponseError(controller, err);
      } else {
        super.onResponseEnd(controller, trailers);
      }
    }
    onResponseError(controller, err) {
      super.onResponseError(controller, err);
    }
  }
  responseError = () => {
    return (dispatch) => {
      return function Intercept(opts, handler) {
        return dispatch(opts, new ResponseErrorHandler(opts, { handler }));
      };
    };
  };
  return responseError;
}
var retry;
var hasRequiredRetry;
function requireRetry() {
  if (hasRequiredRetry) return retry;
  hasRequiredRetry = 1;
  const RetryHandler = /* @__PURE__ */ requireRetryHandler();
  retry = (globalOpts) => {
    return (dispatch) => {
      return function retryInterceptor(opts, handler) {
        return dispatch(
          opts,
          new RetryHandler(
            { ...opts, retryOptions: { ...globalOpts, ...opts.retryOptions } },
            {
              handler,
              dispatch
            }
          )
        );
      };
    };
  };
  return retry;
}
var dump;
var hasRequiredDump;
function requireDump() {
  if (hasRequiredDump) return dump;
  hasRequiredDump = 1;
  const { InvalidArgumentError, RequestAbortedError } = /* @__PURE__ */ requireErrors();
  const DecoratorHandler = /* @__PURE__ */ requireDecoratorHandler();
  class DumpHandler extends DecoratorHandler {
    #maxSize = 1024 * 1024;
    #dumped = false;
    #size = 0;
    #controller = null;
    aborted = false;
    reason = false;
    constructor({ maxSize, signal }, handler) {
      if (maxSize != null && (!Number.isFinite(maxSize) || maxSize < 1)) {
        throw new InvalidArgumentError("maxSize must be a number greater than 0");
      }
      super(handler);
      this.#maxSize = maxSize ?? this.#maxSize;
    }
    #abort(reason) {
      this.aborted = true;
      this.reason = reason;
    }
    onRequestStart(controller, context) {
      controller.abort = this.#abort.bind(this);
      this.#controller = controller;
      return super.onRequestStart(controller, context);
    }
    onResponseStart(controller, statusCode, headers2, statusMessage) {
      const contentLength = headers2["content-length"];
      if (contentLength != null && contentLength > this.#maxSize) {
        throw new RequestAbortedError(
          `Response size (${contentLength}) larger than maxSize (${this.#maxSize})`
        );
      }
      if (this.aborted === true) {
        return true;
      }
      return super.onResponseStart(controller, statusCode, headers2, statusMessage);
    }
    onResponseError(controller, err) {
      if (this.#dumped) {
        return;
      }
      err = this.#controller?.reason ?? err;
      super.onResponseError(controller, err);
    }
    onResponseData(controller, chunk) {
      this.#size = this.#size + chunk.length;
      if (this.#size >= this.#maxSize) {
        this.#dumped = true;
        if (this.aborted === true) {
          super.onResponseError(controller, this.reason);
        } else {
          super.onResponseEnd(controller, {});
        }
      }
      return true;
    }
    onResponseEnd(controller, trailers) {
      if (this.#dumped) {
        return;
      }
      if (this.#controller.aborted === true) {
        super.onResponseError(controller, this.reason);
        return;
      }
      super.onResponseEnd(controller, trailers);
    }
  }
  function createDumpInterceptor({ maxSize: defaultMaxSize } = {
    maxSize: 1024 * 1024
  }) {
    return (dispatch) => {
      return function Intercept(opts, handler) {
        const { dumpMaxSize = defaultMaxSize } = opts;
        const dumpHandler = new DumpHandler({ maxSize: dumpMaxSize, signal: opts.signal }, handler);
        return dispatch(opts, dumpHandler);
      };
    };
  }
  dump = createDumpInterceptor;
  return dump;
}
var dns;
var hasRequiredDns;
function requireDns() {
  if (hasRequiredDns) return dns;
  hasRequiredDns = 1;
  const { isIP } = require$$0$2;
  const { lookup } = require$$1$4;
  const DecoratorHandler = /* @__PURE__ */ requireDecoratorHandler();
  const { InvalidArgumentError, InformationalError } = /* @__PURE__ */ requireErrors();
  const maxInt = Math.pow(2, 31) - 1;
  class DNSStorage {
    #maxItems = 0;
    #records = /* @__PURE__ */ new Map();
    constructor(opts) {
      this.#maxItems = opts.maxItems;
    }
    get size() {
      return this.#records.size;
    }
    get(hostname) {
      return this.#records.get(hostname) ?? null;
    }
    set(hostname, records) {
      this.#records.set(hostname, records);
    }
    delete(hostname) {
      this.#records.delete(hostname);
    }
    // Delegate to storage decide can we do more lookups or not
    full() {
      return this.size >= this.#maxItems;
    }
  }
  class DNSInstance {
    #maxTTL = 0;
    #maxItems = 0;
    dualStack = true;
    affinity = null;
    lookup = null;
    pick = null;
    storage = null;
    constructor(opts) {
      this.#maxTTL = opts.maxTTL;
      this.#maxItems = opts.maxItems;
      this.dualStack = opts.dualStack;
      this.affinity = opts.affinity;
      this.lookup = opts.lookup ?? this.#defaultLookup;
      this.pick = opts.pick ?? this.#defaultPick;
      this.storage = opts.storage ?? new DNSStorage(opts);
    }
    runLookup(origin, opts, cb) {
      const ips = this.storage.get(origin.hostname);
      if (ips == null && this.storage.full()) {
        cb(null, origin);
        return;
      }
      const newOpts = {
        affinity: this.affinity,
        dualStack: this.dualStack,
        lookup: this.lookup,
        pick: this.pick,
        ...opts.dns,
        maxTTL: this.#maxTTL,
        maxItems: this.#maxItems
      };
      if (ips == null) {
        this.lookup(origin, newOpts, (err, addresses) => {
          if (err || addresses == null || addresses.length === 0) {
            cb(err ?? new InformationalError("No DNS entries found"));
            return;
          }
          this.setRecords(origin, addresses);
          const records = this.storage.get(origin.hostname);
          const ip = this.pick(
            origin,
            records,
            newOpts.affinity
          );
          let port;
          if (typeof ip.port === "number") {
            port = `:${ip.port}`;
          } else if (origin.port !== "") {
            port = `:${origin.port}`;
          } else {
            port = "";
          }
          cb(
            null,
            new URL(`${origin.protocol}//${ip.family === 6 ? `[${ip.address}]` : ip.address}${port}`)
          );
        });
      } else {
        const ip = this.pick(
          origin,
          ips,
          newOpts.affinity
        );
        if (ip == null) {
          this.storage.delete(origin.hostname);
          this.runLookup(origin, opts, cb);
          return;
        }
        let port;
        if (typeof ip.port === "number") {
          port = `:${ip.port}`;
        } else if (origin.port !== "") {
          port = `:${origin.port}`;
        } else {
          port = "";
        }
        cb(
          null,
          new URL(`${origin.protocol}//${ip.family === 6 ? `[${ip.address}]` : ip.address}${port}`)
        );
      }
    }
    #defaultLookup(origin, opts, cb) {
      lookup(
        origin.hostname,
        {
          all: true,
          family: this.dualStack === false ? this.affinity : 0,
          order: "ipv4first"
        },
        (err, addresses) => {
          if (err) {
            return cb(err);
          }
          const results = /* @__PURE__ */ new Map();
          for (const addr of addresses) {
            results.set(`${addr.address}:${addr.family}`, addr);
          }
          cb(null, results.values());
        }
      );
    }
    #defaultPick(origin, hostnameRecords, affinity) {
      let ip = null;
      const { records, offset } = hostnameRecords;
      let family;
      if (this.dualStack) {
        if (affinity == null) {
          if (offset == null || offset === maxInt) {
            hostnameRecords.offset = 0;
            affinity = 4;
          } else {
            hostnameRecords.offset++;
            affinity = (hostnameRecords.offset & 1) === 1 ? 6 : 4;
          }
        }
        if (records[affinity] != null && records[affinity].ips.length > 0) {
          family = records[affinity];
        } else {
          family = records[affinity === 4 ? 6 : 4];
        }
      } else {
        family = records[affinity];
      }
      if (family == null || family.ips.length === 0) {
        return ip;
      }
      if (family.offset == null || family.offset === maxInt) {
        family.offset = 0;
      } else {
        family.offset++;
      }
      const position = family.offset % family.ips.length;
      ip = family.ips[position] ?? null;
      if (ip == null) {
        return ip;
      }
      if (Date.now() - ip.timestamp > ip.ttl) {
        family.ips.splice(position, 1);
        return this.pick(origin, hostnameRecords, affinity);
      }
      return ip;
    }
    pickFamily(origin, ipFamily) {
      const records = this.storage.get(origin.hostname)?.records;
      if (!records) {
        return null;
      }
      const family = records[ipFamily];
      if (!family) {
        return null;
      }
      if (family.offset == null || family.offset === maxInt) {
        family.offset = 0;
      } else {
        family.offset++;
      }
      const position = family.offset % family.ips.length;
      const ip = family.ips[position] ?? null;
      if (ip == null) {
        return ip;
      }
      if (Date.now() - ip.timestamp > ip.ttl) {
        family.ips.splice(position, 1);
      }
      return ip;
    }
    setRecords(origin, addresses) {
      const timestamp = Date.now();
      const records = { records: { 4: null, 6: null } };
      let minTTL = this.#maxTTL;
      for (const record of addresses) {
        record.timestamp = timestamp;
        if (typeof record.ttl === "number") {
          record.ttl = Math.min(record.ttl, this.#maxTTL);
          minTTL = Math.min(minTTL, record.ttl);
        } else {
          record.ttl = this.#maxTTL;
        }
        const familyRecords = records.records[record.family] ?? { ips: [] };
        familyRecords.ips.push(record);
        records.records[record.family] = familyRecords;
      }
      this.storage.set(origin.hostname, records, { ttl: minTTL });
    }
    deleteRecords(origin) {
      this.storage.delete(origin.hostname);
    }
    getHandler(meta, opts) {
      return new DNSDispatchHandler(this, meta, opts);
    }
  }
  class DNSDispatchHandler extends DecoratorHandler {
    #state = null;
    #opts = null;
    #dispatch = null;
    #origin = null;
    #controller = null;
    #newOrigin = null;
    #firstTry = true;
    constructor(state, { origin, handler, dispatch, newOrigin }, opts) {
      super(handler);
      this.#origin = origin;
      this.#newOrigin = newOrigin;
      this.#opts = { ...opts };
      this.#state = state;
      this.#dispatch = dispatch;
    }
    onResponseError(controller, err) {
      switch (err.code) {
        case "ETIMEDOUT":
        case "ECONNREFUSED": {
          if (this.#state.dualStack) {
            if (!this.#firstTry) {
              super.onResponseError(controller, err);
              return;
            }
            this.#firstTry = false;
            const otherFamily = this.#newOrigin.hostname[0] === "[" ? 4 : 6;
            const ip = this.#state.pickFamily(this.#origin, otherFamily);
            if (ip == null) {
              super.onResponseError(controller, err);
              return;
            }
            let port;
            if (typeof ip.port === "number") {
              port = `:${ip.port}`;
            } else if (this.#origin.port !== "") {
              port = `:${this.#origin.port}`;
            } else {
              port = "";
            }
            const dispatchOpts = {
              ...this.#opts,
              origin: `${this.#origin.protocol}//${ip.family === 6 ? `[${ip.address}]` : ip.address}${port}`
            };
            this.#dispatch(dispatchOpts, this);
            return;
          }
          super.onResponseError(controller, err);
          break;
        }
        case "ENOTFOUND":
          this.#state.deleteRecords(this.#origin);
          super.onResponseError(controller, err);
          break;
        default:
          super.onResponseError(controller, err);
          break;
      }
    }
  }
  dns = (interceptorOpts) => {
    if (interceptorOpts?.maxTTL != null && (typeof interceptorOpts?.maxTTL !== "number" || interceptorOpts?.maxTTL < 0)) {
      throw new InvalidArgumentError("Invalid maxTTL. Must be a positive number");
    }
    if (interceptorOpts?.maxItems != null && (typeof interceptorOpts?.maxItems !== "number" || interceptorOpts?.maxItems < 1)) {
      throw new InvalidArgumentError(
        "Invalid maxItems. Must be a positive number and greater than zero"
      );
    }
    if (interceptorOpts?.affinity != null && interceptorOpts?.affinity !== 4 && interceptorOpts?.affinity !== 6) {
      throw new InvalidArgumentError("Invalid affinity. Must be either 4 or 6");
    }
    if (interceptorOpts?.dualStack != null && typeof interceptorOpts?.dualStack !== "boolean") {
      throw new InvalidArgumentError("Invalid dualStack. Must be a boolean");
    }
    if (interceptorOpts?.lookup != null && typeof interceptorOpts?.lookup !== "function") {
      throw new InvalidArgumentError("Invalid lookup. Must be a function");
    }
    if (interceptorOpts?.pick != null && typeof interceptorOpts?.pick !== "function") {
      throw new InvalidArgumentError("Invalid pick. Must be a function");
    }
    if (interceptorOpts?.storage != null && (typeof interceptorOpts?.storage?.get !== "function" || typeof interceptorOpts?.storage?.set !== "function" || typeof interceptorOpts?.storage?.full !== "function" || typeof interceptorOpts?.storage?.delete !== "function")) {
      throw new InvalidArgumentError("Invalid storage. Must be a object with methods: { get, set, full, delete }");
    }
    const dualStack = interceptorOpts?.dualStack ?? true;
    let affinity;
    if (dualStack) {
      affinity = interceptorOpts?.affinity ?? null;
    } else {
      affinity = interceptorOpts?.affinity ?? 4;
    }
    const opts = {
      maxTTL: interceptorOpts?.maxTTL ?? 1e4,
      // Expressed in ms
      lookup: interceptorOpts?.lookup ?? null,
      pick: interceptorOpts?.pick ?? null,
      dualStack,
      affinity,
      maxItems: interceptorOpts?.maxItems ?? Infinity,
      storage: interceptorOpts?.storage
    };
    const instance = new DNSInstance(opts);
    return (dispatch) => {
      return function dnsInterceptor(origDispatchOpts, handler) {
        const origin = origDispatchOpts.origin.constructor === URL ? origDispatchOpts.origin : new URL(origDispatchOpts.origin);
        if (isIP(origin.hostname) !== 0) {
          return dispatch(origDispatchOpts, handler);
        }
        instance.runLookup(origin, origDispatchOpts, (err, newOrigin) => {
          if (err) {
            return handler.onResponseError(null, err);
          }
          const dispatchOpts = {
            ...origDispatchOpts,
            servername: origin.hostname,
            // For SNI on TLS
            origin: newOrigin.origin,
            headers: {
              host: origin.host,
              ...origDispatchOpts.headers
            }
          };
          dispatch(
            dispatchOpts,
            instance.getHandler(
              { origin, dispatch, handler, newOrigin },
              origDispatchOpts
            )
          );
        });
        return true;
      };
    };
  };
  return dns;
}
var cache$2;
var hasRequiredCache$2;
function requireCache$2() {
  if (hasRequiredCache$2) return cache$2;
  hasRequiredCache$2 = 1;
  const {
    safeHTTPMethods,
    pathHasQueryOrFragment
  } = /* @__PURE__ */ requireUtil$5();
  const { serializePathWithQuery } = /* @__PURE__ */ requireUtil$5();
  function makeCacheKey(opts) {
    if (!opts.origin) {
      throw new Error("opts.origin is undefined");
    }
    let fullPath = opts.path || "/";
    if (opts.query && !pathHasQueryOrFragment(opts.path)) {
      fullPath = serializePathWithQuery(fullPath, opts.query);
    }
    return {
      origin: opts.origin.toString(),
      method: opts.method,
      path: fullPath,
      headers: opts.headers
    };
  }
  function normalizeHeaders(opts) {
    let headers2;
    if (opts.headers == null) {
      headers2 = {};
    } else if (typeof opts.headers[Symbol.iterator] === "function") {
      headers2 = {};
      for (const x of opts.headers) {
        if (!Array.isArray(x)) {
          throw new Error("opts.headers is not a valid header map");
        }
        const [key, val] = x;
        if (typeof key !== "string" || typeof val !== "string") {
          throw new Error("opts.headers is not a valid header map");
        }
        headers2[key.toLowerCase()] = val;
      }
    } else if (typeof opts.headers === "object") {
      headers2 = {};
      for (const key of Object.keys(opts.headers)) {
        headers2[key.toLowerCase()] = opts.headers[key];
      }
    } else {
      throw new Error("opts.headers is not an object");
    }
    return headers2;
  }
  function assertCacheKey(key) {
    if (typeof key !== "object") {
      throw new TypeError(`expected key to be object, got ${typeof key}`);
    }
    for (const property of ["origin", "method", "path"]) {
      if (typeof key[property] !== "string") {
        throw new TypeError(`expected key.${property} to be string, got ${typeof key[property]}`);
      }
    }
    if (key.headers !== void 0 && typeof key.headers !== "object") {
      throw new TypeError(`expected headers to be object, got ${typeof key}`);
    }
  }
  function assertCacheValue(value) {
    if (typeof value !== "object") {
      throw new TypeError(`expected value to be object, got ${typeof value}`);
    }
    for (const property of ["statusCode", "cachedAt", "staleAt", "deleteAt"]) {
      if (typeof value[property] !== "number") {
        throw new TypeError(`expected value.${property} to be number, got ${typeof value[property]}`);
      }
    }
    if (typeof value.statusMessage !== "string") {
      throw new TypeError(`expected value.statusMessage to be string, got ${typeof value.statusMessage}`);
    }
    if (value.headers != null && typeof value.headers !== "object") {
      throw new TypeError(`expected value.rawHeaders to be object, got ${typeof value.headers}`);
    }
    if (value.vary !== void 0 && typeof value.vary !== "object") {
      throw new TypeError(`expected value.vary to be object, got ${typeof value.vary}`);
    }
    if (value.etag !== void 0 && typeof value.etag !== "string") {
      throw new TypeError(`expected value.etag to be string, got ${typeof value.etag}`);
    }
  }
  function parseCacheControlHeader(header) {
    const output = {};
    let directives;
    if (Array.isArray(header)) {
      directives = [];
      for (const directive of header) {
        directives.push(...directive.split(","));
      }
    } else {
      directives = header.split(",");
    }
    for (let i = 0; i < directives.length; i++) {
      const directive = directives[i].toLowerCase();
      const keyValueDelimiter = directive.indexOf("=");
      let key;
      let value;
      if (keyValueDelimiter !== -1) {
        key = directive.substring(0, keyValueDelimiter).trimStart();
        value = directive.substring(keyValueDelimiter + 1);
      } else {
        key = directive.trim();
      }
      switch (key) {
        case "min-fresh":
        case "max-stale":
        case "max-age":
        case "s-maxage":
        case "stale-while-revalidate":
        case "stale-if-error": {
          if (value === void 0 || value[0] === " ") {
            continue;
          }
          if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
            value = value.substring(1, value.length - 1);
          }
          const parsedValue = parseInt(value, 10);
          if (parsedValue !== parsedValue) {
            continue;
          }
          if (key === "max-age" && key in output && output[key] >= parsedValue) {
            continue;
          }
          output[key] = parsedValue;
          break;
        }
        case "private":
        case "no-cache": {
          if (value) {
            if (value[0] === '"') {
              const headers2 = [value.substring(1)];
              let foundEndingQuote = value[value.length - 1] === '"';
              if (!foundEndingQuote) {
                for (let j = i + 1; j < directives.length; j++) {
                  const nextPart = directives[j];
                  const nextPartLength = nextPart.length;
                  headers2.push(nextPart.trim());
                  if (nextPartLength !== 0 && nextPart[nextPartLength - 1] === '"') {
                    foundEndingQuote = true;
                    break;
                  }
                }
              }
              if (foundEndingQuote) {
                let lastHeader = headers2[headers2.length - 1];
                if (lastHeader[lastHeader.length - 1] === '"') {
                  lastHeader = lastHeader.substring(0, lastHeader.length - 1);
                  headers2[headers2.length - 1] = lastHeader;
                }
                if (key in output) {
                  output[key] = output[key].concat(headers2);
                } else {
                  output[key] = headers2;
                }
              }
            } else {
              if (key in output) {
                output[key] = output[key].concat(value);
              } else {
                output[key] = [value];
              }
            }
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case "public":
        case "no-store":
        case "must-revalidate":
        case "proxy-revalidate":
        case "immutable":
        case "no-transform":
        case "must-understand":
        case "only-if-cached":
          if (value) {
            continue;
          }
          output[key] = true;
          break;
        default:
          continue;
      }
    }
    return output;
  }
  function parseVaryHeader(varyHeader, headers2) {
    if (typeof varyHeader === "string" && varyHeader.includes("*")) {
      return headers2;
    }
    const output = (
      /** @type {Record<string, string | string[] | null>} */
      {}
    );
    const varyingHeaders = typeof varyHeader === "string" ? varyHeader.split(",") : varyHeader;
    for (const header of varyingHeaders) {
      const trimmedHeader = header.trim().toLowerCase();
      output[trimmedHeader] = headers2[trimmedHeader] ?? null;
    }
    return output;
  }
  function isEtagUsable(etag) {
    if (etag.length <= 2) {
      return false;
    }
    if (etag[0] === '"' && etag[etag.length - 1] === '"') {
      return !(etag[1] === '"' || etag.startsWith('"W/'));
    }
    if (etag.startsWith('W/"') && etag[etag.length - 1] === '"') {
      return etag.length !== 4;
    }
    return false;
  }
  function assertCacheStore(store, name = "CacheStore") {
    if (typeof store !== "object" || store === null) {
      throw new TypeError(`expected type of ${name} to be a CacheStore, got ${store === null ? "null" : typeof store}`);
    }
    for (const fn of ["get", "createWriteStream", "delete"]) {
      if (typeof store[fn] !== "function") {
        throw new TypeError(`${name} needs to have a \`${fn}()\` function`);
      }
    }
  }
  function assertCacheMethods(methods, name = "CacheMethods") {
    if (!Array.isArray(methods)) {
      throw new TypeError(`expected type of ${name} needs to be an array, got ${methods === null ? "null" : typeof methods}`);
    }
    if (methods.length === 0) {
      throw new TypeError(`${name} needs to have at least one method`);
    }
    for (const method of methods) {
      if (!safeHTTPMethods.includes(method)) {
        throw new TypeError(`element of ${name}-array needs to be one of following values: ${safeHTTPMethods.join(", ")}, got ${method}`);
      }
    }
  }
  function makeDeduplicationKey(cacheKey, excludeHeaders) {
    let key = `${cacheKey.origin}:${cacheKey.method}:${cacheKey.path}`;
    if (cacheKey.headers) {
      const sortedHeaders = Object.keys(cacheKey.headers).sort();
      for (const header of sortedHeaders) {
        if (excludeHeaders?.has(header.toLowerCase())) {
          continue;
        }
        const value = cacheKey.headers[header];
        key += `:${header}=${Array.isArray(value) ? value.join(",") : value}`;
      }
    }
    return key;
  }
  cache$2 = {
    makeCacheKey,
    normalizeHeaders,
    assertCacheKey,
    assertCacheValue,
    parseCacheControlHeader,
    parseVaryHeader,
    isEtagUsable,
    assertCacheMethods,
    assertCacheStore,
    makeDeduplicationKey
  };
  return cache$2;
}
var date;
var hasRequiredDate;
function requireDate() {
  if (hasRequiredDate) return date;
  hasRequiredDate = 1;
  function parseHttpDate(date2) {
    switch (date2[3]) {
      case ",":
        return parseImfDate(date2);
      case " ":
        return parseAscTimeDate(date2);
      default:
        return parseRfc850Date(date2);
    }
  }
  function parseImfDate(date2) {
    if (date2.length !== 29 || date2[4] !== " " || date2[7] !== " " || date2[11] !== " " || date2[16] !== " " || date2[19] !== ":" || date2[22] !== ":" || date2[25] !== " " || date2[26] !== "G" || date2[27] !== "M" || date2[28] !== "T") {
      return void 0;
    }
    let weekday = -1;
    if (date2[0] === "S" && date2[1] === "u" && date2[2] === "n") {
      weekday = 0;
    } else if (date2[0] === "M" && date2[1] === "o" && date2[2] === "n") {
      weekday = 1;
    } else if (date2[0] === "T" && date2[1] === "u" && date2[2] === "e") {
      weekday = 2;
    } else if (date2[0] === "W" && date2[1] === "e" && date2[2] === "d") {
      weekday = 3;
    } else if (date2[0] === "T" && date2[1] === "h" && date2[2] === "u") {
      weekday = 4;
    } else if (date2[0] === "F" && date2[1] === "r" && date2[2] === "i") {
      weekday = 5;
    } else if (date2[0] === "S" && date2[1] === "a" && date2[2] === "t") {
      weekday = 6;
    } else {
      return void 0;
    }
    let day = 0;
    if (date2[5] === "0") {
      const code = date2.charCodeAt(6);
      if (code < 49 || code > 57) {
        return void 0;
      }
      day = code - 48;
    } else {
      const code1 = date2.charCodeAt(5);
      if (code1 < 49 || code1 > 51) {
        return void 0;
      }
      const code2 = date2.charCodeAt(6);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      day = (code1 - 48) * 10 + (code2 - 48);
    }
    let monthIdx = -1;
    if (date2[8] === "J" && date2[9] === "a" && date2[10] === "n") {
      monthIdx = 0;
    } else if (date2[8] === "F" && date2[9] === "e" && date2[10] === "b") {
      monthIdx = 1;
    } else if (date2[8] === "M" && date2[9] === "a") {
      if (date2[10] === "r") {
        monthIdx = 2;
      } else if (date2[10] === "y") {
        monthIdx = 4;
      } else {
        return void 0;
      }
    } else if (date2[8] === "J") {
      if (date2[9] === "a" && date2[10] === "n") {
        monthIdx = 0;
      } else if (date2[9] === "u") {
        if (date2[10] === "n") {
          monthIdx = 5;
        } else if (date2[10] === "l") {
          monthIdx = 6;
        } else {
          return void 0;
        }
      } else {
        return void 0;
      }
    } else if (date2[8] === "A") {
      if (date2[9] === "p" && date2[10] === "r") {
        monthIdx = 3;
      } else if (date2[9] === "u" && date2[10] === "g") {
        monthIdx = 7;
      } else {
        return void 0;
      }
    } else if (date2[8] === "S" && date2[9] === "e" && date2[10] === "p") {
      monthIdx = 8;
    } else if (date2[8] === "O" && date2[9] === "c" && date2[10] === "t") {
      monthIdx = 9;
    } else if (date2[8] === "N" && date2[9] === "o" && date2[10] === "v") {
      monthIdx = 10;
    } else if (date2[8] === "D" && date2[9] === "e" && date2[10] === "c") {
      monthIdx = 11;
    } else {
      return void 0;
    }
    const yearDigit1 = date2.charCodeAt(12);
    if (yearDigit1 < 48 || yearDigit1 > 57) {
      return void 0;
    }
    const yearDigit2 = date2.charCodeAt(13);
    if (yearDigit2 < 48 || yearDigit2 > 57) {
      return void 0;
    }
    const yearDigit3 = date2.charCodeAt(14);
    if (yearDigit3 < 48 || yearDigit3 > 57) {
      return void 0;
    }
    const yearDigit4 = date2.charCodeAt(15);
    if (yearDigit4 < 48 || yearDigit4 > 57) {
      return void 0;
    }
    const year = (yearDigit1 - 48) * 1e3 + (yearDigit2 - 48) * 100 + (yearDigit3 - 48) * 10 + (yearDigit4 - 48);
    let hour = 0;
    if (date2[17] === "0") {
      const code = date2.charCodeAt(18);
      if (code < 48 || code > 57) {
        return void 0;
      }
      hour = code - 48;
    } else {
      const code1 = date2.charCodeAt(17);
      if (code1 < 48 || code1 > 50) {
        return void 0;
      }
      const code2 = date2.charCodeAt(18);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      if (code1 === 50 && code2 > 51) {
        return void 0;
      }
      hour = (code1 - 48) * 10 + (code2 - 48);
    }
    let minute = 0;
    if (date2[20] === "0") {
      const code = date2.charCodeAt(21);
      if (code < 48 || code > 57) {
        return void 0;
      }
      minute = code - 48;
    } else {
      const code1 = date2.charCodeAt(20);
      if (code1 < 48 || code1 > 53) {
        return void 0;
      }
      const code2 = date2.charCodeAt(21);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      minute = (code1 - 48) * 10 + (code2 - 48);
    }
    let second = 0;
    if (date2[23] === "0") {
      const code = date2.charCodeAt(24);
      if (code < 48 || code > 57) {
        return void 0;
      }
      second = code - 48;
    } else {
      const code1 = date2.charCodeAt(23);
      if (code1 < 48 || code1 > 53) {
        return void 0;
      }
      const code2 = date2.charCodeAt(24);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      second = (code1 - 48) * 10 + (code2 - 48);
    }
    const result = new Date(Date.UTC(year, monthIdx, day, hour, minute, second));
    return result.getUTCDay() === weekday ? result : void 0;
  }
  function parseAscTimeDate(date2) {
    if (date2.length !== 24 || date2[7] !== " " || date2[10] !== " " || date2[19] !== " ") {
      return void 0;
    }
    let weekday = -1;
    if (date2[0] === "S" && date2[1] === "u" && date2[2] === "n") {
      weekday = 0;
    } else if (date2[0] === "M" && date2[1] === "o" && date2[2] === "n") {
      weekday = 1;
    } else if (date2[0] === "T" && date2[1] === "u" && date2[2] === "e") {
      weekday = 2;
    } else if (date2[0] === "W" && date2[1] === "e" && date2[2] === "d") {
      weekday = 3;
    } else if (date2[0] === "T" && date2[1] === "h" && date2[2] === "u") {
      weekday = 4;
    } else if (date2[0] === "F" && date2[1] === "r" && date2[2] === "i") {
      weekday = 5;
    } else if (date2[0] === "S" && date2[1] === "a" && date2[2] === "t") {
      weekday = 6;
    } else {
      return void 0;
    }
    let monthIdx = -1;
    if (date2[4] === "J" && date2[5] === "a" && date2[6] === "n") {
      monthIdx = 0;
    } else if (date2[4] === "F" && date2[5] === "e" && date2[6] === "b") {
      monthIdx = 1;
    } else if (date2[4] === "M" && date2[5] === "a") {
      if (date2[6] === "r") {
        monthIdx = 2;
      } else if (date2[6] === "y") {
        monthIdx = 4;
      } else {
        return void 0;
      }
    } else if (date2[4] === "J") {
      if (date2[5] === "a" && date2[6] === "n") {
        monthIdx = 0;
      } else if (date2[5] === "u") {
        if (date2[6] === "n") {
          monthIdx = 5;
        } else if (date2[6] === "l") {
          monthIdx = 6;
        } else {
          return void 0;
        }
      } else {
        return void 0;
      }
    } else if (date2[4] === "A") {
      if (date2[5] === "p" && date2[6] === "r") {
        monthIdx = 3;
      } else if (date2[5] === "u" && date2[6] === "g") {
        monthIdx = 7;
      } else {
        return void 0;
      }
    } else if (date2[4] === "S" && date2[5] === "e" && date2[6] === "p") {
      monthIdx = 8;
    } else if (date2[4] === "O" && date2[5] === "c" && date2[6] === "t") {
      monthIdx = 9;
    } else if (date2[4] === "N" && date2[5] === "o" && date2[6] === "v") {
      monthIdx = 10;
    } else if (date2[4] === "D" && date2[5] === "e" && date2[6] === "c") {
      monthIdx = 11;
    } else {
      return void 0;
    }
    let day = 0;
    if (date2[8] === " ") {
      const code = date2.charCodeAt(9);
      if (code < 49 || code > 57) {
        return void 0;
      }
      day = code - 48;
    } else {
      const code1 = date2.charCodeAt(8);
      if (code1 < 49 || code1 > 51) {
        return void 0;
      }
      const code2 = date2.charCodeAt(9);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      day = (code1 - 48) * 10 + (code2 - 48);
    }
    let hour = 0;
    if (date2[11] === "0") {
      const code = date2.charCodeAt(12);
      if (code < 48 || code > 57) {
        return void 0;
      }
      hour = code - 48;
    } else {
      const code1 = date2.charCodeAt(11);
      if (code1 < 48 || code1 > 50) {
        return void 0;
      }
      const code2 = date2.charCodeAt(12);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      if (code1 === 50 && code2 > 51) {
        return void 0;
      }
      hour = (code1 - 48) * 10 + (code2 - 48);
    }
    let minute = 0;
    if (date2[14] === "0") {
      const code = date2.charCodeAt(15);
      if (code < 48 || code > 57) {
        return void 0;
      }
      minute = code - 48;
    } else {
      const code1 = date2.charCodeAt(14);
      if (code1 < 48 || code1 > 53) {
        return void 0;
      }
      const code2 = date2.charCodeAt(15);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      minute = (code1 - 48) * 10 + (code2 - 48);
    }
    let second = 0;
    if (date2[17] === "0") {
      const code = date2.charCodeAt(18);
      if (code < 48 || code > 57) {
        return void 0;
      }
      second = code - 48;
    } else {
      const code1 = date2.charCodeAt(17);
      if (code1 < 48 || code1 > 53) {
        return void 0;
      }
      const code2 = date2.charCodeAt(18);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      second = (code1 - 48) * 10 + (code2 - 48);
    }
    const yearDigit1 = date2.charCodeAt(20);
    if (yearDigit1 < 48 || yearDigit1 > 57) {
      return void 0;
    }
    const yearDigit2 = date2.charCodeAt(21);
    if (yearDigit2 < 48 || yearDigit2 > 57) {
      return void 0;
    }
    const yearDigit3 = date2.charCodeAt(22);
    if (yearDigit3 < 48 || yearDigit3 > 57) {
      return void 0;
    }
    const yearDigit4 = date2.charCodeAt(23);
    if (yearDigit4 < 48 || yearDigit4 > 57) {
      return void 0;
    }
    const year = (yearDigit1 - 48) * 1e3 + (yearDigit2 - 48) * 100 + (yearDigit3 - 48) * 10 + (yearDigit4 - 48);
    const result = new Date(Date.UTC(year, monthIdx, day, hour, minute, second));
    return result.getUTCDay() === weekday ? result : void 0;
  }
  function parseRfc850Date(date2) {
    let commaIndex = -1;
    let weekday = -1;
    if (date2[0] === "S") {
      if (date2[1] === "u" && date2[2] === "n" && date2[3] === "d" && date2[4] === "a" && date2[5] === "y") {
        weekday = 0;
        commaIndex = 6;
      } else if (date2[1] === "a" && date2[2] === "t" && date2[3] === "u" && date2[4] === "r" && date2[5] === "d" && date2[6] === "a" && date2[7] === "y") {
        weekday = 6;
        commaIndex = 8;
      }
    } else if (date2[0] === "M" && date2[1] === "o" && date2[2] === "n" && date2[3] === "d" && date2[4] === "a" && date2[5] === "y") {
      weekday = 1;
      commaIndex = 6;
    } else if (date2[0] === "T") {
      if (date2[1] === "u" && date2[2] === "e" && date2[3] === "s" && date2[4] === "d" && date2[5] === "a" && date2[6] === "y") {
        weekday = 2;
        commaIndex = 7;
      } else if (date2[1] === "h" && date2[2] === "u" && date2[3] === "r" && date2[4] === "s" && date2[5] === "d" && date2[6] === "a" && date2[7] === "y") {
        weekday = 4;
        commaIndex = 8;
      }
    } else if (date2[0] === "W" && date2[1] === "e" && date2[2] === "d" && date2[3] === "n" && date2[4] === "e" && date2[5] === "s" && date2[6] === "d" && date2[7] === "a" && date2[8] === "y") {
      weekday = 3;
      commaIndex = 9;
    } else if (date2[0] === "F" && date2[1] === "r" && date2[2] === "i" && date2[3] === "d" && date2[4] === "a" && date2[5] === "y") {
      weekday = 5;
      commaIndex = 6;
    } else {
      return void 0;
    }
    if (date2[commaIndex] !== "," || date2.length - commaIndex - 1 !== 23 || date2[commaIndex + 1] !== " " || date2[commaIndex + 4] !== "-" || date2[commaIndex + 8] !== "-" || date2[commaIndex + 11] !== " " || date2[commaIndex + 14] !== ":" || date2[commaIndex + 17] !== ":" || date2[commaIndex + 20] !== " " || date2[commaIndex + 21] !== "G" || date2[commaIndex + 22] !== "M" || date2[commaIndex + 23] !== "T") {
      return void 0;
    }
    let day = 0;
    if (date2[commaIndex + 2] === "0") {
      const code = date2.charCodeAt(commaIndex + 3);
      if (code < 49 || code > 57) {
        return void 0;
      }
      day = code - 48;
    } else {
      const code1 = date2.charCodeAt(commaIndex + 2);
      if (code1 < 49 || code1 > 51) {
        return void 0;
      }
      const code2 = date2.charCodeAt(commaIndex + 3);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      day = (code1 - 48) * 10 + (code2 - 48);
    }
    let monthIdx = -1;
    if (date2[commaIndex + 5] === "J" && date2[commaIndex + 6] === "a" && date2[commaIndex + 7] === "n") {
      monthIdx = 0;
    } else if (date2[commaIndex + 5] === "F" && date2[commaIndex + 6] === "e" && date2[commaIndex + 7] === "b") {
      monthIdx = 1;
    } else if (date2[commaIndex + 5] === "M" && date2[commaIndex + 6] === "a" && date2[commaIndex + 7] === "r") {
      monthIdx = 2;
    } else if (date2[commaIndex + 5] === "A" && date2[commaIndex + 6] === "p" && date2[commaIndex + 7] === "r") {
      monthIdx = 3;
    } else if (date2[commaIndex + 5] === "M" && date2[commaIndex + 6] === "a" && date2[commaIndex + 7] === "y") {
      monthIdx = 4;
    } else if (date2[commaIndex + 5] === "J" && date2[commaIndex + 6] === "u" && date2[commaIndex + 7] === "n") {
      monthIdx = 5;
    } else if (date2[commaIndex + 5] === "J" && date2[commaIndex + 6] === "u" && date2[commaIndex + 7] === "l") {
      monthIdx = 6;
    } else if (date2[commaIndex + 5] === "A" && date2[commaIndex + 6] === "u" && date2[commaIndex + 7] === "g") {
      monthIdx = 7;
    } else if (date2[commaIndex + 5] === "S" && date2[commaIndex + 6] === "e" && date2[commaIndex + 7] === "p") {
      monthIdx = 8;
    } else if (date2[commaIndex + 5] === "O" && date2[commaIndex + 6] === "c" && date2[commaIndex + 7] === "t") {
      monthIdx = 9;
    } else if (date2[commaIndex + 5] === "N" && date2[commaIndex + 6] === "o" && date2[commaIndex + 7] === "v") {
      monthIdx = 10;
    } else if (date2[commaIndex + 5] === "D" && date2[commaIndex + 6] === "e" && date2[commaIndex + 7] === "c") {
      monthIdx = 11;
    } else {
      return void 0;
    }
    const yearDigit1 = date2.charCodeAt(commaIndex + 9);
    if (yearDigit1 < 48 || yearDigit1 > 57) {
      return void 0;
    }
    const yearDigit2 = date2.charCodeAt(commaIndex + 10);
    if (yearDigit2 < 48 || yearDigit2 > 57) {
      return void 0;
    }
    let year = (yearDigit1 - 48) * 10 + (yearDigit2 - 48);
    year += year < 70 ? 2e3 : 1900;
    let hour = 0;
    if (date2[commaIndex + 12] === "0") {
      const code = date2.charCodeAt(commaIndex + 13);
      if (code < 48 || code > 57) {
        return void 0;
      }
      hour = code - 48;
    } else {
      const code1 = date2.charCodeAt(commaIndex + 12);
      if (code1 < 48 || code1 > 50) {
        return void 0;
      }
      const code2 = date2.charCodeAt(commaIndex + 13);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      if (code1 === 50 && code2 > 51) {
        return void 0;
      }
      hour = (code1 - 48) * 10 + (code2 - 48);
    }
    let minute = 0;
    if (date2[commaIndex + 15] === "0") {
      const code = date2.charCodeAt(commaIndex + 16);
      if (code < 48 || code > 57) {
        return void 0;
      }
      minute = code - 48;
    } else {
      const code1 = date2.charCodeAt(commaIndex + 15);
      if (code1 < 48 || code1 > 53) {
        return void 0;
      }
      const code2 = date2.charCodeAt(commaIndex + 16);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      minute = (code1 - 48) * 10 + (code2 - 48);
    }
    let second = 0;
    if (date2[commaIndex + 18] === "0") {
      const code = date2.charCodeAt(commaIndex + 19);
      if (code < 48 || code > 57) {
        return void 0;
      }
      second = code - 48;
    } else {
      const code1 = date2.charCodeAt(commaIndex + 18);
      if (code1 < 48 || code1 > 53) {
        return void 0;
      }
      const code2 = date2.charCodeAt(commaIndex + 19);
      if (code2 < 48 || code2 > 57) {
        return void 0;
      }
      second = (code1 - 48) * 10 + (code2 - 48);
    }
    const result = new Date(Date.UTC(year, monthIdx, day, hour, minute, second));
    return result.getUTCDay() === weekday ? result : void 0;
  }
  date = {
    parseHttpDate
  };
  return date;
}
var cacheHandler;
var hasRequiredCacheHandler;
function requireCacheHandler() {
  if (hasRequiredCacheHandler) return cacheHandler;
  hasRequiredCacheHandler = 1;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const {
    parseCacheControlHeader,
    parseVaryHeader,
    isEtagUsable
  } = /* @__PURE__ */ requireCache$2();
  const { parseHttpDate } = /* @__PURE__ */ requireDate();
  function noop() {
  }
  const HEURISTICALLY_CACHEABLE_STATUS_CODES = [
    200,
    203,
    204,
    206,
    300,
    301,
    308,
    404,
    405,
    410,
    414,
    501
  ];
  const NOT_UNDERSTOOD_STATUS_CODES = [
    206
  ];
  const MAX_RESPONSE_AGE = 2147483647e3;
  class CacheHandler {
    /**
     * @type {import('../../types/cache-interceptor.d.ts').default.CacheKey}
     */
    #cacheKey;
    /**
     * @type {import('../../types/cache-interceptor.d.ts').default.CacheHandlerOptions['type']}
     */
    #cacheType;
    /**
     * @type {number | undefined}
     */
    #cacheByDefault;
    /**
     * @type {import('../../types/cache-interceptor.d.ts').default.CacheStore}
     */
    #store;
    /**
     * @type {import('../../types/dispatcher.d.ts').default.DispatchHandler}
     */
    #handler;
    /**
     * @type {import('node:stream').Writable | undefined}
     */
    #writeStream;
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheHandlerOptions} opts
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheKey} cacheKey
     * @param {import('../../types/dispatcher.d.ts').default.DispatchHandler} handler
     */
    constructor({ store, type, cacheByDefault }, cacheKey, handler) {
      this.#store = store;
      this.#cacheType = type;
      this.#cacheByDefault = cacheByDefault;
      this.#cacheKey = cacheKey;
      this.#handler = handler;
    }
    onRequestStart(controller, context) {
      this.#writeStream?.destroy();
      this.#writeStream = void 0;
      this.#handler.onRequestStart?.(controller, context);
    }
    onRequestUpgrade(controller, statusCode, headers2, socket) {
      this.#handler.onRequestUpgrade?.(controller, statusCode, headers2, socket);
    }
    /**
     * @param {import('../../types/dispatcher.d.ts').default.DispatchController} controller
     * @param {number} statusCode
     * @param {import('../../types/header.d.ts').IncomingHttpHeaders} resHeaders
     * @param {string} statusMessage
     */
    onResponseStart(controller, statusCode, resHeaders, statusMessage) {
      const downstreamOnHeaders = () => this.#handler.onResponseStart?.(
        controller,
        statusCode,
        resHeaders,
        statusMessage
      );
      const handler = this;
      if (!util2.safeHTTPMethods.includes(this.#cacheKey.method) && statusCode >= 200 && statusCode <= 399) {
        try {
          this.#store.delete(this.#cacheKey)?.catch?.(noop);
        } catch {
        }
        return downstreamOnHeaders();
      }
      const cacheControlHeader = resHeaders["cache-control"];
      const heuristicallyCacheable = resHeaders["last-modified"] && HEURISTICALLY_CACHEABLE_STATUS_CODES.includes(statusCode);
      if (!cacheControlHeader && !resHeaders["expires"] && !heuristicallyCacheable && !this.#cacheByDefault) {
        return downstreamOnHeaders();
      }
      const cacheControlDirectives = cacheControlHeader ? parseCacheControlHeader(cacheControlHeader) : {};
      if (!canCacheResponse(this.#cacheType, statusCode, resHeaders, cacheControlDirectives)) {
        return downstreamOnHeaders();
      }
      const now = Date.now();
      const resAge = resHeaders.age ? getAge(resHeaders.age) : void 0;
      if (resAge && resAge >= MAX_RESPONSE_AGE) {
        return downstreamOnHeaders();
      }
      const resDate = typeof resHeaders.date === "string" ? parseHttpDate(resHeaders.date) : void 0;
      const staleAt = determineStaleAt(this.#cacheType, now, resAge, resHeaders, resDate, cacheControlDirectives) ?? this.#cacheByDefault;
      if (staleAt === void 0 || resAge && resAge > staleAt) {
        return downstreamOnHeaders();
      }
      const baseTime = resDate ? resDate.getTime() : now;
      const absoluteStaleAt = staleAt + baseTime;
      if (now >= absoluteStaleAt) {
        return downstreamOnHeaders();
      }
      let varyDirectives;
      if (this.#cacheKey.headers && resHeaders.vary) {
        varyDirectives = parseVaryHeader(resHeaders.vary, this.#cacheKey.headers);
        if (!varyDirectives) {
          return downstreamOnHeaders();
        }
      }
      const deleteAt = determineDeleteAt(baseTime, cacheControlDirectives, absoluteStaleAt);
      const strippedHeaders = stripNecessaryHeaders(resHeaders, cacheControlDirectives);
      const value = {
        statusCode,
        statusMessage,
        headers: strippedHeaders,
        vary: varyDirectives,
        cacheControlDirectives,
        cachedAt: resAge ? now - resAge : now,
        staleAt: absoluteStaleAt,
        deleteAt
      };
      if (statusCode === 304) {
        const cachedValue = this.#store.get(this.#cacheKey);
        if (!cachedValue) {
          return downstreamOnHeaders();
        }
        value.statusCode = cachedValue.statusCode;
        value.statusMessage = cachedValue.statusMessage;
        value.etag = cachedValue.etag;
        value.headers = { ...cachedValue.headers, ...strippedHeaders };
        downstreamOnHeaders();
        this.#writeStream = this.#store.createWriteStream(this.#cacheKey, value);
        if (!this.#writeStream || !cachedValue?.body) {
          return;
        }
        const bodyIterator = cachedValue.body.values();
        const streamCachedBody = () => {
          for (const chunk of bodyIterator) {
            const full = this.#writeStream.write(chunk) === false;
            this.#handler.onResponseData?.(controller, chunk);
            if (full) {
              break;
            }
          }
        };
        this.#writeStream.on("error", function() {
          handler.#writeStream = void 0;
          handler.#store.delete(handler.#cacheKey);
        }).on("drain", () => {
          streamCachedBody();
        }).on("close", function() {
          if (handler.#writeStream === this) {
            handler.#writeStream = void 0;
          }
        });
        streamCachedBody();
      } else {
        if (typeof resHeaders.etag === "string" && isEtagUsable(resHeaders.etag)) {
          value.etag = resHeaders.etag;
        }
        this.#writeStream = this.#store.createWriteStream(this.#cacheKey, value);
        if (!this.#writeStream) {
          return downstreamOnHeaders();
        }
        this.#writeStream.on("drain", () => controller.resume()).on("error", function() {
          handler.#writeStream = void 0;
          handler.#store.delete(handler.#cacheKey);
        }).on("close", function() {
          if (handler.#writeStream === this) {
            handler.#writeStream = void 0;
          }
          controller.resume();
        });
        downstreamOnHeaders();
      }
    }
    onResponseData(controller, chunk) {
      if (this.#writeStream?.write(chunk) === false) {
        controller.pause();
      }
      this.#handler.onResponseData?.(controller, chunk);
    }
    onResponseEnd(controller, trailers) {
      this.#writeStream?.end();
      this.#handler.onResponseEnd?.(controller, trailers);
    }
    onResponseError(controller, err) {
      this.#writeStream?.destroy(err);
      this.#writeStream = void 0;
      this.#handler.onResponseError?.(controller, err);
    }
  }
  function canCacheResponse(cacheType, statusCode, resHeaders, cacheControlDirectives) {
    if (statusCode < 200 || NOT_UNDERSTOOD_STATUS_CODES.includes(statusCode)) {
      return false;
    }
    if (!HEURISTICALLY_CACHEABLE_STATUS_CODES.includes(statusCode) && !resHeaders["expires"] && !cacheControlDirectives.public && cacheControlDirectives["max-age"] === void 0 && // RFC 9111: a private response directive, if the cache is not shared
    !(cacheControlDirectives.private && cacheType === "private") && !(cacheControlDirectives["s-maxage"] !== void 0 && cacheType === "shared")) {
      return false;
    }
    if (cacheControlDirectives["no-store"]) {
      return false;
    }
    if (cacheType === "shared" && cacheControlDirectives.private === true) {
      return false;
    }
    if (resHeaders.vary?.includes("*")) {
      return false;
    }
    if (resHeaders.authorization) {
      if (!cacheControlDirectives.public || typeof resHeaders.authorization !== "string") {
        return false;
      }
      if (Array.isArray(cacheControlDirectives["no-cache"]) && cacheControlDirectives["no-cache"].includes("authorization")) {
        return false;
      }
      if (Array.isArray(cacheControlDirectives["private"]) && cacheControlDirectives["private"].includes("authorization")) {
        return false;
      }
    }
    return true;
  }
  function getAge(ageHeader) {
    const age = parseInt(Array.isArray(ageHeader) ? ageHeader[0] : ageHeader);
    return isNaN(age) ? void 0 : age * 1e3;
  }
  function determineStaleAt(cacheType, now, age, resHeaders, responseDate, cacheControlDirectives) {
    if (cacheType === "shared") {
      const sMaxAge = cacheControlDirectives["s-maxage"];
      if (sMaxAge !== void 0) {
        return sMaxAge > 0 ? sMaxAge * 1e3 : void 0;
      }
    }
    const maxAge = cacheControlDirectives["max-age"];
    if (maxAge !== void 0) {
      return maxAge > 0 ? maxAge * 1e3 : void 0;
    }
    if (typeof resHeaders.expires === "string") {
      const expiresDate = parseHttpDate(resHeaders.expires);
      if (expiresDate) {
        if (now >= expiresDate.getTime()) {
          return void 0;
        }
        if (responseDate) {
          if (responseDate >= expiresDate) {
            return void 0;
          }
          if (age !== void 0 && age > expiresDate - responseDate) {
            return void 0;
          }
        }
        return expiresDate.getTime() - now;
      }
    }
    if (typeof resHeaders["last-modified"] === "string") {
      const lastModified = new Date(resHeaders["last-modified"]);
      if (isValidDate(lastModified)) {
        if (lastModified.getTime() >= now) {
          return void 0;
        }
        const responseAge = now - lastModified.getTime();
        return responseAge * 0.1;
      }
    }
    if (cacheControlDirectives.immutable) {
      return 31536e3;
    }
    return void 0;
  }
  function determineDeleteAt(now, cacheControlDirectives, staleAt) {
    let staleWhileRevalidate = -Infinity;
    let staleIfError = -Infinity;
    let immutable = -Infinity;
    if (cacheControlDirectives["stale-while-revalidate"]) {
      staleWhileRevalidate = staleAt + cacheControlDirectives["stale-while-revalidate"] * 1e3;
    }
    if (cacheControlDirectives["stale-if-error"]) {
      staleIfError = staleAt + cacheControlDirectives["stale-if-error"] * 1e3;
    }
    if (staleWhileRevalidate === -Infinity && staleIfError === -Infinity) {
      immutable = now + 31536e6;
    }
    return Math.max(staleAt, staleWhileRevalidate, staleIfError, immutable);
  }
  function stripNecessaryHeaders(resHeaders, cacheControlDirectives) {
    const headersToRemove = [
      "connection",
      "proxy-authenticate",
      "proxy-authentication-info",
      "proxy-authorization",
      "proxy-connection",
      "te",
      "transfer-encoding",
      "upgrade",
      // We'll add age back when serving it
      "age"
    ];
    if (resHeaders["connection"]) {
      if (Array.isArray(resHeaders["connection"])) {
        headersToRemove.push(...resHeaders["connection"].map((header) => header.trim()));
      } else {
        headersToRemove.push(...resHeaders["connection"].split(",").map((header) => header.trim()));
      }
    }
    if (Array.isArray(cacheControlDirectives["no-cache"])) {
      headersToRemove.push(...cacheControlDirectives["no-cache"]);
    }
    if (Array.isArray(cacheControlDirectives["private"])) {
      headersToRemove.push(...cacheControlDirectives["private"]);
    }
    let strippedHeaders;
    for (const headerName of headersToRemove) {
      if (resHeaders[headerName]) {
        strippedHeaders ??= { ...resHeaders };
        delete strippedHeaders[headerName];
      }
    }
    return strippedHeaders ?? resHeaders;
  }
  function isValidDate(date2) {
    return date2 instanceof Date && Number.isFinite(date2.valueOf());
  }
  cacheHandler = CacheHandler;
  return cacheHandler;
}
var memoryCacheStore;
var hasRequiredMemoryCacheStore;
function requireMemoryCacheStore() {
  if (hasRequiredMemoryCacheStore) return memoryCacheStore;
  hasRequiredMemoryCacheStore = 1;
  const { Writable } = require$$0;
  const { EventEmitter } = require$$6;
  const { assertCacheKey, assertCacheValue } = /* @__PURE__ */ requireCache$2();
  class MemoryCacheStore extends EventEmitter {
    #maxCount = 1024;
    #maxSize = 104857600;
    // 100MB
    #maxEntrySize = 5242880;
    // 5MB
    #size = 0;
    #count = 0;
    #entries = /* @__PURE__ */ new Map();
    #hasEmittedMaxSizeEvent = false;
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.MemoryCacheStoreOpts | undefined} [opts]
     */
    constructor(opts) {
      super();
      if (opts) {
        if (typeof opts !== "object") {
          throw new TypeError("MemoryCacheStore options must be an object");
        }
        if (opts.maxCount !== void 0) {
          if (typeof opts.maxCount !== "number" || !Number.isInteger(opts.maxCount) || opts.maxCount < 0) {
            throw new TypeError("MemoryCacheStore options.maxCount must be a non-negative integer");
          }
          this.#maxCount = opts.maxCount;
        }
        if (opts.maxSize !== void 0) {
          if (typeof opts.maxSize !== "number" || !Number.isInteger(opts.maxSize) || opts.maxSize < 0) {
            throw new TypeError("MemoryCacheStore options.maxSize must be a non-negative integer");
          }
          this.#maxSize = opts.maxSize;
        }
        if (opts.maxEntrySize !== void 0) {
          if (typeof opts.maxEntrySize !== "number" || !Number.isInteger(opts.maxEntrySize) || opts.maxEntrySize < 0) {
            throw new TypeError("MemoryCacheStore options.maxEntrySize must be a non-negative integer");
          }
          this.#maxEntrySize = opts.maxEntrySize;
        }
      }
    }
    /**
     * Get the current size of the cache in bytes
     * @returns {number} The current size of the cache in bytes
     */
    get size() {
      return this.#size;
    }
    /**
     * Check if the cache is full (either max size or max count reached)
     * @returns {boolean} True if the cache is full, false otherwise
     */
    isFull() {
      return this.#size >= this.#maxSize || this.#count >= this.#maxCount;
    }
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheKey} req
     * @returns {import('../../types/cache-interceptor.d.ts').default.GetResult | undefined}
     */
    get(key) {
      assertCacheKey(key);
      const topLevelKey = `${key.origin}:${key.path}`;
      const now = Date.now();
      const entries = this.#entries.get(topLevelKey);
      const entry = entries ? findEntry(key, entries, now) : null;
      return entry == null ? void 0 : {
        statusMessage: entry.statusMessage,
        statusCode: entry.statusCode,
        headers: entry.headers,
        body: entry.body,
        vary: entry.vary ? entry.vary : void 0,
        etag: entry.etag,
        cacheControlDirectives: entry.cacheControlDirectives,
        cachedAt: entry.cachedAt,
        staleAt: entry.staleAt,
        deleteAt: entry.deleteAt
      };
    }
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheKey} key
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheValue} val
     * @returns {Writable | undefined}
     */
    createWriteStream(key, val) {
      assertCacheKey(key);
      assertCacheValue(val);
      const topLevelKey = `${key.origin}:${key.path}`;
      const store = this;
      const entry = { ...key, ...val, body: [], size: 0 };
      return new Writable({
        write(chunk, encoding2, callback) {
          if (typeof chunk === "string") {
            chunk = Buffer.from(chunk, encoding2);
          }
          entry.size += chunk.byteLength;
          if (entry.size >= store.#maxEntrySize) {
            this.destroy();
          } else {
            entry.body.push(chunk);
          }
          callback(null);
        },
        final(callback) {
          let entries = store.#entries.get(topLevelKey);
          if (!entries) {
            entries = [];
            store.#entries.set(topLevelKey, entries);
          }
          const previousEntry = findEntry(key, entries, Date.now());
          if (previousEntry) {
            const index2 = entries.indexOf(previousEntry);
            entries.splice(index2, 1, entry);
            store.#size -= previousEntry.size;
          } else {
            entries.push(entry);
            store.#count += 1;
          }
          store.#size += entry.size;
          if (store.#size > store.#maxSize || store.#count > store.#maxCount) {
            if (!store.#hasEmittedMaxSizeEvent) {
              store.emit("maxSizeExceeded", {
                size: store.#size,
                maxSize: store.#maxSize,
                count: store.#count,
                maxCount: store.#maxCount
              });
              store.#hasEmittedMaxSizeEvent = true;
            }
            for (const [key2, entries2] of store.#entries) {
              for (const entry2 of entries2.splice(0, entries2.length / 2)) {
                store.#size -= entry2.size;
                store.#count -= 1;
              }
              if (entries2.length === 0) {
                store.#entries.delete(key2);
              }
            }
            if (store.#size < store.#maxSize && store.#count < store.#maxCount) {
              store.#hasEmittedMaxSizeEvent = false;
            }
          }
          callback(null);
        }
      });
    }
    /**
     * @param {CacheKey} key
     */
    delete(key) {
      if (typeof key !== "object") {
        throw new TypeError(`expected key to be object, got ${typeof key}`);
      }
      const topLevelKey = `${key.origin}:${key.path}`;
      for (const entry of this.#entries.get(topLevelKey) ?? []) {
        this.#size -= entry.size;
        this.#count -= 1;
      }
      this.#entries.delete(topLevelKey);
    }
  }
  function findEntry(key, entries, now) {
    return entries.find((entry) => entry.deleteAt > now && entry.method === key.method && (entry.vary == null || Object.keys(entry.vary).every((headerName) => {
      if (entry.vary[headerName] === null) {
        return key.headers[headerName] === void 0;
      }
      return entry.vary[headerName] === key.headers[headerName];
    })));
  }
  memoryCacheStore = MemoryCacheStore;
  return memoryCacheStore;
}
var cacheRevalidationHandler;
var hasRequiredCacheRevalidationHandler;
function requireCacheRevalidationHandler() {
  if (hasRequiredCacheRevalidationHandler) return cacheRevalidationHandler;
  hasRequiredCacheRevalidationHandler = 1;
  const assert = require$$0$1;
  class CacheRevalidationHandler {
    #successful = false;
    /**
     * @type {((boolean, any) => void) | null}
     */
    #callback;
    /**
     * @type {(import('../../types/dispatcher.d.ts').default.DispatchHandler)}
     */
    #handler;
    #context;
    /**
     * @type {boolean}
     */
    #allowErrorStatusCodes;
    /**
     * @param {(boolean) => void} callback Function to call if the cached value is valid
     * @param {import('../../types/dispatcher.d.ts').default.DispatchHandlers} handler
     * @param {boolean} allowErrorStatusCodes
     */
    constructor(callback, handler, allowErrorStatusCodes) {
      if (typeof callback !== "function") {
        throw new TypeError("callback must be a function");
      }
      this.#callback = callback;
      this.#handler = handler;
      this.#allowErrorStatusCodes = allowErrorStatusCodes;
    }
    onRequestStart(_, context) {
      this.#successful = false;
      this.#context = context;
    }
    onRequestUpgrade(controller, statusCode, headers2, socket) {
      this.#handler.onRequestUpgrade?.(controller, statusCode, headers2, socket);
    }
    onResponseStart(controller, statusCode, headers2, statusMessage) {
      assert(this.#callback != null);
      this.#successful = statusCode === 304 || this.#allowErrorStatusCodes && statusCode >= 500 && statusCode <= 504;
      this.#callback(this.#successful, this.#context);
      this.#callback = null;
      if (this.#successful) {
        return true;
      }
      this.#handler.onRequestStart?.(controller, this.#context);
      this.#handler.onResponseStart?.(
        controller,
        statusCode,
        headers2,
        statusMessage
      );
    }
    onResponseData(controller, chunk) {
      if (this.#successful) {
        return;
      }
      return this.#handler.onResponseData?.(controller, chunk);
    }
    onResponseEnd(controller, trailers) {
      if (this.#successful) {
        return;
      }
      this.#handler.onResponseEnd?.(controller, trailers);
    }
    onResponseError(controller, err) {
      if (this.#successful) {
        return;
      }
      if (this.#callback) {
        this.#callback(false);
        this.#callback = null;
      }
      if (typeof this.#handler.onResponseError === "function") {
        this.#handler.onResponseError(controller, err);
      } else {
        throw err;
      }
    }
  }
  cacheRevalidationHandler = CacheRevalidationHandler;
  return cacheRevalidationHandler;
}
var cache$1;
var hasRequiredCache$1;
function requireCache$1() {
  if (hasRequiredCache$1) return cache$1;
  hasRequiredCache$1 = 1;
  const assert = require$$0$1;
  const { Readable } = require$$0;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const CacheHandler = /* @__PURE__ */ requireCacheHandler();
  const MemoryCacheStore = /* @__PURE__ */ requireMemoryCacheStore();
  const CacheRevalidationHandler = /* @__PURE__ */ requireCacheRevalidationHandler();
  const { assertCacheStore, assertCacheMethods, makeCacheKey, normalizeHeaders, parseCacheControlHeader } = /* @__PURE__ */ requireCache$2();
  const { AbortError } = /* @__PURE__ */ requireErrors();
  function assertCacheOrigins(origins, name) {
    if (origins === void 0) return;
    if (!Array.isArray(origins)) {
      throw new TypeError(`expected ${name} to be an array or undefined, got ${typeof origins}`);
    }
    for (let i = 0; i < origins.length; i++) {
      const origin = origins[i];
      if (typeof origin !== "string" && !(origin instanceof RegExp)) {
        throw new TypeError(`expected ${name}[${i}] to be a string or RegExp, got ${typeof origin}`);
      }
    }
  }
  const nop = () => {
  };
  function needsRevalidation(result, cacheControlDirectives, { headers: headers2 = {} }) {
    if (cacheControlDirectives?.["no-cache"]) {
      return true;
    }
    if (result.cacheControlDirectives?.["no-cache"] && !Array.isArray(result.cacheControlDirectives["no-cache"])) {
      return true;
    }
    if (headers2["if-modified-since"] || headers2["if-none-match"]) {
      return true;
    }
    return false;
  }
  function isStale(result, cacheControlDirectives) {
    const now = Date.now();
    if (now > result.staleAt) {
      if (cacheControlDirectives?.["max-stale"]) {
        const gracePeriod = result.staleAt + cacheControlDirectives["max-stale"] * 1e3;
        return now > gracePeriod;
      }
      return true;
    }
    if (cacheControlDirectives?.["min-fresh"]) {
      const timeLeftTillStale = result.staleAt - now;
      const threshold = cacheControlDirectives["min-fresh"] * 1e3;
      return timeLeftTillStale <= threshold;
    }
    return false;
  }
  function withinStaleWhileRevalidateWindow(result) {
    const staleWhileRevalidate = result.cacheControlDirectives?.["stale-while-revalidate"];
    if (!staleWhileRevalidate) {
      return false;
    }
    const now = Date.now();
    const staleWhileRevalidateExpiry = result.staleAt + staleWhileRevalidate * 1e3;
    return now <= staleWhileRevalidateExpiry;
  }
  function handleUncachedResponse(dispatch, globalOpts, cacheKey, handler, opts, reqCacheControl) {
    if (reqCacheControl?.["only-if-cached"]) {
      let aborted = false;
      try {
        if (typeof handler.onConnect === "function") {
          handler.onConnect(() => {
            aborted = true;
          });
          if (aborted) {
            return;
          }
        }
        if (typeof handler.onHeaders === "function") {
          handler.onHeaders(504, [], nop, "Gateway Timeout");
          if (aborted) {
            return;
          }
        }
        if (typeof handler.onComplete === "function") {
          handler.onComplete([]);
        }
      } catch (err) {
        if (typeof handler.onError === "function") {
          handler.onError(err);
        }
      }
      return true;
    }
    return dispatch(opts, new CacheHandler(globalOpts, cacheKey, handler));
  }
  function sendCachedValue(handler, opts, result, age, context, isStale2) {
    const stream = util2.isStream(result.body) ? result.body : Readable.from(result.body ?? []);
    assert(!stream.destroyed, "stream should not be destroyed");
    assert(!stream.readableDidRead, "stream should not be readableDidRead");
    const controller = {
      resume() {
        stream.resume();
      },
      pause() {
        stream.pause();
      },
      get paused() {
        return stream.isPaused();
      },
      get aborted() {
        return stream.destroyed;
      },
      get reason() {
        return stream.errored;
      },
      abort(reason) {
        stream.destroy(reason ?? new AbortError());
      }
    };
    stream.on("error", function(err) {
      if (!this.readableEnded) {
        if (typeof handler.onResponseError === "function") {
          handler.onResponseError(controller, err);
        } else {
          throw err;
        }
      }
    }).on("close", function() {
      if (!this.errored) {
        handler.onResponseEnd?.(controller, {});
      }
    });
    handler.onRequestStart?.(controller, context);
    if (stream.destroyed) {
      return;
    }
    const headers2 = { ...result.headers, age: String(age) };
    if (isStale2) {
      headers2.warning = '110 - "response is stale"';
    }
    handler.onResponseStart?.(controller, result.statusCode, headers2, result.statusMessage);
    if (opts.method === "HEAD") {
      stream.destroy();
    } else {
      stream.on("data", function(chunk) {
        handler.onResponseData?.(controller, chunk);
      });
    }
  }
  function handleResult(dispatch, globalOpts, cacheKey, handler, opts, reqCacheControl, result) {
    if (!result) {
      return handleUncachedResponse(dispatch, globalOpts, cacheKey, handler, opts, reqCacheControl);
    }
    const now = Date.now();
    if (now > result.deleteAt) {
      return dispatch(opts, new CacheHandler(globalOpts, cacheKey, handler));
    }
    const age = Math.round((now - result.cachedAt) / 1e3);
    if (reqCacheControl?.["max-age"] && age >= reqCacheControl["max-age"]) {
      return dispatch(opts, handler);
    }
    const stale = isStale(result, reqCacheControl);
    const revalidate = needsRevalidation(result, reqCacheControl, opts);
    if (stale || revalidate) {
      if (util2.isStream(opts.body) && util2.bodyLength(opts.body) !== 0) {
        return dispatch(opts, new CacheHandler(globalOpts, cacheKey, handler));
      }
      if (!revalidate && withinStaleWhileRevalidateWindow(result)) {
        sendCachedValue(handler, opts, result, age, null, true);
        queueMicrotask(() => {
          let headers3 = {
            ...opts.headers,
            "if-modified-since": new Date(result.cachedAt).toUTCString()
          };
          if (result.etag) {
            headers3["if-none-match"] = result.etag;
          }
          if (result.vary) {
            headers3 = {
              ...headers3,
              ...result.vary
            };
          }
          dispatch(
            {
              ...opts,
              headers: headers3
            },
            new CacheHandler(globalOpts, cacheKey, {
              // Silent handler that just updates the cache
              onRequestStart() {
              },
              onRequestUpgrade() {
              },
              onResponseStart() {
              },
              onResponseData() {
              },
              onResponseEnd() {
              },
              onResponseError() {
              }
            })
          );
        });
        return true;
      }
      let withinStaleIfErrorThreshold = false;
      const staleIfErrorExpiry = result.cacheControlDirectives["stale-if-error"] ?? reqCacheControl?.["stale-if-error"];
      if (staleIfErrorExpiry) {
        withinStaleIfErrorThreshold = now < result.staleAt + staleIfErrorExpiry * 1e3;
      }
      let headers2 = {
        ...opts.headers,
        "if-modified-since": new Date(result.cachedAt).toUTCString()
      };
      if (result.etag) {
        headers2["if-none-match"] = result.etag;
      }
      if (result.vary) {
        headers2 = {
          ...headers2,
          ...result.vary
        };
      }
      return dispatch(
        {
          ...opts,
          headers: headers2
        },
        new CacheRevalidationHandler(
          (success, context) => {
            if (success) {
              sendCachedValue(handler, opts, result, age, context, stale);
            } else if (util2.isStream(result.body)) {
              result.body.on("error", nop).destroy();
            }
          },
          new CacheHandler(globalOpts, cacheKey, handler),
          withinStaleIfErrorThreshold
        )
      );
    }
    if (util2.isStream(opts.body)) {
      opts.body.on("error", nop).destroy();
    }
    sendCachedValue(handler, opts, result, age, null, false);
  }
  cache$1 = (opts = {}) => {
    const {
      store = new MemoryCacheStore(),
      methods = ["GET"],
      cacheByDefault = void 0,
      type = "shared",
      origins = void 0
    } = opts;
    if (typeof opts !== "object" || opts === null) {
      throw new TypeError(`expected type of opts to be an Object, got ${opts === null ? "null" : typeof opts}`);
    }
    assertCacheStore(store, "opts.store");
    assertCacheMethods(methods, "opts.methods");
    assertCacheOrigins(origins, "opts.origins");
    if (typeof cacheByDefault !== "undefined" && typeof cacheByDefault !== "number") {
      throw new TypeError(`expected opts.cacheByDefault to be number or undefined, got ${typeof cacheByDefault}`);
    }
    if (typeof type !== "undefined" && type !== "shared" && type !== "private") {
      throw new TypeError(`expected opts.type to be shared, private, or undefined, got ${typeof type}`);
    }
    const globalOpts = {
      store,
      methods,
      cacheByDefault,
      type
    };
    const safeMethodsToNotCache = util2.safeHTTPMethods.filter((method) => methods.includes(method) === false);
    return (dispatch) => {
      return (opts2, handler) => {
        if (!opts2.origin || safeMethodsToNotCache.includes(opts2.method)) {
          return dispatch(opts2, handler);
        }
        if (origins !== void 0) {
          const requestOrigin = opts2.origin.toString().toLowerCase();
          let isAllowed = false;
          for (let i = 0; i < origins.length; i++) {
            const allowed = origins[i];
            if (typeof allowed === "string") {
              if (allowed.toLowerCase() === requestOrigin) {
                isAllowed = true;
                break;
              }
            } else if (allowed.test(requestOrigin)) {
              isAllowed = true;
              break;
            }
          }
          if (!isAllowed) {
            return dispatch(opts2, handler);
          }
        }
        opts2 = {
          ...opts2,
          headers: normalizeHeaders(opts2)
        };
        const reqCacheControl = opts2.headers?.["cache-control"] ? parseCacheControlHeader(opts2.headers["cache-control"]) : void 0;
        if (reqCacheControl?.["no-store"]) {
          return dispatch(opts2, handler);
        }
        const cacheKey = makeCacheKey(opts2);
        const result = store.get(cacheKey);
        if (result && typeof result.then === "function") {
          return result.then((result2) => handleResult(
            dispatch,
            globalOpts,
            cacheKey,
            handler,
            opts2,
            reqCacheControl,
            result2
          ));
        } else {
          return handleResult(
            dispatch,
            globalOpts,
            cacheKey,
            handler,
            opts2,
            reqCacheControl,
            result
          );
        }
      };
    };
  };
  return cache$1;
}
var decompress;
var hasRequiredDecompress;
function requireDecompress() {
  if (hasRequiredDecompress) return decompress;
  hasRequiredDecompress = 1;
  const { createInflate, createGunzip, createBrotliDecompress, createZstdDecompress } = require$$3;
  const { pipeline } = require$$0;
  const DecoratorHandler = /* @__PURE__ */ requireDecoratorHandler();
  const { runtimeFeatures: runtimeFeatures2 } = /* @__PURE__ */ requireRuntimeFeatures();
  const supportedEncodings = {
    gzip: createGunzip,
    "x-gzip": createGunzip,
    br: createBrotliDecompress,
    deflate: createInflate,
    compress: createInflate,
    "x-compress": createInflate,
    ...runtimeFeatures2.has("zstd") ? { zstd: createZstdDecompress } : {}
  };
  const defaultSkipStatusCodes = (
    /** @type {const} */
    [204, 304]
  );
  let warningEmitted = (
    /** @type {boolean} */
    false
  );
  class DecompressHandler extends DecoratorHandler {
    /** @type {Transform[]} */
    #decompressors = [];
    /** @type {NodeJS.WritableStream&NodeJS.ReadableStream|null} */
    #pipelineStream;
    /** @type {Readonly<number[]>} */
    #skipStatusCodes;
    /** @type {boolean} */
    #skipErrorResponses;
    constructor(handler, { skipStatusCodes = defaultSkipStatusCodes, skipErrorResponses = true } = {}) {
      super(handler);
      this.#skipStatusCodes = skipStatusCodes;
      this.#skipErrorResponses = skipErrorResponses;
    }
    /**
     * Determines if decompression should be skipped based on encoding and status code
     * @param {string} contentEncoding - Content-Encoding header value
     * @param {number} statusCode - HTTP status code of the response
     * @returns {boolean} - True if decompression should be skipped
     */
    #shouldSkipDecompression(contentEncoding, statusCode) {
      if (!contentEncoding || statusCode < 200) return true;
      if (this.#skipStatusCodes.includes(statusCode)) return true;
      if (this.#skipErrorResponses && statusCode >= 400) return true;
      return false;
    }
    /**
     * Creates a chain of decompressors for multiple content encodings
     *
     * @param {string} encodings - Comma-separated list of content encodings
     * @returns {Array<DecompressorStream>} - Array of decompressor streams
     * @throws {Error} - If the number of content-encodings exceeds the maximum allowed
     */
    #createDecompressionChain(encodings) {
      const parts = encodings.split(",");
      const maxContentEncodings = 5;
      if (parts.length > maxContentEncodings) {
        throw new Error(`too many content-encodings in response: ${parts.length}, maximum allowed is ${maxContentEncodings}`);
      }
      const decompressors = [];
      for (let i = parts.length - 1; i >= 0; i--) {
        const encoding2 = parts[i].trim();
        if (!encoding2) continue;
        if (!supportedEncodings[encoding2]) {
          decompressors.length = 0;
          return decompressors;
        }
        decompressors.push(supportedEncodings[encoding2]());
      }
      return decompressors;
    }
    /**
     * Sets up event handlers for a decompressor stream using readable events
     * @param {DecompressorStream} decompressor - The decompressor stream
     * @param {Controller} controller - The controller to coordinate with
     * @returns {void}
     */
    #setupDecompressorEvents(decompressor, controller) {
      decompressor.on("readable", () => {
        let chunk;
        while ((chunk = decompressor.read()) !== null) {
          const result = super.onResponseData(controller, chunk);
          if (result === false) {
            break;
          }
        }
      });
      decompressor.on("error", (error) => {
        super.onResponseError(controller, error);
      });
    }
    /**
     * Sets up event handling for a single decompressor
     * @param {Controller} controller - The controller to handle events
     * @returns {void}
     */
    #setupSingleDecompressor(controller) {
      const decompressor = this.#decompressors[0];
      this.#setupDecompressorEvents(decompressor, controller);
      decompressor.on("end", () => {
        super.onResponseEnd(controller, {});
      });
    }
    /**
     * Sets up event handling for multiple chained decompressors using pipeline
     * @param {Controller} controller - The controller to handle events
     * @returns {void}
     */
    #setupMultipleDecompressors(controller) {
      const lastDecompressor = this.#decompressors[this.#decompressors.length - 1];
      this.#setupDecompressorEvents(lastDecompressor, controller);
      this.#pipelineStream = pipeline(this.#decompressors, (err) => {
        if (err) {
          super.onResponseError(controller, err);
          return;
        }
        super.onResponseEnd(controller, {});
      });
    }
    /**
     * Cleans up decompressor references to prevent memory leaks
     * @returns {void}
     */
    #cleanupDecompressors() {
      this.#decompressors.length = 0;
      this.#pipelineStream = null;
    }
    /**
     * @param {Controller} controller
     * @param {number} statusCode
     * @param {Record<string, string | string[] | undefined>} headers
     * @param {string} statusMessage
     * @returns {void}
     */
    onResponseStart(controller, statusCode, headers2, statusMessage) {
      const contentEncoding = headers2["content-encoding"];
      if (this.#shouldSkipDecompression(contentEncoding, statusCode)) {
        return super.onResponseStart(controller, statusCode, headers2, statusMessage);
      }
      const decompressors = this.#createDecompressionChain(contentEncoding.toLowerCase());
      if (decompressors.length === 0) {
        this.#cleanupDecompressors();
        return super.onResponseStart(controller, statusCode, headers2, statusMessage);
      }
      this.#decompressors = decompressors;
      const { "content-encoding": _, "content-length": __, ...newHeaders } = headers2;
      if (this.#decompressors.length === 1) {
        this.#setupSingleDecompressor(controller);
      } else {
        this.#setupMultipleDecompressors(controller);
      }
      super.onResponseStart(controller, statusCode, newHeaders, statusMessage);
    }
    /**
     * @param {Controller} controller
     * @param {Buffer} chunk
     * @returns {void}
     */
    onResponseData(controller, chunk) {
      if (this.#decompressors.length > 0) {
        this.#decompressors[0].write(chunk);
        return;
      }
      super.onResponseData(controller, chunk);
    }
    /**
     * @param {Controller} controller
     * @param {Record<string, string | string[]> | undefined} trailers
     * @returns {void}
     */
    onResponseEnd(controller, trailers) {
      if (this.#decompressors.length > 0) {
        this.#decompressors[0].end();
        this.#cleanupDecompressors();
        return;
      }
      super.onResponseEnd(controller, trailers);
    }
    /**
     * @param {Controller} controller
     * @param {Error} err
     * @returns {void}
     */
    onResponseError(controller, err) {
      if (this.#decompressors.length > 0) {
        for (const decompressor of this.#decompressors) {
          decompressor.destroy(err);
        }
        this.#cleanupDecompressors();
      }
      super.onResponseError(controller, err);
    }
  }
  function createDecompressInterceptor(options = {}) {
    if (!warningEmitted) {
      process.emitWarning(
        "DecompressInterceptor is experimental and subject to change",
        "ExperimentalWarning"
      );
      warningEmitted = true;
    }
    return (dispatch) => {
      return (opts, handler) => {
        const decompressHandler = new DecompressHandler(handler, options);
        return dispatch(opts, decompressHandler);
      };
    };
  }
  decompress = createDecompressInterceptor;
  return decompress;
}
var deduplicationHandler;
var hasRequiredDeduplicationHandler;
function requireDeduplicationHandler() {
  if (hasRequiredDeduplicationHandler) return deduplicationHandler;
  hasRequiredDeduplicationHandler = 1;
  class DeduplicationHandler {
    /**
     * @type {DispatchHandler}
     */
    #primaryHandler;
    /**
     * @type {DispatchHandler[]}
     */
    #waitingHandlers = [];
    /**
     * @type {Buffer[]}
     */
    #chunks = [];
    /**
     * @type {number}
     */
    #statusCode = 0;
    /**
     * @type {Record<string, string | string[]>}
     */
    #headers = {};
    /**
     * @type {string}
     */
    #statusMessage = "";
    /**
     * @type {boolean}
     */
    #aborted = false;
    /**
     * @type {import('../../types/dispatcher.d.ts').default.DispatchController | null}
     */
    #controller = null;
    /**
     * @type {(() => void) | null}
     */
    #onComplete = null;
    /**
     * @param {DispatchHandler} primaryHandler The primary handler
     * @param {() => void} onComplete Callback when request completes
     */
    constructor(primaryHandler, onComplete) {
      this.#primaryHandler = primaryHandler;
      this.#onComplete = onComplete;
    }
    /**
     * Add a waiting handler that will receive the buffered response
     * @param {DispatchHandler} handler
     */
    addWaitingHandler(handler) {
      this.#waitingHandlers.push(handler);
    }
    /**
     * @param {() => void} abort
     * @param {any} context
     */
    onRequestStart(controller, context) {
      this.#controller = controller;
      this.#primaryHandler.onRequestStart?.(controller, context);
    }
    /**
     * @param {import('../../types/dispatcher.d.ts').default.DispatchController} controller
     * @param {number} statusCode
     * @param {import('../../types/header.d.ts').IncomingHttpHeaders} headers
     * @param {Socket} socket
     */
    onRequestUpgrade(controller, statusCode, headers2, socket) {
      this.#primaryHandler.onRequestUpgrade?.(controller, statusCode, headers2, socket);
    }
    /**
     * @param {import('../../types/dispatcher.d.ts').default.DispatchController} controller
     * @param {number} statusCode
     * @param {Record<string, string | string[]>} headers
     * @param {string} statusMessage
     */
    onResponseStart(controller, statusCode, headers2, statusMessage) {
      this.#statusCode = statusCode;
      this.#headers = headers2;
      this.#statusMessage = statusMessage;
      this.#primaryHandler.onResponseStart?.(controller, statusCode, headers2, statusMessage);
    }
    /**
     * @param {import('../../types/dispatcher.d.ts').default.DispatchController} controller
     * @param {Buffer} chunk
     */
    onResponseData(controller, chunk) {
      this.#chunks.push(Buffer.from(chunk));
      this.#primaryHandler.onResponseData?.(controller, chunk);
    }
    /**
     * @param {import('../../types/dispatcher.d.ts').default.DispatchController} controller
     * @param {object} trailers
     */
    onResponseEnd(controller, trailers) {
      this.#primaryHandler.onResponseEnd?.(controller, trailers);
      this.#notifyWaitingHandlers();
      this.#onComplete?.();
    }
    /**
     * @param {import('../../types/dispatcher.d.ts').default.DispatchController} controller
     * @param {Error} err
     */
    onResponseError(controller, err) {
      this.#aborted = true;
      this.#primaryHandler.onResponseError?.(controller, err);
      this.#notifyWaitingHandlersError(err);
      this.#onComplete?.();
    }
    /**
     * Notify all waiting handlers with the buffered response
     */
    #notifyWaitingHandlers() {
      const body2 = Buffer.concat(this.#chunks);
      for (const handler of this.#waitingHandlers) {
        const waitingController = {
          resume() {
          },
          pause() {
          },
          get paused() {
            return false;
          },
          get aborted() {
            return false;
          },
          get reason() {
            return null;
          },
          abort() {
          }
        };
        try {
          handler.onRequestStart?.(waitingController, null);
          if (waitingController.aborted) {
            continue;
          }
          handler.onResponseStart?.(
            waitingController,
            this.#statusCode,
            this.#headers,
            this.#statusMessage
          );
          if (waitingController.aborted) {
            continue;
          }
          if (body2.length > 0) {
            handler.onResponseData?.(waitingController, body2);
          }
          handler.onResponseEnd?.(waitingController, {});
        } catch {
        }
      }
      this.#waitingHandlers = [];
      this.#chunks = [];
    }
    /**
     * Notify all waiting handlers of an error
     * @param {Error} err
     */
    #notifyWaitingHandlersError(err) {
      for (const handler of this.#waitingHandlers) {
        const waitingController = {
          resume() {
          },
          pause() {
          },
          get paused() {
            return false;
          },
          get aborted() {
            return true;
          },
          get reason() {
            return err;
          },
          abort() {
          }
        };
        try {
          handler.onRequestStart?.(waitingController, null);
          handler.onResponseError?.(waitingController, err);
        } catch {
        }
      }
      this.#waitingHandlers = [];
      this.#chunks = [];
    }
  }
  deduplicationHandler = DeduplicationHandler;
  return deduplicationHandler;
}
var deduplicate;
var hasRequiredDeduplicate;
function requireDeduplicate() {
  if (hasRequiredDeduplicate) return deduplicate;
  hasRequiredDeduplicate = 1;
  const diagnosticsChannel = require$$0$4;
  const util2 = /* @__PURE__ */ requireUtil$5();
  const DeduplicationHandler = /* @__PURE__ */ requireDeduplicationHandler();
  const { normalizeHeaders, makeCacheKey, makeDeduplicationKey } = /* @__PURE__ */ requireCache$2();
  const pendingRequestsChannel = diagnosticsChannel.channel("undici:request:pending-requests");
  deduplicate = (opts = {}) => {
    const {
      methods = ["GET"],
      skipHeaderNames = [],
      excludeHeaderNames = []
    } = opts;
    if (typeof opts !== "object" || opts === null) {
      throw new TypeError(`expected type of opts to be an Object, got ${opts === null ? "null" : typeof opts}`);
    }
    if (!Array.isArray(methods)) {
      throw new TypeError(`expected opts.methods to be an array, got ${typeof methods}`);
    }
    for (const method of methods) {
      if (!util2.safeHTTPMethods.includes(method)) {
        throw new TypeError(`expected opts.methods to only contain safe HTTP methods, got ${method}`);
      }
    }
    if (!Array.isArray(skipHeaderNames)) {
      throw new TypeError(`expected opts.skipHeaderNames to be an array, got ${typeof skipHeaderNames}`);
    }
    if (!Array.isArray(excludeHeaderNames)) {
      throw new TypeError(`expected opts.excludeHeaderNames to be an array, got ${typeof excludeHeaderNames}`);
    }
    const skipHeaderNamesSet = new Set(skipHeaderNames.map((name) => name.toLowerCase()));
    const excludeHeaderNamesSet = new Set(excludeHeaderNames.map((name) => name.toLowerCase()));
    const safeMethodsToNotDeduplicate = util2.safeHTTPMethods.filter((method) => methods.includes(method) === false);
    const pendingRequests = /* @__PURE__ */ new Map();
    return (dispatch) => {
      return (opts2, handler) => {
        if (!opts2.origin || safeMethodsToNotDeduplicate.includes(opts2.method)) {
          return dispatch(opts2, handler);
        }
        opts2 = {
          ...opts2,
          headers: normalizeHeaders(opts2)
        };
        if (skipHeaderNamesSet.size > 0) {
          for (const headerName of Object.keys(opts2.headers)) {
            if (skipHeaderNamesSet.has(headerName.toLowerCase())) {
              return dispatch(opts2, handler);
            }
          }
        }
        const cacheKey = makeCacheKey(opts2);
        const dedupeKey = makeDeduplicationKey(cacheKey, excludeHeaderNamesSet);
        const pendingHandler = pendingRequests.get(dedupeKey);
        if (pendingHandler) {
          pendingHandler.addWaitingHandler(handler);
          return true;
        }
        const deduplicationHandler2 = new DeduplicationHandler(
          handler,
          () => {
            pendingRequests.delete(dedupeKey);
            if (pendingRequestsChannel.hasSubscribers) {
              pendingRequestsChannel.publish({ size: pendingRequests.size, key: dedupeKey, type: "removed" });
            }
          }
        );
        pendingRequests.set(dedupeKey, deduplicationHandler2);
        if (pendingRequestsChannel.hasSubscribers) {
          pendingRequestsChannel.publish({ size: pendingRequests.size, key: dedupeKey, type: "added" });
        }
        return dispatch(opts2, deduplicationHandler2);
      };
    };
  };
  return deduplicate;
}
var sqliteCacheStore;
var hasRequiredSqliteCacheStore;
function requireSqliteCacheStore() {
  if (hasRequiredSqliteCacheStore) return sqliteCacheStore;
  hasRequiredSqliteCacheStore = 1;
  const { Writable } = require$$0;
  const { assertCacheKey, assertCacheValue } = /* @__PURE__ */ requireCache$2();
  let DatabaseSync;
  const VERSION = 3;
  const MAX_ENTRY_SIZE = 2 * 1e3 * 1e3 * 1e3;
  sqliteCacheStore = class SqliteCacheStore {
    #maxEntrySize = MAX_ENTRY_SIZE;
    #maxCount = Infinity;
    /**
     * @type {import('node:sqlite').DatabaseSync}
     */
    #db;
    /**
     * @type {import('node:sqlite').StatementSync}
     */
    #getValuesQuery;
    /**
     * @type {import('node:sqlite').StatementSync}
     */
    #updateValueQuery;
    /**
     * @type {import('node:sqlite').StatementSync}
     */
    #insertValueQuery;
    /**
     * @type {import('node:sqlite').StatementSync}
     */
    #deleteExpiredValuesQuery;
    /**
     * @type {import('node:sqlite').StatementSync}
     */
    #deleteByUrlQuery;
    /**
     * @type {import('node:sqlite').StatementSync}
     */
    #countEntriesQuery;
    /**
     * @type {import('node:sqlite').StatementSync | null}
     */
    #deleteOldValuesQuery;
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.SqliteCacheStoreOpts | undefined} opts
     */
    constructor(opts) {
      if (opts) {
        if (typeof opts !== "object") {
          throw new TypeError("SqliteCacheStore options must be an object");
        }
        if (opts.maxEntrySize !== void 0) {
          if (typeof opts.maxEntrySize !== "number" || !Number.isInteger(opts.maxEntrySize) || opts.maxEntrySize < 0) {
            throw new TypeError("SqliteCacheStore options.maxEntrySize must be a non-negative integer");
          }
          if (opts.maxEntrySize > MAX_ENTRY_SIZE) {
            throw new TypeError("SqliteCacheStore options.maxEntrySize must be less than 2gb");
          }
          this.#maxEntrySize = opts.maxEntrySize;
        }
        if (opts.maxCount !== void 0) {
          if (typeof opts.maxCount !== "number" || !Number.isInteger(opts.maxCount) || opts.maxCount < 0) {
            throw new TypeError("SqliteCacheStore options.maxCount must be a non-negative integer");
          }
          this.#maxCount = opts.maxCount;
        }
      }
      if (!DatabaseSync) {
        DatabaseSync = require$$1.DatabaseSync;
      }
      this.#db = new DatabaseSync(opts?.location ?? ":memory:");
      this.#db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA temp_store = memory;
      PRAGMA optimize;

      CREATE TABLE IF NOT EXISTS cacheInterceptorV${VERSION} (
        -- Data specific to us
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        method TEXT NOT NULL,

        -- Data returned to the interceptor
        body BUF NULL,
        deleteAt INTEGER NOT NULL,
        statusCode INTEGER NOT NULL,
        statusMessage TEXT NOT NULL,
        headers TEXT NULL,
        cacheControlDirectives TEXT NULL,
        etag TEXT NULL,
        vary TEXT NULL,
        cachedAt INTEGER NOT NULL,
        staleAt INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cacheInterceptorV${VERSION}_getValuesQuery ON cacheInterceptorV${VERSION}(url, method, deleteAt);
      CREATE INDEX IF NOT EXISTS idx_cacheInterceptorV${VERSION}_deleteByUrlQuery ON cacheInterceptorV${VERSION}(deleteAt);
    `);
      this.#getValuesQuery = this.#db.prepare(`
      SELECT
        id,
        body,
        deleteAt,
        statusCode,
        statusMessage,
        headers,
        etag,
        cacheControlDirectives,
        vary,
        cachedAt,
        staleAt
      FROM cacheInterceptorV${VERSION}
      WHERE
        url = ?
        AND method = ?
      ORDER BY
        deleteAt ASC
    `);
      this.#updateValueQuery = this.#db.prepare(`
      UPDATE cacheInterceptorV${VERSION} SET
        body = ?,
        deleteAt = ?,
        statusCode = ?,
        statusMessage = ?,
        headers = ?,
        etag = ?,
        cacheControlDirectives = ?,
        cachedAt = ?,
        staleAt = ?
      WHERE
        id = ?
    `);
      this.#insertValueQuery = this.#db.prepare(`
      INSERT INTO cacheInterceptorV${VERSION} (
        url,
        method,
        body,
        deleteAt,
        statusCode,
        statusMessage,
        headers,
        etag,
        cacheControlDirectives,
        vary,
        cachedAt,
        staleAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
      this.#deleteByUrlQuery = this.#db.prepare(
        `DELETE FROM cacheInterceptorV${VERSION} WHERE url = ?`
      );
      this.#countEntriesQuery = this.#db.prepare(
        `SELECT COUNT(*) AS total FROM cacheInterceptorV${VERSION}`
      );
      this.#deleteExpiredValuesQuery = this.#db.prepare(
        `DELETE FROM cacheInterceptorV${VERSION} WHERE deleteAt <= ?`
      );
      this.#deleteOldValuesQuery = this.#maxCount === Infinity ? null : this.#db.prepare(`
        DELETE FROM cacheInterceptorV${VERSION}
        WHERE id IN (
          SELECT
            id
          FROM cacheInterceptorV${VERSION}
          ORDER BY cachedAt DESC
          LIMIT ?
        )
      `);
    }
    close() {
      this.#db.close();
    }
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheKey} key
     * @returns {(import('../../types/cache-interceptor.d.ts').default.GetResult & { body?: Buffer }) | undefined}
     */
    get(key) {
      assertCacheKey(key);
      const value = this.#findValue(key);
      return value ? {
        body: value.body ? Buffer.from(value.body.buffer, value.body.byteOffset, value.body.byteLength) : void 0,
        statusCode: value.statusCode,
        statusMessage: value.statusMessage,
        headers: value.headers ? JSON.parse(value.headers) : void 0,
        etag: value.etag ? value.etag : void 0,
        vary: value.vary ? JSON.parse(value.vary) : void 0,
        cacheControlDirectives: value.cacheControlDirectives ? JSON.parse(value.cacheControlDirectives) : void 0,
        cachedAt: value.cachedAt,
        staleAt: value.staleAt,
        deleteAt: value.deleteAt
      } : void 0;
    }
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheKey} key
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheValue & { body: null | Buffer | Array<Buffer>}} value
     */
    set(key, value) {
      assertCacheKey(key);
      const url = this.#makeValueUrl(key);
      const body2 = Array.isArray(value.body) ? Buffer.concat(value.body) : value.body;
      const size = body2?.byteLength;
      if (size && size > this.#maxEntrySize) {
        return;
      }
      const existingValue = this.#findValue(key, true);
      if (existingValue) {
        this.#updateValueQuery.run(
          body2,
          value.deleteAt,
          value.statusCode,
          value.statusMessage,
          value.headers ? JSON.stringify(value.headers) : null,
          value.etag ? value.etag : null,
          value.cacheControlDirectives ? JSON.stringify(value.cacheControlDirectives) : null,
          value.cachedAt,
          value.staleAt,
          existingValue.id
        );
      } else {
        this.#prune();
        this.#insertValueQuery.run(
          url,
          key.method,
          body2,
          value.deleteAt,
          value.statusCode,
          value.statusMessage,
          value.headers ? JSON.stringify(value.headers) : null,
          value.etag ? value.etag : null,
          value.cacheControlDirectives ? JSON.stringify(value.cacheControlDirectives) : null,
          value.vary ? JSON.stringify(value.vary) : null,
          value.cachedAt,
          value.staleAt
        );
      }
    }
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheKey} key
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheValue} value
     * @returns {Writable | undefined}
     */
    createWriteStream(key, value) {
      assertCacheKey(key);
      assertCacheValue(value);
      let size = 0;
      const body2 = [];
      const store = this;
      return new Writable({
        decodeStrings: true,
        write(chunk, encoding2, callback) {
          size += chunk.byteLength;
          if (size < store.#maxEntrySize) {
            body2.push(chunk);
          } else {
            this.destroy();
          }
          callback();
        },
        final(callback) {
          store.set(key, { ...value, body: body2 });
          callback();
        }
      });
    }
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheKey} key
     */
    delete(key) {
      if (typeof key !== "object") {
        throw new TypeError(`expected key to be object, got ${typeof key}`);
      }
      this.#deleteByUrlQuery.run(this.#makeValueUrl(key));
    }
    #prune() {
      if (Number.isFinite(this.#maxCount) && this.size <= this.#maxCount) {
        return 0;
      }
      {
        const removed = this.#deleteExpiredValuesQuery.run(Date.now()).changes;
        if (removed) {
          return removed;
        }
      }
      {
        const removed = this.#deleteOldValuesQuery?.run(Math.max(Math.floor(this.#maxCount * 0.1), 1)).changes;
        if (removed) {
          return removed;
        }
      }
      return 0;
    }
    /**
     * Counts the number of rows in the cache
     * @returns {Number}
     */
    get size() {
      const { total } = this.#countEntriesQuery.get();
      return total;
    }
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheKey} key
     * @returns {string}
     */
    #makeValueUrl(key) {
      return `${key.origin}/${key.path}`;
    }
    /**
     * @param {import('../../types/cache-interceptor.d.ts').default.CacheKey} key
     * @param {boolean} [canBeExpired=false]
     * @returns {SqliteStoreValue | undefined}
     */
    #findValue(key, canBeExpired = false) {
      const url = this.#makeValueUrl(key);
      const { headers: headers2, method } = key;
      const values = this.#getValuesQuery.all(url, method);
      if (values.length === 0) {
        return void 0;
      }
      const now = Date.now();
      for (const value of values) {
        if (now >= value.deleteAt && !canBeExpired) {
          return void 0;
        }
        let matches = true;
        if (value.vary) {
          const vary = JSON.parse(value.vary);
          for (const header in vary) {
            if (!headerValueEquals(headers2[header], vary[header])) {
              matches = false;
              break;
            }
          }
        }
        if (matches) {
          return value;
        }
      }
      return void 0;
    }
  };
  function headerValueEquals(lhs, rhs) {
    if (lhs == null && rhs == null) {
      return true;
    }
    if (lhs == null && rhs != null || lhs != null && rhs == null) {
      return false;
    }
    if (Array.isArray(lhs) && Array.isArray(rhs)) {
      if (lhs.length !== rhs.length) {
        return false;
      }
      return lhs.every((x, i) => x === rhs[i]);
    }
    return lhs === rhs;
  }
  return sqliteCacheStore;
}
var headers;
var hasRequiredHeaders;
function requireHeaders() {
  if (hasRequiredHeaders) return headers;
  hasRequiredHeaders = 1;
  const { kConstruct } = /* @__PURE__ */ requireSymbols();
  const { kEnumerableProperty } = /* @__PURE__ */ requireUtil$5();
  const {
    iteratorMixin,
    isValidHeaderName,
    isValidHeaderValue
  } = /* @__PURE__ */ requireUtil$4();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const assert = require$$0$1;
  const util2 = require$$0$3;
  function isHTTPWhiteSpaceCharCode(code) {
    return code === 10 || code === 13 || code === 9 || code === 32;
  }
  function headerValueNormalize(potentialValue) {
    let i = 0;
    let j = potentialValue.length;
    while (j > i && isHTTPWhiteSpaceCharCode(potentialValue.charCodeAt(j - 1))) --j;
    while (j > i && isHTTPWhiteSpaceCharCode(potentialValue.charCodeAt(i))) ++i;
    return i === 0 && j === potentialValue.length ? potentialValue : potentialValue.substring(i, j);
  }
  function fill(headers2, object) {
    if (Array.isArray(object)) {
      for (let i = 0; i < object.length; ++i) {
        const header = object[i];
        if (header.length !== 2) {
          throw webidl.errors.exception({
            header: "Headers constructor",
            message: `expected name/value pair to be length 2, found ${header.length}.`
          });
        }
        appendHeader(headers2, header[0], header[1]);
      }
    } else if (typeof object === "object" && object !== null) {
      const keys = Object.keys(object);
      for (let i = 0; i < keys.length; ++i) {
        appendHeader(headers2, keys[i], object[keys[i]]);
      }
    } else {
      throw webidl.errors.conversionFailed({
        prefix: "Headers constructor",
        argument: "Argument 1",
        types: ["sequence<sequence<ByteString>>", "record<ByteString, ByteString>"]
      });
    }
  }
  function appendHeader(headers2, name, value) {
    value = headerValueNormalize(value);
    if (!isValidHeaderName(name)) {
      throw webidl.errors.invalidArgument({
        prefix: "Headers.append",
        value: name,
        type: "header name"
      });
    } else if (!isValidHeaderValue(value)) {
      throw webidl.errors.invalidArgument({
        prefix: "Headers.append",
        value,
        type: "header value"
      });
    }
    if (getHeadersGuard(headers2) === "immutable") {
      throw new TypeError("immutable");
    }
    return getHeadersList(headers2).append(name, value, false);
  }
  function headersListSortAndCombine(target) {
    const headersList = getHeadersList(target);
    if (!headersList) {
      return [];
    }
    if (headersList.sortedMap) {
      return headersList.sortedMap;
    }
    const headers2 = [];
    const names = headersList.toSortedArray();
    const cookies2 = headersList.cookies;
    if (cookies2 === null || cookies2.length === 1) {
      return headersList.sortedMap = names;
    }
    for (let i = 0; i < names.length; ++i) {
      const { 0: name, 1: value } = names[i];
      if (name === "set-cookie") {
        for (let j = 0; j < cookies2.length; ++j) {
          headers2.push([name, cookies2[j]]);
        }
      } else {
        headers2.push([name, value]);
      }
    }
    return headersList.sortedMap = headers2;
  }
  function compareHeaderName(a, b) {
    return a[0] < b[0] ? -1 : 1;
  }
  class HeadersList {
    /** @type {[string, string][]|null} */
    cookies = null;
    sortedMap;
    headersMap;
    constructor(init) {
      if (init instanceof HeadersList) {
        this.headersMap = new Map(init.headersMap);
        this.sortedMap = init.sortedMap;
        this.cookies = init.cookies === null ? null : [...init.cookies];
      } else {
        this.headersMap = new Map(init);
        this.sortedMap = null;
      }
    }
    /**
     * @see https://fetch.spec.whatwg.org/#header-list-contains
     * @param {string} name
     * @param {boolean} isLowerCase
     */
    contains(name, isLowerCase) {
      return this.headersMap.has(isLowerCase ? name : name.toLowerCase());
    }
    clear() {
      this.headersMap.clear();
      this.sortedMap = null;
      this.cookies = null;
    }
    /**
     * @see https://fetch.spec.whatwg.org/#concept-header-list-append
     * @param {string} name
     * @param {string} value
     * @param {boolean} isLowerCase
     */
    append(name, value, isLowerCase) {
      this.sortedMap = null;
      const lowercaseName = isLowerCase ? name : name.toLowerCase();
      const exists = this.headersMap.get(lowercaseName);
      if (exists) {
        const delimiter = lowercaseName === "cookie" ? "; " : ", ";
        this.headersMap.set(lowercaseName, {
          name: exists.name,
          value: `${exists.value}${delimiter}${value}`
        });
      } else {
        this.headersMap.set(lowercaseName, { name, value });
      }
      if (lowercaseName === "set-cookie") {
        (this.cookies ??= []).push(value);
      }
    }
    /**
     * @see https://fetch.spec.whatwg.org/#concept-header-list-set
     * @param {string} name
     * @param {string} value
     * @param {boolean} isLowerCase
     */
    set(name, value, isLowerCase) {
      this.sortedMap = null;
      const lowercaseName = isLowerCase ? name : name.toLowerCase();
      if (lowercaseName === "set-cookie") {
        this.cookies = [value];
      }
      this.headersMap.set(lowercaseName, { name, value });
    }
    /**
     * @see https://fetch.spec.whatwg.org/#concept-header-list-delete
     * @param {string} name
     * @param {boolean} isLowerCase
     */
    delete(name, isLowerCase) {
      this.sortedMap = null;
      if (!isLowerCase) name = name.toLowerCase();
      if (name === "set-cookie") {
        this.cookies = null;
      }
      this.headersMap.delete(name);
    }
    /**
     * @see https://fetch.spec.whatwg.org/#concept-header-list-get
     * @param {string} name
     * @param {boolean} isLowerCase
     * @returns {string | null}
     */
    get(name, isLowerCase) {
      return this.headersMap.get(isLowerCase ? name : name.toLowerCase())?.value ?? null;
    }
    *[Symbol.iterator]() {
      for (const { 0: name, 1: { value } } of this.headersMap) {
        yield [name, value];
      }
    }
    get entries() {
      const headers2 = {};
      if (this.headersMap.size !== 0) {
        for (const { name, value } of this.headersMap.values()) {
          headers2[name] = value;
        }
      }
      return headers2;
    }
    rawValues() {
      return this.headersMap.values();
    }
    get entriesList() {
      const headers2 = [];
      if (this.headersMap.size !== 0) {
        for (const { 0: lowerName, 1: { name, value } } of this.headersMap) {
          if (lowerName === "set-cookie") {
            for (const cookie of this.cookies) {
              headers2.push([name, cookie]);
            }
          } else {
            headers2.push([name, value]);
          }
        }
      }
      return headers2;
    }
    // https://fetch.spec.whatwg.org/#convert-header-names-to-a-sorted-lowercase-set
    toSortedArray() {
      const size = this.headersMap.size;
      const array = new Array(size);
      if (size <= 32) {
        if (size === 0) {
          return array;
        }
        const iterator = this.headersMap[Symbol.iterator]();
        const firstValue = iterator.next().value;
        array[0] = [firstValue[0], firstValue[1].value];
        assert(firstValue[1].value !== null);
        for (let i = 1, j = 0, right = 0, left = 0, pivot = 0, x, value; i < size; ++i) {
          value = iterator.next().value;
          x = array[i] = [value[0], value[1].value];
          assert(x[1] !== null);
          left = 0;
          right = i;
          while (left < right) {
            pivot = left + (right - left >> 1);
            if (array[pivot][0] <= x[0]) {
              left = pivot + 1;
            } else {
              right = pivot;
            }
          }
          if (i !== pivot) {
            j = i;
            while (j > left) {
              array[j] = array[--j];
            }
            array[left] = x;
          }
        }
        if (!iterator.next().done) {
          throw new TypeError("Unreachable");
        }
        return array;
      } else {
        let i = 0;
        for (const { 0: name, 1: { value } } of this.headersMap) {
          array[i++] = [name, value];
          assert(value !== null);
        }
        return array.sort(compareHeaderName);
      }
    }
  }
  class Headers {
    #guard;
    /**
     * @type {HeadersList}
     */
    #headersList;
    /**
     * @param {HeadersInit|Symbol} [init]
     * @returns
     */
    constructor(init = void 0) {
      webidl.util.markAsUncloneable(this);
      if (init === kConstruct) {
        return;
      }
      this.#headersList = new HeadersList();
      this.#guard = "none";
      if (init !== void 0) {
        init = webidl.converters.HeadersInit(init, "Headers constructor", "init");
        fill(this, init);
      }
    }
    // https://fetch.spec.whatwg.org/#dom-headers-append
    append(name, value) {
      webidl.brandCheck(this, Headers);
      webidl.argumentLengthCheck(arguments, 2, "Headers.append");
      const prefix = "Headers.append";
      name = webidl.converters.ByteString(name, prefix, "name");
      value = webidl.converters.ByteString(value, prefix, "value");
      return appendHeader(this, name, value);
    }
    // https://fetch.spec.whatwg.org/#dom-headers-delete
    delete(name) {
      webidl.brandCheck(this, Headers);
      webidl.argumentLengthCheck(arguments, 1, "Headers.delete");
      const prefix = "Headers.delete";
      name = webidl.converters.ByteString(name, prefix, "name");
      if (!isValidHeaderName(name)) {
        throw webidl.errors.invalidArgument({
          prefix: "Headers.delete",
          value: name,
          type: "header name"
        });
      }
      if (this.#guard === "immutable") {
        throw new TypeError("immutable");
      }
      if (!this.#headersList.contains(name, false)) {
        return;
      }
      this.#headersList.delete(name, false);
    }
    // https://fetch.spec.whatwg.org/#dom-headers-get
    get(name) {
      webidl.brandCheck(this, Headers);
      webidl.argumentLengthCheck(arguments, 1, "Headers.get");
      const prefix = "Headers.get";
      name = webidl.converters.ByteString(name, prefix, "name");
      if (!isValidHeaderName(name)) {
        throw webidl.errors.invalidArgument({
          prefix,
          value: name,
          type: "header name"
        });
      }
      return this.#headersList.get(name, false);
    }
    // https://fetch.spec.whatwg.org/#dom-headers-has
    has(name) {
      webidl.brandCheck(this, Headers);
      webidl.argumentLengthCheck(arguments, 1, "Headers.has");
      const prefix = "Headers.has";
      name = webidl.converters.ByteString(name, prefix, "name");
      if (!isValidHeaderName(name)) {
        throw webidl.errors.invalidArgument({
          prefix,
          value: name,
          type: "header name"
        });
      }
      return this.#headersList.contains(name, false);
    }
    // https://fetch.spec.whatwg.org/#dom-headers-set
    set(name, value) {
      webidl.brandCheck(this, Headers);
      webidl.argumentLengthCheck(arguments, 2, "Headers.set");
      const prefix = "Headers.set";
      name = webidl.converters.ByteString(name, prefix, "name");
      value = webidl.converters.ByteString(value, prefix, "value");
      value = headerValueNormalize(value);
      if (!isValidHeaderName(name)) {
        throw webidl.errors.invalidArgument({
          prefix,
          value: name,
          type: "header name"
        });
      } else if (!isValidHeaderValue(value)) {
        throw webidl.errors.invalidArgument({
          prefix,
          value,
          type: "header value"
        });
      }
      if (this.#guard === "immutable") {
        throw new TypeError("immutable");
      }
      this.#headersList.set(name, value, false);
    }
    // https://fetch.spec.whatwg.org/#dom-headers-getsetcookie
    getSetCookie() {
      webidl.brandCheck(this, Headers);
      const list = this.#headersList.cookies;
      if (list) {
        return [...list];
      }
      return [];
    }
    [util2.inspect.custom](depth, options) {
      options.depth ??= depth;
      return `Headers ${util2.formatWithOptions(options, this.#headersList.entries)}`;
    }
    static getHeadersGuard(o) {
      return o.#guard;
    }
    static setHeadersGuard(o, guard) {
      o.#guard = guard;
    }
    /**
     * @param {Headers} o
     */
    static getHeadersList(o) {
      return o.#headersList;
    }
    /**
     * @param {Headers} target
     * @param {HeadersList} list
     */
    static setHeadersList(target, list) {
      target.#headersList = list;
    }
  }
  const { getHeadersGuard, setHeadersGuard, getHeadersList, setHeadersList } = Headers;
  Reflect.deleteProperty(Headers, "getHeadersGuard");
  Reflect.deleteProperty(Headers, "setHeadersGuard");
  Reflect.deleteProperty(Headers, "getHeadersList");
  Reflect.deleteProperty(Headers, "setHeadersList");
  iteratorMixin("Headers", Headers, headersListSortAndCombine, 0, 1);
  Object.defineProperties(Headers.prototype, {
    append: kEnumerableProperty,
    delete: kEnumerableProperty,
    get: kEnumerableProperty,
    has: kEnumerableProperty,
    set: kEnumerableProperty,
    getSetCookie: kEnumerableProperty,
    [Symbol.toStringTag]: {
      value: "Headers",
      configurable: true
    },
    [util2.inspect.custom]: {
      enumerable: false
    }
  });
  webidl.converters.HeadersInit = function(V, prefix, argument) {
    if (webidl.util.Type(V) === webidl.util.Types.OBJECT) {
      const iterator = Reflect.get(V, Symbol.iterator);
      if (!util2.types.isProxy(V) && iterator === Headers.prototype.entries) {
        try {
          return getHeadersList(V).entriesList;
        } catch {
        }
      }
      if (typeof iterator === "function") {
        return webidl.converters["sequence<sequence<ByteString>>"](V, prefix, argument, iterator.bind(V));
      }
      return webidl.converters["record<ByteString, ByteString>"](V, prefix, argument);
    }
    throw webidl.errors.conversionFailed({
      prefix: "Headers constructor",
      argument: "Argument 1",
      types: ["sequence<sequence<ByteString>>", "record<ByteString, ByteString>"]
    });
  };
  headers = {
    fill,
    // for test.
    compareHeaderName,
    Headers,
    HeadersList,
    getHeadersGuard,
    setHeadersGuard,
    setHeadersList,
    getHeadersList
  };
  return headers;
}
var response;
var hasRequiredResponse;
function requireResponse() {
  if (hasRequiredResponse) return response;
  hasRequiredResponse = 1;
  const { Headers, HeadersList, fill, getHeadersGuard, setHeadersGuard, setHeadersList } = /* @__PURE__ */ requireHeaders();
  const { extractBody, cloneBody, mixinBody, streamRegistry, bodyUnusable } = /* @__PURE__ */ requireBody();
  const util2 = /* @__PURE__ */ requireUtil$5();
  const nodeUtil = require$$0$3;
  const { kEnumerableProperty } = util2;
  const {
    isValidReasonPhrase,
    isCancelled,
    isAborted,
    isErrorLike,
    environmentSettingsObject: relevantRealm
  } = /* @__PURE__ */ requireUtil$4();
  const {
    redirectStatusSet,
    nullBodyStatus
  } = /* @__PURE__ */ requireConstants$2();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { URLSerializer } = /* @__PURE__ */ requireDataUrl();
  const { kConstruct } = /* @__PURE__ */ requireSymbols();
  const assert = require$$0$1;
  const { isomorphicEncode, serializeJavascriptValueToJSONString } = /* @__PURE__ */ requireInfra();
  const textEncoder = new TextEncoder("utf-8");
  class Response {
    /** @type {Headers} */
    #headers;
    #state;
    // Creates network error Response.
    static error() {
      const responseObject = fromInnerResponse(makeNetworkError(), "immutable");
      return responseObject;
    }
    // https://fetch.spec.whatwg.org/#dom-response-json
    static json(data, init = void 0) {
      webidl.argumentLengthCheck(arguments, 1, "Response.json");
      if (init !== null) {
        init = webidl.converters.ResponseInit(init);
      }
      const bytes = textEncoder.encode(
        serializeJavascriptValueToJSONString(data)
      );
      const body2 = extractBody(bytes);
      const responseObject = fromInnerResponse(makeResponse({}), "response");
      initializeResponse(responseObject, init, { body: body2[0], type: "application/json" });
      return responseObject;
    }
    // Creates a redirect Response that redirects to url with status status.
    static redirect(url, status = 302) {
      webidl.argumentLengthCheck(arguments, 1, "Response.redirect");
      url = webidl.converters.USVString(url);
      status = webidl.converters["unsigned short"](status);
      let parsedURL;
      try {
        parsedURL = new URL(url, relevantRealm.settingsObject.baseUrl);
      } catch (err) {
        throw new TypeError(`Failed to parse URL from ${url}`, { cause: err });
      }
      if (!redirectStatusSet.has(status)) {
        throw new RangeError(`Invalid status code ${status}`);
      }
      const responseObject = fromInnerResponse(makeResponse({}), "immutable");
      responseObject.#state.status = status;
      const value = isomorphicEncode(URLSerializer(parsedURL));
      responseObject.#state.headersList.append("location", value, true);
      return responseObject;
    }
    // https://fetch.spec.whatwg.org/#dom-response
    constructor(body2 = null, init = void 0) {
      webidl.util.markAsUncloneable(this);
      if (body2 === kConstruct) {
        return;
      }
      if (body2 !== null) {
        body2 = webidl.converters.BodyInit(body2, "Response", "body");
      }
      init = webidl.converters.ResponseInit(init);
      this.#state = makeResponse({});
      this.#headers = new Headers(kConstruct);
      setHeadersGuard(this.#headers, "response");
      setHeadersList(this.#headers, this.#state.headersList);
      let bodyWithType = null;
      if (body2 != null) {
        const [extractedBody, type] = extractBody(body2);
        bodyWithType = { body: extractedBody, type };
      }
      initializeResponse(this, init, bodyWithType);
    }
    // Returns response’s type, e.g., "cors".
    get type() {
      webidl.brandCheck(this, Response);
      return this.#state.type;
    }
    // Returns response’s URL, if it has one; otherwise the empty string.
    get url() {
      webidl.brandCheck(this, Response);
      const urlList = this.#state.urlList;
      const url = urlList[urlList.length - 1] ?? null;
      if (url === null) {
        return "";
      }
      return URLSerializer(url, true);
    }
    // Returns whether response was obtained through a redirect.
    get redirected() {
      webidl.brandCheck(this, Response);
      return this.#state.urlList.length > 1;
    }
    // Returns response’s status.
    get status() {
      webidl.brandCheck(this, Response);
      return this.#state.status;
    }
    // Returns whether response’s status is an ok status.
    get ok() {
      webidl.brandCheck(this, Response);
      return this.#state.status >= 200 && this.#state.status <= 299;
    }
    // Returns response’s status message.
    get statusText() {
      webidl.brandCheck(this, Response);
      return this.#state.statusText;
    }
    // Returns response’s headers as Headers.
    get headers() {
      webidl.brandCheck(this, Response);
      return this.#headers;
    }
    get body() {
      webidl.brandCheck(this, Response);
      return this.#state.body ? this.#state.body.stream : null;
    }
    get bodyUsed() {
      webidl.brandCheck(this, Response);
      return !!this.#state.body && util2.isDisturbed(this.#state.body.stream);
    }
    // Returns a clone of response.
    clone() {
      webidl.brandCheck(this, Response);
      if (bodyUnusable(this.#state)) {
        throw webidl.errors.exception({
          header: "Response.clone",
          message: "Body has already been consumed."
        });
      }
      const clonedResponse = cloneResponse(this.#state);
      if (this.#state.body?.stream) {
        streamRegistry.register(this, new WeakRef(this.#state.body.stream));
      }
      return fromInnerResponse(clonedResponse, getHeadersGuard(this.#headers));
    }
    [nodeUtil.inspect.custom](depth, options) {
      if (options.depth === null) {
        options.depth = 2;
      }
      options.colors ??= true;
      const properties = {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
        body: this.body,
        bodyUsed: this.bodyUsed,
        ok: this.ok,
        redirected: this.redirected,
        type: this.type,
        url: this.url
      };
      return `Response ${nodeUtil.formatWithOptions(options, properties)}`;
    }
    /**
     * @param {Response} response
     */
    static getResponseHeaders(response2) {
      return response2.#headers;
    }
    /**
     * @param {Response} response
     * @param {Headers} newHeaders
     */
    static setResponseHeaders(response2, newHeaders) {
      response2.#headers = newHeaders;
    }
    /**
     * @param {Response} response
     */
    static getResponseState(response2) {
      return response2.#state;
    }
    /**
     * @param {Response} response
     * @param {any} newState
     */
    static setResponseState(response2, newState) {
      response2.#state = newState;
    }
  }
  const { getResponseHeaders, setResponseHeaders, getResponseState, setResponseState } = Response;
  Reflect.deleteProperty(Response, "getResponseHeaders");
  Reflect.deleteProperty(Response, "setResponseHeaders");
  Reflect.deleteProperty(Response, "getResponseState");
  Reflect.deleteProperty(Response, "setResponseState");
  mixinBody(Response, getResponseState);
  Object.defineProperties(Response.prototype, {
    type: kEnumerableProperty,
    url: kEnumerableProperty,
    status: kEnumerableProperty,
    ok: kEnumerableProperty,
    redirected: kEnumerableProperty,
    statusText: kEnumerableProperty,
    headers: kEnumerableProperty,
    clone: kEnumerableProperty,
    body: kEnumerableProperty,
    bodyUsed: kEnumerableProperty,
    [Symbol.toStringTag]: {
      value: "Response",
      configurable: true
    }
  });
  Object.defineProperties(Response, {
    json: kEnumerableProperty,
    redirect: kEnumerableProperty,
    error: kEnumerableProperty
  });
  function cloneResponse(response2) {
    if (response2.internalResponse) {
      return filterResponse(
        cloneResponse(response2.internalResponse),
        response2.type
      );
    }
    const newResponse = makeResponse({ ...response2, body: null });
    if (response2.body != null) {
      newResponse.body = cloneBody(response2.body);
    }
    return newResponse;
  }
  function makeResponse(init) {
    return {
      aborted: false,
      rangeRequested: false,
      timingAllowPassed: false,
      requestIncludesCredentials: false,
      type: "default",
      status: 200,
      timingInfo: null,
      cacheState: "",
      statusText: "",
      ...init,
      headersList: init?.headersList ? new HeadersList(init?.headersList) : new HeadersList(),
      urlList: init?.urlList ? [...init.urlList] : []
    };
  }
  function makeNetworkError(reason) {
    const isError = isErrorLike(reason);
    return makeResponse({
      type: "error",
      status: 0,
      error: isError ? reason : new Error(reason ? String(reason) : reason),
      aborted: reason && reason.name === "AbortError"
    });
  }
  function isNetworkError(response2) {
    return (
      // A network error is a response whose type is "error",
      response2.type === "error" && // status is 0
      response2.status === 0
    );
  }
  function makeFilteredResponse(response2, state) {
    state = {
      internalResponse: response2,
      ...state
    };
    return new Proxy(response2, {
      get(target, p) {
        return p in state ? state[p] : target[p];
      },
      set(target, p, value) {
        assert(!(p in state));
        target[p] = value;
        return true;
      }
    });
  }
  function filterResponse(response2, type) {
    if (type === "basic") {
      return makeFilteredResponse(response2, {
        type: "basic",
        headersList: response2.headersList
      });
    } else if (type === "cors") {
      return makeFilteredResponse(response2, {
        type: "cors",
        headersList: response2.headersList
      });
    } else if (type === "opaque") {
      return makeFilteredResponse(response2, {
        type: "opaque",
        urlList: [],
        status: 0,
        statusText: "",
        body: null
      });
    } else if (type === "opaqueredirect") {
      return makeFilteredResponse(response2, {
        type: "opaqueredirect",
        status: 0,
        statusText: "",
        headersList: [],
        body: null
      });
    } else {
      assert(false);
    }
  }
  function makeAppropriateNetworkError(fetchParams, err = null) {
    assert(isCancelled(fetchParams));
    return isAborted(fetchParams) ? makeNetworkError(Object.assign(new DOMException("The operation was aborted.", "AbortError"), { cause: err })) : makeNetworkError(Object.assign(new DOMException("Request was cancelled."), { cause: err }));
  }
  function initializeResponse(response2, init, body2) {
    if (init.status !== null && (init.status < 200 || init.status > 599)) {
      throw new RangeError('init["status"] must be in the range of 200 to 599, inclusive.');
    }
    if ("statusText" in init && init.statusText != null) {
      if (!isValidReasonPhrase(String(init.statusText))) {
        throw new TypeError("Invalid statusText");
      }
    }
    if ("status" in init && init.status != null) {
      getResponseState(response2).status = init.status;
    }
    if ("statusText" in init && init.statusText != null) {
      getResponseState(response2).statusText = init.statusText;
    }
    if ("headers" in init && init.headers != null) {
      fill(getResponseHeaders(response2), init.headers);
    }
    if (body2) {
      if (nullBodyStatus.includes(response2.status)) {
        throw webidl.errors.exception({
          header: "Response constructor",
          message: `Invalid response status code ${response2.status}`
        });
      }
      getResponseState(response2).body = body2.body;
      if (body2.type != null && !getResponseState(response2).headersList.contains("content-type", true)) {
        getResponseState(response2).headersList.append("content-type", body2.type, true);
      }
    }
  }
  function fromInnerResponse(innerResponse, guard) {
    const response2 = new Response(kConstruct);
    setResponseState(response2, innerResponse);
    const headers2 = new Headers(kConstruct);
    setResponseHeaders(response2, headers2);
    setHeadersList(headers2, innerResponse.headersList);
    setHeadersGuard(headers2, guard);
    if (innerResponse.urlList.length !== 0 && innerResponse.body?.stream) {
      streamRegistry.register(response2, new WeakRef(innerResponse.body.stream));
    }
    return response2;
  }
  webidl.converters.XMLHttpRequestBodyInit = function(V, prefix, name) {
    if (typeof V === "string") {
      return webidl.converters.USVString(V, prefix, name);
    }
    if (webidl.is.Blob(V)) {
      return V;
    }
    if (webidl.is.BufferSource(V)) {
      return V;
    }
    if (webidl.is.FormData(V)) {
      return V;
    }
    if (webidl.is.URLSearchParams(V)) {
      return V;
    }
    return webidl.converters.DOMString(V, prefix, name);
  };
  webidl.converters.BodyInit = function(V, prefix, argument) {
    if (webidl.is.ReadableStream(V)) {
      return V;
    }
    if (V?.[Symbol.asyncIterator]) {
      return V;
    }
    return webidl.converters.XMLHttpRequestBodyInit(V, prefix, argument);
  };
  webidl.converters.ResponseInit = webidl.dictionaryConverter([
    {
      key: "status",
      converter: webidl.converters["unsigned short"],
      defaultValue: () => 200
    },
    {
      key: "statusText",
      converter: webidl.converters.ByteString,
      defaultValue: () => ""
    },
    {
      key: "headers",
      converter: webidl.converters.HeadersInit
    }
  ]);
  webidl.is.Response = webidl.util.MakeTypeAssertion(Response);
  response = {
    isNetworkError,
    makeNetworkError,
    makeResponse,
    makeAppropriateNetworkError,
    filterResponse,
    Response,
    cloneResponse,
    fromInnerResponse,
    getResponseState
  };
  return response;
}
var request;
var hasRequiredRequest;
function requireRequest() {
  if (hasRequiredRequest) return request;
  hasRequiredRequest = 1;
  const { extractBody, mixinBody, cloneBody, bodyUnusable } = /* @__PURE__ */ requireBody();
  const { Headers, fill: fillHeaders, HeadersList, setHeadersGuard, getHeadersGuard, setHeadersList, getHeadersList } = /* @__PURE__ */ requireHeaders();
  const util2 = /* @__PURE__ */ requireUtil$5();
  const nodeUtil = require$$0$3;
  const {
    isValidHTTPToken,
    sameOrigin,
    environmentSettingsObject
  } = /* @__PURE__ */ requireUtil$4();
  const {
    forbiddenMethodsSet,
    corsSafeListedMethodsSet,
    referrerPolicy,
    requestRedirect,
    requestMode,
    requestCredentials,
    requestCache,
    requestDuplex
  } = /* @__PURE__ */ requireConstants$2();
  const { kEnumerableProperty, normalizedMethodRecordsBase, normalizedMethodRecords } = util2;
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { URLSerializer } = /* @__PURE__ */ requireDataUrl();
  const { kConstruct } = /* @__PURE__ */ requireSymbols();
  const assert = require$$0$1;
  const { getMaxListeners, setMaxListeners, defaultMaxListeners } = require$$6;
  const kAbortController = Symbol("abortController");
  const requestFinalizer = new FinalizationRegistry(({ signal, abort }) => {
    signal.removeEventListener("abort", abort);
  });
  const dependentControllerMap = /* @__PURE__ */ new WeakMap();
  let abortSignalHasEventHandlerLeakWarning;
  try {
    abortSignalHasEventHandlerLeakWarning = getMaxListeners(new AbortController().signal) > 0;
  } catch {
    abortSignalHasEventHandlerLeakWarning = false;
  }
  function buildAbort(acRef) {
    return abort;
    function abort() {
      const ac = acRef.deref();
      if (ac !== void 0) {
        requestFinalizer.unregister(abort);
        this.removeEventListener("abort", abort);
        ac.abort(this.reason);
        const controllerList = dependentControllerMap.get(ac.signal);
        if (controllerList !== void 0) {
          if (controllerList.size !== 0) {
            for (const ref of controllerList) {
              const ctrl = ref.deref();
              if (ctrl !== void 0) {
                ctrl.abort(this.reason);
              }
            }
            controllerList.clear();
          }
          dependentControllerMap.delete(ac.signal);
        }
      }
    }
  }
  let patchMethodWarning = false;
  class Request {
    /** @type {AbortSignal} */
    #signal;
    /** @type {import('../../dispatcher/dispatcher')} */
    #dispatcher;
    /** @type {Headers} */
    #headers;
    #state;
    // https://fetch.spec.whatwg.org/#dom-request
    constructor(input, init = void 0) {
      webidl.util.markAsUncloneable(this);
      if (input === kConstruct) {
        return;
      }
      const prefix = "Request constructor";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      input = webidl.converters.RequestInfo(input);
      init = webidl.converters.RequestInit(init);
      let request2 = null;
      let fallbackMode = null;
      const baseUrl = environmentSettingsObject.settingsObject.baseUrl;
      let signal = null;
      if (typeof input === "string") {
        this.#dispatcher = init.dispatcher;
        let parsedURL;
        try {
          parsedURL = new URL(input, baseUrl);
        } catch (err) {
          throw new TypeError("Failed to parse URL from " + input, { cause: err });
        }
        if (parsedURL.username || parsedURL.password) {
          throw new TypeError(
            "Request cannot be constructed from a URL that includes credentials: " + input
          );
        }
        request2 = makeRequest({ urlList: [parsedURL] });
        fallbackMode = "cors";
      } else {
        assert(webidl.is.Request(input));
        request2 = input.#state;
        signal = input.#signal;
        this.#dispatcher = init.dispatcher || input.#dispatcher;
      }
      const origin = environmentSettingsObject.settingsObject.origin;
      let window = "client";
      if (request2.window?.constructor?.name === "EnvironmentSettingsObject" && sameOrigin(request2.window, origin)) {
        window = request2.window;
      }
      if (init.window != null) {
        throw new TypeError(`'window' option '${window}' must be null`);
      }
      if ("window" in init) {
        window = "no-window";
      }
      request2 = makeRequest({
        // URL request’s URL.
        // undici implementation note: this is set as the first item in request's urlList in makeRequest
        // method request’s method.
        method: request2.method,
        // header list A copy of request’s header list.
        // undici implementation note: headersList is cloned in makeRequest
        headersList: request2.headersList,
        // unsafe-request flag Set.
        unsafeRequest: request2.unsafeRequest,
        // client This’s relevant settings object.
        client: environmentSettingsObject.settingsObject,
        // window window.
        window,
        // priority request’s priority.
        priority: request2.priority,
        // origin request’s origin. The propagation of the origin is only significant for navigation requests
        // being handled by a service worker. In this scenario a request can have an origin that is different
        // from the current client.
        origin: request2.origin,
        // referrer request’s referrer.
        referrer: request2.referrer,
        // referrer policy request’s referrer policy.
        referrerPolicy: request2.referrerPolicy,
        // mode request’s mode.
        mode: request2.mode,
        // credentials mode request’s credentials mode.
        credentials: request2.credentials,
        // cache mode request’s cache mode.
        cache: request2.cache,
        // redirect mode request’s redirect mode.
        redirect: request2.redirect,
        // integrity metadata request’s integrity metadata.
        integrity: request2.integrity,
        // keepalive request’s keepalive.
        keepalive: request2.keepalive,
        // reload-navigation flag request’s reload-navigation flag.
        reloadNavigation: request2.reloadNavigation,
        // history-navigation flag request’s history-navigation flag.
        historyNavigation: request2.historyNavigation,
        // URL list A clone of request’s URL list.
        urlList: [...request2.urlList]
      });
      const initHasKey = Object.keys(init).length !== 0;
      if (initHasKey) {
        if (request2.mode === "navigate") {
          request2.mode = "same-origin";
        }
        request2.reloadNavigation = false;
        request2.historyNavigation = false;
        request2.origin = "client";
        request2.referrer = "client";
        request2.referrerPolicy = "";
        request2.url = request2.urlList[request2.urlList.length - 1];
        request2.urlList = [request2.url];
      }
      if (init.referrer !== void 0) {
        const referrer = init.referrer;
        if (referrer === "") {
          request2.referrer = "no-referrer";
        } else {
          let parsedReferrer;
          try {
            parsedReferrer = new URL(referrer, baseUrl);
          } catch (err) {
            throw new TypeError(`Referrer "${referrer}" is not a valid URL.`, { cause: err });
          }
          if (parsedReferrer.protocol === "about:" && parsedReferrer.hostname === "client" || origin && !sameOrigin(parsedReferrer, environmentSettingsObject.settingsObject.baseUrl)) {
            request2.referrer = "client";
          } else {
            request2.referrer = parsedReferrer;
          }
        }
      }
      if (init.referrerPolicy !== void 0) {
        request2.referrerPolicy = init.referrerPolicy;
      }
      let mode;
      if (init.mode !== void 0) {
        mode = init.mode;
      } else {
        mode = fallbackMode;
      }
      if (mode === "navigate") {
        throw webidl.errors.exception({
          header: "Request constructor",
          message: "invalid request mode navigate."
        });
      }
      if (mode != null) {
        request2.mode = mode;
      }
      if (init.credentials !== void 0) {
        request2.credentials = init.credentials;
      }
      if (init.cache !== void 0) {
        request2.cache = init.cache;
      }
      if (request2.cache === "only-if-cached" && request2.mode !== "same-origin") {
        throw new TypeError(
          "'only-if-cached' can be set only with 'same-origin' mode"
        );
      }
      if (init.redirect !== void 0) {
        request2.redirect = init.redirect;
      }
      if (init.integrity != null) {
        request2.integrity = String(init.integrity);
      }
      if (init.keepalive !== void 0) {
        request2.keepalive = Boolean(init.keepalive);
      }
      if (init.method !== void 0) {
        let method = init.method;
        const mayBeNormalized = normalizedMethodRecords[method];
        if (mayBeNormalized !== void 0) {
          request2.method = mayBeNormalized;
        } else {
          if (!isValidHTTPToken(method)) {
            throw new TypeError(`'${method}' is not a valid HTTP method.`);
          }
          const upperCase = method.toUpperCase();
          if (forbiddenMethodsSet.has(upperCase)) {
            throw new TypeError(`'${method}' HTTP method is unsupported.`);
          }
          method = normalizedMethodRecordsBase[upperCase] ?? method;
          request2.method = method;
        }
        if (!patchMethodWarning && request2.method === "patch") {
          process.emitWarning("Using `patch` is highly likely to result in a `405 Method Not Allowed`. `PATCH` is much more likely to succeed.", {
            code: "UNDICI-FETCH-patch"
          });
          patchMethodWarning = true;
        }
      }
      if (init.signal !== void 0) {
        signal = init.signal;
      }
      this.#state = request2;
      const ac = new AbortController();
      this.#signal = ac.signal;
      if (signal != null) {
        if (signal.aborted) {
          ac.abort(signal.reason);
        } else {
          this[kAbortController] = ac;
          const acRef = new WeakRef(ac);
          const abort = buildAbort(acRef);
          if (abortSignalHasEventHandlerLeakWarning && getMaxListeners(signal) === defaultMaxListeners) {
            setMaxListeners(1500, signal);
          }
          util2.addAbortListener(signal, abort);
          requestFinalizer.register(ac, { signal, abort }, abort);
        }
      }
      this.#headers = new Headers(kConstruct);
      setHeadersList(this.#headers, request2.headersList);
      setHeadersGuard(this.#headers, "request");
      if (mode === "no-cors") {
        if (!corsSafeListedMethodsSet.has(request2.method)) {
          throw new TypeError(
            `'${request2.method} is unsupported in no-cors mode.`
          );
        }
        setHeadersGuard(this.#headers, "request-no-cors");
      }
      if (initHasKey) {
        const headersList = getHeadersList(this.#headers);
        const headers2 = init.headers !== void 0 ? init.headers : new HeadersList(headersList);
        headersList.clear();
        if (headers2 instanceof HeadersList) {
          for (const { name, value } of headers2.rawValues()) {
            headersList.append(name, value, false);
          }
          headersList.cookies = headers2.cookies;
        } else {
          fillHeaders(this.#headers, headers2);
        }
      }
      const inputBody = webidl.is.Request(input) ? input.#state.body : null;
      if ((init.body != null || inputBody != null) && (request2.method === "GET" || request2.method === "HEAD")) {
        throw new TypeError("Request with GET/HEAD method cannot have body.");
      }
      let initBody = null;
      if (init.body != null) {
        const [extractedBody, contentType] = extractBody(
          init.body,
          request2.keepalive
        );
        initBody = extractedBody;
        if (contentType && !getHeadersList(this.#headers).contains("content-type", true)) {
          this.#headers.append("content-type", contentType, true);
        }
      }
      const inputOrInitBody = initBody ?? inputBody;
      if (inputOrInitBody != null && inputOrInitBody.source == null) {
        if (initBody != null && init.duplex == null) {
          throw new TypeError("RequestInit: duplex option is required when sending a body.");
        }
        if (request2.mode !== "same-origin" && request2.mode !== "cors") {
          throw new TypeError(
            'If request is made from ReadableStream, mode should be "same-origin" or "cors"'
          );
        }
        request2.useCORSPreflightFlag = true;
      }
      let finalBody = inputOrInitBody;
      if (initBody == null && inputBody != null) {
        if (bodyUnusable(input.#state)) {
          throw new TypeError(
            "Cannot construct a Request with a Request object that has already been used."
          );
        }
        const identityTransform = new TransformStream();
        inputBody.stream.pipeThrough(identityTransform);
        finalBody = {
          source: inputBody.source,
          length: inputBody.length,
          stream: identityTransform.readable
        };
      }
      this.#state.body = finalBody;
    }
    // Returns request’s HTTP method, which is "GET" by default.
    get method() {
      webidl.brandCheck(this, Request);
      return this.#state.method;
    }
    // Returns the URL of request as a string.
    get url() {
      webidl.brandCheck(this, Request);
      return URLSerializer(this.#state.url);
    }
    // Returns a Headers object consisting of the headers associated with request.
    // Note that headers added in the network layer by the user agent will not
    // be accounted for in this object, e.g., the "Host" header.
    get headers() {
      webidl.brandCheck(this, Request);
      return this.#headers;
    }
    // Returns the kind of resource requested by request, e.g., "document"
    // or "script".
    get destination() {
      webidl.brandCheck(this, Request);
      return this.#state.destination;
    }
    // Returns the referrer of request. Its value can be a same-origin URL if
    // explicitly set in init, the empty string to indicate no referrer, and
    // "about:client" when defaulting to the global’s default. This is used
    // during fetching to determine the value of the `Referer` header of the
    // request being made.
    get referrer() {
      webidl.brandCheck(this, Request);
      if (this.#state.referrer === "no-referrer") {
        return "";
      }
      if (this.#state.referrer === "client") {
        return "about:client";
      }
      return this.#state.referrer.toString();
    }
    // Returns the referrer policy associated with request.
    // This is used during fetching to compute the value of the request’s
    // referrer.
    get referrerPolicy() {
      webidl.brandCheck(this, Request);
      return this.#state.referrerPolicy;
    }
    // Returns the mode associated with request, which is a string indicating
    // whether the request will use CORS, or will be restricted to same-origin
    // URLs.
    get mode() {
      webidl.brandCheck(this, Request);
      return this.#state.mode;
    }
    // Returns the credentials mode associated with request,
    // which is a string indicating whether credentials will be sent with the
    // request always, never, or only when sent to a same-origin URL.
    get credentials() {
      webidl.brandCheck(this, Request);
      return this.#state.credentials;
    }
    // Returns the cache mode associated with request,
    // which is a string indicating how the request will
    // interact with the browser’s cache when fetching.
    get cache() {
      webidl.brandCheck(this, Request);
      return this.#state.cache;
    }
    // Returns the redirect mode associated with request,
    // which is a string indicating how redirects for the
    // request will be handled during fetching. A request
    // will follow redirects by default.
    get redirect() {
      webidl.brandCheck(this, Request);
      return this.#state.redirect;
    }
    // Returns request’s subresource integrity metadata, which is a
    // cryptographic hash of the resource being fetched. Its value
    // consists of multiple hashes separated by whitespace. [SRI]
    get integrity() {
      webidl.brandCheck(this, Request);
      return this.#state.integrity;
    }
    // Returns a boolean indicating whether or not request can outlive the
    // global in which it was created.
    get keepalive() {
      webidl.brandCheck(this, Request);
      return this.#state.keepalive;
    }
    // Returns a boolean indicating whether or not request is for a reload
    // navigation.
    get isReloadNavigation() {
      webidl.brandCheck(this, Request);
      return this.#state.reloadNavigation;
    }
    // Returns a boolean indicating whether or not request is for a history
    // navigation (a.k.a. back-forward navigation).
    get isHistoryNavigation() {
      webidl.brandCheck(this, Request);
      return this.#state.historyNavigation;
    }
    // Returns the signal associated with request, which is an AbortSignal
    // object indicating whether or not request has been aborted, and its
    // abort event handler.
    get signal() {
      webidl.brandCheck(this, Request);
      return this.#signal;
    }
    get body() {
      webidl.brandCheck(this, Request);
      return this.#state.body ? this.#state.body.stream : null;
    }
    get bodyUsed() {
      webidl.brandCheck(this, Request);
      return !!this.#state.body && util2.isDisturbed(this.#state.body.stream);
    }
    get duplex() {
      webidl.brandCheck(this, Request);
      return "half";
    }
    // Returns a clone of request.
    clone() {
      webidl.brandCheck(this, Request);
      if (bodyUnusable(this.#state)) {
        throw new TypeError("unusable");
      }
      const clonedRequest = cloneRequest(this.#state);
      const ac = new AbortController();
      if (this.signal.aborted) {
        ac.abort(this.signal.reason);
      } else {
        let list = dependentControllerMap.get(this.signal);
        if (list === void 0) {
          list = /* @__PURE__ */ new Set();
          dependentControllerMap.set(this.signal, list);
        }
        const acRef = new WeakRef(ac);
        list.add(acRef);
        util2.addAbortListener(
          ac.signal,
          buildAbort(acRef)
        );
      }
      return fromInnerRequest(clonedRequest, this.#dispatcher, ac.signal, getHeadersGuard(this.#headers));
    }
    [nodeUtil.inspect.custom](depth, options) {
      if (options.depth === null) {
        options.depth = 2;
      }
      options.colors ??= true;
      const properties = {
        method: this.method,
        url: this.url,
        headers: this.headers,
        destination: this.destination,
        referrer: this.referrer,
        referrerPolicy: this.referrerPolicy,
        mode: this.mode,
        credentials: this.credentials,
        cache: this.cache,
        redirect: this.redirect,
        integrity: this.integrity,
        keepalive: this.keepalive,
        isReloadNavigation: this.isReloadNavigation,
        isHistoryNavigation: this.isHistoryNavigation,
        signal: this.signal
      };
      return `Request ${nodeUtil.formatWithOptions(options, properties)}`;
    }
    /**
     * @param {Request} request
     * @param {AbortSignal} newSignal
     */
    static setRequestSignal(request2, newSignal) {
      request2.#signal = newSignal;
      return request2;
    }
    /**
     * @param {Request} request
     */
    static getRequestDispatcher(request2) {
      return request2.#dispatcher;
    }
    /**
     * @param {Request} request
     * @param {import('../../dispatcher/dispatcher')} newDispatcher
     */
    static setRequestDispatcher(request2, newDispatcher) {
      request2.#dispatcher = newDispatcher;
    }
    /**
     * @param {Request} request
     * @param {Headers} newHeaders
     */
    static setRequestHeaders(request2, newHeaders) {
      request2.#headers = newHeaders;
    }
    /**
     * @param {Request} request
     */
    static getRequestState(request2) {
      return request2.#state;
    }
    /**
     * @param {Request} request
     * @param {any} newState
     */
    static setRequestState(request2, newState) {
      request2.#state = newState;
    }
  }
  const { setRequestSignal, getRequestDispatcher, setRequestDispatcher, setRequestHeaders, getRequestState, setRequestState } = Request;
  Reflect.deleteProperty(Request, "setRequestSignal");
  Reflect.deleteProperty(Request, "getRequestDispatcher");
  Reflect.deleteProperty(Request, "setRequestDispatcher");
  Reflect.deleteProperty(Request, "setRequestHeaders");
  Reflect.deleteProperty(Request, "getRequestState");
  Reflect.deleteProperty(Request, "setRequestState");
  mixinBody(Request, getRequestState);
  function makeRequest(init) {
    return {
      method: init.method ?? "GET",
      localURLsOnly: init.localURLsOnly ?? false,
      unsafeRequest: init.unsafeRequest ?? false,
      body: init.body ?? null,
      client: init.client ?? null,
      reservedClient: init.reservedClient ?? null,
      replacesClientId: init.replacesClientId ?? "",
      window: init.window ?? "client",
      keepalive: init.keepalive ?? false,
      serviceWorkers: init.serviceWorkers ?? "all",
      initiator: init.initiator ?? "",
      destination: init.destination ?? "",
      priority: init.priority ?? null,
      origin: init.origin ?? "client",
      policyContainer: init.policyContainer ?? "client",
      referrer: init.referrer ?? "client",
      referrerPolicy: init.referrerPolicy ?? "",
      mode: init.mode ?? "no-cors",
      useCORSPreflightFlag: init.useCORSPreflightFlag ?? false,
      credentials: init.credentials ?? "same-origin",
      useCredentials: init.useCredentials ?? false,
      cache: init.cache ?? "default",
      redirect: init.redirect ?? "follow",
      integrity: init.integrity ?? "",
      cryptoGraphicsNonceMetadata: init.cryptoGraphicsNonceMetadata ?? "",
      parserMetadata: init.parserMetadata ?? "",
      reloadNavigation: init.reloadNavigation ?? false,
      historyNavigation: init.historyNavigation ?? false,
      userActivation: init.userActivation ?? false,
      taintedOrigin: init.taintedOrigin ?? false,
      redirectCount: init.redirectCount ?? 0,
      responseTainting: init.responseTainting ?? "basic",
      preventNoCacheCacheControlHeaderModification: init.preventNoCacheCacheControlHeaderModification ?? false,
      done: init.done ?? false,
      timingAllowFailed: init.timingAllowFailed ?? false,
      useURLCredentials: init.useURLCredentials ?? void 0,
      traversableForUserPrompts: init.traversableForUserPrompts ?? "client",
      urlList: init.urlList,
      url: init.urlList[0],
      headersList: init.headersList ? new HeadersList(init.headersList) : new HeadersList()
    };
  }
  function cloneRequest(request2) {
    const newRequest = makeRequest({ ...request2, body: null });
    if (request2.body != null) {
      newRequest.body = cloneBody(request2.body);
    }
    return newRequest;
  }
  function fromInnerRequest(innerRequest, dispatcher2, signal, guard) {
    const request2 = new Request(kConstruct);
    setRequestState(request2, innerRequest);
    setRequestDispatcher(request2, dispatcher2);
    setRequestSignal(request2, signal);
    const headers2 = new Headers(kConstruct);
    setRequestHeaders(request2, headers2);
    setHeadersList(headers2, innerRequest.headersList);
    setHeadersGuard(headers2, guard);
    return request2;
  }
  Object.defineProperties(Request.prototype, {
    method: kEnumerableProperty,
    url: kEnumerableProperty,
    headers: kEnumerableProperty,
    redirect: kEnumerableProperty,
    clone: kEnumerableProperty,
    signal: kEnumerableProperty,
    duplex: kEnumerableProperty,
    destination: kEnumerableProperty,
    body: kEnumerableProperty,
    bodyUsed: kEnumerableProperty,
    isHistoryNavigation: kEnumerableProperty,
    isReloadNavigation: kEnumerableProperty,
    keepalive: kEnumerableProperty,
    integrity: kEnumerableProperty,
    cache: kEnumerableProperty,
    credentials: kEnumerableProperty,
    attribute: kEnumerableProperty,
    referrerPolicy: kEnumerableProperty,
    referrer: kEnumerableProperty,
    mode: kEnumerableProperty,
    [Symbol.toStringTag]: {
      value: "Request",
      configurable: true
    }
  });
  webidl.is.Request = webidl.util.MakeTypeAssertion(Request);
  webidl.converters.RequestInfo = function(V) {
    if (typeof V === "string") {
      return webidl.converters.USVString(V);
    }
    if (webidl.is.Request(V)) {
      return V;
    }
    return webidl.converters.USVString(V);
  };
  webidl.converters.RequestInit = webidl.dictionaryConverter([
    {
      key: "method",
      converter: webidl.converters.ByteString
    },
    {
      key: "headers",
      converter: webidl.converters.HeadersInit
    },
    {
      key: "body",
      converter: webidl.nullableConverter(
        webidl.converters.BodyInit
      )
    },
    {
      key: "referrer",
      converter: webidl.converters.USVString
    },
    {
      key: "referrerPolicy",
      converter: webidl.converters.DOMString,
      // https://w3c.github.io/webappsec-referrer-policy/#referrer-policy
      allowedValues: referrerPolicy
    },
    {
      key: "mode",
      converter: webidl.converters.DOMString,
      // https://fetch.spec.whatwg.org/#concept-request-mode
      allowedValues: requestMode
    },
    {
      key: "credentials",
      converter: webidl.converters.DOMString,
      // https://fetch.spec.whatwg.org/#requestcredentials
      allowedValues: requestCredentials
    },
    {
      key: "cache",
      converter: webidl.converters.DOMString,
      // https://fetch.spec.whatwg.org/#requestcache
      allowedValues: requestCache
    },
    {
      key: "redirect",
      converter: webidl.converters.DOMString,
      // https://fetch.spec.whatwg.org/#requestredirect
      allowedValues: requestRedirect
    },
    {
      key: "integrity",
      converter: webidl.converters.DOMString
    },
    {
      key: "keepalive",
      converter: webidl.converters.boolean
    },
    {
      key: "signal",
      converter: webidl.nullableConverter(
        (signal) => webidl.converters.AbortSignal(
          signal,
          "RequestInit",
          "signal"
        )
      )
    },
    {
      key: "window",
      converter: webidl.converters.any
    },
    {
      key: "duplex",
      converter: webidl.converters.DOMString,
      allowedValues: requestDuplex
    },
    {
      key: "dispatcher",
      // undici specific option
      converter: webidl.converters.any
    },
    {
      key: "priority",
      converter: webidl.converters.DOMString,
      allowedValues: ["high", "low", "auto"],
      defaultValue: () => "auto"
    }
  ]);
  request = {
    Request,
    makeRequest,
    fromInnerRequest,
    cloneRequest,
    getRequestDispatcher,
    getRequestState
  };
  return request;
}
var subresourceIntegrity;
var hasRequiredSubresourceIntegrity;
function requireSubresourceIntegrity() {
  if (hasRequiredSubresourceIntegrity) return subresourceIntegrity;
  hasRequiredSubresourceIntegrity = 1;
  const assert = require$$0$1;
  const { runtimeFeatures: runtimeFeatures2 } = /* @__PURE__ */ requireRuntimeFeatures();
  const validSRIHashAlgorithmTokenSet = /* @__PURE__ */ new Map([["sha256", 0], ["sha384", 1], ["sha512", 2]]);
  let crypto$1;
  if (runtimeFeatures2.has("crypto")) {
    crypto$1 = crypto;
    const cryptoHashes = crypto$1.getHashes();
    if (cryptoHashes.length === 0) {
      validSRIHashAlgorithmTokenSet.clear();
    }
    for (const algorithm of validSRIHashAlgorithmTokenSet.keys()) {
      if (cryptoHashes.includes(algorithm) === false) {
        validSRIHashAlgorithmTokenSet.delete(algorithm);
      }
    }
  } else {
    validSRIHashAlgorithmTokenSet.clear();
  }
  const getSRIHashAlgorithmIndex = (
    /** @type {GetSRIHashAlgorithmIndex} */
    Map.prototype.get.bind(
      validSRIHashAlgorithmTokenSet
    )
  );
  const isValidSRIHashAlgorithm = (
    /** @type {IsValidSRIHashAlgorithm} */
    Map.prototype.has.bind(validSRIHashAlgorithmTokenSet)
  );
  const bytesMatch = runtimeFeatures2.has("crypto") === false || validSRIHashAlgorithmTokenSet.size === 0 ? () => true : (bytes, metadataList) => {
    const parsedMetadata = parseMetadata(metadataList);
    if (parsedMetadata.length === 0) {
      return true;
    }
    const metadata = getStrongestMetadata(parsedMetadata);
    for (const item of metadata) {
      const algorithm = item.alg;
      const expectedValue = item.val;
      const actualValue = applyAlgorithmToBytes(algorithm, bytes);
      if (caseSensitiveMatch(actualValue, expectedValue)) {
        return true;
      }
    }
    return false;
  };
  function getStrongestMetadata(metadataList) {
    const result = [];
    let strongest = null;
    for (const item of metadataList) {
      assert(isValidSRIHashAlgorithm(item.alg), "Invalid SRI hash algorithm token");
      if (result.length === 0) {
        result.push(item);
        strongest = item;
        continue;
      }
      const currentAlgorithm = (
        /** @type {Metadata} */
        strongest.alg
      );
      const currentAlgorithmIndex = getSRIHashAlgorithmIndex(currentAlgorithm);
      const newAlgorithm = item.alg;
      const newAlgorithmIndex = getSRIHashAlgorithmIndex(newAlgorithm);
      if (newAlgorithmIndex < currentAlgorithmIndex) {
        continue;
      } else if (newAlgorithmIndex > currentAlgorithmIndex) {
        strongest = item;
        result[0] = item;
        result.length = 1;
      } else {
        result.push(item);
      }
    }
    return result;
  }
  function parseMetadata(metadata) {
    const result = [];
    for (const item of metadata.split(" ")) {
      const expressionAndOptions = item.split("?", 1);
      const algorithmExpression = expressionAndOptions[0];
      let base64Value = "";
      const algorithmAndValue = [algorithmExpression.slice(0, 6), algorithmExpression.slice(7)];
      const algorithm = algorithmAndValue[0];
      if (!isValidSRIHashAlgorithm(algorithm)) {
        continue;
      }
      if (algorithmAndValue[1]) {
        base64Value = algorithmAndValue[1];
      }
      const metadata2 = {
        alg: algorithm,
        val: base64Value
      };
      result.push(metadata2);
    }
    return result;
  }
  const applyAlgorithmToBytes = (algorithm, bytes) => {
    return crypto$1.hash(algorithm, bytes, "base64");
  };
  function caseSensitiveMatch(actualValue, expectedValue) {
    let actualValueLength = actualValue.length;
    if (actualValueLength !== 0 && actualValue[actualValueLength - 1] === "=") {
      actualValueLength -= 1;
    }
    if (actualValueLength !== 0 && actualValue[actualValueLength - 1] === "=") {
      actualValueLength -= 1;
    }
    let expectedValueLength = expectedValue.length;
    if (expectedValueLength !== 0 && expectedValue[expectedValueLength - 1] === "=") {
      expectedValueLength -= 1;
    }
    if (expectedValueLength !== 0 && expectedValue[expectedValueLength - 1] === "=") {
      expectedValueLength -= 1;
    }
    if (actualValueLength !== expectedValueLength) {
      return false;
    }
    for (let i = 0; i < actualValueLength; ++i) {
      if (actualValue[i] === expectedValue[i] || actualValue[i] === "+" && expectedValue[i] === "-" || actualValue[i] === "/" && expectedValue[i] === "_") {
        continue;
      }
      return false;
    }
    return true;
  }
  subresourceIntegrity = {
    applyAlgorithmToBytes,
    bytesMatch,
    caseSensitiveMatch,
    isValidSRIHashAlgorithm,
    getStrongestMetadata,
    parseMetadata
  };
  return subresourceIntegrity;
}
var fetch_1;
var hasRequiredFetch;
function requireFetch() {
  if (hasRequiredFetch) return fetch_1;
  hasRequiredFetch = 1;
  const {
    makeNetworkError,
    makeAppropriateNetworkError,
    filterResponse,
    makeResponse,
    fromInnerResponse,
    getResponseState
  } = /* @__PURE__ */ requireResponse();
  const { HeadersList } = /* @__PURE__ */ requireHeaders();
  const { Request, cloneRequest, getRequestDispatcher, getRequestState } = /* @__PURE__ */ requireRequest();
  const zlib = require$$3;
  const {
    makePolicyContainer,
    clonePolicyContainer,
    requestBadPort,
    TAOCheck,
    appendRequestOriginHeader,
    responseLocationURL,
    requestCurrentURL,
    setRequestReferrerPolicyOnRedirect,
    tryUpgradeRequestToAPotentiallyTrustworthyURL,
    createOpaqueTimingInfo,
    appendFetchMetadata,
    corsCheck,
    crossOriginResourcePolicyCheck,
    determineRequestsReferrer,
    coarsenedSharedCurrentTime,
    sameOrigin,
    isCancelled,
    isAborted,
    isErrorLike,
    fullyReadBody,
    readableStreamClose,
    urlIsLocal,
    urlIsHttpHttpsScheme,
    urlHasHttpsScheme,
    clampAndCoarsenConnectionTimingInfo,
    simpleRangeHeaderValue,
    buildContentRange,
    createInflate,
    extractMimeType,
    hasAuthenticationEntry,
    includesCredentials,
    isTraversableNavigable
  } = /* @__PURE__ */ requireUtil$4();
  const assert = require$$0$1;
  const { safelyExtractBody, extractBody } = /* @__PURE__ */ requireBody();
  const {
    redirectStatusSet,
    nullBodyStatus,
    safeMethodsSet,
    requestBodyHeader,
    subresourceSet
  } = /* @__PURE__ */ requireConstants$2();
  const EE = require$$6;
  const { Readable, pipeline, finished, isErrored, isReadable } = require$$0;
  const { addAbortListener, bufferToLowerCasedHeaderName } = /* @__PURE__ */ requireUtil$5();
  const { dataURLProcessor, serializeAMimeType, minimizeSupportedMimeType } = /* @__PURE__ */ requireDataUrl();
  const { getGlobalDispatcher } = /* @__PURE__ */ requireGlobal();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { STATUS_CODES } = require$$2;
  const { bytesMatch } = /* @__PURE__ */ requireSubresourceIntegrity();
  const { createDeferredPromise } = /* @__PURE__ */ requirePromise();
  const { isomorphicEncode } = /* @__PURE__ */ requireInfra();
  const { runtimeFeatures: runtimeFeatures2 } = /* @__PURE__ */ requireRuntimeFeatures();
  const hasZstd = runtimeFeatures2.has("zstd");
  const GET_OR_HEAD = ["GET", "HEAD"];
  const defaultUserAgent = typeof __UNDICI_IS_NODE__ !== "undefined" || typeof esbuildDetection !== "undefined" ? "node" : "undici";
  let resolveObjectURL;
  class Fetch extends EE {
    constructor(dispatcher2) {
      super();
      this.dispatcher = dispatcher2;
      this.connection = null;
      this.dump = false;
      this.state = "ongoing";
    }
    terminate(reason) {
      if (this.state !== "ongoing") {
        return;
      }
      this.state = "terminated";
      this.connection?.destroy(reason);
      this.emit("terminated", reason);
    }
    // https://fetch.spec.whatwg.org/#fetch-controller-abort
    abort(error) {
      if (this.state !== "ongoing") {
        return;
      }
      this.state = "aborted";
      if (!error) {
        error = new DOMException("The operation was aborted.", "AbortError");
      }
      this.serializedAbortReason = error;
      this.connection?.destroy(error);
      this.emit("terminated", error);
    }
  }
  function handleFetchDone(response2) {
    finalizeAndReportTiming(response2, "fetch");
  }
  function fetch(input, init = void 0) {
    webidl.argumentLengthCheck(arguments, 1, "globalThis.fetch");
    let p = createDeferredPromise();
    let requestObject;
    try {
      requestObject = new Request(input, init);
    } catch (e) {
      p.reject(e);
      return p.promise;
    }
    const request2 = getRequestState(requestObject);
    if (requestObject.signal.aborted) {
      abortFetch(p, request2, null, requestObject.signal.reason);
      return p.promise;
    }
    const globalObject = request2.client.globalObject;
    if (globalObject?.constructor?.name === "ServiceWorkerGlobalScope") {
      request2.serviceWorkers = "none";
    }
    let responseObject = null;
    let locallyAborted = false;
    let controller = null;
    addAbortListener(
      requestObject.signal,
      () => {
        locallyAborted = true;
        assert(controller != null);
        controller.abort(requestObject.signal.reason);
        const realResponse = responseObject?.deref();
        abortFetch(p, request2, realResponse, requestObject.signal.reason);
      }
    );
    const processResponse = (response2) => {
      if (locallyAborted) {
        return;
      }
      if (response2.aborted) {
        abortFetch(p, request2, responseObject, controller.serializedAbortReason);
        return;
      }
      if (response2.type === "error") {
        p.reject(new TypeError("fetch failed", { cause: response2.error }));
        return;
      }
      responseObject = new WeakRef(fromInnerResponse(response2, "immutable"));
      p.resolve(responseObject.deref());
      p = null;
    };
    controller = fetching({
      request: request2,
      processResponseEndOfBody: handleFetchDone,
      processResponse,
      dispatcher: getRequestDispatcher(requestObject)
      // undici
    });
    return p.promise;
  }
  function finalizeAndReportTiming(response2, initiatorType = "other") {
    if (response2.type === "error" && response2.aborted) {
      return;
    }
    if (!response2.urlList?.length) {
      return;
    }
    const originalURL = response2.urlList[0];
    let timingInfo = response2.timingInfo;
    let cacheState = response2.cacheState;
    if (!urlIsHttpHttpsScheme(originalURL)) {
      return;
    }
    if (timingInfo === null) {
      return;
    }
    if (!response2.timingAllowPassed) {
      timingInfo = createOpaqueTimingInfo({
        startTime: timingInfo.startTime
      });
      cacheState = "";
    }
    timingInfo.endTime = coarsenedSharedCurrentTime();
    response2.timingInfo = timingInfo;
    markResourceTiming(
      timingInfo,
      originalURL.href,
      initiatorType,
      globalThis,
      cacheState,
      "",
      // bodyType
      response2.status
    );
  }
  const markResourceTiming = performance.markResourceTiming;
  function abortFetch(p, request2, responseObject, error) {
    if (p) {
      p.reject(error);
    }
    if (request2.body?.stream != null && isReadable(request2.body.stream)) {
      request2.body.stream.cancel(error).catch((err) => {
        if (err.code === "ERR_INVALID_STATE") {
          return;
        }
        throw err;
      });
    }
    if (responseObject == null) {
      return;
    }
    const response2 = getResponseState(responseObject);
    if (response2.body?.stream != null && isReadable(response2.body.stream)) {
      response2.body.stream.cancel(error).catch((err) => {
        if (err.code === "ERR_INVALID_STATE") {
          return;
        }
        throw err;
      });
    }
  }
  function fetching({
    request: request2,
    processRequestBodyChunkLength,
    processRequestEndOfBody,
    processResponse,
    processResponseEndOfBody,
    processResponseConsumeBody,
    useParallelQueue = false,
    dispatcher: dispatcher2 = getGlobalDispatcher()
    // undici
  }) {
    assert(dispatcher2);
    let taskDestination = null;
    let crossOriginIsolatedCapability = false;
    if (request2.client != null) {
      taskDestination = request2.client.globalObject;
      crossOriginIsolatedCapability = request2.client.crossOriginIsolatedCapability;
    }
    const currentTime = coarsenedSharedCurrentTime(crossOriginIsolatedCapability);
    const timingInfo = createOpaqueTimingInfo({
      startTime: currentTime
    });
    const fetchParams = {
      controller: new Fetch(dispatcher2),
      request: request2,
      timingInfo,
      processRequestBodyChunkLength,
      processRequestEndOfBody,
      processResponse,
      processResponseConsumeBody,
      processResponseEndOfBody,
      taskDestination,
      crossOriginIsolatedCapability
    };
    assert(!request2.body || request2.body.stream);
    if (request2.window === "client") {
      request2.window = request2.client?.globalObject?.constructor?.name === "Window" ? request2.client : "no-window";
    }
    if (request2.origin === "client") {
      request2.origin = request2.client.origin;
    }
    if (request2.policyContainer === "client") {
      if (request2.client != null) {
        request2.policyContainer = clonePolicyContainer(
          request2.client.policyContainer
        );
      } else {
        request2.policyContainer = makePolicyContainer();
      }
    }
    if (!request2.headersList.contains("accept", true)) {
      const value = "*/*";
      request2.headersList.append("accept", value, true);
    }
    if (!request2.headersList.contains("accept-language", true)) {
      request2.headersList.append("accept-language", "*", true);
    }
    if (request2.priority === null) ;
    if (subresourceSet.has(request2.destination)) ;
    mainFetch(fetchParams, false);
    return fetchParams.controller;
  }
  async function mainFetch(fetchParams, recursive) {
    try {
      const request2 = fetchParams.request;
      let response2 = null;
      if (request2.localURLsOnly && !urlIsLocal(requestCurrentURL(request2))) {
        response2 = makeNetworkError("local URLs only");
      }
      tryUpgradeRequestToAPotentiallyTrustworthyURL(request2);
      if (requestBadPort(request2) === "blocked") {
        response2 = makeNetworkError("bad port");
      }
      if (request2.referrerPolicy === "") {
        request2.referrerPolicy = request2.policyContainer.referrerPolicy;
      }
      if (request2.referrer !== "no-referrer") {
        request2.referrer = determineRequestsReferrer(request2);
      }
      if (response2 === null) {
        const currentURL = requestCurrentURL(request2);
        if (
          // - request’s current URL’s origin is same origin with request’s origin,
          //   and request’s response tainting is "basic"
          sameOrigin(currentURL, request2.url) && request2.responseTainting === "basic" || // request’s current URL’s scheme is "data"
          currentURL.protocol === "data:" || // - request’s mode is "navigate" or "websocket"
          (request2.mode === "navigate" || request2.mode === "websocket")
        ) {
          request2.responseTainting = "basic";
          response2 = await schemeFetch(fetchParams);
        } else if (request2.mode === "same-origin") {
          response2 = makeNetworkError('request mode cannot be "same-origin"');
        } else if (request2.mode === "no-cors") {
          if (request2.redirect !== "follow") {
            response2 = makeNetworkError(
              'redirect mode cannot be "follow" for "no-cors" request'
            );
          } else {
            request2.responseTainting = "opaque";
            response2 = await schemeFetch(fetchParams);
          }
        } else if (!urlIsHttpHttpsScheme(requestCurrentURL(request2))) {
          response2 = makeNetworkError("URL scheme must be a HTTP(S) scheme");
        } else {
          request2.responseTainting = "cors";
          response2 = await httpFetch(fetchParams);
        }
      }
      if (recursive) {
        return response2;
      }
      if (response2.status !== 0 && !response2.internalResponse) {
        if (request2.responseTainting === "cors") {
        }
        if (request2.responseTainting === "basic") {
          response2 = filterResponse(response2, "basic");
        } else if (request2.responseTainting === "cors") {
          response2 = filterResponse(response2, "cors");
        } else if (request2.responseTainting === "opaque") {
          response2 = filterResponse(response2, "opaque");
        } else {
          assert(false);
        }
      }
      let internalResponse = response2.status === 0 ? response2 : response2.internalResponse;
      if (internalResponse.urlList.length === 0) {
        internalResponse.urlList.push(...request2.urlList);
      }
      if (!request2.timingAllowFailed) {
        response2.timingAllowPassed = true;
      }
      if (response2.type === "opaque" && internalResponse.status === 206 && internalResponse.rangeRequested && !request2.headers.contains("range", true)) {
        response2 = internalResponse = makeNetworkError();
      }
      if (response2.status !== 0 && (request2.method === "HEAD" || request2.method === "CONNECT" || nullBodyStatus.includes(internalResponse.status))) {
        internalResponse.body = null;
        fetchParams.controller.dump = true;
      }
      if (request2.integrity) {
        const processBodyError = (reason) => fetchFinale(fetchParams, makeNetworkError(reason));
        if (request2.responseTainting === "opaque" || response2.body == null) {
          processBodyError(response2.error);
          return;
        }
        const processBody = (bytes) => {
          if (!bytesMatch(bytes, request2.integrity)) {
            processBodyError("integrity mismatch");
            return;
          }
          response2.body = safelyExtractBody(bytes)[0];
          fetchFinale(fetchParams, response2);
        };
        fullyReadBody(response2.body, processBody, processBodyError);
      } else {
        fetchFinale(fetchParams, response2);
      }
    } catch (err) {
      fetchParams.controller.terminate(err);
    }
  }
  function schemeFetch(fetchParams) {
    if (isCancelled(fetchParams) && fetchParams.request.redirectCount === 0) {
      return Promise.resolve(makeAppropriateNetworkError(fetchParams));
    }
    const { request: request2 } = fetchParams;
    const { protocol: scheme } = requestCurrentURL(request2);
    switch (scheme) {
      case "about:": {
        return Promise.resolve(makeNetworkError("about scheme is not supported"));
      }
      case "blob:": {
        if (!resolveObjectURL) {
          resolveObjectURL = require$$0$5.resolveObjectURL;
        }
        const blobURLEntry = requestCurrentURL(request2);
        if (blobURLEntry.search.length !== 0) {
          return Promise.resolve(makeNetworkError("NetworkError when attempting to fetch resource."));
        }
        const blob = resolveObjectURL(blobURLEntry.toString());
        if (request2.method !== "GET" || !webidl.is.Blob(blob)) {
          return Promise.resolve(makeNetworkError("invalid method"));
        }
        const response2 = makeResponse();
        const fullLength = blob.size;
        const serializedFullLength = isomorphicEncode(`${fullLength}`);
        const type = blob.type;
        if (!request2.headersList.contains("range", true)) {
          const bodyWithType = extractBody(blob);
          response2.statusText = "OK";
          response2.body = bodyWithType[0];
          response2.headersList.set("content-length", serializedFullLength, true);
          response2.headersList.set("content-type", type, true);
        } else {
          response2.rangeRequested = true;
          const rangeHeader = request2.headersList.get("range", true);
          const rangeValue = simpleRangeHeaderValue(rangeHeader, true);
          if (rangeValue === "failure") {
            return Promise.resolve(makeNetworkError("failed to fetch the data URL"));
          }
          let { rangeStartValue: rangeStart, rangeEndValue: rangeEnd } = rangeValue;
          if (rangeStart === null) {
            rangeStart = fullLength - rangeEnd;
            rangeEnd = rangeStart + rangeEnd - 1;
          } else {
            if (rangeStart >= fullLength) {
              return Promise.resolve(makeNetworkError("Range start is greater than the blob's size."));
            }
            if (rangeEnd === null || rangeEnd >= fullLength) {
              rangeEnd = fullLength - 1;
            }
          }
          const slicedBlob = blob.slice(rangeStart, rangeEnd + 1, type);
          const slicedBodyWithType = extractBody(slicedBlob);
          response2.body = slicedBodyWithType[0];
          const serializedSlicedLength = isomorphicEncode(`${slicedBlob.size}`);
          const contentRange = buildContentRange(rangeStart, rangeEnd, fullLength);
          response2.status = 206;
          response2.statusText = "Partial Content";
          response2.headersList.set("content-length", serializedSlicedLength, true);
          response2.headersList.set("content-type", type, true);
          response2.headersList.set("content-range", contentRange, true);
        }
        return Promise.resolve(response2);
      }
      case "data:": {
        const currentURL = requestCurrentURL(request2);
        const dataURLStruct = dataURLProcessor(currentURL);
        if (dataURLStruct === "failure") {
          return Promise.resolve(makeNetworkError("failed to fetch the data URL"));
        }
        const mimeType = serializeAMimeType(dataURLStruct.mimeType);
        return Promise.resolve(makeResponse({
          statusText: "OK",
          headersList: [
            ["content-type", { name: "Content-Type", value: mimeType }]
          ],
          body: safelyExtractBody(dataURLStruct.body)[0]
        }));
      }
      case "file:": {
        return Promise.resolve(makeNetworkError("not implemented... yet..."));
      }
      case "http:":
      case "https:": {
        return httpFetch(fetchParams).catch((err) => makeNetworkError(err));
      }
      default: {
        return Promise.resolve(makeNetworkError("unknown scheme"));
      }
    }
  }
  function finalizeResponse(fetchParams, response2) {
    fetchParams.request.done = true;
    if (fetchParams.processResponseDone != null) {
      queueMicrotask(() => fetchParams.processResponseDone(response2));
    }
  }
  function fetchFinale(fetchParams, response2) {
    let timingInfo = fetchParams.timingInfo;
    const processResponseEndOfBody = () => {
      const unsafeEndTime = Date.now();
      if (fetchParams.request.destination === "document") {
        fetchParams.controller.fullTimingInfo = timingInfo;
      }
      fetchParams.controller.reportTimingSteps = () => {
        if (!urlIsHttpHttpsScheme(fetchParams.request.url)) {
          return;
        }
        timingInfo.endTime = unsafeEndTime;
        let cacheState = response2.cacheState;
        const bodyInfo = response2.bodyInfo;
        if (!response2.timingAllowPassed) {
          timingInfo = createOpaqueTimingInfo(timingInfo);
          cacheState = "";
        }
        let responseStatus = 0;
        if (fetchParams.request.mode !== "navigator" || !response2.hasCrossOriginRedirects) {
          responseStatus = response2.status;
          const mimeType = extractMimeType(response2.headersList);
          if (mimeType !== "failure") {
            bodyInfo.contentType = minimizeSupportedMimeType(mimeType);
          }
        }
        if (fetchParams.request.initiatorType != null) {
          markResourceTiming(timingInfo, fetchParams.request.url.href, fetchParams.request.initiatorType, globalThis, cacheState, bodyInfo, responseStatus);
        }
      };
      const processResponseEndOfBodyTask = () => {
        fetchParams.request.done = true;
        if (fetchParams.processResponseEndOfBody != null) {
          queueMicrotask(() => fetchParams.processResponseEndOfBody(response2));
        }
        if (fetchParams.request.initiatorType != null) {
          fetchParams.controller.reportTimingSteps();
        }
      };
      queueMicrotask(() => processResponseEndOfBodyTask());
    };
    if (fetchParams.processResponse != null) {
      queueMicrotask(() => {
        fetchParams.processResponse(response2);
        fetchParams.processResponse = null;
      });
    }
    const internalResponse = response2.type === "error" ? response2 : response2.internalResponse ?? response2;
    if (internalResponse.body == null) {
      processResponseEndOfBody();
    } else {
      finished(internalResponse.body.stream, () => {
        processResponseEndOfBody();
      });
    }
  }
  async function httpFetch(fetchParams) {
    const request2 = fetchParams.request;
    let response2 = null;
    let actualResponse = null;
    const timingInfo = fetchParams.timingInfo;
    if (request2.serviceWorkers === "all") ;
    if (response2 === null) {
      if (request2.redirect === "follow") {
        request2.serviceWorkers = "none";
      }
      actualResponse = response2 = await httpNetworkOrCacheFetch(fetchParams);
      if (request2.responseTainting === "cors" && corsCheck(request2, response2) === "failure") {
        return makeNetworkError("cors failure");
      }
      if (TAOCheck(request2, response2) === "failure") {
        request2.timingAllowFailed = true;
      }
    }
    if ((request2.responseTainting === "opaque" || response2.type === "opaque") && crossOriginResourcePolicyCheck(
      request2.origin,
      request2.client,
      request2.destination,
      actualResponse
    ) === "blocked") {
      return makeNetworkError("blocked");
    }
    if (redirectStatusSet.has(actualResponse.status)) {
      if (request2.redirect !== "manual") {
        fetchParams.controller.connection.destroy(void 0, false);
      }
      if (request2.redirect === "error") {
        response2 = makeNetworkError("unexpected redirect");
      } else if (request2.redirect === "manual") {
        response2 = actualResponse;
      } else if (request2.redirect === "follow") {
        response2 = await httpRedirectFetch(fetchParams, response2);
      } else {
        assert(false);
      }
    }
    response2.timingInfo = timingInfo;
    return response2;
  }
  function httpRedirectFetch(fetchParams, response2) {
    const request2 = fetchParams.request;
    const actualResponse = response2.internalResponse ? response2.internalResponse : response2;
    let locationURL;
    try {
      locationURL = responseLocationURL(
        actualResponse,
        requestCurrentURL(request2).hash
      );
      if (locationURL == null) {
        return response2;
      }
    } catch (err) {
      return Promise.resolve(makeNetworkError(err));
    }
    if (!urlIsHttpHttpsScheme(locationURL)) {
      return Promise.resolve(makeNetworkError("URL scheme must be a HTTP(S) scheme"));
    }
    if (request2.redirectCount === 20) {
      return Promise.resolve(makeNetworkError("redirect count exceeded"));
    }
    request2.redirectCount += 1;
    if (request2.mode === "cors" && (locationURL.username || locationURL.password) && !sameOrigin(request2, locationURL)) {
      return Promise.resolve(makeNetworkError('cross origin not allowed for request mode "cors"'));
    }
    if (request2.responseTainting === "cors" && (locationURL.username || locationURL.password)) {
      return Promise.resolve(makeNetworkError(
        'URL cannot contain credentials for request mode "cors"'
      ));
    }
    if (actualResponse.status !== 303 && request2.body != null && request2.body.source == null) {
      return Promise.resolve(makeNetworkError());
    }
    if ([301, 302].includes(actualResponse.status) && request2.method === "POST" || actualResponse.status === 303 && !GET_OR_HEAD.includes(request2.method)) {
      request2.method = "GET";
      request2.body = null;
      for (const headerName of requestBodyHeader) {
        request2.headersList.delete(headerName);
      }
    }
    if (!sameOrigin(requestCurrentURL(request2), locationURL)) {
      request2.headersList.delete("authorization", true);
      request2.headersList.delete("proxy-authorization", true);
      request2.headersList.delete("cookie", true);
      request2.headersList.delete("host", true);
    }
    if (request2.body != null) {
      assert(request2.body.source != null);
      request2.body = safelyExtractBody(request2.body.source)[0];
    }
    const timingInfo = fetchParams.timingInfo;
    timingInfo.redirectEndTime = timingInfo.postRedirectStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
    if (timingInfo.redirectStartTime === 0) {
      timingInfo.redirectStartTime = timingInfo.startTime;
    }
    request2.urlList.push(locationURL);
    setRequestReferrerPolicyOnRedirect(request2, actualResponse);
    return mainFetch(fetchParams, true);
  }
  async function httpNetworkOrCacheFetch(fetchParams, isAuthenticationFetch = false, isNewConnectionFetch = false) {
    const request2 = fetchParams.request;
    let httpFetchParams = null;
    let httpRequest = null;
    let response2 = null;
    if (request2.window === "no-window" && request2.redirect === "error") {
      httpFetchParams = fetchParams;
      httpRequest = request2;
    } else {
      httpRequest = cloneRequest(request2);
      httpFetchParams = { ...fetchParams };
      httpFetchParams.request = httpRequest;
    }
    const includeCredentials = request2.credentials === "include" || request2.credentials === "same-origin" && request2.responseTainting === "basic";
    const contentLength = httpRequest.body ? httpRequest.body.length : null;
    let contentLengthHeaderValue = null;
    if (httpRequest.body == null && ["POST", "PUT"].includes(httpRequest.method)) {
      contentLengthHeaderValue = "0";
    }
    if (contentLength != null) {
      contentLengthHeaderValue = isomorphicEncode(`${contentLength}`);
    }
    if (contentLengthHeaderValue != null) {
      httpRequest.headersList.append("content-length", contentLengthHeaderValue, true);
    }
    if (contentLength != null && httpRequest.keepalive) ;
    if (webidl.is.URL(httpRequest.referrer)) {
      httpRequest.headersList.append("referer", isomorphicEncode(httpRequest.referrer.href), true);
    }
    appendRequestOriginHeader(httpRequest);
    appendFetchMetadata(httpRequest);
    if (!httpRequest.headersList.contains("user-agent", true)) {
      httpRequest.headersList.append("user-agent", defaultUserAgent, true);
    }
    if (httpRequest.cache === "default" && (httpRequest.headersList.contains("if-modified-since", true) || httpRequest.headersList.contains("if-none-match", true) || httpRequest.headersList.contains("if-unmodified-since", true) || httpRequest.headersList.contains("if-match", true) || httpRequest.headersList.contains("if-range", true))) {
      httpRequest.cache = "no-store";
    }
    if (httpRequest.cache === "no-cache" && !httpRequest.preventNoCacheCacheControlHeaderModification && !httpRequest.headersList.contains("cache-control", true)) {
      httpRequest.headersList.append("cache-control", "max-age=0", true);
    }
    if (httpRequest.cache === "no-store" || httpRequest.cache === "reload") {
      if (!httpRequest.headersList.contains("pragma", true)) {
        httpRequest.headersList.append("pragma", "no-cache", true);
      }
      if (!httpRequest.headersList.contains("cache-control", true)) {
        httpRequest.headersList.append("cache-control", "no-cache", true);
      }
    }
    if (httpRequest.headersList.contains("range", true)) {
      httpRequest.headersList.append("accept-encoding", "identity", true);
    }
    if (!httpRequest.headersList.contains("accept-encoding", true)) {
      if (urlHasHttpsScheme(requestCurrentURL(httpRequest))) {
        httpRequest.headersList.append("accept-encoding", "br, gzip, deflate", true);
      } else {
        httpRequest.headersList.append("accept-encoding", "gzip, deflate", true);
      }
    }
    httpRequest.headersList.delete("host", true);
    if (includeCredentials) {
      if (!httpRequest.headersList.contains("authorization", true)) {
        let authorizationValue = null;
        if (hasAuthenticationEntry(httpRequest) && (httpRequest.useURLCredentials === void 0 || !includesCredentials(requestCurrentURL(httpRequest)))) ;
        else if (includesCredentials(requestCurrentURL(httpRequest)) && isAuthenticationFetch) {
          const { username, password } = requestCurrentURL(httpRequest);
          authorizationValue = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
        }
        if (authorizationValue !== null) {
          httpRequest.headersList.append("Authorization", authorizationValue, false);
        }
      }
    }
    {
      httpRequest.cache = "no-store";
    }
    if (httpRequest.cache !== "no-store" && httpRequest.cache !== "reload") ;
    if (response2 == null) {
      if (httpRequest.cache === "only-if-cached") {
        return makeNetworkError("only if cached");
      }
      const forwardResponse = await httpNetworkFetch(
        httpFetchParams,
        includeCredentials,
        isNewConnectionFetch
      );
      if (!safeMethodsSet.has(httpRequest.method) && forwardResponse.status >= 200 && forwardResponse.status <= 399) ;
      if (response2 == null) {
        response2 = forwardResponse;
      }
    }
    response2.urlList = [...httpRequest.urlList];
    if (httpRequest.headersList.contains("range", true)) {
      response2.rangeRequested = true;
    }
    response2.requestIncludesCredentials = includeCredentials;
    if (response2.status === 401 && httpRequest.responseTainting !== "cors" && includeCredentials && isTraversableNavigable(request2.traversableForUserPrompts)) {
      if (request2.body != null) {
        if (request2.body.source == null) {
          return makeNetworkError("expected non-null body source");
        }
        request2.body = safelyExtractBody(request2.body.source)[0];
      }
      if (request2.useURLCredentials === void 0 || isAuthenticationFetch) {
        if (isCancelled(fetchParams)) {
          return makeAppropriateNetworkError(fetchParams);
        }
      }
      fetchParams.controller.connection.destroy();
      response2 = await httpNetworkOrCacheFetch(fetchParams, true);
    }
    if (response2.status === 407) {
      if (request2.window === "no-window") {
        return makeNetworkError();
      }
      if (isCancelled(fetchParams)) {
        return makeAppropriateNetworkError(fetchParams);
      }
      return makeNetworkError("proxy authentication required");
    }
    if (
      // response’s status is 421
      response2.status === 421 && // isNewConnectionFetch is false
      !isNewConnectionFetch && // request’s body is null, or request’s body is non-null and request’s body’s source is non-null
      (request2.body == null || request2.body.source != null)
    ) {
      if (isCancelled(fetchParams)) {
        return makeAppropriateNetworkError(fetchParams);
      }
      fetchParams.controller.connection.destroy();
      response2 = await httpNetworkOrCacheFetch(
        fetchParams,
        isAuthenticationFetch,
        true
      );
    }
    return response2;
  }
  async function httpNetworkFetch(fetchParams, includeCredentials = false, forceNewConnection = false) {
    assert(!fetchParams.controller.connection || fetchParams.controller.connection.destroyed);
    fetchParams.controller.connection = {
      abort: null,
      destroyed: false,
      destroy(err, abort = true) {
        if (!this.destroyed) {
          this.destroyed = true;
          if (abort) {
            this.abort?.(err ?? new DOMException("The operation was aborted.", "AbortError"));
          }
        }
      }
    };
    const request2 = fetchParams.request;
    let response2 = null;
    const timingInfo = fetchParams.timingInfo;
    {
      request2.cache = "no-store";
    }
    if (request2.mode === "websocket") ;
    let requestBody = null;
    if (request2.body == null && fetchParams.processRequestEndOfBody) {
      queueMicrotask(() => fetchParams.processRequestEndOfBody());
    } else if (request2.body != null) {
      const processBodyChunk = async function* (bytes) {
        if (isCancelled(fetchParams)) {
          return;
        }
        yield bytes;
        fetchParams.processRequestBodyChunkLength?.(bytes.byteLength);
      };
      const processEndOfBody = () => {
        if (isCancelled(fetchParams)) {
          return;
        }
        if (fetchParams.processRequestEndOfBody) {
          fetchParams.processRequestEndOfBody();
        }
      };
      const processBodyError = (e) => {
        if (isCancelled(fetchParams)) {
          return;
        }
        if (e.name === "AbortError") {
          fetchParams.controller.abort();
        } else {
          fetchParams.controller.terminate(e);
        }
      };
      requestBody = (async function* () {
        try {
          for await (const bytes of request2.body.stream) {
            yield* processBodyChunk(bytes);
          }
          processEndOfBody();
        } catch (err) {
          processBodyError(err);
        }
      })();
    }
    try {
      const { body: body2, status, statusText, headersList, socket } = await dispatch({ body: requestBody });
      if (socket) {
        response2 = makeResponse({ status, statusText, headersList, socket });
      } else {
        const iterator = body2[Symbol.asyncIterator]();
        fetchParams.controller.next = () => iterator.next();
        response2 = makeResponse({ status, statusText, headersList });
      }
    } catch (err) {
      if (err.name === "AbortError") {
        fetchParams.controller.connection.destroy();
        return makeAppropriateNetworkError(fetchParams, err);
      }
      return makeNetworkError(err);
    }
    const pullAlgorithm = () => {
      return fetchParams.controller.resume();
    };
    const cancelAlgorithm = (reason) => {
      if (!isCancelled(fetchParams)) {
        fetchParams.controller.abort(reason);
      }
    };
    const stream = new ReadableStream(
      {
        start(controller) {
          fetchParams.controller.controller = controller;
        },
        pull: pullAlgorithm,
        cancel: cancelAlgorithm,
        type: "bytes"
      }
    );
    response2.body = { stream, source: null, length: null };
    if (!fetchParams.controller.resume) {
      fetchParams.controller.on("terminated", onAborted);
    }
    fetchParams.controller.resume = async () => {
      while (true) {
        let bytes;
        let isFailure;
        try {
          const { done, value } = await fetchParams.controller.next();
          if (isAborted(fetchParams)) {
            break;
          }
          bytes = done ? void 0 : value;
        } catch (err) {
          if (fetchParams.controller.ended && !timingInfo.encodedBodySize) {
            bytes = void 0;
          } else {
            bytes = err;
            isFailure = true;
          }
        }
        if (bytes === void 0) {
          readableStreamClose(fetchParams.controller.controller);
          finalizeResponse(fetchParams, response2);
          return;
        }
        timingInfo.decodedBodySize += bytes?.byteLength ?? 0;
        if (isFailure) {
          fetchParams.controller.terminate(bytes);
          return;
        }
        const buffer = new Uint8Array(bytes);
        if (buffer.byteLength) {
          fetchParams.controller.controller.enqueue(buffer);
        }
        if (isErrored(stream)) {
          fetchParams.controller.terminate();
          return;
        }
        if (fetchParams.controller.controller.desiredSize <= 0) {
          return;
        }
      }
    };
    function onAborted(reason) {
      if (isAborted(fetchParams)) {
        response2.aborted = true;
        if (isReadable(stream)) {
          fetchParams.controller.controller.error(
            fetchParams.controller.serializedAbortReason
          );
        }
      } else {
        if (isReadable(stream)) {
          fetchParams.controller.controller.error(new TypeError("terminated", {
            cause: isErrorLike(reason) ? reason : void 0
          }));
        }
      }
      fetchParams.controller.connection.destroy();
    }
    return response2;
    function dispatch({ body: body2 }) {
      const url = requestCurrentURL(request2);
      const agent2 = fetchParams.controller.dispatcher;
      return new Promise((resolve, reject) => agent2.dispatch(
        {
          path: url.pathname + url.search,
          origin: url.origin,
          method: request2.method,
          body: agent2.isMockActive ? request2.body && (request2.body.source || request2.body.stream) : body2,
          headers: request2.headersList.entries,
          maxRedirections: 0,
          upgrade: request2.mode === "websocket" ? "websocket" : void 0
        },
        {
          body: null,
          abort: null,
          onConnect(abort) {
            const { connection: connection2 } = fetchParams.controller;
            timingInfo.finalConnectionTimingInfo = clampAndCoarsenConnectionTimingInfo(void 0, timingInfo.postRedirectStartTime, fetchParams.crossOriginIsolatedCapability);
            if (connection2.destroyed) {
              abort(new DOMException("The operation was aborted.", "AbortError"));
            } else {
              fetchParams.controller.on("terminated", abort);
              this.abort = connection2.abort = abort;
            }
            timingInfo.finalNetworkRequestStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
          },
          onResponseStarted() {
            timingInfo.finalNetworkResponseStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
          },
          onHeaders(status, rawHeaders, resume, statusText) {
            if (status < 200) {
              return false;
            }
            const headersList = new HeadersList();
            for (let i = 0; i < rawHeaders.length; i += 2) {
              headersList.append(bufferToLowerCasedHeaderName(rawHeaders[i]), rawHeaders[i + 1].toString("latin1"), true);
            }
            const location = headersList.get("location", true);
            this.body = new Readable({ read: resume });
            const willFollow = location && request2.redirect === "follow" && redirectStatusSet.has(status);
            const decoders = [];
            if (request2.method !== "HEAD" && request2.method !== "CONNECT" && !nullBodyStatus.includes(status) && !willFollow) {
              const contentEncoding = headersList.get("content-encoding", true);
              const codings = contentEncoding ? contentEncoding.toLowerCase().split(",") : [];
              const maxContentEncodings = 5;
              if (codings.length > maxContentEncodings) {
                reject(new Error(`too many content-encodings in response: ${codings.length}, maximum allowed is ${maxContentEncodings}`));
                return true;
              }
              for (let i = codings.length - 1; i >= 0; --i) {
                const coding = codings[i].trim();
                if (coding === "x-gzip" || coding === "gzip") {
                  decoders.push(zlib.createGunzip({
                    // Be less strict when decoding compressed responses, since sometimes
                    // servers send slightly invalid responses that are still accepted
                    // by common browsers.
                    // Always using Z_SYNC_FLUSH is what cURL does.
                    flush: zlib.constants.Z_SYNC_FLUSH,
                    finishFlush: zlib.constants.Z_SYNC_FLUSH
                  }));
                } else if (coding === "deflate") {
                  decoders.push(createInflate({
                    flush: zlib.constants.Z_SYNC_FLUSH,
                    finishFlush: zlib.constants.Z_SYNC_FLUSH
                  }));
                } else if (coding === "br") {
                  decoders.push(zlib.createBrotliDecompress({
                    flush: zlib.constants.BROTLI_OPERATION_FLUSH,
                    finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH
                  }));
                } else if (coding === "zstd" && hasZstd) {
                  decoders.push(zlib.createZstdDecompress({
                    flush: zlib.constants.ZSTD_e_continue,
                    finishFlush: zlib.constants.ZSTD_e_end
                  }));
                } else {
                  decoders.length = 0;
                  break;
                }
              }
            }
            const onError = this.onError.bind(this);
            resolve({
              status,
              statusText,
              headersList,
              body: decoders.length ? pipeline(this.body, ...decoders, (err) => {
                if (err) {
                  this.onError(err);
                }
              }).on("error", onError) : this.body.on("error", onError)
            });
            return true;
          },
          onData(chunk) {
            if (fetchParams.controller.dump) {
              return;
            }
            const bytes = chunk;
            timingInfo.encodedBodySize += bytes.byteLength;
            return this.body.push(bytes);
          },
          onComplete() {
            if (this.abort) {
              fetchParams.controller.off("terminated", this.abort);
            }
            fetchParams.controller.ended = true;
            this.body.push(null);
          },
          onError(error) {
            if (this.abort) {
              fetchParams.controller.off("terminated", this.abort);
            }
            this.body?.destroy(error);
            fetchParams.controller.terminate(error);
            reject(error);
          },
          onUpgrade(status, rawHeaders, socket) {
            if (socket.session != null && status !== 200 || socket.session == null && status !== 101) {
              return false;
            }
            const headersList = new HeadersList();
            for (let i = 0; i < rawHeaders.length; i += 2) {
              headersList.append(bufferToLowerCasedHeaderName(rawHeaders[i]), rawHeaders[i + 1].toString("latin1"), true);
            }
            resolve({
              status,
              statusText: STATUS_CODES[status],
              headersList,
              socket
            });
            return true;
          }
        }
      ));
    }
  }
  fetch_1 = {
    fetch,
    Fetch,
    fetching,
    finalizeAndReportTiming
  };
  return fetch_1;
}
var util$3;
var hasRequiredUtil$3;
function requireUtil$3() {
  if (hasRequiredUtil$3) return util$3;
  hasRequiredUtil$3 = 1;
  const assert = require$$0$1;
  const { URLSerializer } = /* @__PURE__ */ requireDataUrl();
  const { isValidHeaderName } = /* @__PURE__ */ requireUtil$4();
  function urlEquals(A, B, excludeFragment = false) {
    const serializedA = URLSerializer(A, excludeFragment);
    const serializedB = URLSerializer(B, excludeFragment);
    return serializedA === serializedB;
  }
  function getFieldValues(header) {
    assert(header !== null);
    const values = [];
    for (let value of header.split(",")) {
      value = value.trim();
      if (isValidHeaderName(value)) {
        values.push(value);
      }
    }
    return values;
  }
  util$3 = {
    urlEquals,
    getFieldValues
  };
  return util$3;
}
var cache;
var hasRequiredCache;
function requireCache() {
  if (hasRequiredCache) return cache;
  hasRequiredCache = 1;
  const assert = require$$0$1;
  const { kConstruct } = /* @__PURE__ */ requireSymbols();
  const { urlEquals, getFieldValues } = /* @__PURE__ */ requireUtil$3();
  const { kEnumerableProperty, isDisturbed } = /* @__PURE__ */ requireUtil$5();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { cloneResponse, fromInnerResponse, getResponseState } = /* @__PURE__ */ requireResponse();
  const { Request, fromInnerRequest, getRequestState } = /* @__PURE__ */ requireRequest();
  const { fetching } = /* @__PURE__ */ requireFetch();
  const { urlIsHttpHttpsScheme, readAllBytes } = /* @__PURE__ */ requireUtil$4();
  const { createDeferredPromise } = /* @__PURE__ */ requirePromise();
  class Cache {
    /**
     * @see https://w3c.github.io/ServiceWorker/#dfn-relevant-request-response-list
     * @type {requestResponseList}
     */
    #relevantRequestResponseList;
    constructor() {
      if (arguments[0] !== kConstruct) {
        webidl.illegalConstructor();
      }
      webidl.util.markAsUncloneable(this);
      this.#relevantRequestResponseList = arguments[1];
    }
    async match(request2, options = {}) {
      webidl.brandCheck(this, Cache);
      const prefix = "Cache.match";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      request2 = webidl.converters.RequestInfo(request2);
      options = webidl.converters.CacheQueryOptions(options, prefix, "options");
      const p = this.#internalMatchAll(request2, options, 1);
      if (p.length === 0) {
        return;
      }
      return p[0];
    }
    async matchAll(request2 = void 0, options = {}) {
      webidl.brandCheck(this, Cache);
      const prefix = "Cache.matchAll";
      if (request2 !== void 0) request2 = webidl.converters.RequestInfo(request2);
      options = webidl.converters.CacheQueryOptions(options, prefix, "options");
      return this.#internalMatchAll(request2, options);
    }
    async add(request2) {
      webidl.brandCheck(this, Cache);
      const prefix = "Cache.add";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      request2 = webidl.converters.RequestInfo(request2);
      const requests = [request2];
      const responseArrayPromise = this.addAll(requests);
      return await responseArrayPromise;
    }
    async addAll(requests) {
      webidl.brandCheck(this, Cache);
      const prefix = "Cache.addAll";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      const responsePromises = [];
      const requestList = [];
      for (let request2 of requests) {
        if (request2 === void 0) {
          throw webidl.errors.conversionFailed({
            prefix,
            argument: "Argument 1",
            types: ["undefined is not allowed"]
          });
        }
        request2 = webidl.converters.RequestInfo(request2);
        if (typeof request2 === "string") {
          continue;
        }
        const r = getRequestState(request2);
        if (!urlIsHttpHttpsScheme(r.url) || r.method !== "GET") {
          throw webidl.errors.exception({
            header: prefix,
            message: "Expected http/s scheme when method is not GET."
          });
        }
      }
      const fetchControllers = [];
      for (const request2 of requests) {
        const r = getRequestState(new Request(request2));
        if (!urlIsHttpHttpsScheme(r.url)) {
          throw webidl.errors.exception({
            header: prefix,
            message: "Expected http/s scheme."
          });
        }
        r.initiator = "fetch";
        r.destination = "subresource";
        requestList.push(r);
        const responsePromise = createDeferredPromise();
        fetchControllers.push(fetching({
          request: r,
          processResponse(response2) {
            if (response2.type === "error" || response2.status === 206 || response2.status < 200 || response2.status > 299) {
              responsePromise.reject(webidl.errors.exception({
                header: "Cache.addAll",
                message: "Received an invalid status code or the request failed."
              }));
            } else if (response2.headersList.contains("vary")) {
              const fieldValues = getFieldValues(response2.headersList.get("vary"));
              for (const fieldValue of fieldValues) {
                if (fieldValue === "*") {
                  responsePromise.reject(webidl.errors.exception({
                    header: "Cache.addAll",
                    message: "invalid vary field value"
                  }));
                  for (const controller of fetchControllers) {
                    controller.abort();
                  }
                  return;
                }
              }
            }
          },
          processResponseEndOfBody(response2) {
            if (response2.aborted) {
              responsePromise.reject(new DOMException("aborted", "AbortError"));
              return;
            }
            responsePromise.resolve(response2);
          }
        }));
        responsePromises.push(responsePromise.promise);
      }
      const p = Promise.all(responsePromises);
      const responses = await p;
      const operations = [];
      let index2 = 0;
      for (const response2 of responses) {
        const operation = {
          type: "put",
          // 7.3.2
          request: requestList[index2],
          // 7.3.3
          response: response2
          // 7.3.4
        };
        operations.push(operation);
        index2++;
      }
      const cacheJobPromise = createDeferredPromise();
      let errorData = null;
      try {
        this.#batchCacheOperations(operations);
      } catch (e) {
        errorData = e;
      }
      queueMicrotask(() => {
        if (errorData === null) {
          cacheJobPromise.resolve(void 0);
        } else {
          cacheJobPromise.reject(errorData);
        }
      });
      return cacheJobPromise.promise;
    }
    async put(request2, response2) {
      webidl.brandCheck(this, Cache);
      const prefix = "Cache.put";
      webidl.argumentLengthCheck(arguments, 2, prefix);
      request2 = webidl.converters.RequestInfo(request2);
      response2 = webidl.converters.Response(response2, prefix, "response");
      let innerRequest = null;
      if (webidl.is.Request(request2)) {
        innerRequest = getRequestState(request2);
      } else {
        innerRequest = getRequestState(new Request(request2));
      }
      if (!urlIsHttpHttpsScheme(innerRequest.url) || innerRequest.method !== "GET") {
        throw webidl.errors.exception({
          header: prefix,
          message: "Expected an http/s scheme when method is not GET"
        });
      }
      const innerResponse = getResponseState(response2);
      if (innerResponse.status === 206) {
        throw webidl.errors.exception({
          header: prefix,
          message: "Got 206 status"
        });
      }
      if (innerResponse.headersList.contains("vary")) {
        const fieldValues = getFieldValues(innerResponse.headersList.get("vary"));
        for (const fieldValue of fieldValues) {
          if (fieldValue === "*") {
            throw webidl.errors.exception({
              header: prefix,
              message: "Got * vary field value"
            });
          }
        }
      }
      if (innerResponse.body && (isDisturbed(innerResponse.body.stream) || innerResponse.body.stream.locked)) {
        throw webidl.errors.exception({
          header: prefix,
          message: "Response body is locked or disturbed"
        });
      }
      const clonedResponse = cloneResponse(innerResponse);
      const bodyReadPromise = createDeferredPromise();
      if (innerResponse.body != null) {
        const stream = innerResponse.body.stream;
        const reader = stream.getReader();
        readAllBytes(reader, bodyReadPromise.resolve, bodyReadPromise.reject);
      } else {
        bodyReadPromise.resolve(void 0);
      }
      const operations = [];
      const operation = {
        type: "put",
        // 14.
        request: innerRequest,
        // 15.
        response: clonedResponse
        // 16.
      };
      operations.push(operation);
      const bytes = await bodyReadPromise.promise;
      if (clonedResponse.body != null) {
        clonedResponse.body.source = bytes;
      }
      const cacheJobPromise = createDeferredPromise();
      let errorData = null;
      try {
        this.#batchCacheOperations(operations);
      } catch (e) {
        errorData = e;
      }
      queueMicrotask(() => {
        if (errorData === null) {
          cacheJobPromise.resolve();
        } else {
          cacheJobPromise.reject(errorData);
        }
      });
      return cacheJobPromise.promise;
    }
    async delete(request2, options = {}) {
      webidl.brandCheck(this, Cache);
      const prefix = "Cache.delete";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      request2 = webidl.converters.RequestInfo(request2);
      options = webidl.converters.CacheQueryOptions(options, prefix, "options");
      let r = null;
      if (webidl.is.Request(request2)) {
        r = getRequestState(request2);
        if (r.method !== "GET" && !options.ignoreMethod) {
          return false;
        }
      } else {
        assert(typeof request2 === "string");
        r = getRequestState(new Request(request2));
      }
      const operations = [];
      const operation = {
        type: "delete",
        request: r,
        options
      };
      operations.push(operation);
      const cacheJobPromise = createDeferredPromise();
      let errorData = null;
      let requestResponses;
      try {
        requestResponses = this.#batchCacheOperations(operations);
      } catch (e) {
        errorData = e;
      }
      queueMicrotask(() => {
        if (errorData === null) {
          cacheJobPromise.resolve(!!requestResponses?.length);
        } else {
          cacheJobPromise.reject(errorData);
        }
      });
      return cacheJobPromise.promise;
    }
    /**
     * @see https://w3c.github.io/ServiceWorker/#dom-cache-keys
     * @param {any} request
     * @param {import('../../../types/cache').CacheQueryOptions} options
     * @returns {Promise<readonly Request[]>}
     */
    async keys(request2 = void 0, options = {}) {
      webidl.brandCheck(this, Cache);
      const prefix = "Cache.keys";
      if (request2 !== void 0) request2 = webidl.converters.RequestInfo(request2);
      options = webidl.converters.CacheQueryOptions(options, prefix, "options");
      let r = null;
      if (request2 !== void 0) {
        if (webidl.is.Request(request2)) {
          r = getRequestState(request2);
          if (r.method !== "GET" && !options.ignoreMethod) {
            return [];
          }
        } else if (typeof request2 === "string") {
          r = getRequestState(new Request(request2));
        }
      }
      const promise2 = createDeferredPromise();
      const requests = [];
      if (request2 === void 0) {
        for (const requestResponse of this.#relevantRequestResponseList) {
          requests.push(requestResponse[0]);
        }
      } else {
        const requestResponses = this.#queryCache(r, options);
        for (const requestResponse of requestResponses) {
          requests.push(requestResponse[0]);
        }
      }
      queueMicrotask(() => {
        const requestList = [];
        for (const request3 of requests) {
          const requestObject = fromInnerRequest(
            request3,
            void 0,
            new AbortController().signal,
            "immutable"
          );
          requestList.push(requestObject);
        }
        promise2.resolve(Object.freeze(requestList));
      });
      return promise2.promise;
    }
    /**
     * @see https://w3c.github.io/ServiceWorker/#batch-cache-operations-algorithm
     * @param {CacheBatchOperation[]} operations
     * @returns {requestResponseList}
     */
    #batchCacheOperations(operations) {
      const cache2 = this.#relevantRequestResponseList;
      const backupCache = [...cache2];
      const addedItems = [];
      const resultList = [];
      try {
        for (const operation of operations) {
          if (operation.type !== "delete" && operation.type !== "put") {
            throw webidl.errors.exception({
              header: "Cache.#batchCacheOperations",
              message: 'operation type does not match "delete" or "put"'
            });
          }
          if (operation.type === "delete" && operation.response != null) {
            throw webidl.errors.exception({
              header: "Cache.#batchCacheOperations",
              message: "delete operation should not have an associated response"
            });
          }
          if (this.#queryCache(operation.request, operation.options, addedItems).length) {
            throw new DOMException("???", "InvalidStateError");
          }
          let requestResponses;
          if (operation.type === "delete") {
            requestResponses = this.#queryCache(operation.request, operation.options);
            if (requestResponses.length === 0) {
              return [];
            }
            for (const requestResponse of requestResponses) {
              const idx = cache2.indexOf(requestResponse);
              assert(idx !== -1);
              cache2.splice(idx, 1);
            }
          } else if (operation.type === "put") {
            if (operation.response == null) {
              throw webidl.errors.exception({
                header: "Cache.#batchCacheOperations",
                message: "put operation should have an associated response"
              });
            }
            const r = operation.request;
            if (!urlIsHttpHttpsScheme(r.url)) {
              throw webidl.errors.exception({
                header: "Cache.#batchCacheOperations",
                message: "expected http or https scheme"
              });
            }
            if (r.method !== "GET") {
              throw webidl.errors.exception({
                header: "Cache.#batchCacheOperations",
                message: "not get method"
              });
            }
            if (operation.options != null) {
              throw webidl.errors.exception({
                header: "Cache.#batchCacheOperations",
                message: "options must not be defined"
              });
            }
            requestResponses = this.#queryCache(operation.request);
            for (const requestResponse of requestResponses) {
              const idx = cache2.indexOf(requestResponse);
              assert(idx !== -1);
              cache2.splice(idx, 1);
            }
            cache2.push([operation.request, operation.response]);
            addedItems.push([operation.request, operation.response]);
          }
          resultList.push([operation.request, operation.response]);
        }
        return resultList;
      } catch (e) {
        this.#relevantRequestResponseList.length = 0;
        this.#relevantRequestResponseList = backupCache;
        throw e;
      }
    }
    /**
     * @see https://w3c.github.io/ServiceWorker/#query-cache
     * @param {any} requestQuery
     * @param {import('../../../types/cache').CacheQueryOptions} options
     * @param {requestResponseList} targetStorage
     * @returns {requestResponseList}
     */
    #queryCache(requestQuery, options, targetStorage) {
      const resultList = [];
      const storage = targetStorage ?? this.#relevantRequestResponseList;
      for (const requestResponse of storage) {
        const [cachedRequest, cachedResponse] = requestResponse;
        if (this.#requestMatchesCachedItem(requestQuery, cachedRequest, cachedResponse, options)) {
          resultList.push(requestResponse);
        }
      }
      return resultList;
    }
    /**
     * @see https://w3c.github.io/ServiceWorker/#request-matches-cached-item-algorithm
     * @param {any} requestQuery
     * @param {any} request
     * @param {any | null} response
     * @param {import('../../../types/cache').CacheQueryOptions | undefined} options
     * @returns {boolean}
     */
    #requestMatchesCachedItem(requestQuery, request2, response2 = null, options) {
      const queryURL = new URL(requestQuery.url);
      const cachedURL = new URL(request2.url);
      if (options?.ignoreSearch) {
        cachedURL.search = "";
        queryURL.search = "";
      }
      if (!urlEquals(queryURL, cachedURL, true)) {
        return false;
      }
      if (response2 == null || options?.ignoreVary || !response2.headersList.contains("vary")) {
        return true;
      }
      const fieldValues = getFieldValues(response2.headersList.get("vary"));
      for (const fieldValue of fieldValues) {
        if (fieldValue === "*") {
          return false;
        }
        const requestValue = request2.headersList.get(fieldValue);
        const queryValue = requestQuery.headersList.get(fieldValue);
        if (requestValue !== queryValue) {
          return false;
        }
      }
      return true;
    }
    #internalMatchAll(request2, options, maxResponses = Infinity) {
      let r = null;
      if (request2 !== void 0) {
        if (webidl.is.Request(request2)) {
          r = getRequestState(request2);
          if (r.method !== "GET" && !options.ignoreMethod) {
            return [];
          }
        } else if (typeof request2 === "string") {
          r = getRequestState(new Request(request2));
        }
      }
      const responses = [];
      if (request2 === void 0) {
        for (const requestResponse of this.#relevantRequestResponseList) {
          responses.push(requestResponse[1]);
        }
      } else {
        const requestResponses = this.#queryCache(r, options);
        for (const requestResponse of requestResponses) {
          responses.push(requestResponse[1]);
        }
      }
      const responseList = [];
      for (const response2 of responses) {
        const responseObject = fromInnerResponse(cloneResponse(response2), "immutable");
        responseList.push(responseObject);
        if (responseList.length >= maxResponses) {
          break;
        }
      }
      return Object.freeze(responseList);
    }
  }
  Object.defineProperties(Cache.prototype, {
    [Symbol.toStringTag]: {
      value: "Cache",
      configurable: true
    },
    match: kEnumerableProperty,
    matchAll: kEnumerableProperty,
    add: kEnumerableProperty,
    addAll: kEnumerableProperty,
    put: kEnumerableProperty,
    delete: kEnumerableProperty,
    keys: kEnumerableProperty
  });
  const cacheQueryOptionConverters = [
    {
      key: "ignoreSearch",
      converter: webidl.converters.boolean,
      defaultValue: () => false
    },
    {
      key: "ignoreMethod",
      converter: webidl.converters.boolean,
      defaultValue: () => false
    },
    {
      key: "ignoreVary",
      converter: webidl.converters.boolean,
      defaultValue: () => false
    }
  ];
  webidl.converters.CacheQueryOptions = webidl.dictionaryConverter(cacheQueryOptionConverters);
  webidl.converters.MultiCacheQueryOptions = webidl.dictionaryConverter([
    ...cacheQueryOptionConverters,
    {
      key: "cacheName",
      converter: webidl.converters.DOMString
    }
  ]);
  webidl.converters.Response = webidl.interfaceConverter(
    webidl.is.Response,
    "Response"
  );
  webidl.converters["sequence<RequestInfo>"] = webidl.sequenceConverter(
    webidl.converters.RequestInfo
  );
  cache = {
    Cache
  };
  return cache;
}
var cachestorage;
var hasRequiredCachestorage;
function requireCachestorage() {
  if (hasRequiredCachestorage) return cachestorage;
  hasRequiredCachestorage = 1;
  const { Cache } = /* @__PURE__ */ requireCache();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { kEnumerableProperty } = /* @__PURE__ */ requireUtil$5();
  const { kConstruct } = /* @__PURE__ */ requireSymbols();
  class CacheStorage {
    /**
     * @see https://w3c.github.io/ServiceWorker/#dfn-relevant-name-to-cache-map
     * @type {Map<string, import('./cache').requestResponseList}
     */
    #caches = /* @__PURE__ */ new Map();
    constructor() {
      if (arguments[0] !== kConstruct) {
        webidl.illegalConstructor();
      }
      webidl.util.markAsUncloneable(this);
    }
    async match(request2, options = {}) {
      webidl.brandCheck(this, CacheStorage);
      webidl.argumentLengthCheck(arguments, 1, "CacheStorage.match");
      request2 = webidl.converters.RequestInfo(request2);
      options = webidl.converters.MultiCacheQueryOptions(options);
      if (options.cacheName != null) {
        if (this.#caches.has(options.cacheName)) {
          const cacheList = this.#caches.get(options.cacheName);
          const cache2 = new Cache(kConstruct, cacheList);
          return await cache2.match(request2, options);
        }
      } else {
        for (const cacheList of this.#caches.values()) {
          const cache2 = new Cache(kConstruct, cacheList);
          const response2 = await cache2.match(request2, options);
          if (response2 !== void 0) {
            return response2;
          }
        }
      }
    }
    /**
     * @see https://w3c.github.io/ServiceWorker/#cache-storage-has
     * @param {string} cacheName
     * @returns {Promise<boolean>}
     */
    async has(cacheName) {
      webidl.brandCheck(this, CacheStorage);
      const prefix = "CacheStorage.has";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      cacheName = webidl.converters.DOMString(cacheName, prefix, "cacheName");
      return this.#caches.has(cacheName);
    }
    /**
     * @see https://w3c.github.io/ServiceWorker/#dom-cachestorage-open
     * @param {string} cacheName
     * @returns {Promise<Cache>}
     */
    async open(cacheName) {
      webidl.brandCheck(this, CacheStorage);
      const prefix = "CacheStorage.open";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      cacheName = webidl.converters.DOMString(cacheName, prefix, "cacheName");
      if (this.#caches.has(cacheName)) {
        const cache3 = this.#caches.get(cacheName);
        return new Cache(kConstruct, cache3);
      }
      const cache2 = [];
      this.#caches.set(cacheName, cache2);
      return new Cache(kConstruct, cache2);
    }
    /**
     * @see https://w3c.github.io/ServiceWorker/#cache-storage-delete
     * @param {string} cacheName
     * @returns {Promise<boolean>}
     */
    async delete(cacheName) {
      webidl.brandCheck(this, CacheStorage);
      const prefix = "CacheStorage.delete";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      cacheName = webidl.converters.DOMString(cacheName, prefix, "cacheName");
      return this.#caches.delete(cacheName);
    }
    /**
     * @see https://w3c.github.io/ServiceWorker/#cache-storage-keys
     * @returns {Promise<string[]>}
     */
    async keys() {
      webidl.brandCheck(this, CacheStorage);
      const keys = this.#caches.keys();
      return [...keys];
    }
  }
  Object.defineProperties(CacheStorage.prototype, {
    [Symbol.toStringTag]: {
      value: "CacheStorage",
      configurable: true
    },
    match: kEnumerableProperty,
    has: kEnumerableProperty,
    open: kEnumerableProperty,
    delete: kEnumerableProperty,
    keys: kEnumerableProperty
  });
  cachestorage = {
    CacheStorage
  };
  return cachestorage;
}
var constants$1;
var hasRequiredConstants$1;
function requireConstants$1() {
  if (hasRequiredConstants$1) return constants$1;
  hasRequiredConstants$1 = 1;
  const maxAttributeValueSize = 1024;
  const maxNameValuePairSize = 4096;
  constants$1 = {
    maxAttributeValueSize,
    maxNameValuePairSize
  };
  return constants$1;
}
var util$2;
var hasRequiredUtil$2;
function requireUtil$2() {
  if (hasRequiredUtil$2) return util$2;
  hasRequiredUtil$2 = 1;
  function isCTLExcludingHtab(value) {
    for (let i = 0; i < value.length; ++i) {
      const code = value.charCodeAt(i);
      if (code >= 0 && code <= 8 || code >= 10 && code <= 31 || code === 127) {
        return true;
      }
    }
    return false;
  }
  function validateCookieName(name) {
    for (let i = 0; i < name.length; ++i) {
      const code = name.charCodeAt(i);
      if (code < 33 || // exclude CTLs (0-31), SP and HT
      code > 126 || // exclude non-ascii and DEL
      code === 34 || // "
      code === 40 || // (
      code === 41 || // )
      code === 60 || // <
      code === 62 || // >
      code === 64 || // @
      code === 44 || // ,
      code === 59 || // ;
      code === 58 || // :
      code === 92 || // \
      code === 47 || // /
      code === 91 || // [
      code === 93 || // ]
      code === 63 || // ?
      code === 61 || // =
      code === 123 || // {
      code === 125) {
        throw new Error("Invalid cookie name");
      }
    }
  }
  function validateCookieValue(value) {
    let len = value.length;
    let i = 0;
    if (value[0] === '"') {
      if (len === 1 || value[len - 1] !== '"') {
        throw new Error("Invalid cookie value");
      }
      --len;
      ++i;
    }
    while (i < len) {
      const code = value.charCodeAt(i++);
      if (code < 33 || // exclude CTLs (0-31)
      code > 126 || // non-ascii and DEL (127)
      code === 34 || // "
      code === 44 || // ,
      code === 59 || // ;
      code === 92) {
        throw new Error("Invalid cookie value");
      }
    }
  }
  function validateCookiePath(path) {
    for (let i = 0; i < path.length; ++i) {
      const code = path.charCodeAt(i);
      if (code < 32 || // exclude CTLs (0-31)
      code === 127 || // DEL
      code === 59) {
        throw new Error("Invalid cookie path");
      }
    }
  }
  function validateCookieDomain(domain) {
    if (domain.startsWith("-") || domain.endsWith(".") || domain.endsWith("-")) {
      throw new Error("Invalid cookie domain");
    }
  }
  const IMFDays = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];
  const IMFMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const IMFPaddedNumbers = Array(61).fill(0).map((_, i) => i.toString().padStart(2, "0"));
  function toIMFDate(date2) {
    if (typeof date2 === "number") {
      date2 = new Date(date2);
    }
    return `${IMFDays[date2.getUTCDay()]}, ${IMFPaddedNumbers[date2.getUTCDate()]} ${IMFMonths[date2.getUTCMonth()]} ${date2.getUTCFullYear()} ${IMFPaddedNumbers[date2.getUTCHours()]}:${IMFPaddedNumbers[date2.getUTCMinutes()]}:${IMFPaddedNumbers[date2.getUTCSeconds()]} GMT`;
  }
  function validateCookieMaxAge(maxAge) {
    if (maxAge < 0) {
      throw new Error("Invalid cookie max-age");
    }
  }
  function stringify(cookie) {
    if (cookie.name.length === 0) {
      return null;
    }
    validateCookieName(cookie.name);
    validateCookieValue(cookie.value);
    const out = [`${cookie.name}=${cookie.value}`];
    if (cookie.name.startsWith("__Secure-")) {
      cookie.secure = true;
    }
    if (cookie.name.startsWith("__Host-")) {
      cookie.secure = true;
      cookie.domain = null;
      cookie.path = "/";
    }
    if (cookie.secure) {
      out.push("Secure");
    }
    if (cookie.httpOnly) {
      out.push("HttpOnly");
    }
    if (typeof cookie.maxAge === "number") {
      validateCookieMaxAge(cookie.maxAge);
      out.push(`Max-Age=${cookie.maxAge}`);
    }
    if (cookie.domain) {
      validateCookieDomain(cookie.domain);
      out.push(`Domain=${cookie.domain}`);
    }
    if (cookie.path) {
      validateCookiePath(cookie.path);
      out.push(`Path=${cookie.path}`);
    }
    if (cookie.expires && cookie.expires.toString() !== "Invalid Date") {
      out.push(`Expires=${toIMFDate(cookie.expires)}`);
    }
    if (cookie.sameSite) {
      out.push(`SameSite=${cookie.sameSite}`);
    }
    for (const part of cookie.unparsed) {
      if (!part.includes("=")) {
        throw new Error("Invalid unparsed");
      }
      const [key, ...value] = part.split("=");
      out.push(`${key.trim()}=${value.join("=")}`);
    }
    return out.join("; ");
  }
  util$2 = {
    isCTLExcludingHtab,
    validateCookieName,
    validateCookiePath,
    validateCookieValue,
    toIMFDate,
    stringify
  };
  return util$2;
}
var parse;
var hasRequiredParse;
function requireParse() {
  if (hasRequiredParse) return parse;
  hasRequiredParse = 1;
  const { collectASequenceOfCodePointsFast } = /* @__PURE__ */ requireInfra();
  const { maxNameValuePairSize, maxAttributeValueSize } = /* @__PURE__ */ requireConstants$1();
  const { isCTLExcludingHtab } = /* @__PURE__ */ requireUtil$2();
  const assert = require$$0$1;
  const { unescape: qsUnescape } = require$$5;
  function parseSetCookie(header) {
    if (isCTLExcludingHtab(header)) {
      return null;
    }
    let nameValuePair = "";
    let unparsedAttributes = "";
    let name = "";
    let value = "";
    if (header.includes(";")) {
      const position = { position: 0 };
      nameValuePair = collectASequenceOfCodePointsFast(";", header, position);
      unparsedAttributes = header.slice(position.position);
    } else {
      nameValuePair = header;
    }
    if (!nameValuePair.includes("=")) {
      value = nameValuePair;
    } else {
      const position = { position: 0 };
      name = collectASequenceOfCodePointsFast(
        "=",
        nameValuePair,
        position
      );
      value = nameValuePair.slice(position.position + 1);
    }
    name = name.trim();
    value = value.trim();
    if (name.length + value.length > maxNameValuePairSize) {
      return null;
    }
    return {
      name,
      value: qsUnescape(value),
      ...parseUnparsedAttributes(unparsedAttributes)
    };
  }
  function parseUnparsedAttributes(unparsedAttributes, cookieAttributeList = {}) {
    if (unparsedAttributes.length === 0) {
      return cookieAttributeList;
    }
    assert(unparsedAttributes[0] === ";");
    unparsedAttributes = unparsedAttributes.slice(1);
    let cookieAv = "";
    if (unparsedAttributes.includes(";")) {
      cookieAv = collectASequenceOfCodePointsFast(
        ";",
        unparsedAttributes,
        { position: 0 }
      );
      unparsedAttributes = unparsedAttributes.slice(cookieAv.length);
    } else {
      cookieAv = unparsedAttributes;
      unparsedAttributes = "";
    }
    let attributeName = "";
    let attributeValue = "";
    if (cookieAv.includes("=")) {
      const position = { position: 0 };
      attributeName = collectASequenceOfCodePointsFast(
        "=",
        cookieAv,
        position
      );
      attributeValue = cookieAv.slice(position.position + 1);
    } else {
      attributeName = cookieAv;
    }
    attributeName = attributeName.trim();
    attributeValue = attributeValue.trim();
    if (attributeValue.length > maxAttributeValueSize) {
      return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
    }
    const attributeNameLowercase = attributeName.toLowerCase();
    if (attributeNameLowercase === "expires") {
      const expiryTime = new Date(attributeValue);
      cookieAttributeList.expires = expiryTime;
    } else if (attributeNameLowercase === "max-age") {
      const charCode = attributeValue.charCodeAt(0);
      if ((charCode < 48 || charCode > 57) && attributeValue[0] !== "-") {
        return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
      }
      if (!/^\d+$/.test(attributeValue)) {
        return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
      }
      const deltaSeconds = Number(attributeValue);
      cookieAttributeList.maxAge = deltaSeconds;
    } else if (attributeNameLowercase === "domain") {
      let cookieDomain = attributeValue;
      if (cookieDomain[0] === ".") {
        cookieDomain = cookieDomain.slice(1);
      }
      cookieDomain = cookieDomain.toLowerCase();
      cookieAttributeList.domain = cookieDomain;
    } else if (attributeNameLowercase === "path") {
      let cookiePath = "";
      if (attributeValue.length === 0 || attributeValue[0] !== "/") {
        cookiePath = "/";
      } else {
        cookiePath = attributeValue;
      }
      cookieAttributeList.path = cookiePath;
    } else if (attributeNameLowercase === "secure") {
      cookieAttributeList.secure = true;
    } else if (attributeNameLowercase === "httponly") {
      cookieAttributeList.httpOnly = true;
    } else if (attributeNameLowercase === "samesite") {
      let enforcement = "Default";
      const attributeValueLowercase = attributeValue.toLowerCase();
      if (attributeValueLowercase.includes("none")) {
        enforcement = "None";
      }
      if (attributeValueLowercase.includes("strict")) {
        enforcement = "Strict";
      }
      if (attributeValueLowercase.includes("lax")) {
        enforcement = "Lax";
      }
      cookieAttributeList.sameSite = enforcement;
    } else {
      cookieAttributeList.unparsed ??= [];
      cookieAttributeList.unparsed.push(`${attributeName}=${attributeValue}`);
    }
    return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
  }
  parse = {
    parseSetCookie,
    parseUnparsedAttributes
  };
  return parse;
}
var cookies;
var hasRequiredCookies;
function requireCookies() {
  if (hasRequiredCookies) return cookies;
  hasRequiredCookies = 1;
  const { parseSetCookie } = /* @__PURE__ */ requireParse();
  const { stringify } = /* @__PURE__ */ requireUtil$2();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { Headers } = /* @__PURE__ */ requireHeaders();
  const brandChecks = webidl.brandCheckMultiple([Headers, globalThis.Headers].filter(Boolean));
  function getCookies(headers2) {
    webidl.argumentLengthCheck(arguments, 1, "getCookies");
    brandChecks(headers2);
    const cookie = headers2.get("cookie");
    const out = {};
    if (!cookie) {
      return out;
    }
    for (const piece of cookie.split(";")) {
      const [name, ...value] = piece.split("=");
      out[name.trim()] = value.join("=");
    }
    return out;
  }
  function deleteCookie(headers2, name, attributes) {
    brandChecks(headers2);
    const prefix = "deleteCookie";
    webidl.argumentLengthCheck(arguments, 2, prefix);
    name = webidl.converters.DOMString(name, prefix, "name");
    attributes = webidl.converters.DeleteCookieAttributes(attributes);
    setCookie(headers2, {
      name,
      value: "",
      expires: /* @__PURE__ */ new Date(0),
      ...attributes
    });
  }
  function getSetCookies(headers2) {
    webidl.argumentLengthCheck(arguments, 1, "getSetCookies");
    brandChecks(headers2);
    const cookies2 = headers2.getSetCookie();
    if (!cookies2) {
      return [];
    }
    return cookies2.map((pair) => parseSetCookie(pair));
  }
  function parseCookie(cookie) {
    cookie = webidl.converters.DOMString(cookie);
    return parseSetCookie(cookie);
  }
  function setCookie(headers2, cookie) {
    webidl.argumentLengthCheck(arguments, 2, "setCookie");
    brandChecks(headers2);
    cookie = webidl.converters.Cookie(cookie);
    const str = stringify(cookie);
    if (str) {
      headers2.append("set-cookie", str, true);
    }
  }
  webidl.converters.DeleteCookieAttributes = webidl.dictionaryConverter([
    {
      converter: webidl.nullableConverter(webidl.converters.DOMString),
      key: "path",
      defaultValue: () => null
    },
    {
      converter: webidl.nullableConverter(webidl.converters.DOMString),
      key: "domain",
      defaultValue: () => null
    }
  ]);
  webidl.converters.Cookie = webidl.dictionaryConverter([
    {
      converter: webidl.converters.DOMString,
      key: "name"
    },
    {
      converter: webidl.converters.DOMString,
      key: "value"
    },
    {
      converter: webidl.nullableConverter((value) => {
        if (typeof value === "number") {
          return webidl.converters["unsigned long long"](value);
        }
        return new Date(value);
      }),
      key: "expires",
      defaultValue: () => null
    },
    {
      converter: webidl.nullableConverter(webidl.converters["long long"]),
      key: "maxAge",
      defaultValue: () => null
    },
    {
      converter: webidl.nullableConverter(webidl.converters.DOMString),
      key: "domain",
      defaultValue: () => null
    },
    {
      converter: webidl.nullableConverter(webidl.converters.DOMString),
      key: "path",
      defaultValue: () => null
    },
    {
      converter: webidl.nullableConverter(webidl.converters.boolean),
      key: "secure",
      defaultValue: () => null
    },
    {
      converter: webidl.nullableConverter(webidl.converters.boolean),
      key: "httpOnly",
      defaultValue: () => null
    },
    {
      converter: webidl.converters.USVString,
      key: "sameSite",
      allowedValues: ["Strict", "Lax", "None"]
    },
    {
      converter: webidl.sequenceConverter(webidl.converters.DOMString),
      key: "unparsed",
      defaultValue: () => []
    }
  ]);
  cookies = {
    getCookies,
    deleteCookie,
    getSetCookies,
    setCookie,
    parseCookie
  };
  return cookies;
}
var events;
var hasRequiredEvents;
function requireEvents() {
  if (hasRequiredEvents) return events;
  hasRequiredEvents = 1;
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { kEnumerableProperty } = /* @__PURE__ */ requireUtil$5();
  const { kConstruct } = /* @__PURE__ */ requireSymbols();
  class MessageEvent extends Event {
    #eventInit;
    constructor(type, eventInitDict = {}) {
      if (type === kConstruct) {
        super(arguments[1], arguments[2]);
        webidl.util.markAsUncloneable(this);
        return;
      }
      const prefix = "MessageEvent constructor";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      type = webidl.converters.DOMString(type, prefix, "type");
      eventInitDict = webidl.converters.MessageEventInit(eventInitDict, prefix, "eventInitDict");
      super(type, eventInitDict);
      this.#eventInit = eventInitDict;
      webidl.util.markAsUncloneable(this);
    }
    get data() {
      webidl.brandCheck(this, MessageEvent);
      return this.#eventInit.data;
    }
    get origin() {
      webidl.brandCheck(this, MessageEvent);
      return this.#eventInit.origin;
    }
    get lastEventId() {
      webidl.brandCheck(this, MessageEvent);
      return this.#eventInit.lastEventId;
    }
    get source() {
      webidl.brandCheck(this, MessageEvent);
      return this.#eventInit.source;
    }
    get ports() {
      webidl.brandCheck(this, MessageEvent);
      if (!Object.isFrozen(this.#eventInit.ports)) {
        Object.freeze(this.#eventInit.ports);
      }
      return this.#eventInit.ports;
    }
    initMessageEvent(type, bubbles = false, cancelable = false, data = null, origin = "", lastEventId = "", source = null, ports = []) {
      webidl.brandCheck(this, MessageEvent);
      webidl.argumentLengthCheck(arguments, 1, "MessageEvent.initMessageEvent");
      return new MessageEvent(type, {
        bubbles,
        cancelable,
        data,
        origin,
        lastEventId,
        source,
        ports
      });
    }
    static createFastMessageEvent(type, init) {
      const messageEvent = new MessageEvent(kConstruct, type, init);
      messageEvent.#eventInit = init;
      messageEvent.#eventInit.data ??= null;
      messageEvent.#eventInit.origin ??= "";
      messageEvent.#eventInit.lastEventId ??= "";
      messageEvent.#eventInit.source ??= null;
      messageEvent.#eventInit.ports ??= [];
      return messageEvent;
    }
  }
  const { createFastMessageEvent } = MessageEvent;
  delete MessageEvent.createFastMessageEvent;
  class CloseEvent extends Event {
    #eventInit;
    constructor(type, eventInitDict = {}) {
      const prefix = "CloseEvent constructor";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      type = webidl.converters.DOMString(type, prefix, "type");
      eventInitDict = webidl.converters.CloseEventInit(eventInitDict);
      super(type, eventInitDict);
      this.#eventInit = eventInitDict;
      webidl.util.markAsUncloneable(this);
    }
    get wasClean() {
      webidl.brandCheck(this, CloseEvent);
      return this.#eventInit.wasClean;
    }
    get code() {
      webidl.brandCheck(this, CloseEvent);
      return this.#eventInit.code;
    }
    get reason() {
      webidl.brandCheck(this, CloseEvent);
      return this.#eventInit.reason;
    }
  }
  class ErrorEvent extends Event {
    #eventInit;
    constructor(type, eventInitDict) {
      const prefix = "ErrorEvent constructor";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      super(type, eventInitDict);
      webidl.util.markAsUncloneable(this);
      type = webidl.converters.DOMString(type, prefix, "type");
      eventInitDict = webidl.converters.ErrorEventInit(eventInitDict ?? {});
      this.#eventInit = eventInitDict;
    }
    get message() {
      webidl.brandCheck(this, ErrorEvent);
      return this.#eventInit.message;
    }
    get filename() {
      webidl.brandCheck(this, ErrorEvent);
      return this.#eventInit.filename;
    }
    get lineno() {
      webidl.brandCheck(this, ErrorEvent);
      return this.#eventInit.lineno;
    }
    get colno() {
      webidl.brandCheck(this, ErrorEvent);
      return this.#eventInit.colno;
    }
    get error() {
      webidl.brandCheck(this, ErrorEvent);
      return this.#eventInit.error;
    }
  }
  Object.defineProperties(MessageEvent.prototype, {
    [Symbol.toStringTag]: {
      value: "MessageEvent",
      configurable: true
    },
    data: kEnumerableProperty,
    origin: kEnumerableProperty,
    lastEventId: kEnumerableProperty,
    source: kEnumerableProperty,
    ports: kEnumerableProperty,
    initMessageEvent: kEnumerableProperty
  });
  Object.defineProperties(CloseEvent.prototype, {
    [Symbol.toStringTag]: {
      value: "CloseEvent",
      configurable: true
    },
    reason: kEnumerableProperty,
    code: kEnumerableProperty,
    wasClean: kEnumerableProperty
  });
  Object.defineProperties(ErrorEvent.prototype, {
    [Symbol.toStringTag]: {
      value: "ErrorEvent",
      configurable: true
    },
    message: kEnumerableProperty,
    filename: kEnumerableProperty,
    lineno: kEnumerableProperty,
    colno: kEnumerableProperty,
    error: kEnumerableProperty
  });
  webidl.converters.MessagePort = webidl.interfaceConverter(
    webidl.is.MessagePort,
    "MessagePort"
  );
  webidl.converters["sequence<MessagePort>"] = webidl.sequenceConverter(
    webidl.converters.MessagePort
  );
  const eventInit = [
    {
      key: "bubbles",
      converter: webidl.converters.boolean,
      defaultValue: () => false
    },
    {
      key: "cancelable",
      converter: webidl.converters.boolean,
      defaultValue: () => false
    },
    {
      key: "composed",
      converter: webidl.converters.boolean,
      defaultValue: () => false
    }
  ];
  webidl.converters.MessageEventInit = webidl.dictionaryConverter([
    ...eventInit,
    {
      key: "data",
      converter: webidl.converters.any,
      defaultValue: () => null
    },
    {
      key: "origin",
      converter: webidl.converters.USVString,
      defaultValue: () => ""
    },
    {
      key: "lastEventId",
      converter: webidl.converters.DOMString,
      defaultValue: () => ""
    },
    {
      key: "source",
      // Node doesn't implement WindowProxy or ServiceWorker, so the only
      // valid value for source is a MessagePort.
      converter: webidl.nullableConverter(webidl.converters.MessagePort),
      defaultValue: () => null
    },
    {
      key: "ports",
      converter: webidl.converters["sequence<MessagePort>"],
      defaultValue: () => []
    }
  ]);
  webidl.converters.CloseEventInit = webidl.dictionaryConverter([
    ...eventInit,
    {
      key: "wasClean",
      converter: webidl.converters.boolean,
      defaultValue: () => false
    },
    {
      key: "code",
      converter: webidl.converters["unsigned short"],
      defaultValue: () => 0
    },
    {
      key: "reason",
      converter: webidl.converters.USVString,
      defaultValue: () => ""
    }
  ]);
  webidl.converters.ErrorEventInit = webidl.dictionaryConverter([
    ...eventInit,
    {
      key: "message",
      converter: webidl.converters.DOMString,
      defaultValue: () => ""
    },
    {
      key: "filename",
      converter: webidl.converters.USVString,
      defaultValue: () => ""
    },
    {
      key: "lineno",
      converter: webidl.converters["unsigned long"],
      defaultValue: () => 0
    },
    {
      key: "colno",
      converter: webidl.converters["unsigned long"],
      defaultValue: () => 0
    },
    {
      key: "error",
      converter: webidl.converters.any
    }
  ]);
  events = {
    MessageEvent,
    CloseEvent,
    ErrorEvent,
    createFastMessageEvent
  };
  return events;
}
var constants;
var hasRequiredConstants;
function requireConstants() {
  if (hasRequiredConstants) return constants;
  hasRequiredConstants = 1;
  const uid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
  const staticPropertyDescriptors = {
    enumerable: true,
    writable: false,
    configurable: false
  };
  const states = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  };
  const sentCloseFrameState = {
    SENT: 1,
    RECEIVED: 2
  };
  const opcodes = {
    CONTINUATION: 0,
    TEXT: 1,
    BINARY: 2,
    CLOSE: 8,
    PING: 9,
    PONG: 10
  };
  const maxUnsigned16Bit = 65535;
  const parserStates = {
    INFO: 0,
    PAYLOADLENGTH_16: 2,
    PAYLOADLENGTH_64: 3,
    READ_DATA: 4
  };
  const emptyBuffer = Buffer.allocUnsafe(0);
  const sendHints = {
    text: 1,
    typedArray: 2,
    arrayBuffer: 3,
    blob: 4
  };
  constants = {
    uid,
    sentCloseFrameState,
    staticPropertyDescriptors,
    states,
    opcodes,
    maxUnsigned16Bit,
    parserStates,
    emptyBuffer,
    sendHints
  };
  return constants;
}
var util$1;
var hasRequiredUtil$1;
function requireUtil$1() {
  if (hasRequiredUtil$1) return util$1;
  hasRequiredUtil$1 = 1;
  const { states, opcodes } = /* @__PURE__ */ requireConstants();
  const { isUtf8 } = require$$0$5;
  const { removeHTTPWhitespace } = /* @__PURE__ */ requireDataUrl();
  const { collectASequenceOfCodePointsFast } = /* @__PURE__ */ requireInfra();
  function isConnecting(readyState) {
    return readyState === states.CONNECTING;
  }
  function isEstablished(readyState) {
    return readyState === states.OPEN;
  }
  function isClosing(readyState) {
    return readyState === states.CLOSING;
  }
  function isClosed(readyState) {
    return readyState === states.CLOSED;
  }
  function fireEvent(e, target, eventFactory = (type, init) => new Event(type, init), eventInitDict = {}) {
    const event = eventFactory(e, eventInitDict);
    target.dispatchEvent(event);
  }
  function websocketMessageReceived(handler, type, data) {
    handler.onMessage(type, data);
  }
  function toArrayBuffer(buffer) {
    if (buffer.byteLength === buffer.buffer.byteLength) {
      return buffer.buffer;
    }
    return new Uint8Array(buffer).buffer;
  }
  function isValidSubprotocol(protocol) {
    if (protocol.length === 0) {
      return false;
    }
    for (let i = 0; i < protocol.length; ++i) {
      const code = protocol.charCodeAt(i);
      if (code < 33 || // CTL, contains SP (0x20) and HT (0x09)
      code > 126 || code === 34 || // "
      code === 40 || // (
      code === 41 || // )
      code === 44 || // ,
      code === 47 || // /
      code === 58 || // :
      code === 59 || // ;
      code === 60 || // <
      code === 61 || // =
      code === 62 || // >
      code === 63 || // ?
      code === 64 || // @
      code === 91 || // [
      code === 92 || // \
      code === 93 || // ]
      code === 123 || // {
      code === 125) {
        return false;
      }
    }
    return true;
  }
  function isValidStatusCode(code) {
    if (code >= 1e3 && code < 1015) {
      return code !== 1004 && // reserved
      code !== 1005 && // "MUST NOT be set as a status code"
      code !== 1006;
    }
    return code >= 3e3 && code <= 4999;
  }
  function isControlFrame(opcode) {
    return opcode === opcodes.CLOSE || opcode === opcodes.PING || opcode === opcodes.PONG;
  }
  function isContinuationFrame(opcode) {
    return opcode === opcodes.CONTINUATION;
  }
  function isTextBinaryFrame(opcode) {
    return opcode === opcodes.TEXT || opcode === opcodes.BINARY;
  }
  function isValidOpcode(opcode) {
    return isTextBinaryFrame(opcode) || isContinuationFrame(opcode) || isControlFrame(opcode);
  }
  function parseExtensions(extensions) {
    const position = { position: 0 };
    const extensionList = /* @__PURE__ */ new Map();
    while (position.position < extensions.length) {
      const pair = collectASequenceOfCodePointsFast(";", extensions, position);
      const [name, value = ""] = pair.split("=", 2);
      extensionList.set(
        removeHTTPWhitespace(name, true, false),
        removeHTTPWhitespace(value, false, true)
      );
      position.position++;
    }
    return extensionList;
  }
  function isValidClientWindowBits(value) {
    for (let i = 0; i < value.length; i++) {
      const byte = value.charCodeAt(i);
      if (byte < 48 || byte > 57) {
        return false;
      }
    }
    return true;
  }
  function getURLRecord(url, baseURL) {
    let urlRecord;
    try {
      urlRecord = new URL(url, baseURL);
    } catch (e) {
      throw new DOMException(e, "SyntaxError");
    }
    if (urlRecord.protocol === "http:") {
      urlRecord.protocol = "ws:";
    } else if (urlRecord.protocol === "https:") {
      urlRecord.protocol = "wss:";
    }
    if (urlRecord.protocol !== "ws:" && urlRecord.protocol !== "wss:") {
      throw new DOMException("expected a ws: or wss: url", "SyntaxError");
    }
    if (urlRecord.hash.length || urlRecord.href.endsWith("#")) {
      throw new DOMException("hash", "SyntaxError");
    }
    return urlRecord;
  }
  function validateCloseCodeAndReason(code, reason) {
    if (code !== null) {
      if (code !== 1e3 && (code < 3e3 || code > 4999)) {
        throw new DOMException("invalid code", "InvalidAccessError");
      }
    }
    if (reason !== null) {
      const reasonBytesLength = Buffer.byteLength(reason);
      if (reasonBytesLength > 123) {
        throw new DOMException(`Reason must be less than 123 bytes; received ${reasonBytesLength}`, "SyntaxError");
      }
    }
  }
  const utf8Decode = (() => {
    if (typeof process.versions.icu === "string") {
      const fatalDecoder = new TextDecoder("utf-8", { fatal: true });
      return fatalDecoder.decode.bind(fatalDecoder);
    }
    return function(buffer) {
      if (isUtf8(buffer)) {
        return buffer.toString("utf-8");
      }
      throw new TypeError("Invalid utf-8 received.");
    };
  })();
  util$1 = {
    isConnecting,
    isEstablished,
    isClosing,
    isClosed,
    fireEvent,
    isValidSubprotocol,
    isValidStatusCode,
    websocketMessageReceived,
    utf8Decode,
    isControlFrame,
    isContinuationFrame,
    isTextBinaryFrame,
    isValidOpcode,
    parseExtensions,
    isValidClientWindowBits,
    toArrayBuffer,
    getURLRecord,
    validateCloseCodeAndReason
  };
  return util$1;
}
var frame;
var hasRequiredFrame;
function requireFrame() {
  if (hasRequiredFrame) return frame;
  hasRequiredFrame = 1;
  const { runtimeFeatures: runtimeFeatures2 } = /* @__PURE__ */ requireRuntimeFeatures();
  const { maxUnsigned16Bit, opcodes } = /* @__PURE__ */ requireConstants();
  const BUFFER_SIZE = 8 * 1024;
  let buffer = null;
  let bufIdx = BUFFER_SIZE;
  const randomFillSync = runtimeFeatures2.has("crypto") ? crypto.randomFillSync : function randomFillSync2(buffer2, _offset, _size) {
    for (let i = 0; i < buffer2.length; ++i) {
      buffer2[i] = Math.random() * 255 | 0;
    }
    return buffer2;
  };
  function generateMask() {
    if (bufIdx === BUFFER_SIZE) {
      bufIdx = 0;
      randomFillSync(buffer ??= Buffer.allocUnsafeSlow(BUFFER_SIZE), 0, BUFFER_SIZE);
    }
    return [buffer[bufIdx++], buffer[bufIdx++], buffer[bufIdx++], buffer[bufIdx++]];
  }
  class WebsocketFrameSend {
    /**
     * @param {Buffer|undefined} data
     */
    constructor(data) {
      this.frameData = data;
    }
    createFrame(opcode) {
      const frameData = this.frameData;
      const maskKey = generateMask();
      const bodyLength = frameData?.byteLength ?? 0;
      let payloadLength = bodyLength;
      let offset = 6;
      if (bodyLength > maxUnsigned16Bit) {
        offset += 8;
        payloadLength = 127;
      } else if (bodyLength > 125) {
        offset += 2;
        payloadLength = 126;
      }
      const buffer2 = Buffer.allocUnsafe(bodyLength + offset);
      buffer2[0] = buffer2[1] = 0;
      buffer2[0] |= 128;
      buffer2[0] = (buffer2[0] & 240) + opcode;
      buffer2[offset - 4] = maskKey[0];
      buffer2[offset - 3] = maskKey[1];
      buffer2[offset - 2] = maskKey[2];
      buffer2[offset - 1] = maskKey[3];
      buffer2[1] = payloadLength;
      if (payloadLength === 126) {
        buffer2.writeUInt16BE(bodyLength, 2);
      } else if (payloadLength === 127) {
        buffer2[2] = buffer2[3] = 0;
        buffer2.writeUIntBE(bodyLength, 4, 6);
      }
      buffer2[1] |= 128;
      for (let i = 0; i < bodyLength; ++i) {
        buffer2[offset + i] = frameData[i] ^ maskKey[i & 3];
      }
      return buffer2;
    }
    /**
     * @param {Uint8Array} buffer
     */
    static createFastTextFrame(buffer2) {
      const maskKey = generateMask();
      const bodyLength = buffer2.length;
      for (let i = 0; i < bodyLength; ++i) {
        buffer2[i] ^= maskKey[i & 3];
      }
      let payloadLength = bodyLength;
      let offset = 6;
      if (bodyLength > maxUnsigned16Bit) {
        offset += 8;
        payloadLength = 127;
      } else if (bodyLength > 125) {
        offset += 2;
        payloadLength = 126;
      }
      const head = Buffer.allocUnsafeSlow(offset);
      head[0] = 128 | opcodes.TEXT;
      head[1] = payloadLength | 128;
      head[offset - 4] = maskKey[0];
      head[offset - 3] = maskKey[1];
      head[offset - 2] = maskKey[2];
      head[offset - 1] = maskKey[3];
      if (payloadLength === 126) {
        head.writeUInt16BE(bodyLength, 2);
      } else if (payloadLength === 127) {
        head[2] = head[3] = 0;
        head.writeUIntBE(bodyLength, 4, 6);
      }
      return [head, buffer2];
    }
  }
  frame = {
    WebsocketFrameSend,
    generateMask
    // for benchmark
  };
  return frame;
}
var connection;
var hasRequiredConnection;
function requireConnection() {
  if (hasRequiredConnection) return connection;
  hasRequiredConnection = 1;
  const { uid, states, sentCloseFrameState, emptyBuffer, opcodes } = /* @__PURE__ */ requireConstants();
  const { parseExtensions, isClosed, isClosing, isEstablished, isConnecting, validateCloseCodeAndReason } = /* @__PURE__ */ requireUtil$1();
  const { makeRequest } = /* @__PURE__ */ requireRequest();
  const { fetching } = /* @__PURE__ */ requireFetch();
  const { Headers, getHeadersList } = /* @__PURE__ */ requireHeaders();
  const { getDecodeSplit } = /* @__PURE__ */ requireUtil$4();
  const { WebsocketFrameSend } = /* @__PURE__ */ requireFrame();
  const assert = require$$0$1;
  const { runtimeFeatures: runtimeFeatures2 } = /* @__PURE__ */ requireRuntimeFeatures();
  const crypto$1 = runtimeFeatures2.has("crypto") ? crypto : null;
  let warningEmitted = false;
  function establishWebSocketConnection(url, protocols, client2, handler, options) {
    const requestURL = url;
    requestURL.protocol = url.protocol === "ws:" ? "http:" : "https:";
    const request2 = makeRequest({
      urlList: [requestURL],
      client: client2,
      serviceWorkers: "none",
      referrer: "no-referrer",
      mode: "websocket",
      credentials: "include",
      cache: "no-store",
      redirect: "error",
      useURLCredentials: true
    });
    if (options.headers) {
      const headersList = getHeadersList(new Headers(options.headers));
      request2.headersList = headersList;
    }
    const keyValue = crypto$1.randomBytes(16).toString("base64");
    request2.headersList.append("sec-websocket-key", keyValue, true);
    request2.headersList.append("sec-websocket-version", "13", true);
    for (const protocol of protocols) {
      request2.headersList.append("sec-websocket-protocol", protocol, true);
    }
    const permessageDeflate2 = "permessage-deflate; client_max_window_bits";
    request2.headersList.append("sec-websocket-extensions", permessageDeflate2, true);
    const controller = fetching({
      request: request2,
      useParallelQueue: true,
      dispatcher: options.dispatcher,
      processResponse(response2) {
        if (response2.type === "error" || response2.status !== 101) {
          if (response2.socket?.session == null) {
            failWebsocketConnection(handler, 1002, "Received network error or non-101 status code.", response2.error);
            return;
          }
          if (response2.status !== 200) {
            failWebsocketConnection(handler, 1002, "Received network error or non-200 status code.", response2.error);
            return;
          }
        }
        if (warningEmitted === false && response2.socket?.session != null) {
          process.emitWarning("WebSocket over HTTP2 is experimental, and subject to change.", "ExperimentalWarning");
          warningEmitted = true;
        }
        if (protocols.length !== 0 && !response2.headersList.get("Sec-WebSocket-Protocol")) {
          failWebsocketConnection(handler, 1002, "Server did not respond with sent protocols.");
          return;
        }
        if (response2.socket.session == null && response2.headersList.get("Upgrade")?.toLowerCase() !== "websocket") {
          failWebsocketConnection(handler, 1002, 'Server did not set Upgrade header to "websocket".');
          return;
        }
        if (response2.socket.session == null && response2.headersList.get("Connection")?.toLowerCase() !== "upgrade") {
          failWebsocketConnection(handler, 1002, 'Server did not set Connection header to "upgrade".');
          return;
        }
        const secWSAccept = response2.headersList.get("Sec-WebSocket-Accept");
        const digest = crypto$1.hash("sha1", keyValue + uid, "base64");
        if (secWSAccept !== digest) {
          failWebsocketConnection(handler, 1002, "Incorrect hash received in Sec-WebSocket-Accept header.");
          return;
        }
        const secExtension = response2.headersList.get("Sec-WebSocket-Extensions");
        let extensions;
        if (secExtension !== null) {
          extensions = parseExtensions(secExtension);
          if (!extensions.has("permessage-deflate")) {
            failWebsocketConnection(handler, 1002, "Sec-WebSocket-Extensions header does not match.");
            return;
          }
        }
        const secProtocol = response2.headersList.get("Sec-WebSocket-Protocol");
        if (secProtocol !== null) {
          const requestProtocols = getDecodeSplit("sec-websocket-protocol", request2.headersList);
          if (!requestProtocols.includes(secProtocol)) {
            failWebsocketConnection(handler, 1002, "Protocol was not set in the opening handshake.");
            return;
          }
        }
        response2.socket.on("data", handler.onSocketData);
        response2.socket.on("close", handler.onSocketClose);
        response2.socket.on("error", handler.onSocketError);
        handler.wasEverConnected = true;
        handler.onConnectionEstablished(response2, extensions);
      }
    });
    return controller;
  }
  function closeWebSocketConnection(object, code, reason, validate = false) {
    code ??= null;
    reason ??= "";
    if (validate) validateCloseCodeAndReason(code, reason);
    if (isClosed(object.readyState) || isClosing(object.readyState)) ;
    else if (!isEstablished(object.readyState)) {
      failWebsocketConnection(object);
      object.readyState = states.CLOSING;
    } else if (!object.closeState.has(sentCloseFrameState.SENT) && !object.closeState.has(sentCloseFrameState.RECEIVED)) {
      const frame2 = new WebsocketFrameSend();
      if (reason.length !== 0 && code === null) {
        code = 1e3;
      }
      assert(code === null || Number.isInteger(code));
      if (code === null && reason.length === 0) {
        frame2.frameData = emptyBuffer;
      } else if (code !== null && reason === null) {
        frame2.frameData = Buffer.allocUnsafe(2);
        frame2.frameData.writeUInt16BE(code, 0);
      } else if (code !== null && reason !== null) {
        frame2.frameData = Buffer.allocUnsafe(2 + Buffer.byteLength(reason));
        frame2.frameData.writeUInt16BE(code, 0);
        frame2.frameData.write(reason, 2, "utf-8");
      } else {
        frame2.frameData = emptyBuffer;
      }
      object.socket.write(frame2.createFrame(opcodes.CLOSE));
      object.closeState.add(sentCloseFrameState.SENT);
      object.readyState = states.CLOSING;
    } else {
      object.readyState = states.CLOSING;
    }
  }
  function failWebsocketConnection(handler, code, reason, cause) {
    if (isEstablished(handler.readyState)) {
      closeWebSocketConnection(handler, code, reason, false);
    }
    handler.controller.abort();
    if (isConnecting(handler.readyState)) {
      handler.onSocketClose();
    } else if (handler.socket?.destroyed === false) {
      handler.socket.destroy();
    }
  }
  connection = {
    establishWebSocketConnection,
    failWebsocketConnection,
    closeWebSocketConnection
  };
  return connection;
}
var permessageDeflate;
var hasRequiredPermessageDeflate;
function requirePermessageDeflate() {
  if (hasRequiredPermessageDeflate) return permessageDeflate;
  hasRequiredPermessageDeflate = 1;
  const { createInflateRaw, Z_DEFAULT_WINDOWBITS } = require$$3;
  const { isValidClientWindowBits } = /* @__PURE__ */ requireUtil$1();
  const tail = Buffer.from([0, 0, 255, 255]);
  const kBuffer = Symbol("kBuffer");
  const kLength = Symbol("kLength");
  class PerMessageDeflate {
    /** @type {import('node:zlib').InflateRaw} */
    #inflate;
    #options = {};
    constructor(extensions) {
      this.#options.serverNoContextTakeover = extensions.has("server_no_context_takeover");
      this.#options.serverMaxWindowBits = extensions.get("server_max_window_bits");
    }
    decompress(chunk, fin, callback) {
      if (!this.#inflate) {
        let windowBits = Z_DEFAULT_WINDOWBITS;
        if (this.#options.serverMaxWindowBits) {
          if (!isValidClientWindowBits(this.#options.serverMaxWindowBits)) {
            callback(new Error("Invalid server_max_window_bits"));
            return;
          }
          windowBits = Number.parseInt(this.#options.serverMaxWindowBits);
        }
        this.#inflate = createInflateRaw({ windowBits });
        this.#inflate[kBuffer] = [];
        this.#inflate[kLength] = 0;
        this.#inflate.on("data", (data) => {
          this.#inflate[kBuffer].push(data);
          this.#inflate[kLength] += data.length;
        });
        this.#inflate.on("error", (err) => {
          this.#inflate = null;
          callback(err);
        });
      }
      this.#inflate.write(chunk);
      if (fin) {
        this.#inflate.write(tail);
      }
      this.#inflate.flush(() => {
        const full = Buffer.concat(this.#inflate[kBuffer], this.#inflate[kLength]);
        this.#inflate[kBuffer].length = 0;
        this.#inflate[kLength] = 0;
        callback(null, full);
      });
    }
  }
  permessageDeflate = { PerMessageDeflate };
  return permessageDeflate;
}
var receiver;
var hasRequiredReceiver;
function requireReceiver() {
  if (hasRequiredReceiver) return receiver;
  hasRequiredReceiver = 1;
  const { Writable } = require$$0;
  const assert = require$$0$1;
  const { parserStates, opcodes, states, emptyBuffer, sentCloseFrameState } = /* @__PURE__ */ requireConstants();
  const {
    isValidStatusCode,
    isValidOpcode,
    websocketMessageReceived,
    utf8Decode,
    isControlFrame,
    isTextBinaryFrame,
    isContinuationFrame
  } = /* @__PURE__ */ requireUtil$1();
  const { failWebsocketConnection } = /* @__PURE__ */ requireConnection();
  const { WebsocketFrameSend } = /* @__PURE__ */ requireFrame();
  const { PerMessageDeflate } = /* @__PURE__ */ requirePermessageDeflate();
  class ByteParser extends Writable {
    #buffers = [];
    #fragmentsBytes = 0;
    #byteOffset = 0;
    #loop = false;
    #state = parserStates.INFO;
    #info = {};
    #fragments = [];
    /** @type {Map<string, PerMessageDeflate>} */
    #extensions;
    /** @type {import('./websocket').Handler} */
    #handler;
    constructor(handler, extensions) {
      super();
      this.#handler = handler;
      this.#extensions = extensions == null ? /* @__PURE__ */ new Map() : extensions;
      if (this.#extensions.has("permessage-deflate")) {
        this.#extensions.set("permessage-deflate", new PerMessageDeflate(extensions));
      }
    }
    /**
     * @param {Buffer} chunk
     * @param {() => void} callback
     */
    _write(chunk, _, callback) {
      this.#buffers.push(chunk);
      this.#byteOffset += chunk.length;
      this.#loop = true;
      this.run(callback);
    }
    /**
     * Runs whenever a new chunk is received.
     * Callback is called whenever there are no more chunks buffering,
     * or not enough bytes are buffered to parse.
     */
    run(callback) {
      while (this.#loop) {
        if (this.#state === parserStates.INFO) {
          if (this.#byteOffset < 2) {
            return callback();
          }
          const buffer = this.consume(2);
          const fin = (buffer[0] & 128) !== 0;
          const opcode = buffer[0] & 15;
          const masked = (buffer[1] & 128) === 128;
          const fragmented = !fin && opcode !== opcodes.CONTINUATION;
          const payloadLength = buffer[1] & 127;
          const rsv1 = buffer[0] & 64;
          const rsv2 = buffer[0] & 32;
          const rsv3 = buffer[0] & 16;
          if (!isValidOpcode(opcode)) {
            failWebsocketConnection(this.#handler, 1002, "Invalid opcode received");
            return callback();
          }
          if (masked) {
            failWebsocketConnection(this.#handler, 1002, "Frame cannot be masked");
            return callback();
          }
          if (rsv1 !== 0 && !this.#extensions.has("permessage-deflate")) {
            failWebsocketConnection(this.#handler, 1002, "Expected RSV1 to be clear.");
            return;
          }
          if (rsv2 !== 0 || rsv3 !== 0) {
            failWebsocketConnection(this.#handler, 1002, "RSV1, RSV2, RSV3 must be clear");
            return;
          }
          if (fragmented && !isTextBinaryFrame(opcode)) {
            failWebsocketConnection(this.#handler, 1002, "Invalid frame type was fragmented.");
            return;
          }
          if (isTextBinaryFrame(opcode) && this.#fragments.length > 0) {
            failWebsocketConnection(this.#handler, 1002, "Expected continuation frame");
            return;
          }
          if (this.#info.fragmented && fragmented) {
            failWebsocketConnection(this.#handler, 1002, "Fragmented frame exceeded 125 bytes.");
            return;
          }
          if ((payloadLength > 125 || fragmented) && isControlFrame(opcode)) {
            failWebsocketConnection(this.#handler, 1002, "Control frame either too large or fragmented");
            return;
          }
          if (isContinuationFrame(opcode) && this.#fragments.length === 0 && !this.#info.compressed) {
            failWebsocketConnection(this.#handler, 1002, "Unexpected continuation frame");
            return;
          }
          if (payloadLength <= 125) {
            this.#info.payloadLength = payloadLength;
            this.#state = parserStates.READ_DATA;
          } else if (payloadLength === 126) {
            this.#state = parserStates.PAYLOADLENGTH_16;
          } else if (payloadLength === 127) {
            this.#state = parserStates.PAYLOADLENGTH_64;
          }
          if (isTextBinaryFrame(opcode)) {
            this.#info.binaryType = opcode;
            this.#info.compressed = rsv1 !== 0;
          }
          this.#info.opcode = opcode;
          this.#info.masked = masked;
          this.#info.fin = fin;
          this.#info.fragmented = fragmented;
        } else if (this.#state === parserStates.PAYLOADLENGTH_16) {
          if (this.#byteOffset < 2) {
            return callback();
          }
          const buffer = this.consume(2);
          this.#info.payloadLength = buffer.readUInt16BE(0);
          this.#state = parserStates.READ_DATA;
        } else if (this.#state === parserStates.PAYLOADLENGTH_64) {
          if (this.#byteOffset < 8) {
            return callback();
          }
          const buffer = this.consume(8);
          const upper = buffer.readUInt32BE(0);
          if (upper > 2 ** 31 - 1) {
            failWebsocketConnection(this.#handler, 1009, "Received payload length > 2^31 bytes.");
            return;
          }
          const lower = buffer.readUInt32BE(4);
          this.#info.payloadLength = (upper << 8) + lower;
          this.#state = parserStates.READ_DATA;
        } else if (this.#state === parserStates.READ_DATA) {
          if (this.#byteOffset < this.#info.payloadLength) {
            return callback();
          }
          const body2 = this.consume(this.#info.payloadLength);
          if (isControlFrame(this.#info.opcode)) {
            this.#loop = this.parseControlFrame(body2);
            this.#state = parserStates.INFO;
          } else {
            if (!this.#info.compressed) {
              this.writeFragments(body2);
              if (!this.#info.fragmented && this.#info.fin) {
                websocketMessageReceived(this.#handler, this.#info.binaryType, this.consumeFragments());
              }
              this.#state = parserStates.INFO;
            } else {
              this.#extensions.get("permessage-deflate").decompress(body2, this.#info.fin, (error, data) => {
                if (error) {
                  failWebsocketConnection(this.#handler, 1007, error.message);
                  return;
                }
                this.writeFragments(data);
                if (!this.#info.fin) {
                  this.#state = parserStates.INFO;
                  this.#loop = true;
                  this.run(callback);
                  return;
                }
                websocketMessageReceived(this.#handler, this.#info.binaryType, this.consumeFragments());
                this.#loop = true;
                this.#state = parserStates.INFO;
                this.run(callback);
              });
              this.#loop = false;
              break;
            }
          }
        }
      }
    }
    /**
     * Take n bytes from the buffered Buffers
     * @param {number} n
     * @returns {Buffer}
     */
    consume(n) {
      if (n > this.#byteOffset) {
        throw new Error("Called consume() before buffers satiated.");
      } else if (n === 0) {
        return emptyBuffer;
      }
      this.#byteOffset -= n;
      const first = this.#buffers[0];
      if (first.length > n) {
        this.#buffers[0] = first.subarray(n, first.length);
        return first.subarray(0, n);
      } else if (first.length === n) {
        return this.#buffers.shift();
      } else {
        let offset = 0;
        const buffer = Buffer.allocUnsafeSlow(n);
        while (offset !== n) {
          const next = this.#buffers[0];
          const length = next.length;
          if (length + offset === n) {
            buffer.set(this.#buffers.shift(), offset);
            break;
          } else if (length + offset > n) {
            buffer.set(next.subarray(0, n - offset), offset);
            this.#buffers[0] = next.subarray(n - offset);
            break;
          } else {
            buffer.set(this.#buffers.shift(), offset);
            offset += length;
          }
        }
        return buffer;
      }
    }
    writeFragments(fragment) {
      this.#fragmentsBytes += fragment.length;
      this.#fragments.push(fragment);
    }
    consumeFragments() {
      const fragments = this.#fragments;
      if (fragments.length === 1) {
        this.#fragmentsBytes = 0;
        return fragments.shift();
      }
      let offset = 0;
      const output = Buffer.allocUnsafeSlow(this.#fragmentsBytes);
      for (let i = 0; i < fragments.length; ++i) {
        const buffer = fragments[i];
        output.set(buffer, offset);
        offset += buffer.length;
      }
      this.#fragments = [];
      this.#fragmentsBytes = 0;
      return output;
    }
    parseCloseBody(data) {
      assert(data.length !== 1);
      let code;
      if (data.length >= 2) {
        code = data.readUInt16BE(0);
      }
      if (code !== void 0 && !isValidStatusCode(code)) {
        return { code: 1002, reason: "Invalid status code", error: true };
      }
      let reason = data.subarray(2);
      if (reason[0] === 239 && reason[1] === 187 && reason[2] === 191) {
        reason = reason.subarray(3);
      }
      try {
        reason = utf8Decode(reason);
      } catch {
        return { code: 1007, reason: "Invalid UTF-8", error: true };
      }
      return { code, reason, error: false };
    }
    /**
     * Parses control frames.
     * @param {Buffer} body
     */
    parseControlFrame(body2) {
      const { opcode, payloadLength } = this.#info;
      if (opcode === opcodes.CLOSE) {
        if (payloadLength === 1) {
          failWebsocketConnection(this.#handler, 1002, "Received close frame with a 1-byte body.");
          return false;
        }
        this.#info.closeInfo = this.parseCloseBody(body2);
        if (this.#info.closeInfo.error) {
          const { code, reason } = this.#info.closeInfo;
          failWebsocketConnection(this.#handler, code, reason);
          return false;
        }
        if (!this.#handler.closeState.has(sentCloseFrameState.SENT) && !this.#handler.closeState.has(sentCloseFrameState.RECEIVED)) {
          let body3 = emptyBuffer;
          if (this.#info.closeInfo.code) {
            body3 = Buffer.allocUnsafe(2);
            body3.writeUInt16BE(this.#info.closeInfo.code, 0);
          }
          const closeFrame = new WebsocketFrameSend(body3);
          this.#handler.socket.write(closeFrame.createFrame(opcodes.CLOSE));
          this.#handler.closeState.add(sentCloseFrameState.SENT);
        }
        this.#handler.readyState = states.CLOSING;
        this.#handler.closeState.add(sentCloseFrameState.RECEIVED);
        return false;
      } else if (opcode === opcodes.PING) {
        if (!this.#handler.closeState.has(sentCloseFrameState.RECEIVED)) {
          const frame2 = new WebsocketFrameSend(body2);
          this.#handler.socket.write(frame2.createFrame(opcodes.PONG));
          this.#handler.onPing(body2);
        }
      } else if (opcode === opcodes.PONG) {
        this.#handler.onPong(body2);
      }
      return true;
    }
    get closingInfo() {
      return this.#info.closeInfo;
    }
  }
  receiver = {
    ByteParser
  };
  return receiver;
}
var sender;
var hasRequiredSender;
function requireSender() {
  if (hasRequiredSender) return sender;
  hasRequiredSender = 1;
  const { WebsocketFrameSend } = /* @__PURE__ */ requireFrame();
  const { opcodes, sendHints } = /* @__PURE__ */ requireConstants();
  const FixedQueue = /* @__PURE__ */ requireFixedQueue();
  class SendQueue {
    /**
     * @type {FixedQueue}
     */
    #queue = new FixedQueue();
    /**
     * @type {boolean}
     */
    #running = false;
    /** @type {import('node:net').Socket} */
    #socket;
    constructor(socket) {
      this.#socket = socket;
    }
    add(item, cb, hint) {
      if (hint !== sendHints.blob) {
        if (!this.#running) {
          if (hint === sendHints.text) {
            const { 0: head, 1: body2 } = WebsocketFrameSend.createFastTextFrame(item);
            this.#socket.cork();
            this.#socket.write(head);
            this.#socket.write(body2, cb);
            this.#socket.uncork();
          } else {
            this.#socket.write(createFrame(item, hint), cb);
          }
        } else {
          const node2 = {
            promise: null,
            callback: cb,
            frame: createFrame(item, hint)
          };
          this.#queue.push(node2);
        }
        return;
      }
      const node = {
        promise: item.arrayBuffer().then((ab) => {
          node.promise = null;
          node.frame = createFrame(ab, hint);
        }),
        callback: cb,
        frame: null
      };
      this.#queue.push(node);
      if (!this.#running) {
        this.#run();
      }
    }
    async #run() {
      this.#running = true;
      const queue = this.#queue;
      while (!queue.isEmpty()) {
        const node = queue.shift();
        if (node.promise !== null) {
          await node.promise;
        }
        this.#socket.write(node.frame, node.callback);
        node.callback = node.frame = null;
      }
      this.#running = false;
    }
  }
  function createFrame(data, hint) {
    return new WebsocketFrameSend(toBuffer(data, hint)).createFrame(hint === sendHints.text ? opcodes.TEXT : opcodes.BINARY);
  }
  function toBuffer(data, hint) {
    switch (hint) {
      case sendHints.text:
      case sendHints.typedArray:
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      case sendHints.arrayBuffer:
      case sendHints.blob:
        return new Uint8Array(data);
    }
  }
  sender = { SendQueue };
  return sender;
}
var websocket;
var hasRequiredWebsocket;
function requireWebsocket() {
  if (hasRequiredWebsocket) return websocket;
  hasRequiredWebsocket = 1;
  const { isArrayBuffer } = require$$8;
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { URLSerializer } = /* @__PURE__ */ requireDataUrl();
  const { environmentSettingsObject } = /* @__PURE__ */ requireUtil$4();
  const { staticPropertyDescriptors, states, sentCloseFrameState, sendHints, opcodes } = /* @__PURE__ */ requireConstants();
  const {
    isConnecting,
    isEstablished,
    isClosing,
    isClosed,
    isValidSubprotocol,
    fireEvent,
    utf8Decode,
    toArrayBuffer,
    getURLRecord
  } = /* @__PURE__ */ requireUtil$1();
  const { establishWebSocketConnection, closeWebSocketConnection, failWebsocketConnection } = /* @__PURE__ */ requireConnection();
  const { ByteParser } = /* @__PURE__ */ requireReceiver();
  const { kEnumerableProperty } = /* @__PURE__ */ requireUtil$5();
  const { getGlobalDispatcher } = /* @__PURE__ */ requireGlobal();
  const { ErrorEvent, CloseEvent, createFastMessageEvent } = /* @__PURE__ */ requireEvents();
  const { SendQueue } = /* @__PURE__ */ requireSender();
  const { WebsocketFrameSend } = /* @__PURE__ */ requireFrame();
  const { channels } = /* @__PURE__ */ requireDiagnostics();
  class WebSocket extends EventTarget {
    #events = {
      open: null,
      error: null,
      close: null,
      message: null
    };
    #bufferedAmount = 0;
    #protocol = "";
    #extensions = "";
    /** @type {SendQueue} */
    #sendQueue;
    /** @type {Handler} */
    #handler = {
      onConnectionEstablished: (response2, extensions) => this.#onConnectionEstablished(response2, extensions),
      onMessage: (opcode, data) => this.#onMessage(opcode, data),
      onParserError: (err) => failWebsocketConnection(this.#handler, null, err.message),
      onParserDrain: () => this.#onParserDrain(),
      onSocketData: (chunk) => {
        if (!this.#parser.write(chunk)) {
          this.#handler.socket.pause();
        }
      },
      onSocketError: (err) => {
        this.#handler.readyState = states.CLOSING;
        if (channels.socketError.hasSubscribers) {
          channels.socketError.publish(err);
        }
        this.#handler.socket.destroy();
      },
      onSocketClose: () => this.#onSocketClose(),
      onPing: (body2) => {
        if (channels.ping.hasSubscribers) {
          channels.ping.publish({
            payload: body2,
            websocket: this
          });
        }
      },
      onPong: (body2) => {
        if (channels.pong.hasSubscribers) {
          channels.pong.publish({
            payload: body2,
            websocket: this
          });
        }
      },
      readyState: states.CONNECTING,
      socket: null,
      closeState: /* @__PURE__ */ new Set(),
      controller: null,
      wasEverConnected: false
    };
    #url;
    #binaryType;
    /** @type {import('./receiver').ByteParser} */
    #parser;
    /**
     * @param {string} url
     * @param {string|string[]} protocols
     */
    constructor(url, protocols = []) {
      super();
      webidl.util.markAsUncloneable(this);
      const prefix = "WebSocket constructor";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      const options = webidl.converters["DOMString or sequence<DOMString> or WebSocketInit"](protocols, prefix, "options");
      url = webidl.converters.USVString(url);
      protocols = options.protocols;
      const baseURL = environmentSettingsObject.settingsObject.baseUrl;
      const urlRecord = getURLRecord(url, baseURL);
      if (typeof protocols === "string") {
        protocols = [protocols];
      }
      if (protocols.length !== new Set(protocols.map((p) => p.toLowerCase())).size) {
        throw new DOMException("Invalid Sec-WebSocket-Protocol value", "SyntaxError");
      }
      if (protocols.length > 0 && !protocols.every((p) => isValidSubprotocol(p))) {
        throw new DOMException("Invalid Sec-WebSocket-Protocol value", "SyntaxError");
      }
      this.#url = new URL(urlRecord.href);
      const client2 = environmentSettingsObject.settingsObject;
      this.#handler.controller = establishWebSocketConnection(
        urlRecord,
        protocols,
        client2,
        this.#handler,
        options
      );
      this.#handler.readyState = WebSocket.CONNECTING;
      this.#binaryType = "blob";
    }
    /**
     * @see https://websockets.spec.whatwg.org/#dom-websocket-close
     * @param {number|undefined} code
     * @param {string|undefined} reason
     */
    close(code = void 0, reason = void 0) {
      webidl.brandCheck(this, WebSocket);
      const prefix = "WebSocket.close";
      if (code !== void 0) {
        code = webidl.converters["unsigned short"](code, prefix, "code", webidl.attributes.Clamp);
      }
      if (reason !== void 0) {
        reason = webidl.converters.USVString(reason);
      }
      code ??= null;
      reason ??= "";
      closeWebSocketConnection(this.#handler, code, reason, true);
    }
    /**
     * @see https://websockets.spec.whatwg.org/#dom-websocket-send
     * @param {NodeJS.TypedArray|ArrayBuffer|Blob|string} data
     */
    send(data) {
      webidl.brandCheck(this, WebSocket);
      const prefix = "WebSocket.send";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      data = webidl.converters.WebSocketSendData(data, prefix, "data");
      if (isConnecting(this.#handler.readyState)) {
        throw new DOMException("Sent before connected.", "InvalidStateError");
      }
      if (!isEstablished(this.#handler.readyState) || isClosing(this.#handler.readyState)) {
        return;
      }
      if (typeof data === "string") {
        const buffer = Buffer.from(data);
        this.#bufferedAmount += buffer.byteLength;
        this.#sendQueue.add(buffer, () => {
          this.#bufferedAmount -= buffer.byteLength;
        }, sendHints.text);
      } else if (isArrayBuffer(data)) {
        this.#bufferedAmount += data.byteLength;
        this.#sendQueue.add(data, () => {
          this.#bufferedAmount -= data.byteLength;
        }, sendHints.arrayBuffer);
      } else if (ArrayBuffer.isView(data)) {
        this.#bufferedAmount += data.byteLength;
        this.#sendQueue.add(data, () => {
          this.#bufferedAmount -= data.byteLength;
        }, sendHints.typedArray);
      } else if (webidl.is.Blob(data)) {
        this.#bufferedAmount += data.size;
        this.#sendQueue.add(data, () => {
          this.#bufferedAmount -= data.size;
        }, sendHints.blob);
      }
    }
    get readyState() {
      webidl.brandCheck(this, WebSocket);
      return this.#handler.readyState;
    }
    get bufferedAmount() {
      webidl.brandCheck(this, WebSocket);
      return this.#bufferedAmount;
    }
    get url() {
      webidl.brandCheck(this, WebSocket);
      return URLSerializer(this.#url);
    }
    get extensions() {
      webidl.brandCheck(this, WebSocket);
      return this.#extensions;
    }
    get protocol() {
      webidl.brandCheck(this, WebSocket);
      return this.#protocol;
    }
    get onopen() {
      webidl.brandCheck(this, WebSocket);
      return this.#events.open;
    }
    set onopen(fn) {
      webidl.brandCheck(this, WebSocket);
      if (this.#events.open) {
        this.removeEventListener("open", this.#events.open);
      }
      const listener = webidl.converters.EventHandlerNonNull(fn);
      if (listener !== null) {
        this.addEventListener("open", listener);
        this.#events.open = fn;
      } else {
        this.#events.open = null;
      }
    }
    get onerror() {
      webidl.brandCheck(this, WebSocket);
      return this.#events.error;
    }
    set onerror(fn) {
      webidl.brandCheck(this, WebSocket);
      if (this.#events.error) {
        this.removeEventListener("error", this.#events.error);
      }
      const listener = webidl.converters.EventHandlerNonNull(fn);
      if (listener !== null) {
        this.addEventListener("error", listener);
        this.#events.error = fn;
      } else {
        this.#events.error = null;
      }
    }
    get onclose() {
      webidl.brandCheck(this, WebSocket);
      return this.#events.close;
    }
    set onclose(fn) {
      webidl.brandCheck(this, WebSocket);
      if (this.#events.close) {
        this.removeEventListener("close", this.#events.close);
      }
      const listener = webidl.converters.EventHandlerNonNull(fn);
      if (listener !== null) {
        this.addEventListener("close", listener);
        this.#events.close = fn;
      } else {
        this.#events.close = null;
      }
    }
    get onmessage() {
      webidl.brandCheck(this, WebSocket);
      return this.#events.message;
    }
    set onmessage(fn) {
      webidl.brandCheck(this, WebSocket);
      if (this.#events.message) {
        this.removeEventListener("message", this.#events.message);
      }
      const listener = webidl.converters.EventHandlerNonNull(fn);
      if (listener !== null) {
        this.addEventListener("message", listener);
        this.#events.message = fn;
      } else {
        this.#events.message = null;
      }
    }
    get binaryType() {
      webidl.brandCheck(this, WebSocket);
      return this.#binaryType;
    }
    set binaryType(type) {
      webidl.brandCheck(this, WebSocket);
      if (type !== "blob" && type !== "arraybuffer") {
        this.#binaryType = "blob";
      } else {
        this.#binaryType = type;
      }
    }
    /**
     * @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
     */
    #onConnectionEstablished(response2, parsedExtensions) {
      this.#handler.socket = response2.socket;
      const parser = new ByteParser(this.#handler, parsedExtensions);
      parser.on("drain", () => this.#handler.onParserDrain());
      parser.on("error", (err) => this.#handler.onParserError(err));
      this.#parser = parser;
      this.#sendQueue = new SendQueue(response2.socket);
      this.#handler.readyState = states.OPEN;
      const extensions = response2.headersList.get("sec-websocket-extensions");
      if (extensions !== null) {
        this.#extensions = extensions;
      }
      const protocol = response2.headersList.get("sec-websocket-protocol");
      if (protocol !== null) {
        this.#protocol = protocol;
      }
      fireEvent("open", this);
      if (channels.open.hasSubscribers) {
        const headers2 = response2.headersList.entries;
        channels.open.publish({
          address: response2.socket.address(),
          protocol: this.#protocol,
          extensions: this.#extensions,
          websocket: this,
          handshakeResponse: {
            status: response2.status,
            statusText: response2.statusText,
            headers: headers2
          }
        });
      }
    }
    #onMessage(type, data) {
      if (this.#handler.readyState !== states.OPEN) {
        return;
      }
      let dataForEvent;
      if (type === opcodes.TEXT) {
        try {
          dataForEvent = utf8Decode(data);
        } catch {
          failWebsocketConnection(this.#handler, 1007, "Received invalid UTF-8 in text frame.");
          return;
        }
      } else if (type === opcodes.BINARY) {
        if (this.#binaryType === "blob") {
          dataForEvent = new Blob([data]);
        } else {
          dataForEvent = toArrayBuffer(data);
        }
      }
      fireEvent("message", this, createFastMessageEvent, {
        origin: this.#url.origin,
        data: dataForEvent
      });
    }
    #onParserDrain() {
      this.#handler.socket.resume();
    }
    /**
     * @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
     * @see https://datatracker.ietf.org/doc/html/rfc6455#section-7.1.4
     */
    #onSocketClose() {
      const wasClean = this.#handler.closeState.has(sentCloseFrameState.SENT) && this.#handler.closeState.has(sentCloseFrameState.RECEIVED);
      let code = 1005;
      let reason = "";
      const result = this.#parser?.closingInfo;
      if (result && !result.error) {
        code = result.code ?? 1005;
        reason = result.reason;
      }
      this.#handler.readyState = states.CLOSED;
      if (!this.#handler.closeState.has(sentCloseFrameState.RECEIVED)) {
        code = 1006;
        fireEvent("error", this, (type, init) => new ErrorEvent(type, init), {
          error: new TypeError(reason)
        });
      }
      fireEvent("close", this, (type, init) => new CloseEvent(type, init), {
        wasClean,
        code,
        reason
      });
      if (channels.close.hasSubscribers) {
        channels.close.publish({
          websocket: this,
          code,
          reason
        });
      }
    }
    /**
     * @param {WebSocket} ws
     * @param {Buffer|undefined} buffer
     */
    static ping(ws, buffer) {
      if (Buffer.isBuffer(buffer)) {
        if (buffer.length > 125) {
          throw new TypeError("A PING frame cannot have a body larger than 125 bytes.");
        }
      } else if (buffer !== void 0) {
        throw new TypeError("Expected buffer payload");
      }
      const readyState = ws.#handler.readyState;
      if (isEstablished(readyState) && !isClosing(readyState) && !isClosed(readyState)) {
        const frame2 = new WebsocketFrameSend(buffer);
        ws.#handler.socket.write(frame2.createFrame(opcodes.PING));
      }
    }
  }
  const { ping } = WebSocket;
  Reflect.deleteProperty(WebSocket, "ping");
  WebSocket.CONNECTING = WebSocket.prototype.CONNECTING = states.CONNECTING;
  WebSocket.OPEN = WebSocket.prototype.OPEN = states.OPEN;
  WebSocket.CLOSING = WebSocket.prototype.CLOSING = states.CLOSING;
  WebSocket.CLOSED = WebSocket.prototype.CLOSED = states.CLOSED;
  Object.defineProperties(WebSocket.prototype, {
    CONNECTING: staticPropertyDescriptors,
    OPEN: staticPropertyDescriptors,
    CLOSING: staticPropertyDescriptors,
    CLOSED: staticPropertyDescriptors,
    url: kEnumerableProperty,
    readyState: kEnumerableProperty,
    bufferedAmount: kEnumerableProperty,
    onopen: kEnumerableProperty,
    onerror: kEnumerableProperty,
    onclose: kEnumerableProperty,
    close: kEnumerableProperty,
    onmessage: kEnumerableProperty,
    binaryType: kEnumerableProperty,
    send: kEnumerableProperty,
    extensions: kEnumerableProperty,
    protocol: kEnumerableProperty,
    [Symbol.toStringTag]: {
      value: "WebSocket",
      writable: false,
      enumerable: false,
      configurable: true
    }
  });
  Object.defineProperties(WebSocket, {
    CONNECTING: staticPropertyDescriptors,
    OPEN: staticPropertyDescriptors,
    CLOSING: staticPropertyDescriptors,
    CLOSED: staticPropertyDescriptors
  });
  webidl.converters["sequence<DOMString>"] = webidl.sequenceConverter(
    webidl.converters.DOMString
  );
  webidl.converters["DOMString or sequence<DOMString>"] = function(V, prefix, argument) {
    if (webidl.util.Type(V) === webidl.util.Types.OBJECT && Symbol.iterator in V) {
      return webidl.converters["sequence<DOMString>"](V);
    }
    return webidl.converters.DOMString(V, prefix, argument);
  };
  webidl.converters.WebSocketInit = webidl.dictionaryConverter([
    {
      key: "protocols",
      converter: webidl.converters["DOMString or sequence<DOMString>"],
      defaultValue: () => []
    },
    {
      key: "dispatcher",
      converter: webidl.converters.any,
      defaultValue: () => getGlobalDispatcher()
    },
    {
      key: "headers",
      converter: webidl.nullableConverter(webidl.converters.HeadersInit)
    }
  ]);
  webidl.converters["DOMString or sequence<DOMString> or WebSocketInit"] = function(V) {
    if (webidl.util.Type(V) === webidl.util.Types.OBJECT && !(Symbol.iterator in V)) {
      return webidl.converters.WebSocketInit(V);
    }
    return { protocols: webidl.converters["DOMString or sequence<DOMString>"](V) };
  };
  webidl.converters.WebSocketSendData = function(V) {
    if (webidl.util.Type(V) === webidl.util.Types.OBJECT) {
      if (webidl.is.Blob(V)) {
        return V;
      }
      if (webidl.is.BufferSource(V)) {
        return V;
      }
    }
    return webidl.converters.USVString(V);
  };
  websocket = {
    WebSocket,
    ping
  };
  return websocket;
}
var websocketerror;
var hasRequiredWebsocketerror;
function requireWebsocketerror() {
  if (hasRequiredWebsocketerror) return websocketerror;
  hasRequiredWebsocketerror = 1;
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { validateCloseCodeAndReason } = /* @__PURE__ */ requireUtil$1();
  const { kConstruct } = /* @__PURE__ */ requireSymbols();
  const { kEnumerableProperty } = /* @__PURE__ */ requireUtil$5();
  function createInheritableDOMException() {
    class Test extends DOMException {
      get reason() {
        return "";
      }
    }
    if (new Test().reason !== void 0) {
      return DOMException;
    }
    return new Proxy(DOMException, {
      construct(target, args, newTarget) {
        const instance = Reflect.construct(target, args, target);
        Object.setPrototypeOf(instance, newTarget.prototype);
        return instance;
      }
    });
  }
  class WebSocketError extends createInheritableDOMException() {
    #closeCode;
    #reason;
    constructor(message = "", init = void 0) {
      message = webidl.converters.DOMString(message, "WebSocketError", "message");
      super(message, "WebSocketError");
      if (init === kConstruct) {
        return;
      } else if (init !== null) {
        init = webidl.converters.WebSocketCloseInfo(init);
      }
      let code = init.closeCode ?? null;
      const reason = init.reason ?? "";
      validateCloseCodeAndReason(code, reason);
      if (reason.length !== 0 && code === null) {
        code = 1e3;
      }
      this.#closeCode = code;
      this.#reason = reason;
    }
    get closeCode() {
      return this.#closeCode;
    }
    get reason() {
      return this.#reason;
    }
    /**
     * @param {string} message
     * @param {number|null} code
     * @param {string} reason
     */
    static createUnvalidatedWebSocketError(message, code, reason) {
      const error = new WebSocketError(message, kConstruct);
      error.#closeCode = code;
      error.#reason = reason;
      return error;
    }
  }
  const { createUnvalidatedWebSocketError } = WebSocketError;
  delete WebSocketError.createUnvalidatedWebSocketError;
  Object.defineProperties(WebSocketError.prototype, {
    closeCode: kEnumerableProperty,
    reason: kEnumerableProperty,
    [Symbol.toStringTag]: {
      value: "WebSocketError",
      writable: false,
      enumerable: false,
      configurable: true
    }
  });
  webidl.is.WebSocketError = webidl.util.MakeTypeAssertion(WebSocketError);
  websocketerror = { WebSocketError, createUnvalidatedWebSocketError };
  return websocketerror;
}
var websocketstream;
var hasRequiredWebsocketstream;
function requireWebsocketstream() {
  if (hasRequiredWebsocketstream) return websocketstream;
  hasRequiredWebsocketstream = 1;
  const { createDeferredPromise } = /* @__PURE__ */ requirePromise();
  const { environmentSettingsObject } = /* @__PURE__ */ requireUtil$4();
  const { states, opcodes, sentCloseFrameState } = /* @__PURE__ */ requireConstants();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { getURLRecord, isValidSubprotocol, isEstablished, utf8Decode } = /* @__PURE__ */ requireUtil$1();
  const { establishWebSocketConnection, failWebsocketConnection, closeWebSocketConnection } = /* @__PURE__ */ requireConnection();
  const { channels } = /* @__PURE__ */ requireDiagnostics();
  const { WebsocketFrameSend } = /* @__PURE__ */ requireFrame();
  const { ByteParser } = /* @__PURE__ */ requireReceiver();
  const { WebSocketError, createUnvalidatedWebSocketError } = /* @__PURE__ */ requireWebsocketerror();
  const { kEnumerableProperty } = /* @__PURE__ */ requireUtil$5();
  const { utf8DecodeBytes } = /* @__PURE__ */ requireEncoding();
  let emittedExperimentalWarning = false;
  class WebSocketStream {
    // Each WebSocketStream object has an associated url , which is a URL record .
    /** @type {URL} */
    #url;
    // Each WebSocketStream object has an associated opened promise , which is a promise.
    /** @type {import('../../../util/promise').DeferredPromise} */
    #openedPromise;
    // Each WebSocketStream object has an associated closed promise , which is a promise.
    /** @type {import('../../../util/promise').DeferredPromise} */
    #closedPromise;
    // Each WebSocketStream object has an associated readable stream , which is a ReadableStream .
    /** @type {ReadableStream} */
    #readableStream;
    /** @type {ReadableStreamDefaultController} */
    #readableStreamController;
    // Each WebSocketStream object has an associated writable stream , which is a WritableStream .
    /** @type {WritableStream} */
    #writableStream;
    // Each WebSocketStream object has an associated boolean handshake aborted , which is initially false.
    #handshakeAborted = false;
    /** @type {import('../websocket').Handler} */
    #handler = {
      // https://whatpr.org/websockets/48/7b748d3...d5570f3.html#feedback-to-websocket-stream-from-the-protocol
      onConnectionEstablished: (response2, extensions) => this.#onConnectionEstablished(response2, extensions),
      onMessage: (opcode, data) => this.#onMessage(opcode, data),
      onParserError: (err) => failWebsocketConnection(this.#handler, null, err.message),
      onParserDrain: () => this.#handler.socket.resume(),
      onSocketData: (chunk) => {
        if (!this.#parser.write(chunk)) {
          this.#handler.socket.pause();
        }
      },
      onSocketError: (err) => {
        this.#handler.readyState = states.CLOSING;
        if (channels.socketError.hasSubscribers) {
          channels.socketError.publish(err);
        }
        this.#handler.socket.destroy();
      },
      onSocketClose: () => this.#onSocketClose(),
      onPing: () => {
      },
      onPong: () => {
      },
      readyState: states.CONNECTING,
      socket: null,
      closeState: /* @__PURE__ */ new Set(),
      controller: null,
      wasEverConnected: false
    };
    /** @type {import('../receiver').ByteParser} */
    #parser;
    constructor(url, options = void 0) {
      if (!emittedExperimentalWarning) {
        process.emitWarning("WebSocketStream is experimental! Expect it to change at any time.", {
          code: "UNDICI-WSS"
        });
        emittedExperimentalWarning = true;
      }
      webidl.argumentLengthCheck(arguments, 1, "WebSocket");
      url = webidl.converters.USVString(url);
      if (options !== null) {
        options = webidl.converters.WebSocketStreamOptions(options);
      }
      const baseURL = environmentSettingsObject.settingsObject.baseUrl;
      const urlRecord = getURLRecord(url, baseURL);
      const protocols = options.protocols;
      if (protocols.length !== new Set(protocols.map((p) => p.toLowerCase())).size) {
        throw new DOMException("Invalid Sec-WebSocket-Protocol value", "SyntaxError");
      }
      if (protocols.length > 0 && !protocols.every((p) => isValidSubprotocol(p))) {
        throw new DOMException("Invalid Sec-WebSocket-Protocol value", "SyntaxError");
      }
      this.#url = urlRecord.toString();
      this.#openedPromise = createDeferredPromise();
      this.#closedPromise = createDeferredPromise();
      if (options.signal != null) {
        const signal = options.signal;
        if (signal.aborted) {
          this.#openedPromise.reject(signal.reason);
          this.#closedPromise.reject(signal.reason);
          return;
        }
        signal.addEventListener("abort", () => {
          if (!isEstablished(this.#handler.readyState)) {
            failWebsocketConnection(this.#handler);
            this.#handler.readyState = states.CLOSING;
            this.#openedPromise.reject(signal.reason);
            this.#closedPromise.reject(signal.reason);
            this.#handshakeAborted = true;
          }
        }, { once: true });
      }
      const client2 = environmentSettingsObject.settingsObject;
      this.#handler.controller = establishWebSocketConnection(
        urlRecord,
        protocols,
        client2,
        this.#handler,
        options
      );
    }
    // The url getter steps are to return this 's url , serialized .
    get url() {
      return this.#url.toString();
    }
    // The opened getter steps are to return this 's opened promise .
    get opened() {
      return this.#openedPromise.promise;
    }
    // The closed getter steps are to return this 's closed promise .
    get closed() {
      return this.#closedPromise.promise;
    }
    // The close( closeInfo ) method steps are:
    close(closeInfo = void 0) {
      if (closeInfo !== null) {
        closeInfo = webidl.converters.WebSocketCloseInfo(closeInfo);
      }
      const code = closeInfo.closeCode ?? null;
      const reason = closeInfo.reason;
      closeWebSocketConnection(this.#handler, code, reason, true);
    }
    #write(chunk) {
      chunk = webidl.converters.WebSocketStreamWrite(chunk);
      const promise2 = createDeferredPromise();
      let data = null;
      let opcode = null;
      if (webidl.is.BufferSource(chunk)) {
        data = new Uint8Array(ArrayBuffer.isView(chunk) ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength) : chunk.slice());
        opcode = opcodes.BINARY;
      } else {
        let string;
        try {
          string = webidl.converters.DOMString(chunk);
        } catch (e) {
          promise2.reject(e);
          return promise2.promise;
        }
        data = new TextEncoder().encode(string);
        opcode = opcodes.TEXT;
      }
      if (!this.#handler.closeState.has(sentCloseFrameState.SENT) && !this.#handler.closeState.has(sentCloseFrameState.RECEIVED)) {
        const frame2 = new WebsocketFrameSend(data);
        this.#handler.socket.write(frame2.createFrame(opcode), () => {
          promise2.resolve(void 0);
        });
      }
      return promise2.promise;
    }
    /** @type {import('../websocket').Handler['onConnectionEstablished']} */
    #onConnectionEstablished(response2, parsedExtensions) {
      this.#handler.socket = response2.socket;
      const parser = new ByteParser(this.#handler, parsedExtensions);
      parser.on("drain", () => this.#handler.onParserDrain());
      parser.on("error", (err) => this.#handler.onParserError(err));
      this.#parser = parser;
      this.#handler.readyState = states.OPEN;
      const extensions = parsedExtensions ?? "";
      const protocol = response2.headersList.get("sec-websocket-protocol") ?? "";
      const readable2 = new ReadableStream({
        start: (controller) => {
          this.#readableStreamController = controller;
        },
        pull(controller) {
          let chunk;
          while (controller.desiredSize > 0 && (chunk = response2.socket.read()) !== null) {
            controller.enqueue(chunk);
          }
        },
        cancel: (reason) => this.#cancel(reason)
      });
      const writable = new WritableStream({
        write: (chunk) => this.#write(chunk),
        close: () => closeWebSocketConnection(this.#handler, null, null),
        abort: (reason) => this.#closeUsingReason(reason)
      });
      this.#readableStream = readable2;
      this.#writableStream = writable;
      this.#openedPromise.resolve({
        extensions,
        protocol,
        readable: readable2,
        writable
      });
    }
    /** @type {import('../websocket').Handler['onMessage']} */
    #onMessage(type, data) {
      if (this.#handler.readyState !== states.OPEN) {
        return;
      }
      let chunk;
      if (type === opcodes.TEXT) {
        try {
          chunk = utf8Decode(data);
        } catch {
          failWebsocketConnection(this.#handler, "Received invalid UTF-8 in text frame.");
          return;
        }
      } else if (type === opcodes.BINARY) {
        chunk = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      }
      this.#readableStreamController.enqueue(chunk);
    }
    /** @type {import('../websocket').Handler['onSocketClose']} */
    #onSocketClose() {
      const wasClean = this.#handler.closeState.has(sentCloseFrameState.SENT) && this.#handler.closeState.has(sentCloseFrameState.RECEIVED);
      this.#handler.readyState = states.CLOSED;
      if (this.#handshakeAborted) {
        return;
      }
      if (!this.#handler.wasEverConnected) {
        this.#openedPromise.reject(new WebSocketError("Socket never opened"));
      }
      const result = this.#parser.closingInfo;
      let code = result?.code ?? 1005;
      if (!this.#handler.closeState.has(sentCloseFrameState.SENT) && !this.#handler.closeState.has(sentCloseFrameState.RECEIVED)) {
        code = 1006;
      }
      const reason = result?.reason == null ? "" : utf8DecodeBytes(Buffer.from(result.reason));
      if (wasClean) {
        this.#readableStreamController.close();
        if (!this.#writableStream.locked) {
          this.#writableStream.abort(new DOMException("A closed WebSocketStream cannot be written to", "InvalidStateError"));
        }
        this.#closedPromise.resolve({
          closeCode: code,
          reason
        });
      } else {
        const error = createUnvalidatedWebSocketError("unclean close", code, reason);
        this.#readableStreamController.error(error);
        this.#writableStream.abort(error);
        this.#closedPromise.reject(error);
      }
    }
    #closeUsingReason(reason) {
      let code = null;
      let reasonString = "";
      if (webidl.is.WebSocketError(reason)) {
        code = reason.closeCode;
        reasonString = reason.reason;
      }
      closeWebSocketConnection(this.#handler, code, reasonString);
    }
    //  To cancel a WebSocketStream stream given reason , close using reason giving stream and reason .
    #cancel(reason) {
      this.#closeUsingReason(reason);
    }
  }
  Object.defineProperties(WebSocketStream.prototype, {
    url: kEnumerableProperty,
    opened: kEnumerableProperty,
    closed: kEnumerableProperty,
    close: kEnumerableProperty,
    [Symbol.toStringTag]: {
      value: "WebSocketStream",
      writable: false,
      enumerable: false,
      configurable: true
    }
  });
  webidl.converters.WebSocketStreamOptions = webidl.dictionaryConverter([
    {
      key: "protocols",
      converter: webidl.sequenceConverter(webidl.converters.USVString),
      defaultValue: () => []
    },
    {
      key: "signal",
      converter: webidl.nullableConverter(webidl.converters.AbortSignal),
      defaultValue: () => null
    }
  ]);
  webidl.converters.WebSocketCloseInfo = webidl.dictionaryConverter([
    {
      key: "closeCode",
      converter: (V) => webidl.converters["unsigned short"](V, webidl.attributes.EnforceRange)
    },
    {
      key: "reason",
      converter: webidl.converters.USVString,
      defaultValue: () => ""
    }
  ]);
  webidl.converters.WebSocketStreamWrite = function(V) {
    if (typeof V === "string") {
      return webidl.converters.USVString(V);
    }
    return webidl.converters.BufferSource(V);
  };
  websocketstream = { WebSocketStream };
  return websocketstream;
}
var util;
var hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util;
  hasRequiredUtil = 1;
  function isValidLastEventId(value) {
    return value.indexOf("\0") === -1;
  }
  function isASCIINumber(value) {
    if (value.length === 0) return false;
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) < 48 || value.charCodeAt(i) > 57) return false;
    }
    return true;
  }
  util = {
    isValidLastEventId,
    isASCIINumber
  };
  return util;
}
var eventsourceStream;
var hasRequiredEventsourceStream;
function requireEventsourceStream() {
  if (hasRequiredEventsourceStream) return eventsourceStream;
  hasRequiredEventsourceStream = 1;
  const { Transform } = require$$0;
  const { isASCIINumber, isValidLastEventId } = /* @__PURE__ */ requireUtil();
  const BOM = [239, 187, 191];
  const LF = 10;
  const CR = 13;
  const COLON = 58;
  const SPACE = 32;
  class EventSourceStream extends Transform {
    /**
     * @type {eventSourceSettings}
     */
    state;
    /**
     * Leading byte-order-mark check.
     * @type {boolean}
     */
    checkBOM = true;
    /**
     * @type {boolean}
     */
    crlfCheck = false;
    /**
     * @type {boolean}
     */
    eventEndCheck = false;
    /**
     * @type {Buffer|null}
     */
    buffer = null;
    pos = 0;
    event = {
      data: void 0,
      event: void 0,
      id: void 0,
      retry: void 0
    };
    /**
     * @param {object} options
     * @param {boolean} [options.readableObjectMode]
     * @param {eventSourceSettings} [options.eventSourceSettings]
     * @param {(chunk: any, encoding?: BufferEncoding | undefined) => boolean} [options.push]
     */
    constructor(options = {}) {
      options.readableObjectMode = true;
      super(options);
      this.state = options.eventSourceSettings || {};
      if (options.push) {
        this.push = options.push;
      }
    }
    /**
     * @param {Buffer} chunk
     * @param {string} _encoding
     * @param {Function} callback
     * @returns {void}
     */
    _transform(chunk, _encoding, callback) {
      if (chunk.length === 0) {
        callback();
        return;
      }
      if (this.buffer) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
      } else {
        this.buffer = chunk;
      }
      if (this.checkBOM) {
        switch (this.buffer.length) {
          case 1:
            if (this.buffer[0] === BOM[0]) {
              callback();
              return;
            }
            this.checkBOM = false;
            callback();
            return;
          case 2:
            if (this.buffer[0] === BOM[0] && this.buffer[1] === BOM[1]) {
              callback();
              return;
            }
            this.checkBOM = false;
            break;
          case 3:
            if (this.buffer[0] === BOM[0] && this.buffer[1] === BOM[1] && this.buffer[2] === BOM[2]) {
              this.buffer = Buffer.alloc(0);
              this.checkBOM = false;
              callback();
              return;
            }
            this.checkBOM = false;
            break;
          default:
            if (this.buffer[0] === BOM[0] && this.buffer[1] === BOM[1] && this.buffer[2] === BOM[2]) {
              this.buffer = this.buffer.subarray(3);
            }
            this.checkBOM = false;
            break;
        }
      }
      while (this.pos < this.buffer.length) {
        if (this.eventEndCheck) {
          if (this.crlfCheck) {
            if (this.buffer[this.pos] === LF) {
              this.buffer = this.buffer.subarray(this.pos + 1);
              this.pos = 0;
              this.crlfCheck = false;
              continue;
            }
            this.crlfCheck = false;
          }
          if (this.buffer[this.pos] === LF || this.buffer[this.pos] === CR) {
            if (this.buffer[this.pos] === CR) {
              this.crlfCheck = true;
            }
            this.buffer = this.buffer.subarray(this.pos + 1);
            this.pos = 0;
            if (this.event.data !== void 0 || this.event.event || this.event.id !== void 0 || this.event.retry) {
              this.processEvent(this.event);
            }
            this.clearEvent();
            continue;
          }
          this.eventEndCheck = false;
          continue;
        }
        if (this.buffer[this.pos] === LF || this.buffer[this.pos] === CR) {
          if (this.buffer[this.pos] === CR) {
            this.crlfCheck = true;
          }
          this.parseLine(this.buffer.subarray(0, this.pos), this.event);
          this.buffer = this.buffer.subarray(this.pos + 1);
          this.pos = 0;
          this.eventEndCheck = true;
          continue;
        }
        this.pos++;
      }
      callback();
    }
    /**
     * @param {Buffer} line
     * @param {EventSourceStreamEvent} event
     */
    parseLine(line, event) {
      if (line.length === 0) {
        return;
      }
      const colonPosition = line.indexOf(COLON);
      if (colonPosition === 0) {
        return;
      }
      let field = "";
      let value = "";
      if (colonPosition !== -1) {
        field = line.subarray(0, colonPosition).toString("utf8");
        let valueStart = colonPosition + 1;
        if (line[valueStart] === SPACE) {
          ++valueStart;
        }
        value = line.subarray(valueStart).toString("utf8");
      } else {
        field = line.toString("utf8");
        value = "";
      }
      switch (field) {
        case "data":
          if (event[field] === void 0) {
            event[field] = value;
          } else {
            event[field] += `
${value}`;
          }
          break;
        case "retry":
          if (isASCIINumber(value)) {
            event[field] = value;
          }
          break;
        case "id":
          if (isValidLastEventId(value)) {
            event[field] = value;
          }
          break;
        case "event":
          if (value.length > 0) {
            event[field] = value;
          }
          break;
      }
    }
    /**
     * @param {EventSourceStreamEvent} event
     */
    processEvent(event) {
      if (event.retry && isASCIINumber(event.retry)) {
        this.state.reconnectionTime = parseInt(event.retry, 10);
      }
      if (event.id !== void 0 && isValidLastEventId(event.id)) {
        this.state.lastEventId = event.id;
      }
      if (event.data !== void 0) {
        this.push({
          type: event.event || "message",
          options: {
            data: event.data,
            lastEventId: this.state.lastEventId,
            origin: this.state.origin
          }
        });
      }
    }
    clearEvent() {
      this.event = {
        data: void 0,
        event: void 0,
        id: void 0,
        retry: void 0
      };
    }
  }
  eventsourceStream = {
    EventSourceStream
  };
  return eventsourceStream;
}
var eventsource;
var hasRequiredEventsource;
function requireEventsource() {
  if (hasRequiredEventsource) return eventsource;
  hasRequiredEventsource = 1;
  const { pipeline } = require$$0;
  const { fetching } = /* @__PURE__ */ requireFetch();
  const { makeRequest } = /* @__PURE__ */ requireRequest();
  const { webidl } = /* @__PURE__ */ requireWebidl();
  const { EventSourceStream } = /* @__PURE__ */ requireEventsourceStream();
  const { parseMIMEType } = /* @__PURE__ */ requireDataUrl();
  const { createFastMessageEvent } = /* @__PURE__ */ requireEvents();
  const { isNetworkError } = /* @__PURE__ */ requireResponse();
  const { kEnumerableProperty } = /* @__PURE__ */ requireUtil$5();
  const { environmentSettingsObject } = /* @__PURE__ */ requireUtil$4();
  let experimentalWarned = false;
  const defaultReconnectionTime = 3e3;
  const CONNECTING = 0;
  const OPEN = 1;
  const CLOSED = 2;
  const ANONYMOUS = "anonymous";
  const USE_CREDENTIALS = "use-credentials";
  class EventSource extends EventTarget {
    #events = {
      open: null,
      error: null,
      message: null
    };
    #url;
    #withCredentials = false;
    /**
     * @type {ReadyState}
     */
    #readyState = CONNECTING;
    #request = null;
    #controller = null;
    #dispatcher;
    /**
     * @type {import('./eventsource-stream').eventSourceSettings}
     */
    #state;
    /**
     * Creates a new EventSource object.
     * @param {string} url
     * @param {EventSourceInit} [eventSourceInitDict={}]
     * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#the-eventsource-interface
     */
    constructor(url, eventSourceInitDict = {}) {
      super();
      webidl.util.markAsUncloneable(this);
      const prefix = "EventSource constructor";
      webidl.argumentLengthCheck(arguments, 1, prefix);
      if (!experimentalWarned) {
        experimentalWarned = true;
        process.emitWarning("EventSource is experimental, expect them to change at any time.", {
          code: "UNDICI-ES"
        });
      }
      url = webidl.converters.USVString(url);
      eventSourceInitDict = webidl.converters.EventSourceInitDict(eventSourceInitDict, prefix, "eventSourceInitDict");
      this.#dispatcher = eventSourceInitDict.node.dispatcher || eventSourceInitDict.dispatcher;
      this.#state = {
        lastEventId: "",
        reconnectionTime: eventSourceInitDict.node.reconnectionTime
      };
      const settings = environmentSettingsObject;
      let urlRecord;
      try {
        urlRecord = new URL(url, settings.settingsObject.baseUrl);
        this.#state.origin = urlRecord.origin;
      } catch (e) {
        throw new DOMException(e, "SyntaxError");
      }
      this.#url = urlRecord.href;
      let corsAttributeState = ANONYMOUS;
      if (eventSourceInitDict.withCredentials === true) {
        corsAttributeState = USE_CREDENTIALS;
        this.#withCredentials = true;
      }
      const initRequest = {
        redirect: "follow",
        keepalive: true,
        // @see https://html.spec.whatwg.org/multipage/urls-and-fetching.html#cors-settings-attributes
        mode: "cors",
        credentials: corsAttributeState === "anonymous" ? "same-origin" : "omit",
        referrer: "no-referrer"
      };
      initRequest.client = environmentSettingsObject.settingsObject;
      initRequest.headersList = [["accept", { name: "accept", value: "text/event-stream" }]];
      initRequest.cache = "no-store";
      initRequest.initiator = "other";
      initRequest.urlList = [new URL(this.#url)];
      this.#request = makeRequest(initRequest);
      this.#connect();
    }
    /**
     * Returns the state of this EventSource object's connection. It can have the
     * values described below.
     * @returns {ReadyState}
     * @readonly
     */
    get readyState() {
      return this.#readyState;
    }
    /**
     * Returns the URL providing the event stream.
     * @readonly
     * @returns {string}
     */
    get url() {
      return this.#url;
    }
    /**
     * Returns a boolean indicating whether the EventSource object was
     * instantiated with CORS credentials set (true), or not (false, the default).
     */
    get withCredentials() {
      return this.#withCredentials;
    }
    #connect() {
      if (this.#readyState === CLOSED) return;
      this.#readyState = CONNECTING;
      const fetchParams = {
        request: this.#request,
        dispatcher: this.#dispatcher
      };
      const processEventSourceEndOfBody = (response2) => {
        if (!isNetworkError(response2)) {
          return this.#reconnect();
        }
      };
      fetchParams.processResponseEndOfBody = processEventSourceEndOfBody;
      fetchParams.processResponse = (response2) => {
        if (isNetworkError(response2)) {
          if (response2.aborted) {
            this.close();
            this.dispatchEvent(new Event("error"));
            return;
          } else {
            this.#reconnect();
            return;
          }
        }
        const contentType = response2.headersList.get("content-type", true);
        const mimeType = contentType !== null ? parseMIMEType(contentType) : "failure";
        const contentTypeValid = mimeType !== "failure" && mimeType.essence === "text/event-stream";
        if (response2.status !== 200 || contentTypeValid === false) {
          this.close();
          this.dispatchEvent(new Event("error"));
          return;
        }
        this.#readyState = OPEN;
        this.dispatchEvent(new Event("open"));
        this.#state.origin = response2.urlList[response2.urlList.length - 1].origin;
        const eventSourceStream = new EventSourceStream({
          eventSourceSettings: this.#state,
          push: (event) => {
            this.dispatchEvent(createFastMessageEvent(
              event.type,
              event.options
            ));
          }
        });
        pipeline(
          response2.body.stream,
          eventSourceStream,
          (error) => {
            if (error?.aborted === false) {
              this.close();
              this.dispatchEvent(new Event("error"));
            }
          }
        );
      };
      this.#controller = fetching(fetchParams);
    }
    /**
     * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#sse-processing-model
     * @returns {void}
     */
    #reconnect() {
      if (this.#readyState === CLOSED) return;
      this.#readyState = CONNECTING;
      this.dispatchEvent(new Event("error"));
      setTimeout(() => {
        if (this.#readyState !== CONNECTING) return;
        if (this.#state.lastEventId.length) {
          this.#request.headersList.set("last-event-id", this.#state.lastEventId, true);
        }
        this.#connect();
      }, this.#state.reconnectionTime)?.unref();
    }
    /**
     * Closes the connection, if any, and sets the readyState attribute to
     * CLOSED.
     */
    close() {
      webidl.brandCheck(this, EventSource);
      if (this.#readyState === CLOSED) return;
      this.#readyState = CLOSED;
      this.#controller.abort();
      this.#request = null;
    }
    get onopen() {
      return this.#events.open;
    }
    set onopen(fn) {
      if (this.#events.open) {
        this.removeEventListener("open", this.#events.open);
      }
      const listener = webidl.converters.EventHandlerNonNull(fn);
      if (listener !== null) {
        this.addEventListener("open", listener);
        this.#events.open = fn;
      } else {
        this.#events.open = null;
      }
    }
    get onmessage() {
      return this.#events.message;
    }
    set onmessage(fn) {
      if (this.#events.message) {
        this.removeEventListener("message", this.#events.message);
      }
      const listener = webidl.converters.EventHandlerNonNull(fn);
      if (listener !== null) {
        this.addEventListener("message", listener);
        this.#events.message = fn;
      } else {
        this.#events.message = null;
      }
    }
    get onerror() {
      return this.#events.error;
    }
    set onerror(fn) {
      if (this.#events.error) {
        this.removeEventListener("error", this.#events.error);
      }
      const listener = webidl.converters.EventHandlerNonNull(fn);
      if (listener !== null) {
        this.addEventListener("error", listener);
        this.#events.error = fn;
      } else {
        this.#events.error = null;
      }
    }
  }
  const constantsPropertyDescriptors = {
    CONNECTING: {
      __proto__: null,
      configurable: false,
      enumerable: true,
      value: CONNECTING,
      writable: false
    },
    OPEN: {
      __proto__: null,
      configurable: false,
      enumerable: true,
      value: OPEN,
      writable: false
    },
    CLOSED: {
      __proto__: null,
      configurable: false,
      enumerable: true,
      value: CLOSED,
      writable: false
    }
  };
  Object.defineProperties(EventSource, constantsPropertyDescriptors);
  Object.defineProperties(EventSource.prototype, constantsPropertyDescriptors);
  Object.defineProperties(EventSource.prototype, {
    close: kEnumerableProperty,
    onerror: kEnumerableProperty,
    onmessage: kEnumerableProperty,
    onopen: kEnumerableProperty,
    readyState: kEnumerableProperty,
    url: kEnumerableProperty,
    withCredentials: kEnumerableProperty
  });
  webidl.converters.EventSourceInitDict = webidl.dictionaryConverter([
    {
      key: "withCredentials",
      converter: webidl.converters.boolean,
      defaultValue: () => false
    },
    {
      key: "dispatcher",
      // undici only
      converter: webidl.converters.any
    },
    {
      key: "node",
      // undici only
      converter: webidl.dictionaryConverter([
        {
          key: "reconnectionTime",
          converter: webidl.converters["unsigned long"],
          defaultValue: () => defaultReconnectionTime
        },
        {
          key: "dispatcher",
          converter: webidl.converters.any
        }
      ]),
      defaultValue: () => ({})
    }
  ]);
  eventsource = {
    EventSource,
    defaultReconnectionTime
  };
  return eventsource;
}
undici.exports;
var hasRequiredUndici;
function requireUndici() {
  if (hasRequiredUndici) return undici.exports;
  hasRequiredUndici = 1;
  (function(module) {
    const Client = /* @__PURE__ */ requireClient();
    const Dispatcher = /* @__PURE__ */ requireDispatcher();
    const Pool = /* @__PURE__ */ requirePool();
    const BalancedPool = /* @__PURE__ */ requireBalancedPool();
    const RoundRobinPool = /* @__PURE__ */ requireRoundRobinPool();
    const Agent = /* @__PURE__ */ requireAgent();
    const ProxyAgent = /* @__PURE__ */ requireProxyAgent();
    const EnvHttpProxyAgent = /* @__PURE__ */ requireEnvHttpProxyAgent();
    const RetryAgent = /* @__PURE__ */ requireRetryAgent();
    const H2CClient = /* @__PURE__ */ requireH2cClient();
    const errors2 = /* @__PURE__ */ requireErrors();
    const util2 = /* @__PURE__ */ requireUtil$5();
    const { InvalidArgumentError } = errors2;
    const api2 = /* @__PURE__ */ requireApi();
    const buildConnector = /* @__PURE__ */ requireConnect();
    const MockClient = /* @__PURE__ */ requireMockClient();
    const { MockCallHistory, MockCallHistoryLog } = /* @__PURE__ */ requireMockCallHistory();
    const MockAgent = /* @__PURE__ */ requireMockAgent();
    const MockPool = /* @__PURE__ */ requireMockPool();
    const SnapshotAgent = /* @__PURE__ */ requireSnapshotAgent();
    const mockErrors2 = /* @__PURE__ */ requireMockErrors();
    const RetryHandler = /* @__PURE__ */ requireRetryHandler();
    const { getGlobalDispatcher, setGlobalDispatcher } = /* @__PURE__ */ requireGlobal();
    const DecoratorHandler = /* @__PURE__ */ requireDecoratorHandler();
    const RedirectHandler = /* @__PURE__ */ requireRedirectHandler();
    Object.assign(Dispatcher.prototype, api2);
    module.exports.Dispatcher = Dispatcher;
    module.exports.Client = Client;
    module.exports.Pool = Pool;
    module.exports.BalancedPool = BalancedPool;
    module.exports.RoundRobinPool = RoundRobinPool;
    module.exports.Agent = Agent;
    module.exports.ProxyAgent = ProxyAgent;
    module.exports.EnvHttpProxyAgent = EnvHttpProxyAgent;
    module.exports.RetryAgent = RetryAgent;
    module.exports.H2CClient = H2CClient;
    module.exports.RetryHandler = RetryHandler;
    module.exports.DecoratorHandler = DecoratorHandler;
    module.exports.RedirectHandler = RedirectHandler;
    module.exports.interceptors = {
      redirect: /* @__PURE__ */ requireRedirect(),
      responseError: /* @__PURE__ */ requireResponseError(),
      retry: /* @__PURE__ */ requireRetry(),
      dump: /* @__PURE__ */ requireDump(),
      dns: /* @__PURE__ */ requireDns(),
      cache: /* @__PURE__ */ requireCache$1(),
      decompress: /* @__PURE__ */ requireDecompress(),
      deduplicate: /* @__PURE__ */ requireDeduplicate()
    };
    module.exports.cacheStores = {
      MemoryCacheStore: /* @__PURE__ */ requireMemoryCacheStore()
    };
    const SqliteCacheStore = /* @__PURE__ */ requireSqliteCacheStore();
    module.exports.cacheStores.SqliteCacheStore = SqliteCacheStore;
    module.exports.buildConnector = buildConnector;
    module.exports.errors = errors2;
    module.exports.util = {
      parseHeaders: util2.parseHeaders,
      headerNameToString: util2.headerNameToString
    };
    function makeDispatcher(fn) {
      return (url, opts, handler) => {
        if (typeof opts === "function") {
          handler = opts;
          opts = null;
        }
        if (!url || typeof url !== "string" && typeof url !== "object" && !(url instanceof URL)) {
          throw new InvalidArgumentError("invalid url");
        }
        if (opts != null && typeof opts !== "object") {
          throw new InvalidArgumentError("invalid opts");
        }
        if (opts && opts.path != null) {
          if (typeof opts.path !== "string") {
            throw new InvalidArgumentError("invalid opts.path");
          }
          let path = opts.path;
          if (!opts.path.startsWith("/")) {
            path = `/${path}`;
          }
          url = new URL(util2.parseOrigin(url).origin + path);
        } else {
          if (!opts) {
            opts = typeof url === "object" ? url : {};
          }
          url = util2.parseURL(url);
        }
        const { agent: agent2, dispatcher: dispatcher2 = getGlobalDispatcher() } = opts;
        if (agent2) {
          throw new InvalidArgumentError("unsupported opts.agent. Did you mean opts.client?");
        }
        return fn.call(dispatcher2, {
          ...opts,
          origin: url.origin,
          path: url.search ? `${url.pathname}${url.search}` : url.pathname,
          method: opts.method || (opts.body ? "PUT" : "GET")
        }, handler);
      };
    }
    module.exports.setGlobalDispatcher = setGlobalDispatcher;
    module.exports.getGlobalDispatcher = getGlobalDispatcher;
    const fetchImpl = requireFetch().fetch;
    module.exports.fetch = function fetch(init, options = void 0) {
      return fetchImpl(init, options).catch((err) => {
        if (err && typeof err === "object") {
          Error.captureStackTrace(err);
        }
        throw err;
      });
    };
    module.exports.Headers = requireHeaders().Headers;
    module.exports.Response = requireResponse().Response;
    module.exports.Request = requireRequest().Request;
    module.exports.FormData = requireFormdata().FormData;
    const { setGlobalOrigin, getGlobalOrigin } = /* @__PURE__ */ requireGlobal$1();
    module.exports.setGlobalOrigin = setGlobalOrigin;
    module.exports.getGlobalOrigin = getGlobalOrigin;
    const { CacheStorage } = /* @__PURE__ */ requireCachestorage();
    const { kConstruct } = /* @__PURE__ */ requireSymbols();
    module.exports.caches = new CacheStorage(kConstruct);
    const { deleteCookie, getCookies, getSetCookies, setCookie, parseCookie } = /* @__PURE__ */ requireCookies();
    module.exports.deleteCookie = deleteCookie;
    module.exports.getCookies = getCookies;
    module.exports.getSetCookies = getSetCookies;
    module.exports.setCookie = setCookie;
    module.exports.parseCookie = parseCookie;
    const { parseMIMEType, serializeAMimeType } = /* @__PURE__ */ requireDataUrl();
    module.exports.parseMIMEType = parseMIMEType;
    module.exports.serializeAMimeType = serializeAMimeType;
    const { CloseEvent, ErrorEvent, MessageEvent } = /* @__PURE__ */ requireEvents();
    const { WebSocket, ping } = /* @__PURE__ */ requireWebsocket();
    module.exports.WebSocket = WebSocket;
    module.exports.CloseEvent = CloseEvent;
    module.exports.ErrorEvent = ErrorEvent;
    module.exports.MessageEvent = MessageEvent;
    module.exports.ping = ping;
    module.exports.WebSocketStream = requireWebsocketstream().WebSocketStream;
    module.exports.WebSocketError = requireWebsocketerror().WebSocketError;
    module.exports.request = makeDispatcher(api2.request);
    module.exports.stream = makeDispatcher(api2.stream);
    module.exports.pipeline = makeDispatcher(api2.pipeline);
    module.exports.connect = makeDispatcher(api2.connect);
    module.exports.upgrade = makeDispatcher(api2.upgrade);
    module.exports.MockClient = MockClient;
    module.exports.MockCallHistory = MockCallHistory;
    module.exports.MockCallHistoryLog = MockCallHistoryLog;
    module.exports.MockPool = MockPool;
    module.exports.MockAgent = MockAgent;
    module.exports.SnapshotAgent = SnapshotAgent;
    module.exports.mockErrors = mockErrors2;
    const { EventSource } = /* @__PURE__ */ requireEventsource();
    module.exports.EventSource = EventSource;
    function install() {
      globalThis.fetch = module.exports.fetch;
      globalThis.Headers = module.exports.Headers;
      globalThis.Response = module.exports.Response;
      globalThis.Request = module.exports.Request;
      globalThis.FormData = module.exports.FormData;
      globalThis.WebSocket = module.exports.WebSocket;
      globalThis.CloseEvent = module.exports.CloseEvent;
      globalThis.ErrorEvent = module.exports.ErrorEvent;
      globalThis.MessageEvent = module.exports.MessageEvent;
      globalThis.EventSource = module.exports.EventSource;
    }
    module.exports.install = install;
  })(undici);
  return undici.exports;
}
var undiciExports = /* @__PURE__ */ requireUndici();
const index = /* @__PURE__ */ getDefaultExportFromCjs(undiciExports);
const index$1 = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: index
}, [undiciExports]);
export {
  index$1 as i
};
