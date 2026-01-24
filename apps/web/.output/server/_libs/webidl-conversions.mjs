var lib;
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  var conversions = {};
  lib = conversions;
  function sign(x) {
    return x < 0 ? -1 : 1;
  }
  function evenRound(x) {
    if (x % 1 === 0.5 && (x & 1) === 0) {
      return Math.floor(x);
    } else {
      return Math.round(x);
    }
  }
  function createNumberConversion(bitLength, typeOpts) {
    if (!typeOpts.unsigned) {
      --bitLength;
    }
    const lowerBound = typeOpts.unsigned ? 0 : -Math.pow(2, bitLength);
    const upperBound = Math.pow(2, bitLength) - 1;
    const moduloVal = typeOpts.moduloBitLength ? Math.pow(2, typeOpts.moduloBitLength) : Math.pow(2, bitLength);
    const moduloBound = typeOpts.moduloBitLength ? Math.pow(2, typeOpts.moduloBitLength - 1) : Math.pow(2, bitLength - 1);
    return function(V, opts) {
      if (!opts) opts = {};
      let x = +V;
      if (opts.enforceRange) {
        if (!Number.isFinite(x)) {
          throw new TypeError("Argument is not a finite number");
        }
        x = sign(x) * Math.floor(Math.abs(x));
        if (x < lowerBound || x > upperBound) {
          throw new TypeError("Argument is not in byte range");
        }
        return x;
      }
      if (!isNaN(x) && opts.clamp) {
        x = evenRound(x);
        if (x < lowerBound) x = lowerBound;
        if (x > upperBound) x = upperBound;
        return x;
      }
      if (!Number.isFinite(x) || x === 0) {
        return 0;
      }
      x = sign(x) * Math.floor(Math.abs(x));
      x = x % moduloVal;
      if (!typeOpts.unsigned && x >= moduloBound) {
        return x - moduloVal;
      } else if (typeOpts.unsigned) {
        if (x < 0) {
          x += moduloVal;
        } else if (x === -0) {
          return 0;
        }
      }
      return x;
    };
  }
  conversions["void"] = function() {
    return void 0;
  };
  conversions["boolean"] = function(val) {
    return !!val;
  };
  conversions["byte"] = createNumberConversion(8, { unsigned: false });
  conversions["octet"] = createNumberConversion(8, { unsigned: true });
  conversions["short"] = createNumberConversion(16, { unsigned: false });
  conversions["unsigned short"] = createNumberConversion(16, { unsigned: true });
  conversions["long"] = createNumberConversion(32, { unsigned: false });
  conversions["unsigned long"] = createNumberConversion(32, { unsigned: true });
  conversions["long long"] = createNumberConversion(32, { unsigned: false, moduloBitLength: 64 });
  conversions["unsigned long long"] = createNumberConversion(32, { unsigned: true, moduloBitLength: 64 });
  conversions["double"] = function(V) {
    const x = +V;
    if (!Number.isFinite(x)) {
      throw new TypeError("Argument is not a finite floating-point value");
    }
    return x;
  };
  conversions["unrestricted double"] = function(V) {
    const x = +V;
    if (isNaN(x)) {
      throw new TypeError("Argument is NaN");
    }
    return x;
  };
  conversions["float"] = conversions["double"];
  conversions["unrestricted float"] = conversions["unrestricted double"];
  conversions["DOMString"] = function(V, opts) {
    if (!opts) opts = {};
    if (opts.treatNullAsEmptyString && V === null) {
      return "";
    }
    return String(V);
  };
  conversions["ByteString"] = function(V, opts) {
    const x = String(V);
    let c = void 0;
    for (let i = 0; (c = x.codePointAt(i)) !== void 0; ++i) {
      if (c > 255) {
        throw new TypeError("Argument is not a valid bytestring");
      }
    }
    return x;
  };
  conversions["USVString"] = function(V) {
    const S = String(V);
    const n = S.length;
    const U = [];
    for (let i = 0; i < n; ++i) {
      const c = S.charCodeAt(i);
      if (c < 55296 || c > 57343) {
        U.push(String.fromCodePoint(c));
      } else if (56320 <= c && c <= 57343) {
        U.push(String.fromCodePoint(65533));
      } else {
        if (i === n - 1) {
          U.push(String.fromCodePoint(65533));
        } else {
          const d = S.charCodeAt(i + 1);
          if (56320 <= d && d <= 57343) {
            const a = c & 1023;
            const b = d & 1023;
            U.push(String.fromCodePoint((2 << 15) + (2 << 9) * a + b));
            ++i;
          } else {
            U.push(String.fromCodePoint(65533));
          }
        }
      }
    }
    return U.join("");
  };
  conversions["Date"] = function(V, opts) {
    if (!(V instanceof Date)) {
      throw new TypeError("Argument is not a Date object");
    }
    if (isNaN(V)) {
      return void 0;
    }
    return V;
  };
  conversions["RegExp"] = function(V, opts) {
    if (!(V instanceof RegExp)) {
      V = new RegExp(V);
    }
    return V;
  };
  return lib;
}
export {
  requireLib as r
};
