var base64 = {};
var hasRequiredBase64;
function requireBase64() {
  if (hasRequiredBase64) return base64;
  hasRequiredBase64 = 1;
  var __extends = base64 && base64.__extends || /* @__PURE__ */ (function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  })();
  Object.defineProperty(base64, "__esModule", { value: true });
  var INVALID_BYTE = 256;
  var Coder = (
    /** @class */
    (function() {
      function Coder2(_paddingCharacter) {
        if (_paddingCharacter === void 0) {
          _paddingCharacter = "=";
        }
        this._paddingCharacter = _paddingCharacter;
      }
      Coder2.prototype.encodedLength = function(length) {
        if (!this._paddingCharacter) {
          return (length * 8 + 5) / 6 | 0;
        }
        return (length + 2) / 3 * 4 | 0;
      };
      Coder2.prototype.encode = function(data) {
        var out = "";
        var i = 0;
        for (; i < data.length - 2; i += 3) {
          var c = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
          out += this._encodeByte(c >>> 3 * 6 & 63);
          out += this._encodeByte(c >>> 2 * 6 & 63);
          out += this._encodeByte(c >>> 1 * 6 & 63);
          out += this._encodeByte(c >>> 0 * 6 & 63);
        }
        var left = data.length - i;
        if (left > 0) {
          var c = data[i] << 16 | (left === 2 ? data[i + 1] << 8 : 0);
          out += this._encodeByte(c >>> 3 * 6 & 63);
          out += this._encodeByte(c >>> 2 * 6 & 63);
          if (left === 2) {
            out += this._encodeByte(c >>> 1 * 6 & 63);
          } else {
            out += this._paddingCharacter || "";
          }
          out += this._paddingCharacter || "";
        }
        return out;
      };
      Coder2.prototype.maxDecodedLength = function(length) {
        if (!this._paddingCharacter) {
          return (length * 6 + 7) / 8 | 0;
        }
        return length / 4 * 3 | 0;
      };
      Coder2.prototype.decodedLength = function(s) {
        return this.maxDecodedLength(s.length - this._getPaddingLength(s));
      };
      Coder2.prototype.decode = function(s) {
        if (s.length === 0) {
          return new Uint8Array(0);
        }
        var paddingLength = this._getPaddingLength(s);
        var length = s.length - paddingLength;
        var out = new Uint8Array(this.maxDecodedLength(length));
        var op = 0;
        var i = 0;
        var haveBad = 0;
        var v0 = 0, v1 = 0, v2 = 0, v3 = 0;
        for (; i < length - 4; i += 4) {
          v0 = this._decodeChar(s.charCodeAt(i + 0));
          v1 = this._decodeChar(s.charCodeAt(i + 1));
          v2 = this._decodeChar(s.charCodeAt(i + 2));
          v3 = this._decodeChar(s.charCodeAt(i + 3));
          out[op++] = v0 << 2 | v1 >>> 4;
          out[op++] = v1 << 4 | v2 >>> 2;
          out[op++] = v2 << 6 | v3;
          haveBad |= v0 & INVALID_BYTE;
          haveBad |= v1 & INVALID_BYTE;
          haveBad |= v2 & INVALID_BYTE;
          haveBad |= v3 & INVALID_BYTE;
        }
        if (i < length - 1) {
          v0 = this._decodeChar(s.charCodeAt(i));
          v1 = this._decodeChar(s.charCodeAt(i + 1));
          out[op++] = v0 << 2 | v1 >>> 4;
          haveBad |= v0 & INVALID_BYTE;
          haveBad |= v1 & INVALID_BYTE;
        }
        if (i < length - 2) {
          v2 = this._decodeChar(s.charCodeAt(i + 2));
          out[op++] = v1 << 4 | v2 >>> 2;
          haveBad |= v2 & INVALID_BYTE;
        }
        if (i < length - 3) {
          v3 = this._decodeChar(s.charCodeAt(i + 3));
          out[op++] = v2 << 6 | v3;
          haveBad |= v3 & INVALID_BYTE;
        }
        if (haveBad !== 0) {
          throw new Error("Base64Coder: incorrect characters for decoding");
        }
        return out;
      };
      Coder2.prototype._encodeByte = function(b) {
        var result = b;
        result += 65;
        result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
        result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
        result += 61 - b >>> 8 & 52 - 48 - 62 + 43;
        result += 62 - b >>> 8 & 62 - 43 - 63 + 47;
        return String.fromCharCode(result);
      };
      Coder2.prototype._decodeChar = function(c) {
        var result = INVALID_BYTE;
        result += (42 - c & c - 44) >>> 8 & -INVALID_BYTE + c - 43 + 62;
        result += (46 - c & c - 48) >>> 8 & -INVALID_BYTE + c - 47 + 63;
        result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
        result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
        result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
        return result;
      };
      Coder2.prototype._getPaddingLength = function(s) {
        var paddingLength = 0;
        if (this._paddingCharacter) {
          for (var i = s.length - 1; i >= 0; i--) {
            if (s[i] !== this._paddingCharacter) {
              break;
            }
            paddingLength++;
          }
          if (s.length < 4 || paddingLength > 2) {
            throw new Error("Base64Coder: incorrect padding");
          }
        }
        return paddingLength;
      };
      return Coder2;
    })()
  );
  base64.Coder = Coder;
  var stdCoder = new Coder();
  function encode(data) {
    return stdCoder.encode(data);
  }
  base64.encode = encode;
  function decode(s) {
    return stdCoder.decode(s);
  }
  base64.decode = decode;
  var URLSafeCoder = (
    /** @class */
    (function(_super) {
      __extends(URLSafeCoder2, _super);
      function URLSafeCoder2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      URLSafeCoder2.prototype._encodeByte = function(b) {
        var result = b;
        result += 65;
        result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
        result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
        result += 61 - b >>> 8 & 52 - 48 - 62 + 45;
        result += 62 - b >>> 8 & 62 - 45 - 63 + 95;
        return String.fromCharCode(result);
      };
      URLSafeCoder2.prototype._decodeChar = function(c) {
        var result = INVALID_BYTE;
        result += (44 - c & c - 46) >>> 8 & -INVALID_BYTE + c - 45 + 62;
        result += (94 - c & c - 96) >>> 8 & -INVALID_BYTE + c - 95 + 63;
        result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
        result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
        result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
        return result;
      };
      return URLSafeCoder2;
    })(Coder)
  );
  base64.URLSafeCoder = URLSafeCoder;
  var urlSafeCoder = new URLSafeCoder();
  function encodeURLSafe(data) {
    return urlSafeCoder.encode(data);
  }
  base64.encodeURLSafe = encodeURLSafe;
  function decodeURLSafe(s) {
    return urlSafeCoder.decode(s);
  }
  base64.decodeURLSafe = decodeURLSafe;
  base64.encodedLength = function(length) {
    return stdCoder.encodedLength(length);
  };
  base64.maxDecodedLength = function(length) {
    return stdCoder.maxDecodedLength(length);
  };
  base64.decodedLength = function(s) {
    return stdCoder.decodedLength(s);
  };
  return base64;
}
export {
  requireBase64 as r
};
