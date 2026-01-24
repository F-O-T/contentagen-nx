function ensureSynchronous(value, message) {
  if (value instanceof Promise) throw new Error(message);
}
function parseWithDictionary(dictionary, value) {
  const result = {};
  const issues = [];
  for (const key in dictionary) {
    const propResult = dictionary[key]["~standard"].validate(value[key]);
    ensureSynchronous(propResult, `Validation must be synchronous, but ${key} returned a Promise.`);
    if (propResult.issues) {
      issues.push(...propResult.issues.map((issue) => ({
        ...issue,
        message: issue.message,
        path: [key, ...issue.path ?? []]
      })));
      continue;
    }
    result[key] = propResult.value;
  }
  if (issues.length) return { issues };
  return { value: result };
}
function createEnv(opts) {
  const runtimeEnv = opts.runtimeEnvStrict ?? opts.runtimeEnv ?? process.env;
  if (opts.emptyStringAsUndefined ?? false) {
    for (const [key, value] of Object.entries(runtimeEnv)) if (value === "") delete runtimeEnv[key];
  }
  if (!!opts.skipValidation) {
    if (opts.extends) for (const preset of opts.extends) preset.skipValidation = true;
    return runtimeEnv;
  }
  const _client = typeof opts.client === "object" ? opts.client : {};
  const _server = typeof opts.server === "object" ? opts.server : {};
  const _shared = typeof opts.shared === "object" ? opts.shared : {};
  const isServer = opts.isServer ?? (typeof window === "undefined" || "Deno" in window);
  const finalSchemaShape = isServer ? {
    ..._server,
    ..._shared,
    ..._client
  } : {
    ..._client,
    ..._shared
  };
  const parsed = opts.createFinalSchema?.(finalSchemaShape, isServer)?.["~standard"].validate(runtimeEnv) ?? parseWithDictionary(finalSchemaShape, runtimeEnv);
  ensureSynchronous(parsed, "Validation must be synchronous");
  const onValidationError = opts.onValidationError ?? ((issues) => {
    console.error("❌ Invalid environment variables:", issues);
    throw new Error("Invalid environment variables");
  });
  const onInvalidAccess = opts.onInvalidAccess ?? (() => {
    throw new Error("❌ Attempted to access a server-side environment variable on the client");
  });
  if (parsed.issues) return onValidationError(parsed.issues);
  const isServerAccess = (prop) => {
    if (!opts.clientPrefix) return true;
    return !prop.startsWith(opts.clientPrefix) && !(prop in _shared);
  };
  const isValidServerAccess = (prop) => {
    return isServer || !isServerAccess(prop);
  };
  const ignoreProp = (prop) => {
    return prop === "__esModule" || prop === "$$typeof";
  };
  const extendedObj = (opts.extends ?? []).reduce((acc, curr) => {
    return Object.assign(acc, curr);
  }, {});
  const fullObj = Object.assign(extendedObj, parsed.value);
  return new Proxy(fullObj, { get(target, prop) {
    if (typeof prop !== "string") return void 0;
    if (ignoreProp(prop)) return void 0;
    if (!isValidServerAccess(prop)) return onInvalidAccess(prop);
    return Reflect.get(target, prop);
  } });
}
export {
  createEnv as c
};
