import { g as getWebcryptoSubtle } from "../_chunks/_libs/@better-auth/utils.mjs";
import { G as ZodObject, F as ZodOptional } from "./zod.mjs";
import { a as addRoute, c as createRouter, f as findRoute, b as findAllRoutes } from "./rou3.mjs";
function isErrorStackTraceLimitWritable() {
  const desc = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
  if (desc === void 0) return Object.isExtensible(Error);
  return Object.prototype.hasOwnProperty.call(desc, "writable") ? desc.writable : desc.set !== void 0;
}
function hideInternalStackFrames(stack) {
  const lines = stack.split("\n    at ");
  if (lines.length <= 1) return stack;
  lines.splice(1, 1);
  return lines.join("\n    at ");
}
function makeErrorForHideStackFrame(Base, clazz) {
  class HideStackFramesError extends Base {
    #hiddenStack;
    constructor(...args) {
      if (isErrorStackTraceLimitWritable()) {
        const limit = Error.stackTraceLimit;
        Error.stackTraceLimit = 0;
        super(...args);
        Error.stackTraceLimit = limit;
      } else super(...args);
      const stack = (/* @__PURE__ */ new Error()).stack;
      if (stack) this.#hiddenStack = hideInternalStackFrames(stack.replace(/^Error/, this.name));
    }
    get errorStack() {
      return this.#hiddenStack;
    }
  }
  Object.defineProperty(HideStackFramesError.prototype, "constructor", {
    get() {
      return clazz;
    },
    enumerable: false,
    configurable: true
  });
  return HideStackFramesError;
}
const statusCodes = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
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
  "I'M_A_TEAPOT": 418,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
