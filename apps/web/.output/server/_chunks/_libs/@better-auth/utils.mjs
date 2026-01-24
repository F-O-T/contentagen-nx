function expandAlphabet(alphabet) {
  switch (alphabet) {
    case "a-z":
      return "abcdefghijklmnopqrstuvwxyz";
    case "A-Z":
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    case "0-9":
      return "0123456789";
    case "-_":
      return "-_";
    default:
      throw new Error(`Unsupported alphabet: ${alphabet}`);
  }
}
function createRandomStringGenerator(...baseAlphabets) {
  const baseCharSet = baseAlphabets.map(expandAlphabet).join("");
  if (baseCharSet.length === 0) {
    throw new Error(
      "No valid characters provided for random string generation."
    );
  }
  const baseCharSetLength = baseCharSet.length;
  return (length, ...alphabets) => {
    if (length <= 0) {
      throw new Error("Length must be a positive integer.");
    }
    let charSet = baseCharSet;
    let charSetLength = baseCharSetLength;
    if (alphabets.length > 0) {
      charSet = alphabets.map(expandAlphabet).join("");
      charSetLength = charSet.length;
    }
    const maxValid = Math.floor(256 / charSetLength) * charSetLength;
    const buf = new Uint8Array(length * 2);
    const bufLength = buf.length;
    let result = "";
    let bufIndex = bufLength;
    let rand;
    while (result.length < length) {
      if (bufIndex >= bufLength) {
        crypto.getRandomValues(buf);
        bufIndex = 0;
      }
      rand = buf[bufIndex++];
      if (rand < maxValid) {
        result += charSet[rand % charSetLength];
      }
    }
    return result;
  };
}
const hexadecimal = "0123456789abcdef";
const hex = {
  encode: (data) => {
    if (typeof data === "string") {
      data = new TextEncoder().encode(data);
    }
    if (data.byteLength === 0) {
      return "";
    }
    const buffer = new Uint8Array(data);
    let result = "";
    for (const byte of buffer) {
      result += byte.toString(16).padStart(2, "0");
    }
    return result;
  },
  decode: (data) => {
    if (!data) {
      return "";
    }
    if (typeof data === "string") {
      if (data.length % 2 !== 0) {
        throw new Error("Invalid hexadecimal string");
      }
      if (!new RegExp(`^[${hexadecimal}]+$`).test(data)) {
        throw new Error("Invalid hexadecimal string");
      }
      const result = new Uint8Array(data.length / 2);
      for (let i = 0; i < data.length; i += 2) {
        result[i / 2] = parseInt(data.slice(i, i + 2), 16);
      }
      return new TextDecoder().decode(result);
    }
    return new TextDecoder().decode(data);
  }
};
function getWebcryptoSubtle() {
  const cr = typeof globalThis !== "undefined" && globalThis.crypto;
  if (cr && typeof cr.subtle === "object" && cr.subtle != null)
    return cr.subtle;
  throw new Error("crypto.subtle must be defined");
}
function getAlphabet$1(urlSafe) {
  return urlSafe ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
}
function base64Encode(data, alphabet, padding) {
  let result = "";
  let buffer = 0;
  let shift = 0;
  for (const byte of data) {
    buffer = buffer << 8 | byte;
    shift += 8;
    while (shift >= 6) {
      shift -= 6;
      result += alphabet[buffer >> shift & 63];
    }
  }
  if (shift > 0) {
    result += alphabet[buffer << 6 - shift & 63];
  }
  if (padding) {
    const padCount = (4 - result.length % 4) % 4;
    result += "=".repeat(padCount);
  }
  return result;
}
function base64Decode(data, alphabet) {
  const decodeMap = /* @__PURE__ */ new Map();
  for (let i = 0; i < alphabet.length; i++) {
    decodeMap.set(alphabet[i], i);
  }
  const result = [];
  let buffer = 0;
  let bitsCollected = 0;
  for (const char of data) {
    if (char === "=")
      break;
    const value = decodeMap.get(char);
    if (value === void 0) {
      throw new Error(`Invalid Base64 character: ${char}`);
    }
    buffer = buffer << 6 | value;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      result.push(buffer >> bitsCollected & 255);
    }
  }
  return Uint8Array.from(result);
}
const base64 = {
  encode(data, options = {}) {
    const alphabet = getAlphabet$1(false);
    const buffer = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
    return base64Encode(buffer, alphabet, options.padding ?? true);
  },
  decode(data) {
    if (typeof data !== "string") {
      data = new TextDecoder().decode(data);
    }
    const urlSafe = data.includes("-") || data.includes("_");
    const alphabet = getAlphabet$1(urlSafe);
    return base64Decode(data, alphabet);
  }
};
const base64Url = {
  encode(data, options = {}) {
    const alphabet = getAlphabet$1(true);
    const buffer = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
    return base64Encode(buffer, alphabet, options.padding ?? true);
  },
  decode(data) {
    const urlSafe = data.includes("-") || data.includes("_");
    const alphabet = getAlphabet$1(urlSafe);
    return base64Decode(data, alphabet);
  }
};
function createHash(algorithm, encoding) {
  return {
    digest: async (input) => {
      const encoder2 = new TextEncoder();
      const data = typeof input === "string" ? encoder2.encode(input) : input;
      const hashBuffer = await getWebcryptoSubtle().digest(algorithm, data);
      return hashBuffer;
    }
  };
}
const decoders = /* @__PURE__ */ new Map();
const encoder = new TextEncoder();
const binary = {
  decode: (data, encoding = "utf-8") => {
    if (!decoders.has(encoding)) {
      decoders.set(encoding, new TextDecoder(encoding));
    }
    const decoder = decoders.get(encoding);
    return decoder.decode(data);
  },
  encode: encoder.encode
};
const createHMAC = (algorithm = "SHA-256", encoding = "none") => {
  const hmac = {
    importKey: async (key, keyUsage) => {
      return getWebcryptoSubtle().importKey(
        "raw",
        typeof key === "string" ? new TextEncoder().encode(key) : key,
        { name: "HMAC", hash: { name: algorithm } },
        false,
        [keyUsage]
      );
    },
    sign: async (hmacKey, data) => {
      if (typeof hmacKey === "string") {
        hmacKey = await hmac.importKey(hmacKey, "sign");
      }
      const signature = await getWebcryptoSubtle().sign(
        "HMAC",
        hmacKey,
        typeof data === "string" ? new TextEncoder().encode(data) : data
      );
      if (encoding === "hex") {
        return hex.encode(signature);
      }
      if (encoding === "base64" || encoding === "base64url" || encoding === "base64urlnopad") {
        return base64Url.encode(signature, {
          padding: encoding !== "base64urlnopad"
        });
      }
      return signature;
    },
    verify: async (hmacKey, data, signature) => {
      if (typeof hmacKey === "string") {
        hmacKey = await hmac.importKey(hmacKey, "verify");
      }
      if (encoding === "hex") {
        signature = hex.decode(signature);
      }
      if (encoding === "base64" || encoding === "base64url" || encoding === "base64urlnopad") {
        signature = await base64.decode(signature);
      }
      return getWebcryptoSubtle().verify(
        "HMAC",
        hmacKey,
        typeof signature === "string" ? new TextEncoder().encode(signature) : signature,
        typeof data === "string" ? new TextEncoder().encode(data) : data
      );
    }
  };
  return hmac;
};
function getAlphabet(hex2) {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
}
function createDecodeMap(alphabet) {
  const decodeMap = /* @__PURE__ */ new Map();
  for (let i = 0; i < alphabet.length; i++) {
    decodeMap.set(alphabet[i], i);
  }
  return decodeMap;
}
function base32Encode(data, alphabet, padding) {
  let result = "";
  let buffer = 0;
  let shift = 0;
  for (const byte of data) {
    buffer = buffer << 8 | byte;
    shift += 8;
    while (shift >= 5) {
      shift -= 5;
      result += alphabet[buffer >> shift & 31];
    }
  }
  if (shift > 0) {
    result += alphabet[buffer << 5 - shift & 31];
  }
  if (padding) {
    const padCount = (8 - result.length % 8) % 8;
    result += "=".repeat(padCount);
  }
  return result;
}
function base32Decode(data, alphabet) {
  const decodeMap = createDecodeMap(alphabet);
  const result = [];
  let buffer = 0;
  let bitsCollected = 0;
  for (const char of data) {
    if (char === "=")
      break;
    const value = decodeMap.get(char);
    if (value === void 0) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    buffer = buffer << 5 | value;
    bitsCollected += 5;
    while (bitsCollected >= 8) {
      bitsCollected -= 8;
      result.push(buffer >> bitsCollected & 255);
    }
  }
  return Uint8Array.from(result);
}
const base32 = {
  /**
   * Encodes data into a Base32 string.
   * @param data - The data to encode (ArrayBuffer, TypedArray, or string).
   * @param options - Encoding options.
   * @returns The Base32 encoded string.
   */
  encode(data, options = {}) {
    const alphabet = getAlphabet();
    const buffer = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
    return base32Encode(buffer, alphabet, options.padding ?? true);
  },
  /**
   * Decodes a Base32 string into a Uint8Array.
   * @param data - The Base32 encoded string or ArrayBuffer/TypedArray.
   * @returns The decoded Uint8Array.
   */
  decode(data) {
    if (typeof data !== "string") {
      data = new TextDecoder().decode(data);
    }
    const alphabet = getAlphabet();
    return base32Decode(data, alphabet);
  }
};
const defaultPeriod = 30;
const defaultDigits = 6;
async function generateHOTP(secret, {
  counter,
  digits,
  hash = "SHA-1"
}) {
  const _digits = digits ?? defaultDigits;
  if (_digits < 1 || _digits > 8) {
    throw new TypeError("Digits must be between 1 and 8");
  }
  const buffer = new ArrayBuffer(8);
  new DataView(buffer).setBigUint64(0, BigInt(counter), false);
  const bytes = new Uint8Array(buffer);
  const hmacResult = new Uint8Array(await createHMAC(hash).sign(secret, bytes));
  const offset = hmacResult[hmacResult.length - 1] & 15;
  const truncated = (hmacResult[offset] & 127) << 24 | (hmacResult[offset + 1] & 255) << 16 | (hmacResult[offset + 2] & 255) << 8 | hmacResult[offset + 3] & 255;
  const otp = truncated % 10 ** _digits;
  return otp.toString().padStart(_digits, "0");
}
async function generateTOTP(secret, options) {
  const digits = options?.digits ?? defaultDigits;
  const period = options?.period ?? defaultPeriod;
  const milliseconds = period * 1e3;
  const counter = Math.floor(Date.now() / milliseconds);
  return await generateHOTP(secret, { counter, digits, hash: options?.hash });
}
async function verifyTOTP(otp, {
  window = 1,
  digits = defaultDigits,
  secret,
  period = defaultPeriod
}) {
  const milliseconds = period * 1e3;
  const counter = Math.floor(Date.now() / milliseconds);
  for (let i = -window; i <= window; i++) {
    const generatedOTP = await generateHOTP(secret, {
      counter: counter + i,
      digits
    });
    if (otp === generatedOTP) {
      return true;
    }
  }
  return false;
}
function generateQRCode({
  issuer,
  account,
  secret,
  digits = defaultDigits,
  period = defaultPeriod
}) {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccountName = encodeURIComponent(account);
  const baseURI = `otpauth://totp/${encodedIssuer}:${encodedAccountName}`;
  const params = new URLSearchParams({
    secret: base32.encode(secret, {
      padding: false
    }),
    issuer
  });
  if (digits !== void 0) {
    params.set("digits", digits.toString());
  }
  if (period !== void 0) {
    params.set("period", period.toString());
  }
  return `${baseURI}?${params.toString()}`;
}
const createOTP = (secret, opts) => {
  const digits = opts?.digits ?? defaultDigits;
  const period = opts?.period ?? defaultPeriod;
  return {
    hotp: (counter) => generateHOTP(secret, { counter, digits }),
    totp: () => generateTOTP(secret, { digits, period }),
    verify: (otp, options) => verifyTOTP(otp, { secret, digits, period, ...options }),
    url: (issuer, account) => generateQRCode({ issuer, account, secret, digits, period })
  };
};
export {
  base64 as a,
  base64Url as b,
  createRandomStringGenerator as c,
  createHash as d,
  createHMAC as e,
  binary as f,
  getWebcryptoSubtle as g,
  createOTP as h,
  hex as i
};
