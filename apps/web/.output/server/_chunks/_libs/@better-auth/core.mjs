import { c as createMiddleware, a as createEndpoint, A as APIError } from "../../../_libs/better-call.mjs";
import { o as object, a as string, d as date, b as string$1, n as number, c as boolean, _ as _enum } from "../../../_libs/zod.mjs";
import { c as createRandomStringGenerator, b as base64Url, a as base64 } from "./utils.mjs";
import { b as betterFetch } from "../@better-fetch/fetch.mjs";
import { d as decodeJwt, a as decodeProtectedHeader, j as jwtVerify, c as createRemoteJWKSet, i as importJWK } from "../../../_libs/jose.mjs";
const AsyncLocalStoragePromise = import(
  /* @vite-ignore */
  /* webpackIgnore: true */
  "node:async_hooks"
).then((mod) => mod.AsyncLocalStorage).catch((err) => {
  if ("AsyncLocalStorage" in globalThis) return globalThis.AsyncLocalStorage;
  if (typeof window !== "undefined") return null;
  console.warn("[better-auth] Warning: AsyncLocalStorage is not available in this environment. Some features may not work as expected.");
  console.warn("[better-auth] Please read more about this warning at https://better-auth.com/docs/installation#mount-handler");
  console.warn("[better-auth] If you are using Cloudflare Workers, please see: https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag");
  throw err;
});
async function getAsyncLocalStorage() {
  const mod = await AsyncLocalStoragePromise;
  if (mod === null) throw new Error("getAsyncLocalStorage is only available in server code");
  else return mod;
}
const symbol$2 = Symbol.for("better-auth:endpoint-context-async-storage");
let currentContextAsyncStorage = null;
const ensureAsyncStorage$2 = async () => {
  if (!currentContextAsyncStorage || globalThis[symbol$2] === void 0) {
    currentContextAsyncStorage = new (await getAsyncLocalStorage())();
    globalThis[symbol$2] = currentContextAsyncStorage;
  }
  return currentContextAsyncStorage || globalThis[symbol$2];
};
async function getCurrentAuthContext() {
  const context = (await ensureAsyncStorage$2()).getStore();
  if (!context) throw new Error("No auth context found. Please make sure you are calling this function within a `runWithEndpointContext` callback.");
  return context;
}
async function runWithEndpointContext(context, fn) {
  return (await ensureAsyncStorage$2()).run(context, fn);
}
const symbol$1 = Symbol.for("better-auth:request-state-async-storage");
let requestStateAsyncStorage = null;
const ensureAsyncStorage$1 = async () => {
  if (!requestStateAsyncStorage || globalThis[symbol$1] === void 0) {
    requestStateAsyncStorage = new (await getAsyncLocalStorage())();
    globalThis[symbol$1] = requestStateAsyncStorage;
  }
  return requestStateAsyncStorage || globalThis[symbol$1];
};
async function hasRequestState() {
  return (await ensureAsyncStorage$1()).getStore() !== void 0;
}
async function getCurrentRequestState() {
  const store = (await ensureAsyncStorage$1()).getStore();
  if (!store) throw new Error("No request state found. Please make sure you are calling this function within a `runWithRequestState` callback.");
  return store;
}
async function runWithRequestState(store, fn) {
  return (await ensureAsyncStorage$1()).run(store, fn);
}
function defineRequestState(initFn) {
  const ref = Object.freeze({});
  return {
    get ref() {
      return ref;
    },
    async get() {
      const store = await getCurrentRequestState();
      if (!store.has(ref)) {
        const initialValue = await initFn();
        store.set(ref, initialValue);
        return initialValue;
      }
      return store.get(ref);
    },
    async set(value) {
      (await getCurrentRequestState()).set(ref, value);
    }
  };
}
const symbol = Symbol.for("better-auth:transaction-adapter-async-storage");
let currentAdapterAsyncStorage = null;
const ensureAsyncStorage = async () => {
  if (!currentAdapterAsyncStorage || globalThis[symbol] === void 0) {
    currentAdapterAsyncStorage = new (await getAsyncLocalStorage())();
    globalThis[symbol] = currentAdapterAsyncStorage;
  }
  return currentAdapterAsyncStorage || globalThis[symbol];
};
const getCurrentAdapter = async (fallback) => {
  return ensureAsyncStorage().then((als) => {
    return als.getStore() || fallback;
  }).catch(() => {
    return fallback;
  });
};
const runWithAdapter = async (adapter, fn) => {
  let called = true;
  return ensureAsyncStorage().then((als) => {
    called = true;
    return als.run(adapter, fn);
  }).catch((err) => {
    if (!called) return fn();
    throw err;
  });
};
const runWithTransaction = async (adapter, fn) => {
  let called = true;
  return ensureAsyncStorage().then((als) => {
    called = true;
    return adapter.transaction(async (trx) => {
      return als.run(trx, fn);
    });
  }).catch((err) => {
    if (!called) return fn();
    throw err;
  });
};
const _envShim = /* @__PURE__ */ Object.create(null);
const _getEnv = (useShim) => globalThis.process?.env || globalThis.Deno?.env.toObject() || globalThis.__env__ || (useShim ? _envShim : globalThis);
const env = new Proxy(_envShim, {
  get(_, prop) {
    return _getEnv()[prop] ?? _envShim[prop];
  },
  has(_, prop) {
    return prop in _getEnv() || prop in _envShim;
  },
  set(_, prop, value) {
    const env$1 = _getEnv(true);
    env$1[prop] = value;
    return true;
  },
  deleteProperty(_, prop) {
    if (!prop) return false;
    const env$1 = _getEnv(true);
    delete env$1[prop];
    return true;
  },
  ownKeys() {
    const env$1 = _getEnv(true);
    return Object.keys(env$1);
  }
});
function toBoolean(val) {
  return val ? val !== "false" : false;
}
const nodeENV = typeof process !== "undefined" && process.env && "production" || "";
const isProduction = nodeENV === "production";
const isDevelopment = () => nodeENV === "dev" || nodeENV === "development";
const isTest = () => nodeENV === "test" || toBoolean(env.TEST);
function getEnvVar(key, fallback) {
  if (typeof process !== "undefined" && process.env) return process.env[key] ?? fallback;
  if (typeof Deno !== "undefined") return Deno.env.get(key) ?? fallback;
  if (typeof Bun !== "undefined") return Bun.env[key] ?? fallback;
  return fallback;
}
function getBooleanEnvVar(key, fallback = true) {
  const value = getEnvVar(key);
  if (!value) return fallback;
  return value !== "0" && value.toLowerCase() !== "false" && value !== "";
}
const ENV = Object.freeze({
  get BETTER_AUTH_SECRET() {
    return getEnvVar("BETTER_AUTH_SECRET");
  },
  get AUTH_SECRET() {
    return getEnvVar("AUTH_SECRET");
  },
  get BETTER_AUTH_TELEMETRY() {
    return getEnvVar("BETTER_AUTH_TELEMETRY");
  },
  get BETTER_AUTH_TELEMETRY_ID() {
    return getEnvVar("BETTER_AUTH_TELEMETRY_ID");
  },
  get NODE_ENV() {
    return getEnvVar("NODE_ENV", "development");
  },
  get PACKAGE_VERSION() {
    return getEnvVar("PACKAGE_VERSION", "0.0.0");
  },
  get BETTER_AUTH_TELEMETRY_ENDPOINT() {
    return getEnvVar("BETTER_AUTH_TELEMETRY_ENDPOINT", "https://telemetry.better-auth.com/v1/track");
  }
});
const COLORS_2 = 1;
const COLORS_16 = 4;
const COLORS_256 = 8;
const COLORS_16m = 24;
const TERM_ENVS = {
  eterm: COLORS_16,
  cons25: COLORS_16,
  console: COLORS_16,
  cygwin: COLORS_16,
  dtterm: COLORS_16,
  gnome: COLORS_16,
  hurd: COLORS_16,
  jfbterm: COLORS_16,
  konsole: COLORS_16,
  kterm: COLORS_16,
  mlterm: COLORS_16,
  mosh: COLORS_16m,
  putty: COLORS_16,
  st: COLORS_16,
  "rxvt-unicode-24bit": COLORS_16m,
  terminator: COLORS_16m,
  "xterm-kitty": COLORS_16m
};
const CI_ENVS_MAP = new Map(Object.entries({
  APPVEYOR: COLORS_256,
  BUILDKITE: COLORS_256,
  CIRCLECI: COLORS_16m,
  DRONE: COLORS_256,
  GITEA_ACTIONS: COLORS_16m,
  GITHUB_ACTIONS: COLORS_16m,
  GITLAB_CI: COLORS_256,
  TRAVIS: COLORS_256
}));
const TERM_ENVS_REG_EXP = [
  /ansi/,
  /color/,
  /linux/,
  /direct/,
  /^con[0-9]*x[0-9]/,
  /^rxvt/,
  /^screen/,
  /^xterm/,
  /^vt100/,
  /^vt220/
];
function getColorDepth() {
  if (getEnvVar("FORCE_COLOR") !== void 0) switch (getEnvVar("FORCE_COLOR")) {
    case "":
    case "1":
    case "true":
      return COLORS_16;
    case "2":
      return COLORS_256;
    case "3":
      return COLORS_16m;
    default:
      return COLORS_2;
  }
  if (getEnvVar("NODE_DISABLE_COLORS") !== void 0 && getEnvVar("NODE_DISABLE_COLORS") !== "" || getEnvVar("NO_COLOR") !== void 0 && getEnvVar("NO_COLOR") !== "" || getEnvVar("TERM") === "dumb") return COLORS_2;
  if (getEnvVar("TMUX")) return COLORS_16m;
  if ("TF_BUILD" in env && "AGENT_NAME" in env) return COLORS_16;
  if ("CI" in env) {
    for (const { 0: envName, 1: colors } of CI_ENVS_MAP) if (envName in env) return colors;
    if (getEnvVar("CI_NAME") === "codeship") return COLORS_256;
    return COLORS_2;
  }
  if ("TEAMCITY_VERSION" in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.exec(getEnvVar("TEAMCITY_VERSION")) !== null ? COLORS_16 : COLORS_2;
  switch (getEnvVar("TERM_PROGRAM")) {
    case "iTerm.app":
      if (!getEnvVar("TERM_PROGRAM_VERSION") || /^[0-2]\./.exec(getEnvVar("TERM_PROGRAM_VERSION")) !== null) return COLORS_256;
      return COLORS_16m;
    case "HyperTerm":
    case "MacTerm":
      return COLORS_16m;
    case "Apple_Terminal":
      return COLORS_256;
  }
  if (getEnvVar("COLORTERM") === "truecolor" || getEnvVar("COLORTERM") === "24bit") return COLORS_16m;
  if (getEnvVar("TERM")) {
    if (/truecolor/.exec(getEnvVar("TERM")) !== null) return COLORS_16m;
    if (/^xterm-256/.exec(getEnvVar("TERM")) !== null) return COLORS_256;
    const termEnv = getEnvVar("TERM").toLowerCase();
    if (TERM_ENVS[termEnv]) return TERM_ENVS[termEnv];
    if (TERM_ENVS_REG_EXP.some((term) => term.exec(termEnv) !== null)) return COLORS_16;
  }
  if (getEnvVar("COLORTERM")) return COLORS_16;
  return COLORS_2;
}
const TTY_COLORS = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  dim: "\x1B[2m",
  fg: {
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    magenta: "\x1B[35m"
  },
  bg: {
    black: "\x1B[40m"
  }
};
const levels = [
  "debug",
  "info",
  "success",
  "warn",
  "error"
];
function shouldPublishLog(currentLogLevel, logLevel) {
  return levels.indexOf(logLevel) >= levels.indexOf(currentLogLevel);
}
const levelColors = {
  info: TTY_COLORS.fg.blue,
  success: TTY_COLORS.fg.green,
  warn: TTY_COLORS.fg.yellow,
  error: TTY_COLORS.fg.red,
  debug: TTY_COLORS.fg.magenta
};
const formatMessage = (level, message, colorsEnabled) => {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  if (colorsEnabled) return `${TTY_COLORS.dim}${timestamp}${TTY_COLORS.reset} ${levelColors[level]}${level.toUpperCase()}${TTY_COLORS.reset} ${TTY_COLORS.bright}[Better Auth]:${TTY_COLORS.reset} ${message}`;
  return `${timestamp} ${level.toUpperCase()} [Better Auth]: ${message}`;
};
const createLogger = (options) => {
  const enabled = options?.disabled !== true;
  const logLevel = options?.level ?? "error";
  const colorsEnabled = options?.disableColors !== void 0 ? !options.disableColors : getColorDepth() !== 1;
  const LogFunc = (level, message, args = []) => {
    if (!enabled || !shouldPublishLog(logLevel, level)) return;
    const formattedMessage = formatMessage(level, message, colorsEnabled);
    if (!options || typeof options.log !== "function") {
      if (level === "error") console.error(formattedMessage, ...args);
      else if (level === "warn") console.warn(formattedMessage, ...args);
      else console.log(formattedMessage, ...args);
      return;
    }
    options.log(level === "success" ? "info" : level, message, ...args);
  };
  return {
    ...Object.fromEntries(levels.map((level) => [level, (...[message, ...args]) => LogFunc(level, message, args)])),
    get level() {
      return logLevel;
    }
  };
};
const logger = createLogger();
function deprecate(fn, message, logger$1) {
  let warned = false;
  return function(...args) {
    if (!warned) {
      (logger$1?.warn ?? console.warn)(`[Deprecation] ${message}`);
      warned = true;
    }
    return fn.apply(this, args);
  };
}
function defineErrorCodes(codes) {
  return codes;
}
const generateId = (size) => {
  return createRandomStringGenerator("a-z", "A-Z", "0-9")(size || 32);
};
function safeJSONParse(data) {
  function reviver(_, value) {
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)) {
        const date2 = new Date(value);
        if (!isNaN(date2.getTime())) return date2;
      }
    }
    return value;
  }
  try {
    if (typeof data !== "string") return data;
    return JSON.parse(data, reviver);
  } catch (e) {
    logger.error("Error parsing JSON", { error: e });
    return null;
  }
}
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
const BASE_ERROR_CODES = defineErrorCodes({
  USER_NOT_FOUND: "User not found",
  FAILED_TO_CREATE_USER: "Failed to create user",
  FAILED_TO_CREATE_SESSION: "Failed to create session",
  FAILED_TO_UPDATE_USER: "Failed to update user",
  FAILED_TO_GET_SESSION: "Failed to get session",
  INVALID_PASSWORD: "Invalid password",
  INVALID_EMAIL: "Invalid email",
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "Social account already linked",
  PROVIDER_NOT_FOUND: "Provider not found",
  INVALID_TOKEN: "Invalid token",
  ID_TOKEN_NOT_SUPPORTED: "id_token not supported",
  FAILED_TO_GET_USER_INFO: "Failed to get user info",
  USER_EMAIL_NOT_FOUND: "User email not found",
  EMAIL_NOT_VERIFIED: "Email not verified",
  PASSWORD_TOO_SHORT: "Password too short",
  PASSWORD_TOO_LONG: "Password too long",
  USER_ALREADY_EXISTS: "User already exists.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "User already exists. Use another email.",
  EMAIL_CAN_NOT_BE_UPDATED: "Email can not be updated",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Credential account not found",
  SESSION_EXPIRED: "Session expired. Re-authenticate to perform this action.",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "You can't unlink your last account",
  ACCOUNT_NOT_FOUND: "Account not found",
  USER_ALREADY_HAS_PASSWORD: "User already has a password. Provide that to delete the account.",
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: "Cross-site navigation login blocked. This request appears to be a CSRF attack.",
  VERIFICATION_EMAIL_NOT_ENABLED: "Verification email isn't enabled",
  EMAIL_ALREADY_VERIFIED: "Email is already verified",
  EMAIL_MISMATCH: "Email mismatch",
  SESSION_NOT_FRESH: "Session is not fresh",
  LINKED_ACCOUNT_ALREADY_EXISTS: "Linked account already exists",
  INVALID_ORIGIN: "Invalid origin",
  INVALID_CALLBACK_URL: "Invalid callbackURL",
  INVALID_REDIRECT_URL: "Invalid redirectURL",
  INVALID_ERROR_CALLBACK_URL: "Invalid errorCallbackURL",
  INVALID_NEW_USER_CALLBACK_URL: "Invalid newUserCallbackURL",
  MISSING_OR_NULL_ORIGIN: "Missing or null Origin",
  CALLBACK_URL_REQUIRED: "callbackURL is required",
  FAILED_TO_CREATE_VERIFICATION: "Unable to create verification",
  FIELD_NOT_ALLOWED: "Field not allowed to be set",
  ASYNC_VALIDATION_NOT_SUPPORTED: "Async validation is not supported",
  VALIDATION_ERROR: "Validation Error",
  MISSING_FIELD: "Field is required"
});
var BetterAuthError = class extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "BetterAuthError";
    this.message = message;
    this.cause = cause;
    this.stack = "";
  }
};
const optionsMiddleware = createMiddleware(async () => {
  return {};
});
const createAuthMiddleware = createMiddleware.create({ use: [optionsMiddleware, createMiddleware(async () => {
  return {};
})] });
const use = [optionsMiddleware];
function createAuthEndpoint(pathOrOptions, handlerOrOptions, handlerOrNever) {
  const path = typeof pathOrOptions === "string" ? pathOrOptions : void 0;
  const options = typeof handlerOrOptions === "object" ? handlerOrOptions : pathOrOptions;
  const handler = typeof handlerOrOptions === "function" ? handlerOrOptions : handlerOrNever;
  if (path) return createEndpoint(path, {
    ...options,
    use: [...options?.use || [], ...use]
  }, async (ctx) => runWithEndpointContext(ctx, () => handler(ctx)));
  return createEndpoint({
    ...options,
    use: [...options?.use || [], ...use]
  }, async (ctx) => runWithEndpointContext(ctx, () => handler(ctx)));
}
const getAuthTables = (options) => {
  const pluginSchema = (options.plugins ?? []).reduce((acc, plugin) => {
    const schema = plugin.schema;
    if (!schema) return acc;
    for (const [key, value] of Object.entries(schema)) acc[key] = {
      fields: {
        ...acc[key]?.fields,
        ...value.fields
      },
      modelName: value.modelName || key
    };
    return acc;
  }, {});
  const shouldAddRateLimitTable = options.rateLimit?.storage === "database";
  const rateLimitTable = { rateLimit: {
    modelName: options.rateLimit?.modelName || "rateLimit",
    fields: {
      key: {
        type: "string",
        fieldName: options.rateLimit?.fields?.key || "key"
      },
      count: {
        type: "number",
        fieldName: options.rateLimit?.fields?.count || "count"
      },
      lastRequest: {
        type: "number",
        bigint: true,
        fieldName: options.rateLimit?.fields?.lastRequest || "lastRequest"
      }
    }
  } };
  const { user, session, account, verification, ...pluginTables } = pluginSchema;
  const sessionTable = { session: {
    modelName: options.session?.modelName || "session",
    fields: {
      expiresAt: {
        type: "date",
        required: true,
        fieldName: options.session?.fields?.expiresAt || "expiresAt"
      },
      token: {
        type: "string",
        required: true,
        fieldName: options.session?.fields?.token || "token",
        unique: true
      },
      createdAt: {
        type: "date",
        required: true,
        fieldName: options.session?.fields?.createdAt || "createdAt",
        defaultValue: () => /* @__PURE__ */ new Date()
      },
      updatedAt: {
        type: "date",
        required: true,
        fieldName: options.session?.fields?.updatedAt || "updatedAt",
        onUpdate: () => /* @__PURE__ */ new Date()
      },
      ipAddress: {
        type: "string",
        required: false,
        fieldName: options.session?.fields?.ipAddress || "ipAddress"
      },
      userAgent: {
        type: "string",
        required: false,
        fieldName: options.session?.fields?.userAgent || "userAgent"
      },
      userId: {
        type: "string",
        fieldName: options.session?.fields?.userId || "userId",
        references: {
          model: options.user?.modelName || "user",
          field: "id",
          onDelete: "cascade"
        },
        required: true,
        index: true
      },
      ...session?.fields,
      ...options.session?.additionalFields
    },
    order: 2
  } };
  return {
    user: {
      modelName: options.user?.modelName || "user",
      fields: {
        name: {
          type: "string",
          required: true,
          fieldName: options.user?.fields?.name || "name",
          sortable: true
        },
        email: {
          type: "string",
          unique: true,
          required: true,
          fieldName: options.user?.fields?.email || "email",
          sortable: true
        },
        emailVerified: {
          type: "boolean",
          defaultValue: false,
          required: true,
          fieldName: options.user?.fields?.emailVerified || "emailVerified",
          input: false
        },
        image: {
          type: "string",
          required: false,
          fieldName: options.user?.fields?.image || "image"
        },
        createdAt: {
          type: "date",
          defaultValue: () => /* @__PURE__ */ new Date(),
          required: true,
          fieldName: options.user?.fields?.createdAt || "createdAt"
        },
        updatedAt: {
          type: "date",
          defaultValue: () => /* @__PURE__ */ new Date(),
          onUpdate: () => /* @__PURE__ */ new Date(),
          required: true,
          fieldName: options.user?.fields?.updatedAt || "updatedAt"
        },
        ...user?.fields,
        ...options.user?.additionalFields
      },
      order: 1
    },
    ...!options.secondaryStorage || options.session?.storeSessionInDatabase ? sessionTable : {},
    account: {
      modelName: options.account?.modelName || "account",
      fields: {
        accountId: {
          type: "string",
          required: true,
          fieldName: options.account?.fields?.accountId || "accountId"
        },
        providerId: {
          type: "string",
          required: true,
          fieldName: options.account?.fields?.providerId || "providerId"
        },
        userId: {
          type: "string",
          references: {
            model: options.user?.modelName || "user",
            field: "id",
            onDelete: "cascade"
          },
          required: true,
          fieldName: options.account?.fields?.userId || "userId",
          index: true
        },
        accessToken: {
          type: "string",
          required: false,
          fieldName: options.account?.fields?.accessToken || "accessToken"
        },
        refreshToken: {
          type: "string",
          required: false,
          fieldName: options.account?.fields?.refreshToken || "refreshToken"
        },
        idToken: {
          type: "string",
          required: false,
          fieldName: options.account?.fields?.idToken || "idToken"
        },
        accessTokenExpiresAt: {
          type: "date",
          required: false,
          fieldName: options.account?.fields?.accessTokenExpiresAt || "accessTokenExpiresAt"
        },
        refreshTokenExpiresAt: {
          type: "date",
          required: false,
          fieldName: options.account?.fields?.refreshTokenExpiresAt || "refreshTokenExpiresAt"
        },
        scope: {
          type: "string",
          required: false,
          fieldName: options.account?.fields?.scope || "scope"
        },
        password: {
          type: "string",
          required: false,
          fieldName: options.account?.fields?.password || "password"
        },
        createdAt: {
          type: "date",
          required: true,
          fieldName: options.account?.fields?.createdAt || "createdAt",
          defaultValue: () => /* @__PURE__ */ new Date()
        },
        updatedAt: {
          type: "date",
          required: true,
          fieldName: options.account?.fields?.updatedAt || "updatedAt",
          onUpdate: () => /* @__PURE__ */ new Date()
        },
        ...account?.fields,
        ...options.account?.additionalFields
      },
      order: 3
    },
    verification: {
      modelName: options.verification?.modelName || "verification",
      fields: {
        identifier: {
          type: "string",
          required: true,
          fieldName: options.verification?.fields?.identifier || "identifier",
          index: true
        },
        value: {
          type: "string",
          required: true,
          fieldName: options.verification?.fields?.value || "value"
        },
        expiresAt: {
          type: "date",
          required: true,
          fieldName: options.verification?.fields?.expiresAt || "expiresAt"
        },
        createdAt: {
          type: "date",
          required: true,
          defaultValue: () => /* @__PURE__ */ new Date(),
          fieldName: options.verification?.fields?.createdAt || "createdAt"
        },
        updatedAt: {
          type: "date",
          required: true,
          defaultValue: () => /* @__PURE__ */ new Date(),
          onUpdate: () => /* @__PURE__ */ new Date(),
          fieldName: options.verification?.fields?.updatedAt || "updatedAt"
        },
        ...verification?.fields,
        ...options.verification?.additionalFields
      },
      order: 4
    },
    ...pluginTables,
    ...shouldAddRateLimitTable ? rateLimitTable : {}
  };
};
const coreSchema = object({
  id: string(),
  createdAt: date().default(() => /* @__PURE__ */ new Date()),
  updatedAt: date().default(() => /* @__PURE__ */ new Date())
});
const accountSchema = coreSchema.extend({
  providerId: string(),
  accountId: string(),
  userId: string$1(),
  accessToken: string().nullish(),
  refreshToken: string().nullish(),
  idToken: string().nullish(),
  accessTokenExpiresAt: date().nullish(),
  refreshTokenExpiresAt: date().nullish(),
  scope: string().nullish(),
  password: string().nullish()
});
const rateLimitSchema = object({
  key: string(),
  count: number(),
  lastRequest: number()
});
const sessionSchema = coreSchema.extend({
  userId: string$1(),
  expiresAt: date(),
  token: string(),
  ipAddress: string().nullish(),
  userAgent: string().nullish()
});
const userSchema = coreSchema.extend({
  email: string().transform((val) => val.toLowerCase()),
  emailVerified: boolean().default(false),
  name: string(),
  image: string().nullish()
});
const verificationSchema = coreSchema.extend({
  value: string(),
  expiresAt: date(),
  identifier: string()
});
const import___better_auth_core_db = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  accountSchema,
  coreSchema,
  getAuthTables,
  rateLimitSchema,
  sessionSchema,
  userSchema,
  verificationSchema
});
const initGetDefaultModelName = ({ usePlural, schema }) => {
  const getDefaultModelName = (model) => {
    if (usePlural && model.charAt(model.length - 1) === "s") {
      let pluralessModel = model.slice(0, -1);
      let m$1 = schema[pluralessModel] ? pluralessModel : void 0;
      if (!m$1) m$1 = Object.entries(schema).find(([_, f]) => f.modelName === pluralessModel)?.[0];
      if (m$1) return m$1;
    }
    let m = schema[model] ? model : void 0;
    if (!m) m = Object.entries(schema).find(([_, f]) => f.modelName === model)?.[0];
    if (!m) throw new BetterAuthError(`Model "${model}" not found in schema`);
    return m;
  };
  return getDefaultModelName;
};
const initGetDefaultFieldName = ({ schema, usePlural }) => {
  const getDefaultModelName = initGetDefaultModelName({
    schema,
    usePlural
  });
  const getDefaultFieldName = ({ field, model: unsafeModel }) => {
    if (field === "id" || field === "_id") return "id";
    const model = getDefaultModelName(unsafeModel);
    let f = schema[model]?.fields[field];
    if (!f) {
      const result = Object.entries(schema[model].fields).find(([_, f$1]) => f$1.fieldName === field);
      if (result) {
        f = result[1];
        field = result[0];
      }
    }
    if (!f) throw new BetterAuthError(`Field ${field} not found in model ${model}`);
    return field;
  };
  return getDefaultFieldName;
};
const initGetIdField = ({ usePlural, schema, disableIdGeneration, options, customIdGenerator, supportsUUIDs }) => {
  const getDefaultModelName = initGetDefaultModelName({
    usePlural,
    schema
  });
  const idField = ({ customModelName, forceAllowId }) => {
    const useNumberId = options.advanced?.database?.useNumberId || options.advanced?.database?.generateId === "serial";
    const useUUIDs = options.advanced?.database?.generateId === "uuid";
    let shouldGenerateId = (() => {
      if (disableIdGeneration) return false;
      else if (useNumberId && !forceAllowId) return false;
      else if (useUUIDs) return !supportsUUIDs;
      else return true;
    })();
    const model = getDefaultModelName(customModelName ?? "id");
    return {
      type: useNumberId ? "number" : "string",
      required: shouldGenerateId ? true : false,
      ...shouldGenerateId ? { defaultValue() {
        if (disableIdGeneration) return void 0;
        let generateId$1 = options.advanced?.database?.generateId;
        if (generateId$1 === false || useNumberId) return void 0;
        if (typeof generateId$1 === "function") return generateId$1({ model });
        if (customIdGenerator) return customIdGenerator({ model });
        if (generateId$1 === "uuid") return crypto.randomUUID();
        return generateId();
      } } : {},
      transform: {
        input: (value) => {
          if (!value) return void 0;
          if (useNumberId) {
            const numberValue = Number(value);
            if (isNaN(numberValue)) return;
            return numberValue;
          }
          if (useUUIDs) {
            if (shouldGenerateId && !forceAllowId) return value;
            if (disableIdGeneration) return void 0;
            if (supportsUUIDs) return void 0;
            if (forceAllowId && typeof value === "string") if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return value;
            else {
              const stack = (/* @__PURE__ */ new Error()).stack?.split("\n").filter((_, i) => i !== 1).join("\n").replace("Error:", "");
              logger.warn("[Adapter Factory] - Invalid UUID value for field `id` provided when `forceAllowId` is true. Generating a new UUID.", stack);
            }
            if (typeof value !== "string" && !supportsUUIDs) return crypto.randomUUID();
            return;
          }
          return value;
        },
        output: (value) => {
          if (!value) return void 0;
          return String(value);
        }
      }
    };
  };
  return idField;
};
const initGetFieldAttributes = ({ usePlural, schema, options, customIdGenerator, disableIdGeneration }) => {
  const getDefaultModelName = initGetDefaultModelName({
    usePlural,
    schema
  });
  const getDefaultFieldName = initGetDefaultFieldName({
    usePlural,
    schema
  });
  const idField = initGetIdField({
    usePlural,
    schema,
    options,
    customIdGenerator,
    disableIdGeneration
  });
  const getFieldAttributes = ({ model, field }) => {
    const defaultModelName = getDefaultModelName(model);
    const defaultFieldName = getDefaultFieldName({
      field,
      model: defaultModelName
    });
    const fields = schema[defaultModelName].fields;
    fields.id = idField({ customModelName: defaultModelName });
    const fieldAttributes = fields[defaultFieldName];
    if (!fieldAttributes) throw new BetterAuthError(`Field ${field} not found in model ${model}`);
    return fieldAttributes;
  };
  return getFieldAttributes;
};
const initGetFieldName = ({ schema, usePlural }) => {
  const getDefaultModelName = initGetDefaultModelName({
    schema,
    usePlural
  });
  const getDefaultFieldName = initGetDefaultFieldName({
    schema,
    usePlural
  });
  function getFieldName({ model: modelName, field: fieldName }) {
    const model = getDefaultModelName(modelName);
    const field = getDefaultFieldName({
      model,
      field: fieldName
    });
    return schema[model]?.fields[field]?.fieldName || field;
  }
  return getFieldName;
};
const initGetModelName = ({ usePlural, schema }) => {
  const getDefaultModelName = initGetDefaultModelName({
    schema,
    usePlural
  });
  const getModelName = (model) => {
    const defaultModelKey = getDefaultModelName(model);
    if (schema && schema[defaultModelKey] && schema[defaultModelKey].modelName !== model) return usePlural ? `${schema[defaultModelKey].modelName}s` : schema[defaultModelKey].modelName;
    return usePlural ? `${model}s` : model;
  };
  return getModelName;
};
function withApplyDefault(value, field, action) {
  if (action === "update") {
    if (value === void 0 && field.onUpdate !== void 0) {
      if (typeof field.onUpdate === "function") return field.onUpdate();
      return field.onUpdate;
    }
    return value;
  }
  if (action === "create") {
    if (value === void 0 || field.required === true && value === null) {
      if (field.defaultValue !== void 0) {
        if (typeof field.defaultValue === "function") return field.defaultValue();
        return field.defaultValue;
      }
    }
  }
  return value;
}
let debugLogs = [];
let transactionId = -1;
const createAsIsTransaction = (adapter) => (fn) => fn(adapter);
const createAdapterFactory = ({ adapter: customAdapter, config: cfg }) => (options) => {
  const uniqueAdapterFactoryInstanceId = Math.random().toString(36).substring(2, 15);
  const config = {
    ...cfg,
    supportsBooleans: cfg.supportsBooleans ?? true,
    supportsDates: cfg.supportsDates ?? true,
    supportsJSON: cfg.supportsJSON ?? false,
    adapterName: cfg.adapterName ?? cfg.adapterId,
    supportsNumericIds: cfg.supportsNumericIds ?? true,
    supportsUUIDs: cfg.supportsUUIDs ?? false,
    supportsArrays: cfg.supportsArrays ?? false,
    transaction: cfg.transaction ?? false,
    disableTransformInput: cfg.disableTransformInput ?? false,
    disableTransformOutput: cfg.disableTransformOutput ?? false,
    disableTransformJoin: cfg.disableTransformJoin ?? false
  };
  if ((options.advanced?.database?.useNumberId === true || options.advanced?.database?.generateId === "serial") && config.supportsNumericIds === false) throw new BetterAuthError(`[${config.adapterName}] Your database or database adapter does not support numeric ids. Please disable "useNumberId" in your config.`);
  const schema = getAuthTables(options);
  const debugLog = (...args) => {
    if (config.debugLogs === true || typeof config.debugLogs === "object") {
      const logger$2 = createLogger({ level: "info" });
      if (typeof config.debugLogs === "object" && "isRunningAdapterTests" in config.debugLogs) {
        if (config.debugLogs.isRunningAdapterTests) {
          args.shift();
          debugLogs.push({
            instance: uniqueAdapterFactoryInstanceId,
            args
          });
        }
        return;
      }
      if (typeof config.debugLogs === "object" && config.debugLogs.logCondition && !config.debugLogs.logCondition?.()) return;
      if (typeof args[0] === "object" && "method" in args[0]) {
        const method = args.shift().method;
        if (typeof config.debugLogs === "object") {
          if (method === "create" && !config.debugLogs.create) return;
          else if (method === "update" && !config.debugLogs.update) return;
          else if (method === "updateMany" && !config.debugLogs.updateMany) return;
          else if (method === "findOne" && !config.debugLogs.findOne) return;
          else if (method === "findMany" && !config.debugLogs.findMany) return;
          else if (method === "delete" && !config.debugLogs.delete) return;
          else if (method === "deleteMany" && !config.debugLogs.deleteMany) return;
          else if (method === "count" && !config.debugLogs.count) return;
        }
        logger$2.info(`[${config.adapterName}]`, ...args);
      } else logger$2.info(`[${config.adapterName}]`, ...args);
    }
  };
  const logger$1 = createLogger(options.logger);
  const getDefaultModelName = initGetDefaultModelName({
    usePlural: config.usePlural,
    schema
  });
  const getDefaultFieldName = initGetDefaultFieldName({
    usePlural: config.usePlural,
    schema
  });
  const getModelName = initGetModelName({
    usePlural: config.usePlural,
    schema
  });
  const getFieldName = initGetFieldName({
    schema,
    usePlural: config.usePlural
  });
  const idField = initGetIdField({
    schema,
    options,
    usePlural: config.usePlural,
    disableIdGeneration: config.disableIdGeneration,
    customIdGenerator: config.customIdGenerator,
    supportsUUIDs: config.supportsUUIDs
  });
  const getFieldAttributes = initGetFieldAttributes({
    schema,
    options,
    usePlural: config.usePlural,
    disableIdGeneration: config.disableIdGeneration,
    customIdGenerator: config.customIdGenerator
  });
  const transformInput = async (data, defaultModelName, action, forceAllowId) => {
    const transformedData = {};
    const fields = schema[defaultModelName].fields;
    const newMappedKeys = config.mapKeysTransformInput ?? {};
    const useNumberId = options.advanced?.database?.useNumberId || options.advanced?.database?.generateId === "serial";
    fields.id = idField({
      customModelName: defaultModelName,
      forceAllowId: forceAllowId && "id" in data
    });
    for (const field in fields) {
      let value = data[field];
      const fieldAttributes = fields[field];
      let newFieldName = newMappedKeys[field] || fields[field].fieldName || field;
      if (value === void 0 && (fieldAttributes.defaultValue === void 0 && !fieldAttributes.transform?.input && !(action === "update" && fieldAttributes.onUpdate) || action === "update" && !fieldAttributes.onUpdate)) continue;
      if (fieldAttributes && fieldAttributes.type === "date" && !(value instanceof Date) && typeof value === "string") try {
        value = new Date(value);
      } catch {
        logger$1.error("[Adapter Factory] Failed to convert string to date", {
          value,
          field
        });
      }
      let newValue = withApplyDefault(value, fieldAttributes, action);
      if (fieldAttributes.transform?.input) newValue = await fieldAttributes.transform.input(newValue);
      if (fieldAttributes.references?.field === "id" && useNumberId) if (Array.isArray(newValue)) newValue = newValue.map((x) => x !== null ? Number(x) : null);
      else newValue = newValue !== null ? Number(newValue) : null;
      else if (config.supportsJSON === false && typeof newValue === "object" && fieldAttributes.type === "json") newValue = JSON.stringify(newValue);
      else if (config.supportsArrays === false && Array.isArray(newValue) && (fieldAttributes.type === "string[]" || fieldAttributes.type === "number[]")) newValue = JSON.stringify(newValue);
      else if (config.supportsDates === false && newValue instanceof Date && fieldAttributes.type === "date") newValue = newValue.toISOString();
      else if (config.supportsBooleans === false && typeof newValue === "boolean") newValue = newValue ? 1 : 0;
      if (config.customTransformInput) newValue = config.customTransformInput({
        data: newValue,
        action,
        field: newFieldName,
        fieldAttributes,
        model: getModelName(defaultModelName),
        schema,
        options
      });
      if (newValue !== void 0) transformedData[newFieldName] = newValue;
    }
    return transformedData;
  };
  const transformOutput = async (data, unsafe_model, select = [], join) => {
    const transformSingleOutput = async (data$1, unsafe_model$1, select$1 = []) => {
      if (!data$1) return null;
      const newMappedKeys = config.mapKeysTransformOutput ?? {};
      const transformedData$1 = {};
      const tableSchema = schema[getDefaultModelName(unsafe_model$1)].fields;
      const idKey = Object.entries(newMappedKeys).find(([_, v]) => v === "id")?.[0];
      tableSchema[idKey ?? "id"] = { type: options.advanced?.database?.useNumberId || options.advanced?.database?.generateId === "serial" ? "number" : "string" };
      for (const key in tableSchema) {
        if (select$1.length && !select$1.includes(key)) continue;
        const field = tableSchema[key];
        if (field) {
          const originalKey = field.fieldName || key;
          let newValue = data$1[Object.entries(newMappedKeys).find(([_, v]) => v === originalKey)?.[0] || originalKey];
          if (field.transform?.output) newValue = await field.transform.output(newValue);
          let newFieldName = newMappedKeys[key] || key;
          if (originalKey === "id" || field.references?.field === "id") {
            if (typeof newValue !== "undefined" && newValue !== null) newValue = String(newValue);
          } else if (config.supportsJSON === false && typeof newValue === "string" && field.type === "json") newValue = safeJSONParse(newValue);
          else if (config.supportsArrays === false && typeof newValue === "string" && (field.type === "string[]" || field.type === "number[]")) newValue = safeJSONParse(newValue);
          else if (config.supportsDates === false && typeof newValue === "string" && field.type === "date") newValue = new Date(newValue);
          else if (config.supportsBooleans === false && typeof newValue === "number" && field.type === "boolean") newValue = newValue === 1;
          if (config.customTransformOutput) newValue = config.customTransformOutput({
            data: newValue,
            field: newFieldName,
            fieldAttributes: field,
            select: select$1,
            model: getModelName(unsafe_model$1),
            schema,
            options
          });
          transformedData$1[newFieldName] = newValue;
        }
      }
      return transformedData$1;
    };
    if (!join || Object.keys(join).length === 0) return await transformSingleOutput(data, unsafe_model, select);
    unsafe_model = getDefaultModelName(unsafe_model);
    let transformedData = await transformSingleOutput(data, unsafe_model, select);
    const requiredModels = Object.entries(join).map(([model, joinConfig]) => ({
      modelName: getModelName(model),
      defaultModelName: getDefaultModelName(model),
      joinConfig
    }));
    if (!data) return null;
    for (const { modelName, defaultModelName, joinConfig } of requiredModels) {
      let joinedData = await (async () => {
        if (options.experimental?.joins) return data[modelName];
        else return await handleFallbackJoin({
          baseModel: unsafe_model,
          baseData: transformedData,
          joinModel: modelName,
          specificJoinConfig: joinConfig
        });
      })();
      if (joinedData === void 0 || joinedData === null) joinedData = joinConfig.relation === "one-to-one" ? null : [];
      if (joinConfig.relation === "one-to-many" && !Array.isArray(joinedData)) joinedData = [joinedData];
      let transformed = [];
      if (Array.isArray(joinedData)) for (const item of joinedData) {
        const transformedItem = await transformSingleOutput(item, modelName, []);
        transformed.push(transformedItem);
      }
      else {
        const transformedItem = await transformSingleOutput(joinedData, modelName, []);
        transformed.push(transformedItem);
      }
      transformedData[defaultModelName] = (joinConfig.relation === "one-to-one" ? transformed[0] : transformed) ?? null;
    }
    return transformedData;
  };
  const transformWhereClause = ({ model, where, action }) => {
    if (!where) return void 0;
    const newMappedKeys = config.mapKeysTransformInput ?? {};
    return where.map((w) => {
      const { field: unsafe_field, value, operator = "eq", connector = "AND" } = w;
      if (operator === "in") {
        if (!Array.isArray(value)) throw new BetterAuthError("Value must be an array");
      }
      let newValue = value;
      const defaultModelName = getDefaultModelName(model);
      const defaultFieldName = getDefaultFieldName({
        field: unsafe_field,
        model
      });
      const fieldName = newMappedKeys[defaultFieldName] || getFieldName({
        field: defaultFieldName,
        model: defaultModelName
      });
      const fieldAttr = getFieldAttributes({
        field: defaultFieldName,
        model: defaultModelName
      });
      const useNumberId = options.advanced?.database?.useNumberId || options.advanced?.database?.generateId === "serial";
      if (defaultFieldName === "id" || fieldAttr.references?.field === "id") {
        if (useNumberId) if (Array.isArray(value)) newValue = value.map(Number);
        else newValue = Number(value);
      }
      if (fieldAttr.type === "date" && value instanceof Date && !config.supportsDates) newValue = value.toISOString();
      if (fieldAttr.type === "boolean" && typeof value === "boolean" && !config.supportsBooleans) newValue = value ? 1 : 0;
      if (fieldAttr.type === "json" && typeof value === "object" && !config.supportsJSON) try {
        newValue = JSON.stringify(value);
      } catch (error) {
        throw new Error(`Failed to stringify JSON value for field ${fieldName}`, { cause: error });
      }
      if (config.customTransformInput) newValue = config.customTransformInput({
        data: newValue,
        fieldAttributes: fieldAttr,
        field: fieldName,
        model: getModelName(model),
        schema,
        options,
        action
      });
      return {
        operator,
        connector,
        field: fieldName,
        value: newValue
      };
    });
  };
  const transformJoinClause = (baseModel, unsanitizedJoin, select) => {
    if (!unsanitizedJoin) return void 0;
    if (Object.keys(unsanitizedJoin).length === 0) return void 0;
    const transformedJoin = {};
    for (const [model, join] of Object.entries(unsanitizedJoin)) {
      if (!join) continue;
      const defaultModelName = getDefaultModelName(model);
      const defaultBaseModelName = getDefaultModelName(baseModel);
      let foreignKeys = Object.entries(schema[defaultModelName].fields).filter(([field, fieldAttributes]) => fieldAttributes.references && getDefaultModelName(fieldAttributes.references.model) === defaultBaseModelName);
      let isForwardJoin = true;
      if (!foreignKeys.length) {
        foreignKeys = Object.entries(schema[defaultBaseModelName].fields).filter(([field, fieldAttributes]) => fieldAttributes.references && getDefaultModelName(fieldAttributes.references.model) === defaultModelName);
        isForwardJoin = false;
      }
      if (!foreignKeys.length) throw new BetterAuthError(`No foreign key found for model ${model} and base model ${baseModel} while performing join operation.`);
      else if (foreignKeys.length > 1) throw new BetterAuthError(`Multiple foreign keys found for model ${model} and base model ${baseModel} while performing join operation. Only one foreign key is supported.`);
      const [foreignKey, foreignKeyAttributes] = foreignKeys[0];
      if (!foreignKeyAttributes.references) throw new BetterAuthError(`No references found for foreign key ${foreignKey} on model ${model} while performing join operation.`);
      let from;
      let to;
      let requiredSelectField;
      if (isForwardJoin) {
        requiredSelectField = foreignKeyAttributes.references.field;
        from = getFieldName({
          model: baseModel,
          field: requiredSelectField
        });
        to = getFieldName({
          model,
          field: foreignKey
        });
      } else {
        requiredSelectField = foreignKey;
        from = getFieldName({
          model: baseModel,
          field: requiredSelectField
        });
        to = getFieldName({
          model,
          field: foreignKeyAttributes.references.field
        });
      }
      if (select && !select.includes(requiredSelectField)) select.push(requiredSelectField);
      const isUnique = to === "id" ? true : foreignKeyAttributes.unique ?? false;
      let limit = options.advanced?.database?.defaultFindManyLimit ?? 100;
      if (isUnique) limit = 1;
      else if (typeof join === "object" && typeof join.limit === "number") limit = join.limit;
      transformedJoin[getModelName(model)] = {
        on: {
          from,
          to
        },
        limit,
        relation: isUnique ? "one-to-one" : "one-to-many"
      };
    }
    return {
      join: transformedJoin,
      select
    };
  };
  const handleFallbackJoin = async ({ baseModel, baseData, joinModel, specificJoinConfig: joinConfig }) => {
    if (!baseData) return baseData;
    const modelName = getModelName(joinModel);
    const field = joinConfig.on.to;
    const value = baseData[getDefaultFieldName({
      field: joinConfig.on.from,
      model: baseModel
    })];
    if (value === null || value === void 0) return joinConfig.relation === "one-to-one" ? null : [];
    let result;
    const where = transformWhereClause({
      model: modelName,
      where: [{
        field,
        value,
        operator: "eq",
        connector: "AND"
      }],
      action: "findOne"
    });
    try {
      if (joinConfig.relation === "one-to-one") result = await adapterInstance.findOne({
        model: modelName,
        where
      });
      else {
        const limit = joinConfig.limit ?? options.advanced?.database?.defaultFindManyLimit ?? 100;
        result = await adapterInstance.findMany({
          model: modelName,
          where,
          limit
        });
      }
    } catch (error) {
      logger$1.error(`Failed to query fallback join for model ${modelName}:`, {
        where,
        limit: joinConfig.limit
      });
      console.error(error);
      throw error;
    }
    return result;
  };
  const adapterInstance = customAdapter({
    options,
    schema,
    debugLog,
    getFieldName,
    getModelName,
    getDefaultModelName,
    getDefaultFieldName,
    getFieldAttributes,
    transformInput,
    transformOutput,
    transformWhereClause
  });
  let lazyLoadTransaction = null;
  const adapter = {
    transaction: async (cb) => {
      if (!lazyLoadTransaction) if (!config.transaction) lazyLoadTransaction = createAsIsTransaction(adapter);
      else {
        logger$1.debug(`[${config.adapterName}] - Using provided transaction implementation.`);
        lazyLoadTransaction = config.transaction;
      }
      return lazyLoadTransaction(cb);
    },
    create: async ({ data: unsafeData, model: unsafeModel, select, forceAllowId = false }) => {
      transactionId++;
      let thisTransactionId = transactionId;
      const model = getModelName(unsafeModel);
      unsafeModel = getDefaultModelName(unsafeModel);
      if ("id" in unsafeData && typeof unsafeData.id !== "undefined" && !forceAllowId) {
        logger$1.warn(`[${config.adapterName}] - You are trying to create a record with an id. This is not allowed as we handle id generation for you, unless you pass in the \`forceAllowId\` parameter. The id will be ignored.`);
        const stack = (/* @__PURE__ */ new Error()).stack?.split("\n").filter((_, i) => i !== 1).join("\n").replace("Error:", "Create method with `id` being called at:");
        console.log(stack);
        unsafeData.id = void 0;
      }
      debugLog({ method: "create" }, `${formatTransactionId(thisTransactionId)} ${formatStep(1, 4)}`, `${formatMethod("create")} ${formatAction("Unsafe Input")}:`, {
        model,
        data: unsafeData
      });
      let data = unsafeData;
      if (!config.disableTransformInput) data = await transformInput(unsafeData, unsafeModel, "create", forceAllowId);
      debugLog({ method: "create" }, `${formatTransactionId(thisTransactionId)} ${formatStep(2, 4)}`, `${formatMethod("create")} ${formatAction("Parsed Input")}:`, {
        model,
        data
      });
      const res = await adapterInstance.create({
        data,
        model
      });
      debugLog({ method: "create" }, `${formatTransactionId(thisTransactionId)} ${formatStep(3, 4)}`, `${formatMethod("create")} ${formatAction("DB Result")}:`, {
        model,
        res
      });
      let transformed = res;
      if (!config.disableTransformOutput) transformed = await transformOutput(res, unsafeModel, select, void 0);
      debugLog({ method: "create" }, `${formatTransactionId(thisTransactionId)} ${formatStep(4, 4)}`, `${formatMethod("create")} ${formatAction("Parsed Result")}:`, {
        model,
        data: transformed
      });
      return transformed;
    },
    update: async ({ model: unsafeModel, where: unsafeWhere, update: unsafeData }) => {
      transactionId++;
      let thisTransactionId = transactionId;
      unsafeModel = getDefaultModelName(unsafeModel);
      const model = getModelName(unsafeModel);
      const where = transformWhereClause({
        model: unsafeModel,
        where: unsafeWhere,
        action: "update"
      });
      debugLog({ method: "update" }, `${formatTransactionId(thisTransactionId)} ${formatStep(1, 4)}`, `${formatMethod("update")} ${formatAction("Unsafe Input")}:`, {
        model,
        data: unsafeData
      });
      let data = unsafeData;
      if (!config.disableTransformInput) data = await transformInput(unsafeData, unsafeModel, "update");
      debugLog({ method: "update" }, `${formatTransactionId(thisTransactionId)} ${formatStep(2, 4)}`, `${formatMethod("update")} ${formatAction("Parsed Input")}:`, {
        model,
        data
      });
      const res = await adapterInstance.update({
        model,
        where,
        update: data
      });
      debugLog({ method: "update" }, `${formatTransactionId(thisTransactionId)} ${formatStep(3, 4)}`, `${formatMethod("update")} ${formatAction("DB Result")}:`, {
        model,
        data: res
      });
      let transformed = res;
      if (!config.disableTransformOutput) transformed = await transformOutput(res, unsafeModel, void 0, void 0);
      debugLog({ method: "update" }, `${formatTransactionId(thisTransactionId)} ${formatStep(4, 4)}`, `${formatMethod("update")} ${formatAction("Parsed Result")}:`, {
        model,
        data: transformed
      });
      return transformed;
    },
    updateMany: async ({ model: unsafeModel, where: unsafeWhere, update: unsafeData }) => {
      transactionId++;
      let thisTransactionId = transactionId;
      const model = getModelName(unsafeModel);
      const where = transformWhereClause({
        model: unsafeModel,
        where: unsafeWhere,
        action: "updateMany"
      });
      unsafeModel = getDefaultModelName(unsafeModel);
      debugLog({ method: "updateMany" }, `${formatTransactionId(thisTransactionId)} ${formatStep(1, 4)}`, `${formatMethod("updateMany")} ${formatAction("Unsafe Input")}:`, {
        model,
        data: unsafeData
      });
      let data = unsafeData;
      if (!config.disableTransformInput) data = await transformInput(unsafeData, unsafeModel, "update");
      debugLog({ method: "updateMany" }, `${formatTransactionId(thisTransactionId)} ${formatStep(2, 4)}`, `${formatMethod("updateMany")} ${formatAction("Parsed Input")}:`, {
        model,
        data
      });
      const updatedCount = await adapterInstance.updateMany({
        model,
        where,
        update: data
      });
      debugLog({ method: "updateMany" }, `${formatTransactionId(thisTransactionId)} ${formatStep(3, 4)}`, `${formatMethod("updateMany")} ${formatAction("DB Result")}:`, {
        model,
        data: updatedCount
      });
      debugLog({ method: "updateMany" }, `${formatTransactionId(thisTransactionId)} ${formatStep(4, 4)}`, `${formatMethod("updateMany")} ${formatAction("Parsed Result")}:`, {
        model,
        data: updatedCount
      });
      return updatedCount;
    },
    findOne: async ({ model: unsafeModel, where: unsafeWhere, select, join: unsafeJoin }) => {
      transactionId++;
      let thisTransactionId = transactionId;
      const model = getModelName(unsafeModel);
      const where = transformWhereClause({
        model: unsafeModel,
        where: unsafeWhere,
        action: "findOne"
      });
      unsafeModel = getDefaultModelName(unsafeModel);
      let join;
      let passJoinToAdapter = true;
      if (!config.disableTransformJoin) {
        const result = transformJoinClause(unsafeModel, unsafeJoin, select);
        if (result) {
          join = result.join;
          select = result.select;
        }
        if (!options.experimental?.joins && join && Object.keys(join).length > 0) passJoinToAdapter = false;
      } else join = unsafeJoin;
      debugLog({ method: "findOne" }, `${formatTransactionId(thisTransactionId)} ${formatStep(1, 3)}`, `${formatMethod("findOne")}:`, {
        model,
        where,
        select,
        join
      });
      const res = await adapterInstance.findOne({
        model,
        where,
        select,
        join: passJoinToAdapter ? join : void 0
      });
      debugLog({ method: "findOne" }, `${formatTransactionId(thisTransactionId)} ${formatStep(2, 3)}`, `${formatMethod("findOne")} ${formatAction("DB Result")}:`, {
        model,
        data: res
      });
      let transformed = res;
      if (!config.disableTransformOutput) transformed = await transformOutput(res, unsafeModel, select, join);
      debugLog({ method: "findOne" }, `${formatTransactionId(thisTransactionId)} ${formatStep(3, 3)}`, `${formatMethod("findOne")} ${formatAction("Parsed Result")}:`, {
        model,
        data: transformed
      });
      return transformed;
    },
    findMany: async ({ model: unsafeModel, where: unsafeWhere, limit: unsafeLimit, sortBy, offset, join: unsafeJoin }) => {
      transactionId++;
      let thisTransactionId = transactionId;
      const limit = unsafeLimit ?? options.advanced?.database?.defaultFindManyLimit ?? 100;
      const model = getModelName(unsafeModel);
      const where = transformWhereClause({
        model: unsafeModel,
        where: unsafeWhere,
        action: "findMany"
      });
      unsafeModel = getDefaultModelName(unsafeModel);
      let join;
      let passJoinToAdapter = true;
      if (!config.disableTransformJoin) {
        const result = transformJoinClause(unsafeModel, unsafeJoin, void 0);
        if (result) join = result.join;
        if (!options.experimental?.joins && join && Object.keys(join).length > 0) passJoinToAdapter = false;
      } else join = unsafeJoin;
      debugLog({ method: "findMany" }, `${formatTransactionId(thisTransactionId)} ${formatStep(1, 3)}`, `${formatMethod("findMany")}:`, {
        model,
        where,
        limit,
        sortBy,
        offset,
        join
      });
      const res = await adapterInstance.findMany({
        model,
        where,
        limit,
        sortBy,
        offset,
        join: passJoinToAdapter ? join : void 0
      });
      debugLog({ method: "findMany" }, `${formatTransactionId(thisTransactionId)} ${formatStep(2, 3)}`, `${formatMethod("findMany")} ${formatAction("DB Result")}:`, {
        model,
        data: res
      });
      let transformed = res;
      if (!config.disableTransformOutput) transformed = await Promise.all(res.map(async (r) => {
        return await transformOutput(r, unsafeModel, void 0, join);
      }));
      debugLog({ method: "findMany" }, `${formatTransactionId(thisTransactionId)} ${formatStep(3, 3)}`, `${formatMethod("findMany")} ${formatAction("Parsed Result")}:`, {
        model,
        data: transformed
      });
      return transformed;
    },
    delete: async ({ model: unsafeModel, where: unsafeWhere }) => {
      transactionId++;
      let thisTransactionId = transactionId;
      const model = getModelName(unsafeModel);
      const where = transformWhereClause({
        model: unsafeModel,
        where: unsafeWhere,
        action: "delete"
      });
      unsafeModel = getDefaultModelName(unsafeModel);
      debugLog({ method: "delete" }, `${formatTransactionId(thisTransactionId)} ${formatStep(1, 2)}`, `${formatMethod("delete")}:`, {
        model,
        where
      });
      await adapterInstance.delete({
        model,
        where
      });
      debugLog({ method: "delete" }, `${formatTransactionId(thisTransactionId)} ${formatStep(2, 2)}`, `${formatMethod("delete")} ${formatAction("DB Result")}:`, { model });
    },
    deleteMany: async ({ model: unsafeModel, where: unsafeWhere }) => {
      transactionId++;
      let thisTransactionId = transactionId;
      const model = getModelName(unsafeModel);
      const where = transformWhereClause({
        model: unsafeModel,
        where: unsafeWhere,
        action: "deleteMany"
      });
      unsafeModel = getDefaultModelName(unsafeModel);
      debugLog({ method: "deleteMany" }, `${formatTransactionId(thisTransactionId)} ${formatStep(1, 2)}`, `${formatMethod("deleteMany")} ${formatAction("DeleteMany")}:`, {
        model,
        where
      });
      const res = await adapterInstance.deleteMany({
        model,
        where
      });
      debugLog({ method: "deleteMany" }, `${formatTransactionId(thisTransactionId)} ${formatStep(2, 2)}`, `${formatMethod("deleteMany")} ${formatAction("DB Result")}:`, {
        model,
        data: res
      });
      return res;
    },
    count: async ({ model: unsafeModel, where: unsafeWhere }) => {
      transactionId++;
      let thisTransactionId = transactionId;
      const model = getModelName(unsafeModel);
      const where = transformWhereClause({
        model: unsafeModel,
        where: unsafeWhere,
        action: "count"
      });
      unsafeModel = getDefaultModelName(unsafeModel);
      debugLog({ method: "count" }, `${formatTransactionId(thisTransactionId)} ${formatStep(1, 2)}`, `${formatMethod("count")}:`, {
        model,
        where
      });
      const res = await adapterInstance.count({
        model,
        where
      });
      debugLog({ method: "count" }, `${formatTransactionId(thisTransactionId)} ${formatStep(2, 2)}`, `${formatMethod("count")}:`, {
        model,
        data: res
      });
      return res;
    },
    createSchema: adapterInstance.createSchema ? async (_, file) => {
      const tables = getAuthTables(options);
      if (options.secondaryStorage && !options.session?.storeSessionInDatabase) delete tables.session;
      if (options.rateLimit && options.rateLimit.storage === "database" && (typeof options.rateLimit.enabled === "undefined" || options.rateLimit.enabled === true)) tables.ratelimit = {
        modelName: options.rateLimit.modelName ?? "ratelimit",
        fields: {
          key: {
            type: "string",
            unique: true,
            required: true,
            fieldName: options.rateLimit.fields?.key ?? "key"
          },
          count: {
            type: "number",
            required: true,
            fieldName: options.rateLimit.fields?.count ?? "count"
          },
          lastRequest: {
            type: "number",
            required: true,
            bigint: true,
            defaultValue: () => Date.now(),
            fieldName: options.rateLimit.fields?.lastRequest ?? "lastRequest"
          }
        }
      };
      return adapterInstance.createSchema({
        file,
        tables
      });
    } : void 0,
    options: {
      adapterConfig: config,
      ...adapterInstance.options ?? {}
    },
    id: config.adapterId,
    ...config.debugLogs?.isRunningAdapterTests ? { adapterTestDebugLogs: {
      resetDebugLogs() {
        debugLogs = debugLogs.filter((log) => log.instance !== uniqueAdapterFactoryInstanceId);
      },
      printDebugLogs() {
        const separator = `─`.repeat(80);
        const logs = debugLogs.filter((log$1) => log$1.instance === uniqueAdapterFactoryInstanceId);
        if (logs.length === 0) return;
        let log = logs.reverse().map((log$1) => {
          log$1.args[0] = `
${log$1.args[0]}`;
          return [...log$1.args, "\n"];
        }).reduce((prev, curr) => {
          return [...curr, ...prev];
        }, [`
${separator}`]);
        console.log(...log);
      }
    } } : {}
  };
  return adapter;
};
function formatTransactionId(transactionId$1) {
  if (getColorDepth() < 8) return `#${transactionId$1}`;
  return `${TTY_COLORS.fg.magenta}#${transactionId$1}${TTY_COLORS.reset}`;
}
function formatStep(step, total) {
  return `${TTY_COLORS.bg.black}${TTY_COLORS.fg.yellow}[${step}/${total}]${TTY_COLORS.reset}`;
}
function formatMethod(method) {
  return `${TTY_COLORS.bright}${method}${TTY_COLORS.reset}`;
}
function formatAction(action) {
  return `${TTY_COLORS.dim}(${action})${TTY_COLORS.reset}`;
}
function getOAuth2Tokens(data) {
  const getDate = (seconds) => {
    const now = /* @__PURE__ */ new Date();
    return new Date(now.getTime() + seconds * 1e3);
  };
  return {
    tokenType: data.token_type,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessTokenExpiresAt: data.expires_in ? getDate(data.expires_in) : void 0,
    refreshTokenExpiresAt: data.refresh_token_expires_in ? getDate(data.refresh_token_expires_in) : void 0,
    scopes: data?.scope ? typeof data.scope === "string" ? data.scope.split(" ") : data.scope : [],
    idToken: data.id_token,
    raw: data
  };
}
async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64Url.encode(new Uint8Array(hash), { padding: false });
}
async function createAuthorizationURL({ id, options, authorizationEndpoint, state, codeVerifier, scopes, claims, redirectURI, duration, prompt, accessType, responseType, display, loginHint, hd, responseMode, additionalParams, scopeJoiner }) {
  const url = new URL(options.authorizationEndpoint || authorizationEndpoint);
  url.searchParams.set("response_type", responseType || "code");
  const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
  url.searchParams.set("client_id", primaryClientId);
  url.searchParams.set("state", state);
  if (scopes) url.searchParams.set("scope", scopes.join(scopeJoiner || " "));
  url.searchParams.set("redirect_uri", options.redirectURI || redirectURI);
  duration && url.searchParams.set("duration", duration);
  display && url.searchParams.set("display", display);
  loginHint && url.searchParams.set("login_hint", loginHint);
  prompt && url.searchParams.set("prompt", prompt);
  hd && url.searchParams.set("hd", hd);
  accessType && url.searchParams.set("access_type", accessType);
  responseMode && url.searchParams.set("response_mode", responseMode);
  if (codeVerifier) {
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", codeChallenge);
  }
  if (claims) {
    const claimsObj = claims.reduce((acc, claim) => {
      acc[claim] = null;
      return acc;
    }, {});
    url.searchParams.set("claims", JSON.stringify({ id_token: {
      email: null,
      email_verified: null,
      ...claimsObj
    } }));
  }
  if (additionalParams) Object.entries(additionalParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url;
}
function createRefreshAccessTokenRequest({ refreshToken, options, authentication, extraParams, resource }) {
  const body = new URLSearchParams();
  const headers = {
    "content-type": "application/x-www-form-urlencoded",
    accept: "application/json"
  };
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);
  if (authentication === "basic") {
    const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
    if (primaryClientId) headers["authorization"] = "Basic " + base64.encode(`${primaryClientId}:${options.clientSecret ?? ""}`);
    else headers["authorization"] = "Basic " + base64.encode(`:${options.clientSecret ?? ""}`);
  } else {
    const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
    body.set("client_id", primaryClientId);
    if (options.clientSecret) body.set("client_secret", options.clientSecret);
  }
  if (resource) if (typeof resource === "string") body.append("resource", resource);
  else for (const _resource of resource) body.append("resource", _resource);
  if (extraParams) for (const [key, value] of Object.entries(extraParams)) body.set(key, value);
  return {
    body,
    headers
  };
}
async function refreshAccessToken({ refreshToken, options, tokenEndpoint, authentication, extraParams }) {
  const { body, headers } = createRefreshAccessTokenRequest({
    refreshToken,
    options,
    authentication,
    extraParams
  });
  const { data, error } = await betterFetch(tokenEndpoint, {
    method: "POST",
    body,
    headers
  });
  if (error) throw error;
  const tokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    scopes: data.scope?.split(" "),
    idToken: data.id_token
  };
  if (data.expires_in) {
    const now = /* @__PURE__ */ new Date();
    tokens.accessTokenExpiresAt = new Date(now.getTime() + data.expires_in * 1e3);
  }
  return tokens;
}
function createAuthorizationCodeRequest({ code, codeVerifier, redirectURI, options, authentication, deviceId, headers, additionalParams = {}, resource }) {
  const body = new URLSearchParams();
  const requestHeaders = {
    "content-type": "application/x-www-form-urlencoded",
    accept: "application/json",
    ...headers
  };
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  codeVerifier && body.set("code_verifier", codeVerifier);
  options.clientKey && body.set("client_key", options.clientKey);
  deviceId && body.set("device_id", deviceId);
  body.set("redirect_uri", options.redirectURI || redirectURI);
  if (resource) if (typeof resource === "string") body.append("resource", resource);
  else for (const _resource of resource) body.append("resource", _resource);
  if (authentication === "basic") {
    const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
    requestHeaders["authorization"] = `Basic ${base64.encode(`${primaryClientId}:${options.clientSecret ?? ""}`)}`;
  } else {
    const primaryClientId = Array.isArray(options.clientId) ? options.clientId[0] : options.clientId;
    body.set("client_id", primaryClientId);
    if (options.clientSecret) body.set("client_secret", options.clientSecret);
  }
  for (const [key, value] of Object.entries(additionalParams)) if (!body.has(key)) body.append(key, value);
  return {
    body,
    headers: requestHeaders
  };
}
async function validateAuthorizationCode({ code, codeVerifier, redirectURI, options, tokenEndpoint, authentication, deviceId, headers, additionalParams = {}, resource }) {
  const { body, headers: requestHeaders } = createAuthorizationCodeRequest({
    code,
    codeVerifier,
    redirectURI,
    options,
    authentication,
    deviceId,
    headers,
    additionalParams,
    resource
  });
  const { data, error } = await betterFetch(tokenEndpoint, {
    method: "POST",
    body,
    headers: requestHeaders
  });
  if (error) throw error;
  return getOAuth2Tokens(data);
}
const apple = (options) => {
  const tokenEndpoint = "https://appleid.apple.com/auth/token";
  return {
    id: "apple",
    name: "Apple",
    async createAuthorizationURL({ state, scopes, redirectURI }) {
      const _scope = options.disableDefaultScope ? [] : ["email", "name"];
      if (options.scope) _scope.push(...options.scope);
      if (scopes) _scope.push(...scopes);
      return await createAuthorizationURL({
        id: "apple",
        options,
        authorizationEndpoint: "https://appleid.apple.com/auth/authorize",
        scopes: _scope,
        state,
        redirectURI,
        responseMode: "form_post",
        responseType: "code id_token"
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint
      });
    },
    async verifyIdToken(token, nonce) {
      if (options.disableIdTokenSignIn) return false;
      if (options.verifyIdToken) return options.verifyIdToken(token, nonce);
      const { kid, alg: jwtAlg } = decodeProtectedHeader(token);
      if (!kid || !jwtAlg) return false;
      const { payload: jwtClaims } = await jwtVerify(token, await getApplePublicKey(kid), {
        algorithms: [jwtAlg],
        issuer: "https://appleid.apple.com",
        audience: options.audience && options.audience.length ? options.audience : options.appBundleIdentifier ? options.appBundleIdentifier : options.clientId,
        maxTokenAge: "1h"
      });
      ["email_verified", "is_private_email"].forEach((field) => {
        if (jwtClaims[field] !== void 0) jwtClaims[field] = Boolean(jwtClaims[field]);
      });
      if (nonce && jwtClaims.nonce !== nonce) return false;
      return !!jwtClaims;
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://appleid.apple.com/auth/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      if (!token.idToken) return null;
      const profile = decodeJwt(token.idToken);
      if (!profile) return null;
      const name = token.user ? `${token.user.name?.firstName} ${token.user.name?.lastName}` : profile.name || profile.email;
      const emailVerified = typeof profile.email_verified === "boolean" ? profile.email_verified : profile.email_verified === "true";
      const enrichedProfile = {
        ...profile,
        name
      };
      const userMap = await options.mapProfileToUser?.(enrichedProfile);
      return {
        user: {
          id: profile.sub,
          name: enrichedProfile.name,
          emailVerified,
          email: profile.email,
          ...userMap
        },
        data: enrichedProfile
      };
    },
    options
  };
};
const getApplePublicKey = async (kid) => {
  const { data } = await betterFetch(`https://appleid.apple.com/auth/keys`);
  if (!data?.keys) throw new APIError("BAD_REQUEST", { message: "Keys not found" });
  const jwk = data.keys.find((key) => key.kid === kid);
  if (!jwk) throw new Error(`JWK with kid ${kid} not found`);
  return await importJWK(jwk, jwk.alg);
};
const atlassian = (options) => {
  return {
    id: "atlassian",
    name: "Atlassian",
    async createAuthorizationURL({ state, scopes, codeVerifier, redirectURI }) {
      if (!options.clientId || !options.clientSecret) {
        logger.error("Client Id and Secret are required for Atlassian");
        throw new BetterAuthError("CLIENT_ID_AND_SECRET_REQUIRED");
      }
      if (!codeVerifier) throw new BetterAuthError("codeVerifier is required for Atlassian");
      const _scopes = options.disableDefaultScope ? [] : ["read:jira-user", "offline_access"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "atlassian",
        options,
        authorizationEndpoint: "https://auth.atlassian.com/authorize",
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI,
        additionalParams: { audience: "api.atlassian.com" },
        prompt: options.prompt
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint: "https://auth.atlassian.com/oauth/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://auth.atlassian.com/oauth/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      if (!token.accessToken) return null;
      try {
        const { data: profile } = await betterFetch("https://api.atlassian.com/me", { headers: { Authorization: `Bearer ${token.accessToken}` } });
        if (!profile) return null;
        const userMap = await options.mapProfileToUser?.(profile);
        return {
          user: {
            id: profile.account_id,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            emailVerified: false,
            ...userMap
          },
          data: profile
        };
      } catch (error) {
        logger.error("Failed to fetch user info from Figma:", error);
        return null;
      }
    },
    options
  };
};
const cognito = (options) => {
  if (!options.domain || !options.region || !options.userPoolId) {
    logger.error("Domain, region and userPoolId are required for Amazon Cognito. Make sure to provide them in the options.");
    throw new BetterAuthError("DOMAIN_AND_REGION_REQUIRED");
  }
  const cleanDomain = options.domain.replace(/^https?:\/\//, "");
  const authorizationEndpoint = `https://${cleanDomain}/oauth2/authorize`;
  const tokenEndpoint = `https://${cleanDomain}/oauth2/token`;
  const userInfoEndpoint = `https://${cleanDomain}/oauth2/userinfo`;
  return {
    id: "cognito",
    name: "Cognito",
    async createAuthorizationURL({ state, scopes, codeVerifier, redirectURI }) {
      if (!options.clientId) {
        logger.error("ClientId is required for Amazon Cognito. Make sure to provide them in the options.");
        throw new BetterAuthError("CLIENT_ID_AND_SECRET_REQUIRED");
      }
      if (options.requireClientSecret && !options.clientSecret) {
        logger.error("Client Secret is required when requireClientSecret is true. Make sure to provide it in the options.");
        throw new BetterAuthError("CLIENT_SECRET_REQUIRED");
      }
      const _scopes = options.disableDefaultScope ? [] : [
        "openid",
        "profile",
        "email"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      const url = await createAuthorizationURL({
        id: "cognito",
        options: { ...options },
        authorizationEndpoint,
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI,
        prompt: options.prompt
      });
      const scopeValue = url.searchParams.get("scope");
      if (scopeValue) {
        url.searchParams.delete("scope");
        const encodedScope = encodeURIComponent(scopeValue);
        const urlString = url.toString();
        const separator = urlString.includes("?") ? "&" : "?";
        return new URL(`${urlString}${separator}scope=${encodedScope}`);
      }
      return url;
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint
      });
    },
    async verifyIdToken(token, nonce) {
      if (options.disableIdTokenSignIn) return false;
      if (options.verifyIdToken) return options.verifyIdToken(token, nonce);
      try {
        const { kid, alg: jwtAlg } = decodeProtectedHeader(token);
        if (!kid || !jwtAlg) return false;
        const publicKey = await getCognitoPublicKey(kid, options.region, options.userPoolId);
        const expectedIssuer = `https://cognito-idp.${options.region}.amazonaws.com/${options.userPoolId}`;
        const { payload: jwtClaims } = await jwtVerify(token, publicKey, {
          algorithms: [jwtAlg],
          issuer: expectedIssuer,
          audience: options.clientId,
          maxTokenAge: "1h"
        });
        if (nonce && jwtClaims.nonce !== nonce) return false;
        return true;
      } catch (error) {
        logger.error("Failed to verify ID token:", error);
        return false;
      }
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      if (token.idToken) try {
        const profile = decodeJwt(token.idToken);
        if (!profile) return null;
        const name = profile.name || profile.given_name || profile.username || profile.email;
        const enrichedProfile = {
          ...profile,
          name
        };
        const userMap = await options.mapProfileToUser?.(enrichedProfile);
        return {
          user: {
            id: profile.sub,
            name: enrichedProfile.name,
            email: profile.email,
            image: profile.picture,
            emailVerified: profile.email_verified,
            ...userMap
          },
          data: enrichedProfile
        };
      } catch (error) {
        logger.error("Failed to decode ID token:", error);
      }
      if (token.accessToken) try {
        const { data: userInfo } = await betterFetch(userInfoEndpoint, { headers: { Authorization: `Bearer ${token.accessToken}` } });
        if (userInfo) {
          const userMap = await options.mapProfileToUser?.(userInfo);
          return {
            user: {
              id: userInfo.sub,
              name: userInfo.name || userInfo.given_name || userInfo.username,
              email: userInfo.email,
              image: userInfo.picture,
              emailVerified: userInfo.email_verified,
              ...userMap
            },
            data: userInfo
          };
        }
      } catch (error) {
        logger.error("Failed to fetch user info from Cognito:", error);
      }
      return null;
    },
    options
  };
};
const getCognitoPublicKey = async (kid, region, userPoolId) => {
  const COGNITO_JWKS_URI = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  try {
    const { data } = await betterFetch(COGNITO_JWKS_URI);
    if (!data?.keys) throw new APIError("BAD_REQUEST", { message: "Keys not found" });
    const jwk = data.keys.find((key) => key.kid === kid);
    if (!jwk) throw new Error(`JWK with kid ${kid} not found`);
    return await importJWK(jwk, jwk.alg);
  } catch (error) {
    logger.error("Failed to fetch Cognito public key:", error);
    throw error;
  }
};
const discord = (options) => {
  return {
    id: "discord",
    name: "Discord",
    createAuthorizationURL({ state, scopes, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["identify", "email"];
      if (scopes) _scopes.push(...scopes);
      if (options.scope) _scopes.push(...options.scope);
      const permissionsParam = _scopes.includes("bot") && options.permissions !== void 0 ? `&permissions=${options.permissions}` : "";
      return new URL(`https://discord.com/api/oauth2/authorize?scope=${_scopes.join("+")}&response_type=code&client_id=${options.clientId}&redirect_uri=${encodeURIComponent(options.redirectURI || redirectURI)}&state=${state}&prompt=${options.prompt || "none"}${permissionsParam}`);
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint: "https://discord.com/api/oauth2/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://discord.com/api/oauth2/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://discord.com/api/users/@me", { headers: { authorization: `Bearer ${token.accessToken}` } });
      if (error) return null;
      if (profile.avatar === null) profile.image_url = `https://cdn.discordapp.com/embed/avatars/${profile.discriminator === "0" ? Number(BigInt(profile.id) >> BigInt(22)) % 6 : parseInt(profile.discriminator) % 5}.png`;
      else {
        const format = profile.avatar.startsWith("a_") ? "gif" : "png";
        profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
      }
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.id,
          name: profile.global_name || profile.username || "",
          email: profile.email,
          emailVerified: profile.verified,
          image: profile.image_url,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const dropbox = (options) => {
  const tokenEndpoint = "https://api.dropboxapi.com/oauth2/token";
  return {
    id: "dropbox",
    name: "Dropbox",
    createAuthorizationURL: async ({ state, scopes, codeVerifier, redirectURI }) => {
      const _scopes = options.disableDefaultScope ? [] : ["account_info.read"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      const additionalParams = {};
      if (options.accessType) additionalParams.token_access_type = options.accessType;
      return await createAuthorizationURL({
        id: "dropbox",
        options,
        authorizationEndpoint: "https://www.dropbox.com/oauth2/authorize",
        scopes: _scopes,
        state,
        redirectURI,
        codeVerifier,
        additionalParams
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return await validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://api.dropbox.com/oauth2/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://api.dropboxapi.com/2/users/get_current_account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token.accessToken}` }
      });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.account_id,
          name: profile.name?.display_name,
          email: profile.email,
          emailVerified: profile.email_verified || false,
          image: profile.profile_photo_url,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const facebook = (options) => {
  return {
    id: "facebook",
    name: "Facebook",
    async createAuthorizationURL({ state, scopes, redirectURI, loginHint }) {
      const _scopes = options.disableDefaultScope ? [] : ["email", "public_profile"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return await createAuthorizationURL({
        id: "facebook",
        options,
        authorizationEndpoint: "https://www.facebook.com/v21.0/dialog/oauth",
        scopes: _scopes,
        state,
        redirectURI,
        loginHint,
        additionalParams: options.configId ? { config_id: options.configId } : {}
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint: "https://graph.facebook.com/oauth/access_token"
      });
    },
    async verifyIdToken(token, nonce) {
      if (options.disableIdTokenSignIn) return false;
      if (options.verifyIdToken) return options.verifyIdToken(token, nonce);
      if (token.split(".").length === 3) try {
        const { payload: jwtClaims } = await jwtVerify(token, createRemoteJWKSet(new URL("https://limited.facebook.com/.well-known/oauth/openid/jwks/")), {
          algorithms: ["RS256"],
          audience: options.clientId,
          issuer: "https://www.facebook.com"
        });
        if (nonce && jwtClaims.nonce !== nonce) return false;
        return !!jwtClaims;
      } catch {
        return false;
      }
      return true;
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://graph.facebook.com/v18.0/oauth/access_token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      if (token.idToken && token.idToken.split(".").length === 3) {
        const profile$1 = decodeJwt(token.idToken);
        const user = {
          id: profile$1.sub,
          name: profile$1.name,
          email: profile$1.email,
          picture: { data: {
            url: profile$1.picture,
            height: 100,
            width: 100,
            is_silhouette: false
          } }
        };
        const userMap$1 = await options.mapProfileToUser?.({
          ...user,
          email_verified: false
        });
        return {
          user: {
            ...user,
            emailVerified: false,
            ...userMap$1
          },
          data: profile$1
        };
      }
      const { data: profile, error } = await betterFetch("https://graph.facebook.com/me?fields=" + [
        "id",
        "name",
        "email",
        "picture",
        ...options?.fields || []
      ].join(","), { auth: {
        type: "Bearer",
        token: token.accessToken
      } });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture.data.url,
          emailVerified: profile.email_verified,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const figma = (options) => {
  return {
    id: "figma",
    name: "Figma",
    async createAuthorizationURL({ state, scopes, codeVerifier, redirectURI }) {
      if (!options.clientId || !options.clientSecret) {
        logger.error("Client Id and Client Secret are required for Figma. Make sure to provide them in the options.");
        throw new BetterAuthError("CLIENT_ID_AND_SECRET_REQUIRED");
      }
      if (!codeVerifier) throw new BetterAuthError("codeVerifier is required for Figma");
      const _scopes = options.disableDefaultScope ? [] : ["file_read"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return await createAuthorizationURL({
        id: "figma",
        options,
        authorizationEndpoint: "https://www.figma.com/oauth",
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint: "https://www.figma.com/api/oauth/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://www.figma.com/api/oauth/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      try {
        const { data: profile } = await betterFetch("https://api.figma.com/v1/me", { headers: { Authorization: `Bearer ${token.accessToken}` } });
        if (!profile) {
          logger.error("Failed to fetch user from Figma");
          return null;
        }
        const userMap = await options.mapProfileToUser?.(profile);
        return {
          user: {
            id: profile.id,
            name: profile.handle,
            email: profile.email,
            image: profile.img_url,
            emailVerified: false,
            ...userMap
          },
          data: profile
        };
      } catch (error) {
        logger.error("Failed to fetch user info from Figma:", error);
        return null;
      }
    },
    options
  };
};
const github = (options) => {
  const tokenEndpoint = "https://github.com/login/oauth/access_token";
  return {
    id: "github",
    name: "GitHub",
    createAuthorizationURL({ state, scopes, loginHint, codeVerifier, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["read:user", "user:email"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "github",
        options,
        authorizationEndpoint: "https://github.com/login/oauth/authorize",
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI,
        loginHint,
        prompt: options.prompt
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://github.com/login/oauth/access_token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://api.github.com/user", { headers: {
        "User-Agent": "better-auth",
        authorization: `Bearer ${token.accessToken}`
      } });
      if (error) return null;
      const { data: emails } = await betterFetch("https://api.github.com/user/emails", { headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "User-Agent": "better-auth"
      } });
      if (!profile.email && emails) profile.email = (emails.find((e) => e.primary) ?? emails[0])?.email;
      const emailVerified = emails?.find((e) => e.email === profile.email)?.verified ?? false;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.id,
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          emailVerified,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const cleanDoubleSlashes = (input = "") => {
  return input.split("://").map((str) => str.replace(/\/{2,}/g, "/")).join("://");
};
const issuerToEndpoints = (issuer) => {
  let baseUrl = issuer || "https://gitlab.com";
  return {
    authorizationEndpoint: cleanDoubleSlashes(`${baseUrl}/oauth/authorize`),
    tokenEndpoint: cleanDoubleSlashes(`${baseUrl}/oauth/token`),
    userinfoEndpoint: cleanDoubleSlashes(`${baseUrl}/api/v4/user`)
  };
};
const gitlab = (options) => {
  const { authorizationEndpoint, tokenEndpoint, userinfoEndpoint } = issuerToEndpoints(options.issuer);
  const issuerId = "gitlab";
  return {
    id: issuerId,
    name: "Gitlab",
    createAuthorizationURL: async ({ state, scopes, codeVerifier, loginHint, redirectURI }) => {
      const _scopes = options.disableDefaultScope ? [] : ["read_user"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return await createAuthorizationURL({
        id: issuerId,
        options,
        authorizationEndpoint,
        scopes: _scopes,
        state,
        redirectURI,
        codeVerifier,
        loginHint
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI, codeVerifier }) => {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        codeVerifier,
        tokenEndpoint
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch(userinfoEndpoint, { headers: { authorization: `Bearer ${token.accessToken}` } });
      if (error || profile.state !== "active" || profile.locked) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.id,
          name: profile.name ?? profile.username,
          email: profile.email,
          image: profile.avatar_url,
          emailVerified: profile.email_verified ?? false,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const google = (options) => {
  return {
    id: "google",
    name: "Google",
    async createAuthorizationURL({ state, scopes, codeVerifier, redirectURI, loginHint, display }) {
      if (!options.clientId || !options.clientSecret) {
        logger.error("Client Id and Client Secret is required for Google. Make sure to provide them in the options.");
        throw new BetterAuthError("CLIENT_ID_AND_SECRET_REQUIRED");
      }
      if (!codeVerifier) throw new BetterAuthError("codeVerifier is required for Google");
      const _scopes = options.disableDefaultScope ? [] : [
        "email",
        "profile",
        "openid"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return await createAuthorizationURL({
        id: "google",
        options,
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/auth",
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI,
        prompt: options.prompt,
        accessType: options.accessType,
        display: display || options.display,
        loginHint,
        hd: options.hd,
        additionalParams: { include_granted_scopes: "true" }
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint: "https://oauth2.googleapis.com/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://www.googleapis.com/oauth2/v4/token"
      });
    },
    async verifyIdToken(token, nonce) {
      if (options.disableIdTokenSignIn) return false;
      if (options.verifyIdToken) return options.verifyIdToken(token, nonce);
      const { kid, alg: jwtAlg } = decodeProtectedHeader(token);
      if (!kid || !jwtAlg) return false;
      const { payload: jwtClaims } = await jwtVerify(token, await getGooglePublicKey(kid), {
        algorithms: [jwtAlg],
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: options.clientId,
        maxTokenAge: "1h"
      });
      if (nonce && jwtClaims.nonce !== nonce) return false;
      return true;
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      if (!token.idToken) return null;
      const user = decodeJwt(token.idToken);
      const userMap = await options.mapProfileToUser?.(user);
      return {
        user: {
          id: user.sub,
          name: user.name,
          email: user.email,
          image: user.picture,
          emailVerified: user.email_verified,
          ...userMap
        },
        data: user
      };
    },
    options
  };
};
const getGooglePublicKey = async (kid) => {
  const { data } = await betterFetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!data?.keys) throw new APIError("BAD_REQUEST", { message: "Keys not found" });
  const jwk = data.keys.find((key) => key.kid === kid);
  if (!jwk) throw new Error(`JWK with kid ${kid} not found`);
  return await importJWK(jwk, jwk.alg);
};
const huggingface = (options) => {
  return {
    id: "huggingface",
    name: "Hugging Face",
    createAuthorizationURL({ state, scopes, codeVerifier, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : [
        "openid",
        "profile",
        "email"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "huggingface",
        options,
        authorizationEndpoint: "https://huggingface.co/oauth/authorize",
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint: "https://huggingface.co/oauth/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://huggingface.co/oauth/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://huggingface.co/oauth/userinfo", {
        method: "GET",
        headers: { Authorization: `Bearer ${token.accessToken}` }
      });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ?? false,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const kakao = (options) => {
  return {
    id: "kakao",
    name: "Kakao",
    createAuthorizationURL({ state, scopes, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : [
        "account_email",
        "profile_image",
        "profile_nickname"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "kakao",
        options,
        authorizationEndpoint: "https://kauth.kakao.com/oauth/authorize",
        scopes: _scopes,
        state,
        redirectURI
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint: "https://kauth.kakao.com/oauth/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://kauth.kakao.com/oauth/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: `Bearer ${token.accessToken}` } });
      if (error || !profile) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      const account = profile.kakao_account || {};
      const kakaoProfile = account.profile || {};
      return {
        user: {
          id: String(profile.id),
          name: kakaoProfile.nickname || account.name || void 0,
          email: account.email,
          image: kakaoProfile.profile_image_url || kakaoProfile.thumbnail_image_url,
          emailVerified: !!account.is_email_valid && !!account.is_email_verified,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const kick = (options) => {
  return {
    id: "kick",
    name: "Kick",
    createAuthorizationURL({ state, scopes, redirectURI, codeVerifier }) {
      const _scopes = options.disableDefaultScope ? [] : ["user:read"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "kick",
        redirectURI,
        options,
        authorizationEndpoint: "https://id.kick.com/oauth/authorize",
        scopes: _scopes,
        codeVerifier,
        state
      });
    },
    async validateAuthorizationCode({ code, redirectURI, codeVerifier }) {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint: "https://id.kick.com/oauth/token",
        codeVerifier
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://id.kick.com/oauth/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data, error } = await betterFetch("https://api.kick.com/public/v1/users", {
        method: "GET",
        headers: { Authorization: `Bearer ${token.accessToken}` }
      });
      if (error) return null;
      const profile = data.data[0];
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.user_id,
          name: profile.name,
          email: profile.email,
          image: profile.profile_picture,
          emailVerified: false,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const line = (options) => {
  const authorizationEndpoint = "https://access.line.me/oauth2/v2.1/authorize";
  const tokenEndpoint = "https://api.line.me/oauth2/v2.1/token";
  const userInfoEndpoint = "https://api.line.me/oauth2/v2.1/userinfo";
  const verifyIdTokenEndpoint = "https://api.line.me/oauth2/v2.1/verify";
  return {
    id: "line",
    name: "LINE",
    async createAuthorizationURL({ state, scopes, codeVerifier, redirectURI, loginHint }) {
      const _scopes = options.disableDefaultScope ? [] : [
        "openid",
        "profile",
        "email"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return await createAuthorizationURL({
        id: "line",
        options,
        authorizationEndpoint,
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI,
        loginHint
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientSecret: options.clientSecret
        },
        tokenEndpoint
      });
    },
    async verifyIdToken(token, nonce) {
      if (options.disableIdTokenSignIn) return false;
      if (options.verifyIdToken) return options.verifyIdToken(token, nonce);
      const body = new URLSearchParams();
      body.set("id_token", token);
      body.set("client_id", options.clientId);
      if (nonce) body.set("nonce", nonce);
      const { data, error } = await betterFetch(verifyIdTokenEndpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body
      });
      if (error || !data) return false;
      if (data.aud !== options.clientId) return false;
      if (data.nonce && data.nonce !== nonce) return false;
      return true;
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      let profile = null;
      if (token.idToken) try {
        profile = decodeJwt(token.idToken);
      } catch {
      }
      if (!profile) {
        const { data } = await betterFetch(userInfoEndpoint, { headers: { authorization: `Bearer ${token.accessToken}` } });
        profile = data || null;
      }
      if (!profile) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      const id = profile.sub || profile.userId;
      const name = profile.name || profile.displayName;
      const image = profile.picture || profile.pictureUrl || void 0;
      return {
        user: {
          id,
          name,
          email: profile.email,
          image,
          emailVerified: false,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const linear = (options) => {
  const tokenEndpoint = "https://api.linear.app/oauth/token";
  return {
    id: "linear",
    name: "Linear",
    createAuthorizationURL({ state, scopes, loginHint, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["read"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "linear",
        options,
        authorizationEndpoint: "https://linear.app/oauth/authorize",
        scopes: _scopes,
        state,
        redirectURI,
        loginHint
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.accessToken}`
        },
        body: JSON.stringify({ query: `
							query {
								viewer {
									id
									name
									email
									avatarUrl
									active
									createdAt
									updatedAt
								}
							}
						` })
      });
      if (error || !profile?.data?.viewer) return null;
      const userData = profile.data.viewer;
      const userMap = await options.mapProfileToUser?.(userData);
      return {
        user: {
          id: profile.data.viewer.id,
          name: profile.data.viewer.name,
          email: profile.data.viewer.email,
          image: profile.data.viewer.avatarUrl,
          emailVerified: false,
          ...userMap
        },
        data: userData
      };
    },
    options
  };
};
const linkedin = (options) => {
  const authorizationEndpoint = "https://www.linkedin.com/oauth/v2/authorization";
  const tokenEndpoint = "https://www.linkedin.com/oauth/v2/accessToken";
  return {
    id: "linkedin",
    name: "Linkedin",
    createAuthorizationURL: async ({ state, scopes, redirectURI, loginHint }) => {
      const _scopes = options.disableDefaultScope ? [] : [
        "profile",
        "email",
        "openid"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return await createAuthorizationURL({
        id: "linkedin",
        options,
        authorizationEndpoint,
        scopes: _scopes,
        state,
        loginHint,
        redirectURI
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return await validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://api.linkedin.com/v2/userinfo", {
        method: "GET",
        headers: { Authorization: `Bearer ${token.accessToken}` }
      });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          emailVerified: profile.email_verified || false,
          image: profile.picture,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const microsoft = (options) => {
  const tenant = options.tenantId || "common";
  const authority = options.authority || "https://login.microsoftonline.com";
  const authorizationEndpoint = `${authority}/${tenant}/oauth2/v2.0/authorize`;
  const tokenEndpoint = `${authority}/${tenant}/oauth2/v2.0/token`;
  return {
    id: "microsoft",
    name: "Microsoft EntraID",
    createAuthorizationURL(data) {
      const scopes = options.disableDefaultScope ? [] : [
        "openid",
        "profile",
        "email",
        "User.Read",
        "offline_access"
      ];
      if (options.scope) scopes.push(...options.scope);
      if (data.scopes) scopes.push(...data.scopes);
      return createAuthorizationURL({
        id: "microsoft",
        options,
        authorizationEndpoint,
        state: data.state,
        codeVerifier: data.codeVerifier,
        scopes,
        redirectURI: data.redirectURI,
        prompt: options.prompt,
        loginHint: data.loginHint
      });
    },
    validateAuthorizationCode({ code, codeVerifier, redirectURI }) {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      if (!token.idToken) return null;
      const user = decodeJwt(token.idToken);
      const profilePhotoSize = options.profilePhotoSize || 48;
      await betterFetch(`https://graph.microsoft.com/v1.0/me/photos/${profilePhotoSize}x${profilePhotoSize}/$value`, {
        headers: { Authorization: `Bearer ${token.accessToken}` },
        async onResponse(context) {
          if (options.disableProfilePhoto || !context.response.ok) return;
          try {
            const pictureBuffer = await context.response.clone().arrayBuffer();
            user.picture = `data:image/jpeg;base64, ${base64.encode(pictureBuffer)}`;
          } catch (e) {
            logger.error(e && typeof e === "object" && "name" in e ? e.name : "", e);
          }
        }
      });
      const userMap = await options.mapProfileToUser?.(user);
      const emailVerified = user.email_verified !== void 0 ? user.email_verified : user.email && (user.verified_primary_email?.includes(user.email) || user.verified_secondary_email?.includes(user.email)) ? true : false;
      return {
        user: {
          id: user.sub,
          name: user.name,
          email: user.email,
          image: user.picture,
          emailVerified,
          ...userMap
        },
        data: user
      };
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      const scopes = options.disableDefaultScope ? [] : [
        "openid",
        "profile",
        "email",
        "User.Read",
        "offline_access"
      ];
      if (options.scope) scopes.push(...options.scope);
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientSecret: options.clientSecret
        },
        extraParams: { scope: scopes.join(" ") },
        tokenEndpoint
      });
    },
    options
  };
};
const naver = (options) => {
  return {
    id: "naver",
    name: "Naver",
    createAuthorizationURL({ state, scopes, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["profile", "email"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "naver",
        options,
        authorizationEndpoint: "https://nid.naver.com/oauth2.0/authorize",
        scopes: _scopes,
        state,
        redirectURI
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint: "https://nid.naver.com/oauth2.0/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://nid.naver.com/oauth2.0/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://openapi.naver.com/v1/nid/me", { headers: { Authorization: `Bearer ${token.accessToken}` } });
      if (error || !profile || profile.resultcode !== "00") return null;
      const userMap = await options.mapProfileToUser?.(profile);
      const res = profile.response || {};
      return {
        user: {
          id: res.id,
          name: res.name || res.nickname,
          email: res.email,
          image: res.profile_image,
          emailVerified: false,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const notion = (options) => {
  const tokenEndpoint = "https://api.notion.com/v1/oauth/token";
  return {
    id: "notion",
    name: "Notion",
    createAuthorizationURL({ state, scopes, loginHint, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : [];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "notion",
        options,
        authorizationEndpoint: "https://api.notion.com/v1/oauth/authorize",
        scopes: _scopes,
        state,
        redirectURI,
        loginHint,
        additionalParams: { owner: "user" }
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint,
        authentication: "basic"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://api.notion.com/v1/users/me", { headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Notion-Version": "2022-06-28"
      } });
      if (error || !profile) return null;
      const userProfile = profile.bot?.owner?.user;
      if (!userProfile) return null;
      const userMap = await options.mapProfileToUser?.(userProfile);
      return {
        user: {
          id: userProfile.id,
          name: userProfile.name || "Notion User",
          email: userProfile.person?.email || null,
          image: userProfile.avatar_url,
          emailVerified: false,
          ...userMap
        },
        data: userProfile
      };
    },
    options
  };
};
const paybin = (options) => {
  const issuer = options.issuer || "https://idp.paybin.io";
  const authorizationEndpoint = `${issuer}/oauth2/authorize`;
  const tokenEndpoint = `${issuer}/oauth2/token`;
  return {
    id: "paybin",
    name: "Paybin",
    async createAuthorizationURL({ state, scopes, codeVerifier, redirectURI, loginHint }) {
      if (!options.clientId || !options.clientSecret) {
        logger.error("Client Id and Client Secret is required for Paybin. Make sure to provide them in the options.");
        throw new BetterAuthError("CLIENT_ID_AND_SECRET_REQUIRED");
      }
      if (!codeVerifier) throw new BetterAuthError("codeVerifier is required for Paybin");
      const _scopes = options.disableDefaultScope ? [] : [
        "openid",
        "email",
        "profile"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return await createAuthorizationURL({
        id: "paybin",
        options,
        authorizationEndpoint,
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI,
        prompt: options.prompt,
        loginHint
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      if (!token.idToken) return null;
      const user = decodeJwt(token.idToken);
      const userMap = await options.mapProfileToUser?.(user);
      return {
        user: {
          id: user.sub,
          name: user.name || user.preferred_username || (user.email ? user.email.split("@")[0] : "User") || "User",
          email: user.email,
          image: user.picture,
          emailVerified: user.email_verified || false,
          ...userMap
        },
        data: user
      };
    },
    options
  };
};
const paypal = (options) => {
  const isSandbox = (options.environment || "sandbox") === "sandbox";
  const authorizationEndpoint = isSandbox ? "https://www.sandbox.paypal.com/signin/authorize" : "https://www.paypal.com/signin/authorize";
  const tokenEndpoint = isSandbox ? "https://api-m.sandbox.paypal.com/v1/oauth2/token" : "https://api-m.paypal.com/v1/oauth2/token";
  const userInfoEndpoint = isSandbox ? "https://api-m.sandbox.paypal.com/v1/identity/oauth2/userinfo" : "https://api-m.paypal.com/v1/identity/oauth2/userinfo";
  return {
    id: "paypal",
    name: "PayPal",
    async createAuthorizationURL({ state, codeVerifier, redirectURI }) {
      if (!options.clientId || !options.clientSecret) {
        logger.error("Client Id and Client Secret is required for PayPal. Make sure to provide them in the options.");
        throw new BetterAuthError("CLIENT_ID_AND_SECRET_REQUIRED");
      }
      return await createAuthorizationURL({
        id: "paypal",
        options,
        authorizationEndpoint,
        scopes: [],
        state,
        codeVerifier,
        redirectURI,
        prompt: options.prompt
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      const credentials = base64.encode(`${options.clientId}:${options.clientSecret}`);
      try {
        const response = await betterFetch(tokenEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            Accept: "application/json",
            "Accept-Language": "en_US",
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectURI
          }).toString()
        });
        if (!response.data) throw new BetterAuthError("FAILED_TO_GET_ACCESS_TOKEN");
        const data = response.data;
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          accessTokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0,
          idToken: data.id_token
        };
      } catch (error) {
        logger.error("PayPal token exchange failed:", error);
        throw new BetterAuthError("FAILED_TO_GET_ACCESS_TOKEN");
      }
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      const credentials = base64.encode(`${options.clientId}:${options.clientSecret}`);
      try {
        const response = await betterFetch(tokenEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            Accept: "application/json",
            "Accept-Language": "en_US",
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken
          }).toString()
        });
        if (!response.data) throw new BetterAuthError("FAILED_TO_REFRESH_ACCESS_TOKEN");
        const data = response.data;
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          accessTokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1e3) : void 0
        };
      } catch (error) {
        logger.error("PayPal token refresh failed:", error);
        throw new BetterAuthError("FAILED_TO_REFRESH_ACCESS_TOKEN");
      }
    },
    async verifyIdToken(token, nonce) {
      if (options.disableIdTokenSignIn) return false;
      if (options.verifyIdToken) return options.verifyIdToken(token, nonce);
      try {
        return !!decodeJwt(token).sub;
      } catch (error) {
        logger.error("Failed to verify PayPal ID token:", error);
        return false;
      }
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      if (!token.accessToken) {
        logger.error("Access token is required to fetch PayPal user info");
        return null;
      }
      try {
        const response = await betterFetch(`${userInfoEndpoint}?schema=paypalv1.1`, { headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/json"
        } });
        if (!response.data) {
          logger.error("Failed to fetch user info from PayPal");
          return null;
        }
        const userInfo = response.data;
        const userMap = await options.mapProfileToUser?.(userInfo);
        return {
          user: {
            id: userInfo.user_id,
            name: userInfo.name,
            email: userInfo.email,
            image: userInfo.picture,
            emailVerified: userInfo.email_verified,
            ...userMap
          },
          data: userInfo
        };
      } catch (error) {
        logger.error("Failed to fetch user info from PayPal:", error);
        return null;
      }
    },
    options
  };
};
const polar = (options) => {
  return {
    id: "polar",
    name: "Polar",
    createAuthorizationURL({ state, scopes, codeVerifier, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : [
        "openid",
        "profile",
        "email"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "polar",
        options,
        authorizationEndpoint: "https://polar.sh/oauth2/authorize",
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI,
        prompt: options.prompt
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint: "https://api.polar.sh/v1/oauth2/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://api.polar.sh/v1/oauth2/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://api.polar.sh/v1/oauth2/userinfo", { headers: { Authorization: `Bearer ${token.accessToken}` } });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.id,
          name: profile.public_name || profile.username,
          email: profile.email,
          image: profile.avatar_url,
          emailVerified: profile.email_verified ?? false,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const reddit = (options) => {
  return {
    id: "reddit",
    name: "Reddit",
    createAuthorizationURL({ state, scopes, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["identity"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "reddit",
        options,
        authorizationEndpoint: "https://www.reddit.com/api/v1/authorize",
        scopes: _scopes,
        state,
        redirectURI,
        duration: options.duration
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: options.redirectURI || redirectURI
      });
      const { data, error } = await betterFetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          accept: "text/plain",
          "user-agent": "better-auth",
          Authorization: `Basic ${base64.encode(`${options.clientId}:${options.clientSecret}`)}`
        },
        body: body.toString()
      });
      if (error) throw error;
      return getOAuth2Tokens(data);
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        authentication: "basic",
        tokenEndpoint: "https://www.reddit.com/api/v1/access_token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://oauth.reddit.com/api/v1/me", { headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "User-Agent": "better-auth"
      } });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.oauth_client_id,
          emailVerified: profile.has_verified_email,
          image: profile.icon_img?.split("?")[0],
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const roblox = (options) => {
  return {
    id: "roblox",
    name: "Roblox",
    createAuthorizationURL({ state, scopes, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["openid", "profile"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return new URL(`https://apis.roblox.com/oauth/v1/authorize?scope=${_scopes.join("+")}&response_type=code&client_id=${options.clientId}&redirect_uri=${encodeURIComponent(options.redirectURI || redirectURI)}&state=${state}&prompt=${options.prompt || "select_account consent"}`);
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI: options.redirectURI || redirectURI,
        options,
        tokenEndpoint: "https://apis.roblox.com/oauth/v1/token",
        authentication: "post"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://apis.roblox.com/oauth/v1/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://apis.roblox.com/oauth/v1/userinfo", { headers: { authorization: `Bearer ${token.accessToken}` } });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.sub,
          name: profile.nickname || profile.preferred_username || "",
          image: profile.picture,
          email: profile.preferred_username || null,
          emailVerified: false,
          ...userMap
        },
        data: { ...profile }
      };
    },
    options
  };
};
const salesforce = (options) => {
  const isSandbox = (options.environment ?? "production") === "sandbox";
  const authorizationEndpoint = options.loginUrl ? `https://${options.loginUrl}/services/oauth2/authorize` : isSandbox ? "https://test.salesforce.com/services/oauth2/authorize" : "https://login.salesforce.com/services/oauth2/authorize";
  const tokenEndpoint = options.loginUrl ? `https://${options.loginUrl}/services/oauth2/token` : isSandbox ? "https://test.salesforce.com/services/oauth2/token" : "https://login.salesforce.com/services/oauth2/token";
  const userInfoEndpoint = options.loginUrl ? `https://${options.loginUrl}/services/oauth2/userinfo` : isSandbox ? "https://test.salesforce.com/services/oauth2/userinfo" : "https://login.salesforce.com/services/oauth2/userinfo";
  return {
    id: "salesforce",
    name: "Salesforce",
    async createAuthorizationURL({ state, scopes, codeVerifier, redirectURI }) {
      if (!options.clientId || !options.clientSecret) {
        logger.error("Client Id and Client Secret are required for Salesforce. Make sure to provide them in the options.");
        throw new BetterAuthError("CLIENT_ID_AND_SECRET_REQUIRED");
      }
      if (!codeVerifier) throw new BetterAuthError("codeVerifier is required for Salesforce");
      const _scopes = options.disableDefaultScope ? [] : [
        "openid",
        "email",
        "profile"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "salesforce",
        options,
        authorizationEndpoint,
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI: options.redirectURI || redirectURI
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI: options.redirectURI || redirectURI,
        options,
        tokenEndpoint
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientSecret: options.clientSecret
        },
        tokenEndpoint
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      try {
        const { data: user } = await betterFetch(userInfoEndpoint, { headers: { Authorization: `Bearer ${token.accessToken}` } });
        if (!user) {
          logger.error("Failed to fetch user info from Salesforce");
          return null;
        }
        const userMap = await options.mapProfileToUser?.(user);
        return {
          user: {
            id: user.user_id,
            name: user.name,
            email: user.email,
            image: user.photos?.picture || user.photos?.thumbnail,
            emailVerified: user.email_verified ?? false,
            ...userMap
          },
          data: user
        };
      } catch (error) {
        logger.error("Failed to fetch user info from Salesforce:", error);
        return null;
      }
    },
    options
  };
};
const slack = (options) => {
  return {
    id: "slack",
    name: "Slack",
    createAuthorizationURL({ state, scopes, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : [
        "openid",
        "profile",
        "email"
      ];
      if (scopes) _scopes.push(...scopes);
      if (options.scope) _scopes.push(...options.scope);
      const url = new URL("https://slack.com/openid/connect/authorize");
      url.searchParams.set("scope", _scopes.join(" "));
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", options.clientId);
      url.searchParams.set("redirect_uri", options.redirectURI || redirectURI);
      url.searchParams.set("state", state);
      return url;
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint: "https://slack.com/api/openid.connect.token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://slack.com/api/openid.connect.token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://slack.com/api/openid.connect.userInfo", { headers: { authorization: `Bearer ${token.accessToken}` } });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile["https://slack.com/user_id"],
          name: profile.name || "",
          email: profile.email,
          emailVerified: profile.email_verified,
          image: profile.picture || profile["https://slack.com/user_image_512"],
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const spotify = (options) => {
  return {
    id: "spotify",
    name: "Spotify",
    createAuthorizationURL({ state, scopes, codeVerifier, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["user-read-email"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "spotify",
        options,
        authorizationEndpoint: "https://accounts.spotify.com/authorize",
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint: "https://accounts.spotify.com/api/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://accounts.spotify.com/api/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token.accessToken}` }
      });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.id,
          name: profile.display_name,
          email: profile.email,
          image: profile.images[0]?.url,
          emailVerified: false,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const tiktok = (options) => {
  return {
    id: "tiktok",
    name: "TikTok",
    createAuthorizationURL({ state, scopes, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["user.info.profile"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return new URL(`https://www.tiktok.com/v2/auth/authorize?scope=${_scopes.join(",")}&response_type=code&client_key=${options.clientKey}&redirect_uri=${encodeURIComponent(options.redirectURI || redirectURI)}&state=${state}`);
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI: options.redirectURI || redirectURI,
        options: {
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://open.tiktokapis.com/v2/oauth/token/"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: { clientSecret: options.clientSecret },
        tokenEndpoint: "https://open.tiktokapis.com/v2/oauth/token/",
        authentication: "post",
        extraParams: { client_key: options.clientKey }
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch(`https://open.tiktokapis.com/v2/user/info/?fields=${[
        "open_id",
        "avatar_large_url",
        "display_name",
        "username"
      ].join(",")}`, { headers: { authorization: `Bearer ${token.accessToken}` } });
      if (error) return null;
      return {
        user: {
          email: profile.data.user.email || profile.data.user.username,
          id: profile.data.user.open_id,
          name: profile.data.user.display_name || profile.data.user.username,
          image: profile.data.user.avatar_large_url,
          emailVerified: false
        },
        data: profile
      };
    },
    options
  };
};
const twitch = (options) => {
  return {
    id: "twitch",
    name: "Twitch",
    createAuthorizationURL({ state, scopes, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["user:read:email", "openid"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "twitch",
        redirectURI,
        options,
        authorizationEndpoint: "https://id.twitch.tv/oauth2/authorize",
        scopes: _scopes,
        state,
        claims: options.claims || [
          "email",
          "email_verified",
          "preferred_username",
          "picture"
        ]
      });
    },
    validateAuthorizationCode: async ({ code, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        redirectURI,
        options,
        tokenEndpoint: "https://id.twitch.tv/oauth2/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://id.twitch.tv/oauth2/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const idToken = token.idToken;
      if (!idToken) {
        logger.error("No idToken found in token");
        return null;
      }
      const profile = decodeJwt(idToken);
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.sub,
          name: profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const twitter = (options) => {
  return {
    id: "twitter",
    name: "Twitter",
    createAuthorizationURL(data) {
      const _scopes = options.disableDefaultScope ? [] : [
        "users.read",
        "tweet.read",
        "offline.access",
        "users.email"
      ];
      if (options.scope) _scopes.push(...options.scope);
      if (data.scopes) _scopes.push(...data.scopes);
      return createAuthorizationURL({
        id: "twitter",
        options,
        authorizationEndpoint: "https://x.com/i/oauth2/authorize",
        scopes: _scopes,
        state: data.state,
        codeVerifier: data.codeVerifier,
        redirectURI: data.redirectURI
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        authentication: "basic",
        redirectURI,
        options,
        tokenEndpoint: "https://api.x.com/2/oauth2/token"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        authentication: "basic",
        tokenEndpoint: "https://api.x.com/2/oauth2/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error: profileError } = await betterFetch("https://api.x.com/2/users/me?user.fields=profile_image_url", {
        method: "GET",
        headers: { Authorization: `Bearer ${token.accessToken}` }
      });
      if (profileError) return null;
      const { data: emailData, error: emailError } = await betterFetch("https://api.x.com/2/users/me?user.fields=confirmed_email", {
        method: "GET",
        headers: { Authorization: `Bearer ${token.accessToken}` }
      });
      let emailVerified = false;
      if (!emailError && emailData?.data?.confirmed_email) {
        profile.data.email = emailData.data.confirmed_email;
        emailVerified = true;
      }
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.data.id,
          name: profile.data.name,
          email: profile.data.email || profile.data.username || null,
          image: profile.data.profile_image_url,
          emailVerified,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const vercel = (options) => {
  return {
    id: "vercel",
    name: "Vercel",
    createAuthorizationURL({ state, scopes, codeVerifier, redirectURI }) {
      if (!codeVerifier) throw new BetterAuthError("codeVerifier is required for Vercel");
      let _scopes = void 0;
      if (options.scope !== void 0 || scopes !== void 0) {
        _scopes = [];
        if (options.scope) _scopes.push(...options.scope);
        if (scopes) _scopes.push(...scopes);
      }
      return createAuthorizationURL({
        id: "vercel",
        options,
        authorizationEndpoint: "https://vercel.com/oauth/authorize",
        scopes: _scopes,
        state,
        codeVerifier,
        redirectURI
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI,
        options,
        tokenEndpoint: "https://api.vercel.com/login/oauth/token"
      });
    },
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://api.vercel.com/login/oauth/userinfo", { headers: { Authorization: `Bearer ${token.accessToken}` } });
      if (error || !profile) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ?? false,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const vk = (options) => {
  return {
    id: "vk",
    name: "VK",
    async createAuthorizationURL({ state, scopes, codeVerifier, redirectURI }) {
      const _scopes = options.disableDefaultScope ? [] : ["email", "phone"];
      if (options.scope) _scopes.push(...options.scope);
      if (scopes) _scopes.push(...scopes);
      return createAuthorizationURL({
        id: "vk",
        options,
        authorizationEndpoint: "https://id.vk.com/authorize",
        scopes: _scopes,
        state,
        redirectURI,
        codeVerifier
      });
    },
    validateAuthorizationCode: async ({ code, codeVerifier, redirectURI, deviceId }) => {
      return validateAuthorizationCode({
        code,
        codeVerifier,
        redirectURI: options.redirectURI || redirectURI,
        options,
        deviceId,
        tokenEndpoint: "https://id.vk.com/oauth2/auth"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => {
      return refreshAccessToken({
        refreshToken,
        options: {
          clientId: options.clientId,
          clientKey: options.clientKey,
          clientSecret: options.clientSecret
        },
        tokenEndpoint: "https://id.vk.com/oauth2/auth"
      });
    },
    async getUserInfo(data) {
      if (options.getUserInfo) return options.getUserInfo(data);
      if (!data.accessToken) return null;
      const formBody = new URLSearchParams({
        access_token: data.accessToken,
        client_id: options.clientId
      }).toString();
      const { data: profile, error } = await betterFetch("https://id.vk.com/oauth2/user_info", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
      });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      if (!profile.user.email && !userMap?.email) return null;
      return {
        user: {
          id: profile.user.user_id,
          first_name: profile.user.first_name,
          last_name: profile.user.last_name,
          email: profile.user.email,
          image: profile.user.avatar,
          emailVerified: false,
          birthday: profile.user.birthday,
          sex: profile.user.sex,
          name: `${profile.user.first_name} ${profile.user.last_name}`,
          ...userMap
        },
        data: profile
      };
    },
    options
  };
};
const zoom = (userOptions) => {
  const options = {
    pkce: true,
    ...userOptions
  };
  return {
    id: "zoom",
    name: "Zoom",
    createAuthorizationURL: async ({ state, redirectURI, codeVerifier }) => {
      const params = new URLSearchParams({
        response_type: "code",
        redirect_uri: options.redirectURI ? options.redirectURI : redirectURI,
        client_id: options.clientId,
        state
      });
      if (options.pkce) {
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        params.set("code_challenge_method", "S256");
        params.set("code_challenge", codeChallenge);
      }
      const url = new URL("https://zoom.us/oauth/authorize");
      url.search = params.toString();
      return url;
    },
    validateAuthorizationCode: async ({ code, redirectURI, codeVerifier }) => {
      return validateAuthorizationCode({
        code,
        redirectURI: options.redirectURI || redirectURI,
        codeVerifier,
        options,
        tokenEndpoint: "https://zoom.us/oauth/token",
        authentication: "post"
      });
    },
    refreshAccessToken: options.refreshAccessToken ? options.refreshAccessToken : async (refreshToken) => refreshAccessToken({
      refreshToken,
      options: {
        clientId: options.clientId,
        clientKey: options.clientKey,
        clientSecret: options.clientSecret
      },
      tokenEndpoint: "https://zoom.us/oauth/token"
    }),
    async getUserInfo(token) {
      if (options.getUserInfo) return options.getUserInfo(token);
      const { data: profile, error } = await betterFetch("https://api.zoom.us/v2/users/me", { headers: { authorization: `Bearer ${token.accessToken}` } });
      if (error) return null;
      const userMap = await options.mapProfileToUser?.(profile);
      return {
        user: {
          id: profile.id,
          name: profile.display_name,
          image: profile.pic_url,
          email: profile.email,
          emailVerified: Boolean(profile.verified),
          ...userMap
        },
        data: { ...profile }
      };
    }
  };
};
const socialProviders = {
  apple,
  atlassian,
  cognito,
  discord,
  facebook,
  figma,
  github,
  microsoft,
  google,
  huggingface,
  slack,
  spotify,
  twitch,
  twitter,
  dropbox,
  kick,
  linear,
  linkedin,
  gitlab,
  tiktok,
  reddit,
  roblox,
  salesforce,
  vk,
  zoom,
  notion,
  kakao,
  naver,
  line,
  paybin,
  paypal,
  polar,
  vercel
};
const socialProviderList = Object.keys(socialProviders);
const SocialProviderListEnum = _enum(socialProviderList).or(string());
export {
  isProduction as A,
  BASE_ERROR_CODES as B,
  shouldPublishLog as C,
  defineRequestState as D,
  ENV as E,
  socialProviders as F,
  capitalizeFirstLetter as G,
  SocialProviderListEnum as S,
  createAuthMiddleware as a,
  getEnvVar as b,
  createAuthEndpoint as c,
  defineErrorCodes as d,
  env as e,
  isDevelopment as f,
  getBooleanEnvVar as g,
  deprecate as h,
  isTest as i,
  getAuthTables as j,
  BetterAuthError as k,
  logger as l,
  getCurrentAuthContext as m,
  getCurrentAdapter as n,
  generateId as o,
  createLogger as p,
  initGetModelName as q,
  runWithTransaction as r,
  safeJSONParse as s,
  initGetFieldName as t,
  import___better_auth_core_db as u,
  createAdapterFactory as v,
  runWithAdapter as w,
  hasRequestState as x,
  runWithRequestState as y,
  runWithEndpointContext as z
};