var InternalAPIError = class extends Error {
  constructor(status = "INTERNAL_SERVER_ERROR", body = void 0, headers = {}, statusCode = typeof status === "number" ? status : statusCodes[status]) {
    super(body?.message, body?.cause ? { cause: body.cause } : void 0);
    this.status = status;
    this.body = body;
    this.headers = headers;
    this.statusCode = statusCode;
    this.name = "APIError";
    this.status = status;
    this.headers = headers;
    this.statusCode = statusCode;
    this.body = body ? {
      code: body?.message?.toUpperCase().replace(/ /g, "_").replace(/[^A-Z0-9_]/g, ""),
      ...body
    } : void 0;
  }
};
var ValidationError = class extends InternalAPIError {
  constructor(message, issues) {
    super(400, {
      message,
      code: "VALIDATION_ERROR"
    });
    this.message = message;
    this.issues = issues;
    this.issues = issues;
  }
};
var BetterCallError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "BetterCallError";
  }
};
const APIError = makeErrorForHideStackFrame(InternalAPIError, Error);
const jsonContentTypeRegex = /^application\/([a-z0-9.+-]*\+)?json/i;
async function getBody(request, allowedMediaTypes) {
  const contentType = request.headers.get("content-type") || "";
  const normalizedContentType = contentType.toLowerCase();
  if (!request.body) return;
  if (allowedMediaTypes && allowedMediaTypes.length > 0) {
    if (!allowedMediaTypes.some((allowed) => {
      const normalizedContentTypeBase = normalizedContentType.split(";")[0].trim();
      const normalizedAllowed = allowed.toLowerCase().trim();
      return normalizedContentTypeBase === normalizedAllowed || normalizedContentTypeBase.includes(normalizedAllowed);
    })) {
      if (!normalizedContentType) throw new APIError(415, {
        message: `Content-Type is required. Allowed types: ${allowedMediaTypes.join(", ")}`,
        code: "UNSUPPORTED_MEDIA_TYPE"
      });
      throw new APIError(415, {
        message: `Content-Type "${contentType}" is not allowed. Allowed types: ${allowedMediaTypes.join(", ")}`,
        code: "UNSUPPORTED_MEDIA_TYPE"
      });
    }
  }
  if (jsonContentTypeRegex.test(normalizedContentType)) return await request.json();
  if (normalizedContentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const result = {};
    formData.forEach((value, key) => {
      result[key] = value.toString();
    });
    return result;
  }
  if (normalizedContentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const result = {};
    formData.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  if (normalizedContentType.includes("text/plain")) return await request.text();
  if (normalizedContentType.includes("application/octet-stream")) return await request.arrayBuffer();
  if (normalizedContentType.includes("application/pdf") || normalizedContentType.includes("image/") || normalizedContentType.includes("video/")) return await request.blob();
  if (normalizedContentType.includes("application/stream") || request.body instanceof ReadableStream) return request.body;
  return await request.text();
}
function isAPIError(error) {
  return error instanceof APIError || error?.name === "APIError";
}
function tryDecode(str) {
  try {
    return str.includes("%") ? decodeURIComponent(str) : str;
  } catch {
    return str;
  }
}
async function tryCatch(promise) {
  try {
    return {
      data: await promise,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error
    };
  }
}
function isJSONSerializable(value) {
  if (value === void 0) return false;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) return true;
  if (t !== "object") return false;
  if (Array.isArray(value)) return true;
  if (value.buffer) return false;
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
function safeStringify(obj, replacer, space) {
  let id = 0;
  const seen = /* @__PURE__ */ new WeakMap();
  const safeReplacer = (key, value) => {
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return `[Circular ref-${seen.get(value)}]`;
      seen.set(value, id++);
    }
    return value;
  };
  return JSON.stringify(obj, safeReplacer, space);
}
function isJSONResponse(value) {
  if (!value || typeof value !== "object") return false;
  return "_flag" in value && value._flag === "json";
}
function toResponse(data, init) {
  if (data instanceof Response) {
    if (init?.headers instanceof Headers) init.headers.forEach((value, key) => {
      data.headers.set(key, value);
    });
    return data;
  }
  if (isJSONResponse(data)) {
    const body$1 = data.body;
    const routerResponse = data.routerResponse;
    if (routerResponse instanceof Response) return routerResponse;
    const headers$1 = new Headers();
    if (routerResponse?.headers) {
      const headers$2 = new Headers(routerResponse.headers);
      for (const [key, value] of headers$2.entries()) headers$2.set(key, value);
    }
    if (data.headers) for (const [key, value] of new Headers(data.headers).entries()) headers$1.set(key, value);
    if (init?.headers) for (const [key, value] of new Headers(init.headers).entries()) headers$1.set(key, value);
    headers$1.set("Content-Type", "application/json");
    return new Response(JSON.stringify(body$1), {
      ...routerResponse,
      headers: headers$1,
      status: data.status ?? init?.status ?? routerResponse?.status,
      statusText: init?.statusText ?? routerResponse?.statusText
    });
  }
  if (isAPIError(data)) return toResponse(data.body, {
    status: init?.status ?? data.statusCode,
    statusText: data.status.toString(),
    headers: init?.headers || data.headers
  });
  let body = data;
  let headers = new Headers(init?.headers);
  if (!data) {
    if (data === null) body = JSON.stringify(null);
    headers.set("content-type", "application/json");
  } else if (typeof data === "string") {
    body = data;
    headers.set("Content-Type", "text/plain");
  } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    body = data;
    headers.set("Content-Type", "application/octet-stream");
  } else if (data instanceof Blob) {
    body = data;
    headers.set("Content-Type", data.type || "application/octet-stream");
  } else if (data instanceof FormData) body = data;
  else if (data instanceof URLSearchParams) {
    body = data;
    headers.set("Content-Type", "application/x-www-form-urlencoded");
  } else if (data instanceof ReadableStream) {
    body = data;
    headers.set("Content-Type", "application/octet-stream");
  } else if (isJSONSerializable(data)) {
    body = safeStringify(data);
    headers.set("Content-Type", "application/json");
  }
  return new Response(body, {
    ...init,
    headers
  });
}
const algorithm = {
  name: "HMAC",
  hash: "SHA-256"
};
const getCryptoKey = async (secret) => {
  const secretBuf = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  return await getWebcryptoSubtle().importKey("raw", secretBuf, algorithm, false, ["sign", "verify"]);
};
const verifySignature = async (base64Signature, value, secret) => {
  try {
    const signatureBinStr = atob(base64Signature);
    const signature = new Uint8Array(signatureBinStr.length);
    for (let i = 0, len = signatureBinStr.length; i < len; i++) signature[i] = signatureBinStr.charCodeAt(i);
    return await getWebcryptoSubtle().verify(algorithm, secret, signature, new TextEncoder().encode(value));
  } catch (e) {
    return false;
  }
};
const makeSignature = async (value, secret) => {
  const key = await getCryptoKey(secret);
  const signature = await getWebcryptoSubtle().sign(algorithm.name, key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};
const signCookieValue = async (value, secret) => {
  const signature = await makeSignature(value, secret);
  value = `${value}.${signature}`;
  value = encodeURIComponent(value);
  return value;
};
const getCookieKey = (key, prefix) => {
  let finalKey = key;
  if (prefix) if (prefix === "secure") finalKey = "__Secure-" + key;
  else if (prefix === "host") finalKey = "__Host-" + key;
  else return;
  return finalKey;
};
function parseCookies(str) {
  if (typeof str !== "string") throw new TypeError("argument str must be a string");
  const cookies = /* @__PURE__ */ new Map();
  let index = 0;
  while (index < str.length) {
    const eqIdx = str.indexOf("=", index);
    if (eqIdx === -1) break;
    let endIdx = str.indexOf(";", index);
    if (endIdx === -1) endIdx = str.length;
    else if (endIdx < eqIdx) {
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = str.slice(index, eqIdx).trim();
    if (!cookies.has(key)) {
      let val = str.slice(eqIdx + 1, endIdx).trim();
      if (val.codePointAt(0) === 34) val = val.slice(1, -1);
      cookies.set(key, tryDecode(val));
    }
    index = endIdx + 1;
  }
  return cookies;
}
const _serialize = (key, value, opt = {}) => {
  let cookie;
  if (opt?.prefix === "secure") cookie = `${`__Secure-${key}`}=${value}`;
  else if (opt?.prefix === "host") cookie = `${`__Host-${key}`}=${value}`;
  else cookie = `${key}=${value}`;
  if (key.startsWith("__Secure-") && !opt.secure) opt.secure = true;
  if (key.startsWith("__Host-")) {
    if (!opt.secure) opt.secure = true;
    if (opt.path !== "/") opt.path = "/";
    if (opt.domain) opt.domain = void 0;
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) throw new Error("Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.");
    cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
  }
  if (opt.domain && opt.prefix !== "host") cookie += `; Domain=${opt.domain}`;
  if (opt.path) cookie += `; Path=${opt.path}`;
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) throw new Error("Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.");
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) cookie += "; HttpOnly";
  if (opt.secure) cookie += "; Secure";
  if (opt.sameSite) cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  if (opt.partitioned) {
    if (!opt.secure) opt.secure = true;
    cookie += "; Partitioned";
  }
  return cookie;
};
const serializeCookie = (key, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(key, value, opt);
};
const serializeSignedCookie = async (key, value, secret, opt) => {
  value = await signCookieValue(value, secret);
  return _serialize(key, value, opt);
};
async function runValidation(options, context = {}) {
  let request = {
    body: context.body,
    query: context.query
  };
  if (options.body) {
    const result = await options.body["~standard"].validate(context.body);
    if (result.issues) return {
      data: null,
      error: fromError(result.issues, "body")
    };
    request.body = result.value;
  }
  if (options.query) {
    const result = await options.query["~standard"].validate(context.query);
    if (result.issues) return {
      data: null,
      error: fromError(result.issues, "query")
    };
    request.query = result.value;
  }
  if (options.requireHeaders && !context.headers) return {
    data: null,
    error: {
      message: "Headers is required",
      issues: []
    }
  };
  if (options.requireRequest && !context.request) return {
    data: null,
    error: {
      message: "Request is required",
      issues: []
    }
  };
  return {
    data: request,
    error: null
  };
}
function fromError(error, validating) {
  return {
    message: error.map((e) => {
      return `[${e.path?.length ? `${validating}.` + e.path.map((x) => typeof x === "object" ? x.key : x).join(".") : validating}] ${e.message}`;
    }).join("; "),
    issues: error
  };
}
const createInternalContext = async (context, { options, path }) => {
  const headers = new Headers();
  let responseStatus = void 0;
  const { data, error } = await runValidation(options, context);
  if (error) throw new ValidationError(error.message, error.issues);
  const requestHeaders = "headers" in context ? context.headers instanceof Headers ? context.headers : new Headers(context.headers) : "request" in context && context.request instanceof Request ? context.request.headers : null;
  const requestCookies = requestHeaders?.get("cookie");
  const parsedCookies = requestCookies ? parseCookies(requestCookies) : void 0;
  const internalContext = {
    ...context,
    body: data.body,
    query: data.query,
    path: context.path || path || "virtual:",
    context: "context" in context && context.context ? context.context : {},
    returned: void 0,
    headers: context?.headers,
    request: context?.request,
    params: "params" in context ? context.params : void 0,
    method: context.method ?? (Array.isArray(options.method) ? options.method[0] : options.method === "*" ? "GET" : options.method),
    setHeader: (key, value) => {
      headers.set(key, value);
    },
    getHeader: (key) => {
      if (!requestHeaders) return null;
      return requestHeaders.get(key);
    },
    getCookie: (key, prefix) => {
      const finalKey = getCookieKey(key, prefix);
      if (!finalKey) return null;
      return parsedCookies?.get(finalKey) || null;
    },
    getSignedCookie: async (key, secret, prefix) => {
      const finalKey = getCookieKey(key, prefix);
      if (!finalKey) return null;
      const value = parsedCookies?.get(finalKey);
      if (!value) return null;
      const signatureStartPos = value.lastIndexOf(".");
      if (signatureStartPos < 1) return null;
      const signedValue = value.substring(0, signatureStartPos);
      const signature = value.substring(signatureStartPos + 1);
      if (signature.length !== 44 || !signature.endsWith("=")) return null;
      return await verifySignature(signature, signedValue, await getCryptoKey(secret)) ? signedValue : false;
    },
    setCookie: (key, value, options$1) => {
      const cookie = serializeCookie(key, value, options$1);
      headers.append("set-cookie", cookie);
      return cookie;
    },
    setSignedCookie: async (key, value, secret, options$1) => {
      const cookie = await serializeSignedCookie(key, value, secret, options$1);
      headers.append("set-cookie", cookie);
      return cookie;
    },
    redirect: (url) => {
      headers.set("location", url);
      return new APIError("FOUND", void 0, headers);
    },
    error: (status, body, headers$1) => {
      return new APIError(status, body, headers$1);
    },
    setStatus: (status) => {
      responseStatus = status;
    },
    json: (json, routerResponse) => {
      if (!context.asResponse) return json;
      return {
        body: routerResponse?.body || json,
        routerResponse,
        _flag: "json"
      };
    },
    responseHeaders: headers,
    get responseStatus() {
      return responseStatus;
    }
  };
  for (const middleware of options.use || []) {
    const response = await middleware({
      ...internalContext,
      returnHeaders: true,
      asResponse: false
    });
    if (response.response) Object.assign(internalContext.context, response.response);
    if (response.headers) response.headers.forEach((value, key) => {
      internalContext.responseHeaders.set(key, value);
    });
  }
  return internalContext;
};
function createEndpoint(pathOrOptions, handlerOrOptions, handlerOrNever) {
  const path = typeof pathOrOptions === "string" ? pathOrOptions : void 0;
  const options = typeof handlerOrOptions === "object" ? handlerOrOptions : pathOrOptions;
  const handler = typeof handlerOrOptions === "function" ? handlerOrOptions : handlerOrNever;
  if ((options.method === "GET" || options.method === "HEAD") && options.body) throw new BetterCallError("Body is not allowed with GET or HEAD methods");
  if (path && /\/{2,}/.test(path)) throw new BetterCallError("Path cannot contain consecutive slashes");
  const internalHandler = async (...inputCtx) => {
    const context = inputCtx[0] || {};
    const { data: internalContext, error: validationError } = await tryCatch(createInternalContext(context, {
      options,
      path
    }));
    if (validationError) {
      if (!(validationError instanceof ValidationError)) throw validationError;
      if (options.onValidationError) await options.onValidationError({
        message: validationError.message,
        issues: validationError.issues
      });
      throw new APIError(400, {
        message: validationError.message,
        code: "VALIDATION_ERROR"
      });
    }
    const response = await handler(internalContext).catch(async (e) => {
      if (isAPIError(e)) {
        const onAPIError = options.onAPIError;
        if (onAPIError) await onAPIError(e);
        if (context.asResponse) return e;
      }
      throw e;
    });
    const headers = internalContext.responseHeaders;
    const status = internalContext.responseStatus;
    return context.asResponse ? toResponse(response, {
      headers,
      status
    }) : context.returnHeaders ? context.returnStatus ? {
      headers,
      response,
      status
    } : {
      headers,
      response
    } : context.returnStatus ? {
      response,
      status
    } : response;
  };
  internalHandler.options = options;
  internalHandler.path = path;
  return internalHandler;
}
createEndpoint.create = (opts) => {
  return (path, options, handler) => {
    return createEndpoint(path, {
      ...options,
      use: [...options?.use || [], ...opts?.use || []]
    }, handler);
  };
};
function createMiddleware(optionsOrHandler, handler) {
  const internalHandler = async (inputCtx) => {
    const context = inputCtx;
    const _handler = typeof optionsOrHandler === "function" ? optionsOrHandler : handler;
    const internalContext = await createInternalContext(context, {
      options: typeof optionsOrHandler === "function" ? {} : optionsOrHandler,
      path: "/"
    });
    if (!_handler) throw new Error("handler must be defined");
    const response = await _handler(internalContext);
    const headers = internalContext.responseHeaders;
    return context.returnHeaders ? {
      headers,
      response
    } : response;
  };
  internalHandler.options = typeof optionsOrHandler === "function" ? {} : optionsOrHandler;
  return internalHandler;
}
createMiddleware.create = (opts) => {
  function fn(optionsOrHandler, handler) {
    if (typeof optionsOrHandler === "function") return createMiddleware({ use: opts?.use }, optionsOrHandler);
    if (!handler) throw new Error("Middleware handler is required");
    return createMiddleware({
      ...optionsOrHandler,
      method: "*",
      use: [...opts?.use || [], ...optionsOrHandler.use || []]
    }, handler);
  }
  return fn;
};
const paths = {};
function getTypeFromZodType(zodType) {
  switch (zodType.constructor.name) {
    case "ZodString":
      return "string";
    case "ZodNumber":
      return "number";
    case "ZodBoolean":
      return "boolean";
    case "ZodObject":
      return "object";
    case "ZodArray":
      return "array";
    default:
      return "string";
  }
}
function getParameters(options) {
  const parameters = [];
  if (options.metadata?.openapi?.parameters) {
    parameters.push(...options.metadata.openapi.parameters);
    return parameters;
  }
  if (options.query instanceof ZodObject) Object.entries(options.query.shape).forEach(([key, value]) => {
    if (value instanceof ZodObject) parameters.push({
      name: key,
      in: "query",
      schema: {
        type: getTypeFromZodType(value),
        ..."minLength" in value && value.minLength ? { minLength: value.minLength } : {},
        description: value.description
      }
    });
  });
  return parameters;
}
function getRequestBody(options) {
  if (options.metadata?.openapi?.requestBody) return options.metadata.openapi.requestBody;
  if (!options.body) return void 0;
  if (options.body instanceof ZodObject || options.body instanceof ZodOptional) {
    const shape = options.body.shape;
    if (!shape) return void 0;
    const properties = {};
    const required = [];
    Object.entries(shape).forEach(([key, value]) => {
      if (value instanceof ZodObject) {
        properties[key] = {
          type: getTypeFromZodType(value),
          description: value.description
        };
        if (!(value instanceof ZodOptional)) required.push(key);
      }
    });
    return {
      required: options.body instanceof ZodOptional ? false : options.body ? true : false,
      content: { "application/json": { schema: {
        type: "object",
        properties,
        required
      } } }
    };
  }
}
function getResponse(responses) {
  return {
    "400": {
      content: { "application/json": { schema: {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"]
      } } },
      description: "Bad Request. Usually due to missing parameters, or invalid parameters."
    },
    "401": {
      content: { "application/json": { schema: {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"]
      } } },
      description: "Unauthorized. Due to missing or invalid authentication."
    },
    "403": {
      content: { "application/json": { schema: {
        type: "object",
        properties: { message: { type: "string" } }
      } } },
      description: "Forbidden. You do not have permission to access this resource or to perform this action."
    },
    "404": {
      content: { "application/json": { schema: {
        type: "object",
        properties: { message: { type: "string" } }
      } } },
      description: "Not Found. The requested resource was not found."
    },
    "429": {
      content: { "application/json": { schema: {
        type: "object",
        properties: { message: { type: "string" } }
      } } },
      description: "Too Many Requests. You have exceeded the rate limit. Try again later."
    },
    "500": {
      content: { "application/json": { schema: {
        type: "object",
        properties: { message: { type: "string" } }
      } } },
      description: "Internal Server Error. This is a problem with the server that you cannot fix."
    },
    ...responses
  };
}
async function generator(endpoints, config) {
  const components = { schemas: {} };
  Object.entries(endpoints).forEach(([_, value]) => {
    const options = value.options;
    if (!value.path || options.metadata?.SERVER_ONLY) return;
    if (options.method === "GET") paths[value.path] = { get: {
      tags: ["Default", ...options.metadata?.openapi?.tags || []],
      description: options.metadata?.openapi?.description,
      operationId: options.metadata?.openapi?.operationId,
      security: [{ bearerAuth: [] }],
      parameters: getParameters(options),
      responses: getResponse(options.metadata?.openapi?.responses)
    } };
    if (options.method === "POST") {
      const body = getRequestBody(options);
      paths[value.path] = { post: {
        tags: ["Default", ...options.metadata?.openapi?.tags || []],
        description: options.metadata?.openapi?.description,
        operationId: options.metadata?.openapi?.operationId,
        security: [{ bearerAuth: [] }],
        parameters: getParameters(options),
        ...body ? { requestBody: body } : { requestBody: { content: { "application/json": { schema: {
          type: "object",
          properties: {}
        } } } } },
        responses: getResponse(options.metadata?.openapi?.responses)
      } };
    }
  });
  return {
    openapi: "3.1.1",
    info: {
      title: "Better Auth",
      description: "API Reference for your Better Auth Instance",
      version: "1.1.0"
    },
    components,
    security: [{ apiKeyCookie: [] }],
    servers: [{ url: config?.url }],
    tags: [{
      name: "Default",
      description: "Default endpoints that are included with Better Auth by default. These endpoints are not part of any plugin."
    }],
    paths
  };
}
const getHTML = (apiReference, config) => `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      type="application/json">
    ${JSON.stringify(apiReference)}
    <\/script>
	 <script>
      var configuration = {
	  	favicon: ${config?.logo ? `data:image/svg+xml;utf8,${encodeURIComponent(config.logo)}` : void 0} ,
	   	theme: ${config?.theme || "saturn"},
        metaData: {
			title: ${config?.title || "Open API Reference"},
			description: ${config?.description || "Better Call Open API"},
		}
      }
      document.getElementById('api-reference').dataset.configuration =
        JSON.stringify(configuration)
    <\/script>
	  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"><\/script>
  </body>
</html>`;
const createRouter$1 = (endpoints, config) => {
  if (!config?.openapi?.disabled) {
    const openapi = {
      path: "/api/reference",
      ...config?.openapi
    };
    endpoints["openapi"] = createEndpoint(openapi.path, { method: "GET" }, async (c) => {
      const schema = await generator(endpoints);
      return new Response(getHTML(schema, openapi.scalar), { headers: { "Content-Type": "text/html" } });
    });
  }
  const router = createRouter();
  const middlewareRouter = createRouter();
  for (const endpoint of Object.values(endpoints)) {
    if (!endpoint.options || !endpoint.path) continue;
    if (endpoint.options?.metadata?.SERVER_ONLY) continue;
    const methods = Array.isArray(endpoint.options?.method) ? endpoint.options.method : [endpoint.options?.method];
    for (const method of methods) addRoute(router, method, endpoint.path, endpoint);
  }
  if (config?.routerMiddleware?.length) for (const { path, middleware } of config.routerMiddleware) addRoute(middlewareRouter, "*", path, middleware);
  const processRequest = async (request) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const path = config?.basePath && config.basePath !== "/" ? pathname.split(config.basePath).reduce((acc, curr, index) => {
      if (index !== 0) if (index > 1) acc.push(`${config.basePath}${curr}`);
      else acc.push(curr);
      return acc;
    }, []).join("") : url.pathname;
    if (!path?.length) return new Response(null, {
      status: 404,
      statusText: "Not Found"
    });
    if (/\/{2,}/.test(path)) return new Response(null, {
      status: 404,
      statusText: "Not Found"
    });
    const route = findRoute(router, request.method, path);
    if (path.endsWith("/") !== route?.data?.path?.endsWith("/") && !config?.skipTrailingSlashes) return new Response(null, {
      status: 404,
      statusText: "Not Found"
    });
    if (!route?.data) return new Response(null, {
      status: 404,
      statusText: "Not Found"
    });
    const query = {};
    url.searchParams.forEach((value, key) => {
      if (key in query) if (Array.isArray(query[key])) query[key].push(value);
      else query[key] = [query[key], value];
      else query[key] = value;
    });
    const handler = route.data;
    try {
      const allowedMediaTypes = handler.options.metadata?.allowedMediaTypes || config?.allowedMediaTypes;
      const context = {
        path,
        method: request.method,
        headers: request.headers,
        params: route.params ? JSON.parse(JSON.stringify(route.params)) : {},
        request,
        body: handler.options.disableBody ? void 0 : await getBody(handler.options.cloneRequest ? request.clone() : request, allowedMediaTypes),
        query,
        _flag: "router",
        asResponse: true,
        context: config?.routerContext
      };
      const middlewareRoutes = findAllRoutes(middlewareRouter, "*", path);
      if (middlewareRoutes?.length) for (const { data: middleware, params } of middlewareRoutes) {
        const res = await middleware({
          ...context,
          params,
          asResponse: false
        });
        if (res instanceof Response) return res;
      }
      return await handler(context);
    } catch (error) {
      if (config?.onError) try {
        const errorResponse = await config.onError(error);
        if (errorResponse instanceof Response) return toResponse(errorResponse);
      } catch (error$1) {
        if (isAPIError(error$1)) return toResponse(error$1);
        throw error$1;
      }
      if (config?.throwError) throw error;
      if (isAPIError(error)) return toResponse(error);
      console.error(`# SERVER_ERROR: `, error);
      return new Response(null, {
        status: 500,
        statusText: "Internal Server Error"
      });
    }
  };
  return {
    handler: async (request) => {
      const onReq = await config?.onRequest?.(request);
      if (onReq instanceof Response) return onReq;
      const res = await processRequest(onReq instanceof Request ? onReq : request);
      const onRes = await config?.onResponse?.(res);
      if (onRes instanceof Response) return onRes;
      return res;
    },
    endpoints
  };
};
export {
  APIError as A,
  createEndpoint as a,
  createRouter$1 as b,
  createMiddleware as c,
  toResponse as t
};
