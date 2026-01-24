import require$$0 from "buffer";
import require$$1 from "string_decoder";
import { r as requireRedisErrors } from "../../_libs/redis-errors.mjs";
var parser;
var hasRequiredParser;
function requireParser() {
  if (hasRequiredParser) return parser;
  hasRequiredParser = 1;
  const Buffer = require$$0.Buffer;
  const StringDecoder = require$$1.StringDecoder;
  const decoder = new StringDecoder();
  const errors = /* @__PURE__ */ requireRedisErrors();
  const ReplyError = errors.ReplyError;
  const ParserError = errors.ParserError;
  var bufferPool = Buffer.allocUnsafe(32 * 1024);
  var bufferOffset = 0;
  var interval = null;
  var counter = 0;
  var notDecreased = 0;
  function parseSimpleNumbers(parser2) {
    const length = parser2.buffer.length - 1;
    var offset = parser2.offset;
    var number = 0;
    var sign = 1;
    if (parser2.buffer[offset] === 45) {
      sign = -1;
      offset++;
    }
    while (offset < length) {
      const c1 = parser2.buffer[offset++];
      if (c1 === 13) {
        parser2.offset = offset + 1;
        return sign * number;
      }
      number = number * 10 + (c1 - 48);
    }
  }
  function parseStringNumbers(parser2) {
    const length = parser2.buffer.length - 1;
    var offset = parser2.offset;
    var number = 0;
    var res = "";
    if (parser2.buffer[offset] === 45) {
      res += "-";
      offset++;
    }
    while (offset < length) {
      var c1 = parser2.buffer[offset++];
      if (c1 === 13) {
        parser2.offset = offset + 1;
        if (number !== 0) {
          res += number;
        }
        return res;
      } else if (number > 429496728) {
        res += number * 10 + (c1 - 48);
        number = 0;
      } else if (c1 === 48 && number === 0) {
        res += 0;
      } else {
        number = number * 10 + (c1 - 48);
      }
    }
  }
  function parseSimpleString(parser2) {
    const start = parser2.offset;
    const buffer = parser2.buffer;
    const length = buffer.length - 1;
    var offset = start;
    while (offset < length) {
      if (buffer[offset++] === 13) {
        parser2.offset = offset + 1;
        if (parser2.optionReturnBuffers === true) {
          return parser2.buffer.slice(start, offset - 1);
        }
        return parser2.buffer.toString("utf8", start, offset - 1);
      }
    }
  }
  function parseLength(parser2) {
    const length = parser2.buffer.length - 1;
    var offset = parser2.offset;
    var number = 0;
    while (offset < length) {
      const c1 = parser2.buffer[offset++];
      if (c1 === 13) {
        parser2.offset = offset + 1;
        return number;
      }
      number = number * 10 + (c1 - 48);
    }
  }
  function parseInteger(parser2) {
    if (parser2.optionStringNumbers === true) {
      return parseStringNumbers(parser2);
    }
    return parseSimpleNumbers(parser2);
  }
  function parseBulkString(parser2) {
    const length = parseLength(parser2);
    if (length === void 0) {
      return;
    }
    if (length < 0) {
      return null;
    }
    const offset = parser2.offset + length;
    if (offset + 2 > parser2.buffer.length) {
      parser2.bigStrSize = offset + 2;
      parser2.totalChunkSize = parser2.buffer.length;
      parser2.bufferCache.push(parser2.buffer);
      return;
    }
    const start = parser2.offset;
    parser2.offset = offset + 2;
    if (parser2.optionReturnBuffers === true) {
      return parser2.buffer.slice(start, offset);
    }
    return parser2.buffer.toString("utf8", start, offset);
  }
  function parseError(parser2) {
    var string = parseSimpleString(parser2);
    if (string !== void 0) {
      if (parser2.optionReturnBuffers === true) {
        string = string.toString();
      }
      return new ReplyError(string);
    }
  }
  function handleError(parser2, type) {
    const err = new ParserError(
      "Protocol error, got " + JSON.stringify(String.fromCharCode(type)) + " as reply type byte",
      JSON.stringify(parser2.buffer),
      parser2.offset
    );
    parser2.buffer = null;
    parser2.returnFatalError(err);
  }
  function parseArray(parser2) {
    const length = parseLength(parser2);
    if (length === void 0) {
      return;
    }
    if (length < 0) {
      return null;
    }
    const responses = new Array(length);
    return parseArrayElements(parser2, responses, 0);
  }
  function pushArrayCache(parser2, array, pos) {
    parser2.arrayCache.push(array);
    parser2.arrayPos.push(pos);
  }
  function parseArrayChunks(parser2) {
    const tmp = parser2.arrayCache.pop();
    var pos = parser2.arrayPos.pop();
    if (parser2.arrayCache.length) {
      const res = parseArrayChunks(parser2);
      if (res === void 0) {
        pushArrayCache(parser2, tmp, pos);
        return;
      }
      tmp[pos++] = res;
    }
    return parseArrayElements(parser2, tmp, pos);
  }
  function parseArrayElements(parser2, responses, i) {
    const bufferLength = parser2.buffer.length;
    while (i < responses.length) {
      const offset = parser2.offset;
      if (parser2.offset >= bufferLength) {
        pushArrayCache(parser2, responses, i);
        return;
      }
      const response = parseType(parser2, parser2.buffer[parser2.offset++]);
      if (response === void 0) {
        if (!(parser2.arrayCache.length || parser2.bufferCache.length)) {
          parser2.offset = offset;
        }
        pushArrayCache(parser2, responses, i);
        return;
      }
      responses[i] = response;
      i++;
    }
    return responses;
  }
  function parseType(parser2, type) {
    switch (type) {
      case 36:
        return parseBulkString(parser2);
      case 43:
        return parseSimpleString(parser2);
      case 42:
        return parseArray(parser2);
      case 58:
        return parseInteger(parser2);
      case 45:
        return parseError(parser2);
      default:
        return handleError(parser2, type);
    }
  }
  function decreaseBufferPool() {
    if (bufferPool.length > 50 * 1024) {
      if (counter === 1 || notDecreased > counter * 2) {
        const minSliceLen = Math.floor(bufferPool.length / 10);
        const sliceLength = minSliceLen < bufferOffset ? bufferOffset : minSliceLen;
        bufferOffset = 0;
        bufferPool = bufferPool.slice(sliceLength, bufferPool.length);
      } else {
        notDecreased++;
        counter--;
      }
    } else {
      clearInterval(interval);
      counter = 0;
      notDecreased = 0;
      interval = null;
    }
  }
  function resizeBuffer(length) {
    if (bufferPool.length < length + bufferOffset) {
      const multiplier = length > 1024 * 1024 * 75 ? 2 : 3;
      if (bufferOffset > 1024 * 1024 * 111) {
        bufferOffset = 1024 * 1024 * 50;
      }
      bufferPool = Buffer.allocUnsafe(length * multiplier + bufferOffset);
      bufferOffset = 0;
      counter++;
      if (interval === null) {
        interval = setInterval(decreaseBufferPool, 50);
      }
    }
  }
  function concatBulkString(parser2) {
    const list = parser2.bufferCache;
    const oldOffset = parser2.offset;
    var chunks = list.length;
    var offset = parser2.bigStrSize - parser2.totalChunkSize;
    parser2.offset = offset;
    if (offset <= 2) {
      if (chunks === 2) {
        return list[0].toString("utf8", oldOffset, list[0].length + offset - 2);
      }
      chunks--;
      offset = list[list.length - 2].length + offset;
    }
    var res = decoder.write(list[0].slice(oldOffset));
    for (var i = 1; i < chunks - 1; i++) {
      res += decoder.write(list[i]);
    }
    res += decoder.end(list[i].slice(0, offset - 2));
    return res;
  }
  function concatBulkBuffer(parser2) {
    const list = parser2.bufferCache;
    const oldOffset = parser2.offset;
    const length = parser2.bigStrSize - oldOffset - 2;
    var chunks = list.length;
    var offset = parser2.bigStrSize - parser2.totalChunkSize;
    parser2.offset = offset;
    if (offset <= 2) {
      if (chunks === 2) {
        return list[0].slice(oldOffset, list[0].length + offset - 2);
      }
      chunks--;
      offset = list[list.length - 2].length + offset;
    }
    resizeBuffer(length);
    const start = bufferOffset;
    list[0].copy(bufferPool, start, oldOffset, list[0].length);
    bufferOffset += list[0].length - oldOffset;
    for (var i = 1; i < chunks - 1; i++) {
      list[i].copy(bufferPool, bufferOffset);
      bufferOffset += list[i].length;
    }
    list[i].copy(bufferPool, bufferOffset, 0, offset - 2);
    bufferOffset += offset - 2;
    return bufferPool.slice(start, bufferOffset);
  }
  class JavascriptRedisParser {
    /**
     * Javascript Redis Parser constructor
     * @param {{returnError: Function, returnReply: Function, returnFatalError?: Function, returnBuffers: boolean, stringNumbers: boolean }} options
     * @constructor
     */
    constructor(options) {
      if (!options) {
        throw new TypeError("Options are mandatory.");
      }
      if (typeof options.returnError !== "function" || typeof options.returnReply !== "function") {
        throw new TypeError("The returnReply and returnError options have to be functions.");
      }
      this.setReturnBuffers(!!options.returnBuffers);
      this.setStringNumbers(!!options.stringNumbers);
      this.returnError = options.returnError;
      this.returnFatalError = options.returnFatalError || options.returnError;
      this.returnReply = options.returnReply;
      this.reset();
    }
    /**
     * Reset the parser values to the initial state
     *
     * @returns {undefined}
     */
    reset() {
      this.offset = 0;
      this.buffer = null;
      this.bigStrSize = 0;
      this.totalChunkSize = 0;
      this.bufferCache = [];
      this.arrayCache = [];
      this.arrayPos = [];
    }
    /**
     * Set the returnBuffers option
     *
     * @param {boolean} returnBuffers
     * @returns {undefined}
     */
    setReturnBuffers(returnBuffers) {
      if (typeof returnBuffers !== "boolean") {
        throw new TypeError("The returnBuffers argument has to be a boolean");
      }
      this.optionReturnBuffers = returnBuffers;
    }
    /**
     * Set the stringNumbers option
     *
     * @param {boolean} stringNumbers
     * @returns {undefined}
     */
    setStringNumbers(stringNumbers) {
      if (typeof stringNumbers !== "boolean") {
        throw new TypeError("The stringNumbers argument has to be a boolean");
      }
      this.optionStringNumbers = stringNumbers;
    }
    /**
     * Parse the redis buffer
     * @param {Buffer} buffer
     * @returns {undefined}
     */
    execute(buffer) {
      if (this.buffer === null) {
        this.buffer = buffer;
        this.offset = 0;
      } else if (this.bigStrSize === 0) {
        const oldLength = this.buffer.length;
        const remainingLength = oldLength - this.offset;
        const newBuffer = Buffer.allocUnsafe(remainingLength + buffer.length);
        this.buffer.copy(newBuffer, 0, this.offset, oldLength);
        buffer.copy(newBuffer, remainingLength, 0, buffer.length);
        this.buffer = newBuffer;
        this.offset = 0;
        if (this.arrayCache.length) {
          const arr = parseArrayChunks(this);
          if (arr === void 0) {
            return;
          }
          this.returnReply(arr);
        }
      } else if (this.totalChunkSize + buffer.length >= this.bigStrSize) {
        this.bufferCache.push(buffer);
        var tmp = this.optionReturnBuffers ? concatBulkBuffer(this) : concatBulkString(this);
        this.bigStrSize = 0;
        this.bufferCache = [];
        this.buffer = buffer;
        if (this.arrayCache.length) {
          this.arrayCache[0][this.arrayPos[0]++] = tmp;
          tmp = parseArrayChunks(this);
          if (tmp === void 0) {
            return;
          }
        }
        this.returnReply(tmp);
      } else {
        this.bufferCache.push(buffer);
        this.totalChunkSize += buffer.length;
        return;
      }
      while (this.offset < this.buffer.length) {
        const offset = this.offset;
        const type = this.buffer[this.offset++];
        const response = parseType(this, type);
        if (response === void 0) {
          if (!(this.arrayCache.length || this.bufferCache.length)) {
            this.offset = offset;
          }
          return;
        }
        if (type === 45) {
          this.returnError(response);
        } else {
          this.returnReply(response);
        }
      }
      this.buffer = null;
    }
  }
  parser = JavascriptRedisParser;
  return parser;
}
var redisParser;
var hasRequiredRedisParser;
function requireRedisParser() {
  if (hasRequiredRedisParser) return redisParser;
  hasRequiredRedisParser = 1;
  redisParser = /* @__PURE__ */ requireParser();
  return redisParser;
}
export {
  requireRedisParser as r
};
