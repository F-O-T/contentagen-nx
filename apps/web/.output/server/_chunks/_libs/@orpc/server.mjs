import { m as mergePrefix, a as mergeErrorMap, e as enhanceRoute, i as isContractProcedure, v as validateORPCError, V as ValidationError, b as mergeMeta, c as mergeRoute, d as mergeTags, f as fallbackContractConfig } from "./contract.mjs";
import { r as resolveMaybeOptionalOptions, t as toArray, v as value, d as runWithSpan, e as intercept, b as isAsyncIteratorObject, o as overlayProxy, f as asyncIteratorWithSpan, i as isObject, N as NullProtoObj, p as parseEmptyableJSON, O as ORPC_NAME, h as setSpanError } from "./shared.mjs";
import { m as mapEventIterator, O as ORPCError, a as toORPCError, S as StandardRPCJsonSerializer, d as StandardRPCSerializer, t as toHttpPath } from "./client.mjs";
import { t as toStandardLazyRequest, a as toFetchResponse } from "./standard-server-fetch.mjs";
import { H as HibernationEventIterator, f as flattenHeader } from "./standard-server.mjs";
const LAZY_SYMBOL = Symbol("ORPC_LAZY_SYMBOL");
function lazy(loader, meta = {}) {
  return {
    [LAZY_SYMBOL]: {
      loader,
      meta
    }
  };
}
function isLazy(item) {
  return (typeof item === "object" || typeof item === "function") && item !== null && LAZY_SYMBOL in item;
}
function getLazyMeta(lazied) {
  return lazied[LAZY_SYMBOL].meta;
}
function unlazy(lazied) {
  return isLazy(lazied) ? lazied[LAZY_SYMBOL].loader() : Promise.resolve({ default: lazied });
}
function isStartWithMiddlewares(middlewares, compare) {
  if (compare.length > middlewares.length) {
    return false;
  }
  for (let i = 0; i < middlewares.length; i++) {
    if (compare[i] === void 0) {
      return true;
    }
    if (middlewares[i] !== compare[i]) {
      return false;
    }
  }
  return true;
}
function mergeMiddlewares(first, second, options) {
  if (options.dedupeLeading && isStartWithMiddlewares(second, first)) {
    return second;
  }
  return [...first, ...second];
}
function addMiddleware(middlewares, addition) {
  return [...middlewares, addition];
}
class Procedure {
  /**
   * This property holds the defined options.
   */
  "~orpc";
  constructor(def) {
    this["~orpc"] = def;
  }
}
function isProcedure(item) {
  if (item instanceof Procedure) {
    return true;
  }
  return isContractProcedure(item) && "middlewares" in item["~orpc"] && "inputValidationIndex" in item["~orpc"] && "outputValidationIndex" in item["~orpc"] && "handler" in item["~orpc"];
}
function mergeCurrentContext(context, other) {
  return { ...context, ...other };
}
function createORPCErrorConstructorMap(errors) {
  const proxy = new Proxy(errors, {
    get(target, code) {
      if (typeof code !== "string") {
        return Reflect.get(target, code);
      }
      const item = (...rest) => {
        const options = resolveMaybeOptionalOptions(rest);
        const config = errors[code];
        return new ORPCError(code, {
          defined: Boolean(config),
          status: config?.status,
          message: options.message ?? config?.message,
          data: options.data,
          cause: options.cause
        });
      };
      return item;
    }
  });
  return proxy;
}
function middlewareOutputFn(output) {
  return { output, context: {} };
}
function createProcedureClient(lazyableProcedure, ...rest) {
  const options = resolveMaybeOptionalOptions(rest);
  return async (...[input, callerOptions]) => {
    const path = toArray(options.path);
    const { default: procedure } = await unlazy(lazyableProcedure);
    const clientContext = callerOptions?.context ?? {};
    const context = await value(options.context ?? {}, clientContext);
    const errors = createORPCErrorConstructorMap(procedure["~orpc"].errorMap);
    const validateError = async (e) => {
      if (e instanceof ORPCError) {
        return await validateORPCError(procedure["~orpc"].errorMap, e);
      }
      return e;
    };
    try {
      const output = await runWithSpan(
        { name: "call_procedure", signal: callerOptions?.signal },
        (span) => {
          span?.setAttribute("procedure.path", [...path]);
          return intercept(
            toArray(options.interceptors),
            {
              context,
              input,
              // input only optional when it undefinable so we can safely cast it
              errors,
              path,
              procedure,
              signal: callerOptions?.signal,
              lastEventId: callerOptions?.lastEventId
            },
            (interceptorOptions) => executeProcedureInternal(interceptorOptions.procedure, interceptorOptions)
          );
        }
      );
      if (isAsyncIteratorObject(output)) {
        if (output instanceof HibernationEventIterator) {
          return output;
        }
        return overlayProxy(output, mapEventIterator(
          asyncIteratorWithSpan(
            { name: "consume_event_iterator_output", signal: callerOptions?.signal },
            output
          ),
          {
            value: (v) => v,
            error: (e) => validateError(e)
          }
        ));
      }
      return output;
    } catch (e) {
      throw await validateError(e);
    }
  };
}
async function validateInput(procedure, input) {
  const schema = procedure["~orpc"].inputSchema;
  if (!schema) {
    return input;
  }
  return runWithSpan(
    { name: "validate_input" },
    async () => {
      const result = await schema["~standard"].validate(input);
      if (result.issues) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Input validation failed",
          data: {
            issues: result.issues
          },
          cause: new ValidationError({
            message: "Input validation failed",
            issues: result.issues,
            data: input
          })
        });
      }
      return result.value;
    }
  );
}
async function validateOutput(procedure, output) {
  const schema = procedure["~orpc"].outputSchema;
  if (!schema) {
    return output;
  }
  return runWithSpan(
    { name: "validate_output" },
    async () => {
      const result = await schema["~standard"].validate(output);
      if (result.issues) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Output validation failed",
          cause: new ValidationError({
            message: "Output validation failed",
            issues: result.issues,
            data: output
          })
        });
      }
      return result.value;
    }
  );
}
async function executeProcedureInternal(procedure, options) {
  const middlewares = procedure["~orpc"].middlewares;
  const inputValidationIndex = Math.min(Math.max(0, procedure["~orpc"].inputValidationIndex), middlewares.length);
  const outputValidationIndex = Math.min(Math.max(0, procedure["~orpc"].outputValidationIndex), middlewares.length);
  const next = async (index, context, input) => {
    let currentInput = input;
    if (index === inputValidationIndex) {
      currentInput = await validateInput(procedure, currentInput);
    }
    const mid = middlewares[index];
    const output = mid ? await runWithSpan(
      { name: `middleware.${mid.name}`, signal: options.signal },
      async (span) => {
        span?.setAttribute("middleware.index", index);
        span?.setAttribute("middleware.name", mid.name);
        const result = await mid({
          ...options,
          context,
          next: async (...[nextOptions]) => {
            const nextContext = nextOptions?.context ?? {};
            return {
              output: await next(index + 1, mergeCurrentContext(context, nextContext), currentInput),
              context: nextContext
            };
          }
        }, currentInput, middlewareOutputFn);
        return result.output;
      }
    ) : await runWithSpan(
      { name: "handler", signal: options.signal },
      () => procedure["~orpc"].handler({ ...options, context, input: currentInput })
    );
    if (index === outputValidationIndex) {
      return await validateOutput(procedure, output);
    }
    return output;
  };
  return next(0, options.context, options.input);
}
const HIDDEN_ROUTER_CONTRACT_SYMBOL = Symbol("ORPC_HIDDEN_ROUTER_CONTRACT");
function getHiddenRouterContract(router) {
  return router[HIDDEN_ROUTER_CONTRACT_SYMBOL];
}
function getRouter(router, path) {
  let current = router;
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    if (!current) {
      return void 0;
    }
    if (isProcedure(current)) {
      return void 0;
    }
    if (!isLazy(current)) {
      current = current[segment];
      continue;
    }
    const lazied = current;
    const rest = path.slice(i);
    return lazy(async () => {
      const unwrapped = await unlazy(lazied);
      const next = getRouter(unwrapped.default, rest);
      return unlazy(next);
    }, getLazyMeta(lazied));
  }
  return current;
}
function createAccessibleLazyRouter(lazied) {
  const recursive = new Proxy(lazied, {
    get(target, key) {
      if (typeof key !== "string") {
        return Reflect.get(target, key);
      }
      const next = getRouter(lazied, [key]);
      return createAccessibleLazyRouter(next);
    }
  });
  return recursive;
}
function enhanceRouter(router, options) {
  if (isLazy(router)) {
    const laziedMeta = getLazyMeta(router);
    const enhancedPrefix = laziedMeta?.prefix ? mergePrefix(options.prefix, laziedMeta?.prefix) : options.prefix;
    const enhanced2 = lazy(async () => {
      const { default: unlaziedRouter } = await unlazy(router);
      const enhanced3 = enhanceRouter(unlaziedRouter, options);
      return unlazy(enhanced3);
    }, {
      ...laziedMeta,
      prefix: enhancedPrefix
    });
    const accessible = createAccessibleLazyRouter(enhanced2);
    return accessible;
  }
  if (isProcedure(router)) {
    const newMiddlewares = mergeMiddlewares(options.middlewares, router["~orpc"].middlewares, { dedupeLeading: options.dedupeLeadingMiddlewares });
    const newMiddlewareAdded = newMiddlewares.length - router["~orpc"].middlewares.length;
    const enhanced2 = new Procedure({
      ...router["~orpc"],
      route: enhanceRoute(router["~orpc"].route, options),
      errorMap: mergeErrorMap(options.errorMap, router["~orpc"].errorMap),
      middlewares: newMiddlewares,
      inputValidationIndex: router["~orpc"].inputValidationIndex + newMiddlewareAdded,
      outputValidationIndex: router["~orpc"].outputValidationIndex + newMiddlewareAdded
    });
    return enhanced2;
  }
  const enhanced = {};
  for (const key in router) {
    enhanced[key] = enhanceRouter(router[key], options);
  }
  return enhanced;
}
function traverseContractProcedures(options, callback, lazyOptions = []) {
  let currentRouter = options.router;
  const hiddenContract = getHiddenRouterContract(options.router);
  if (hiddenContract !== void 0) {
    currentRouter = hiddenContract;
  }
  if (isLazy(currentRouter)) {
    lazyOptions.push({
      router: currentRouter,
      path: options.path
    });
  } else if (isContractProcedure(currentRouter)) {
    callback({
      contract: currentRouter,
      path: options.path
    });
  } else {
    for (const key in currentRouter) {
      traverseContractProcedures(
        {
          router: currentRouter[key],
          path: [...options.path, key]
        },
        callback,
        lazyOptions
      );
    }
  }
  return lazyOptions;
}
function createAssertedLazyProcedure(lazied) {
  const lazyProcedure = lazy(async () => {
    const { default: maybeProcedure } = await unlazy(lazied);
    if (!isProcedure(maybeProcedure)) {
      throw new Error(`
            Expected a lazy<procedure> but got lazy<unknown>.
            This should be caught by TypeScript compilation.
            Please report this issue if this makes you feel uncomfortable.
        `);
    }
    return { default: maybeProcedure };
  }, getLazyMeta(lazied));
  return lazyProcedure;
}
function createContractedProcedure(procedure, contract) {
  return new Procedure({
    ...procedure["~orpc"],
    errorMap: contract["~orpc"].errorMap,
    route: contract["~orpc"].route,
    meta: contract["~orpc"].meta
  });
}
const DEFAULT_CONFIG = {
  initialInputValidationIndex: 0,
  initialOutputValidationIndex: 0,
  dedupeLeadingMiddlewares: true
};
function fallbackConfig(key, value2) {
  if (value2 === void 0) {
    return DEFAULT_CONFIG[key];
  }
  return value2;
}
function decorateMiddleware(middleware) {
  const decorated = ((...args) => middleware(...args));
  decorated.mapInput = (mapInput) => {
    const mapped = decorateMiddleware(
      (options, input, ...rest) => middleware(options, mapInput(input), ...rest)
    );
    return mapped;
  };
  decorated.concat = (concatMiddleware, mapInput) => {
    const mapped = mapInput ? decorateMiddleware(concatMiddleware).mapInput(mapInput) : concatMiddleware;
    const concatted = decorateMiddleware((options, input, output, ...rest) => {
      const merged = middleware({
        ...options,
        next: (...[nextOptions1]) => mapped({
          ...options,
          context: { ...options.context, ...nextOptions1?.context },
          next: (...[nextOptions2]) => options.next({ context: { ...nextOptions1?.context, ...nextOptions2?.context } })
        }, input, output, ...rest)
      }, input, output, ...rest);
      return merged;
    });
    return concatted;
  };
  return decorated;
}
function createActionableClient(client) {
  const action = async (input) => {
    try {
      return [null, await client(input)];
    } catch (error) {
      if (error instanceof Error && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_")) {
        throw error;
      }
      if (error instanceof Response && "options" in error && isObject(error.options) || isObject(error) && error.isNotFound === true) {
        throw error;
      }
      return [toORPCError(error).toJSON(), void 0];
    }
  };
  return action;
}
class DecoratedProcedure extends Procedure {
  /**
   * Adds type-safe custom errors.
   * The provided errors are spared-merged with any existing errors.
   *
   * @see {@link https://orpc.dev/docs/error-handling#type%E2%80%90safe-error-handling Type-Safe Error Handling Docs}
   */
  errors(errors) {
    return new DecoratedProcedure({
      ...this["~orpc"],
      errorMap: mergeErrorMap(this["~orpc"].errorMap, errors)
    });
  }
  /**
   * Sets or updates the metadata.
   * The provided metadata is spared-merged with any existing metadata.
   *
   * @see {@link https://orpc.dev/docs/metadata Metadata Docs}
   */
  meta(meta) {
    return new DecoratedProcedure({
      ...this["~orpc"],
      meta: mergeMeta(this["~orpc"].meta, meta)
    });
  }
  /**
   * Sets or updates the route definition.
   * The provided route is spared-merged with any existing route.
   * This option is typically relevant when integrating with OpenAPI.
   *
   * @see {@link https://orpc.dev/docs/openapi/routing OpenAPI Routing Docs}
   * @see {@link https://orpc.dev/docs/openapi/input-output-structure OpenAPI Input/Output Structure Docs}
   */
  route(route) {
    return new DecoratedProcedure({
      ...this["~orpc"],
      route: mergeRoute(this["~orpc"].route, route)
    });
  }
  use(middleware, mapInput) {
    const mapped = mapInput ? decorateMiddleware(middleware).mapInput(mapInput) : middleware;
    return new DecoratedProcedure({
      ...this["~orpc"],
      middlewares: addMiddleware(this["~orpc"].middlewares, mapped)
    });
  }
  /**
   * Make this procedure callable (works like a function while still being a procedure).
   *
   * @see {@link https://orpc.dev/docs/client/server-side Server-side Client Docs}
   */
  callable(...rest) {
    const client = createProcedureClient(this, ...rest);
    return new Proxy(client, {
      get: (target, key) => {
        return Reflect.has(this, key) ? Reflect.get(this, key) : Reflect.get(target, key);
      },
      has: (target, key) => {
        return Reflect.has(this, key) || Reflect.has(target, key);
      }
    });
  }
  /**
   * Make this procedure compatible with server action.
   *
   * @see {@link https://orpc.dev/docs/server-action Server Action Docs}
   */
  actionable(...rest) {
    const action = createActionableClient(createProcedureClient(this, ...rest));
    return new Proxy(action, {
      get: (target, key) => {
        return Reflect.has(this, key) ? Reflect.get(this, key) : Reflect.get(target, key);
      },
      has: (target, key) => {
        return Reflect.has(this, key) || Reflect.has(target, key);
      }
    });
  }
}
class Builder {
  /**
   * This property holds the defined options.
   */
  "~orpc";
  constructor(def) {
    this["~orpc"] = def;
  }
  /**
   * Sets or overrides the config.
   *
   * @see {@link https://orpc.dev/docs/client/server-side#middlewares-order Middlewares Order Docs}
   * @see {@link https://orpc.dev/docs/best-practices/dedupe-middleware#configuration Dedupe Middleware Docs}
   */
  $config(config) {
    const inputValidationCount = this["~orpc"].inputValidationIndex - fallbackConfig("initialInputValidationIndex", this["~orpc"].config.initialInputValidationIndex);
    const outputValidationCount = this["~orpc"].outputValidationIndex - fallbackConfig("initialOutputValidationIndex", this["~orpc"].config.initialOutputValidationIndex);
    return new Builder({
      ...this["~orpc"],
      config,
      dedupeLeadingMiddlewares: fallbackConfig("dedupeLeadingMiddlewares", config.dedupeLeadingMiddlewares),
      inputValidationIndex: fallbackConfig("initialInputValidationIndex", config.initialInputValidationIndex) + inputValidationCount,
      outputValidationIndex: fallbackConfig("initialOutputValidationIndex", config.initialOutputValidationIndex) + outputValidationCount
    });
  }
  /**
   * Set or override the initial context.
   *
   * @see {@link https://orpc.dev/docs/context Context Docs}
   */
  $context() {
    return new Builder({
      ...this["~orpc"],
      middlewares: [],
      inputValidationIndex: fallbackConfig("initialInputValidationIndex", this["~orpc"].config.initialInputValidationIndex),
      outputValidationIndex: fallbackConfig("initialOutputValidationIndex", this["~orpc"].config.initialOutputValidationIndex)
    });
  }
  /**
   * Sets or overrides the initial meta.
   *
   * @see {@link https://orpc.dev/docs/metadata Metadata Docs}
   */
  $meta(initialMeta) {
    return new Builder({
      ...this["~orpc"],
      meta: initialMeta
    });
  }
  /**
   * Sets or overrides the initial route.
   * This option is typically relevant when integrating with OpenAPI.
   *
   * @see {@link https://orpc.dev/docs/openapi/routing OpenAPI Routing Docs}
   * @see {@link https://orpc.dev/docs/openapi/input-output-structure OpenAPI Input/Output Structure Docs}
   */
  $route(initialRoute) {
    return new Builder({
      ...this["~orpc"],
      route: initialRoute
    });
  }
  /**
   * Sets or overrides the initial input schema.
   *
   * @see {@link https://orpc.dev/docs/procedure#initial-configuration Initial Procedure Configuration Docs}
   */
  $input(initialInputSchema) {
    return new Builder({
      ...this["~orpc"],
      inputSchema: initialInputSchema
    });
  }
  /**
   * Creates a middleware.
   *
   * @see {@link https://orpc.dev/docs/middleware Middleware Docs}
   */
  middleware(middleware) {
    return decorateMiddleware(middleware);
  }
  /**
   * Adds type-safe custom errors.
   * The provided errors are spared-merged with any existing errors.
   *
   * @see {@link https://orpc.dev/docs/error-handling#type%E2%80%90safe-error-handling Type-Safe Error Handling Docs}
   */
  errors(errors) {
    return new Builder({
      ...this["~orpc"],
      errorMap: mergeErrorMap(this["~orpc"].errorMap, errors)
    });
  }
  use(middleware, mapInput) {
    const mapped = mapInput ? decorateMiddleware(middleware).mapInput(mapInput) : middleware;
    return new Builder({
      ...this["~orpc"],
      middlewares: addMiddleware(this["~orpc"].middlewares, mapped)
    });
  }
  /**
   * Sets or updates the metadata.
   * The provided metadata is spared-merged with any existing metadata.
   *
   * @see {@link https://orpc.dev/docs/metadata Metadata Docs}
   */
  meta(meta) {
    return new Builder({
      ...this["~orpc"],
      meta: mergeMeta(this["~orpc"].meta, meta)
    });
  }
  /**
   * Sets or updates the route definition.
   * The provided route is spared-merged with any existing route.
   * This option is typically relevant when integrating with OpenAPI.
   *
   * @see {@link https://orpc.dev/docs/openapi/routing OpenAPI Routing Docs}
   * @see {@link https://orpc.dev/docs/openapi/input-output-structure OpenAPI Input/Output Structure Docs}
   */
  route(route) {
    return new Builder({
      ...this["~orpc"],
      route: mergeRoute(this["~orpc"].route, route)
    });
  }
  /**
   * Defines the input validation schema.
   *
   * @see {@link https://orpc.dev/docs/procedure#input-output-validation Input Validation Docs}
   */
  input(schema) {
    return new Builder({
      ...this["~orpc"],
      inputSchema: schema,
      inputValidationIndex: fallbackConfig("initialInputValidationIndex", this["~orpc"].config.initialInputValidationIndex) + this["~orpc"].middlewares.length
    });
  }
  /**
   * Defines the output validation schema.
   *
   * @see {@link https://orpc.dev/docs/procedure#input-output-validation Output Validation Docs}
   */
  output(schema) {
    return new Builder({
      ...this["~orpc"],
      outputSchema: schema,
      outputValidationIndex: fallbackConfig("initialOutputValidationIndex", this["~orpc"].config.initialOutputValidationIndex) + this["~orpc"].middlewares.length
    });
  }
  /**
   * Defines the handler of the procedure.
   *
   * @see {@link https://orpc.dev/docs/procedure Procedure Docs}
   */
  handler(handler) {
    return new DecoratedProcedure({
      ...this["~orpc"],
      handler
    });
  }
  /**
   * Prefixes all procedures in the router.
   * The provided prefix is post-appended to any existing router prefix.
   *
   * @note This option does not affect procedures that do not define a path in their route definition.
   *
   * @see {@link https://orpc.dev/docs/openapi/routing#route-prefixes OpenAPI Route Prefixes Docs}
   */
  prefix(prefix) {
    return new Builder({
      ...this["~orpc"],
      prefix: mergePrefix(this["~orpc"].prefix, prefix)
    });
  }
  /**
   * Adds tags to all procedures in the router.
   * This helpful when you want to group procedures together in the OpenAPI specification.
   *
   * @see {@link https://orpc.dev/docs/openapi/openapi-specification#operation-metadata OpenAPI Operation Metadata Docs}
   */
  tag(...tags) {
    return new Builder({
      ...this["~orpc"],
      tags: mergeTags(this["~orpc"].tags, tags)
    });
  }
  /**
   * Applies all of the previously defined options to the specified router.
   *
   * @see {@link https://orpc.dev/docs/router#extending-router Extending Router Docs}
   */
  router(router) {
    return enhanceRouter(router, this["~orpc"]);
  }
  /**
   * Create a lazy router
   * And applies all of the previously defined options to the specified router.
   *
   * @see {@link https://orpc.dev/docs/router#extending-router Extending Router Docs}
   */
  lazy(loader) {
    return enhanceRouter(lazy(loader), this["~orpc"]);
  }
}
const os = new Builder({
  config: {},
  route: {},
  meta: {},
  errorMap: {},
  inputValidationIndex: fallbackConfig("initialInputValidationIndex"),
  outputValidationIndex: fallbackConfig("initialOutputValidationIndex"),
  middlewares: [],
  dedupeLeadingMiddlewares: true
});
function createRouterClient(router, ...rest) {
  const options = resolveMaybeOptionalOptions(rest);
  if (isProcedure(router)) {
    const caller = createProcedureClient(router, options);
    return caller;
  }
  const procedureCaller = isLazy(router) ? createProcedureClient(createAssertedLazyProcedure(router), options) : {};
  const recursive = new Proxy(procedureCaller, {
    get(target, key) {
      if (typeof key !== "string") {
        return Reflect.get(target, key);
      }
      const next = getRouter(router, [key]);
      if (!next) {
        return Reflect.get(target, key);
      }
      return createRouterClient(next, {
        ...rest[0],
        path: [...rest[0]?.path ?? [], key]
      });
    }
  });
  return recursive;
}
function resolveFriendlyStandardHandleOptions(options) {
  return {
    ...options,
    context: options.context ?? {}
    // Context only optional if all fields are optional
  };
}
class CompositeStandardHandlerPlugin {
  plugins;
  constructor(plugins = []) {
    this.plugins = [...plugins].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  init(options, router) {
    for (const plugin of this.plugins) {
      plugin.init?.(options, router);
    }
  }
}
class StandardHandler {
  constructor(router, matcher, codec, options) {
    this.matcher = matcher;
    this.codec = codec;
    const plugins = new CompositeStandardHandlerPlugin(options.plugins);
    plugins.init(options, router);
    this.interceptors = toArray(options.interceptors);
    this.clientInterceptors = toArray(options.clientInterceptors);
    this.rootInterceptors = toArray(options.rootInterceptors);
    this.matcher.init(router);
  }
  interceptors;
  clientInterceptors;
  rootInterceptors;
  async handle(request, options) {
    const prefix = options.prefix?.replace(/\/$/, "") || void 0;
    if (prefix && !request.url.pathname.startsWith(`${prefix}/`) && request.url.pathname !== prefix) {
      return { matched: false, response: void 0 };
    }
    return intercept(
      this.rootInterceptors,
      { ...options, request, prefix },
      async (interceptorOptions) => {
        return runWithSpan(
          { name: `${request.method} ${request.url.pathname}` },
          async (span) => {
            let step;
            try {
              return await intercept(
                this.interceptors,
                interceptorOptions,
                async ({ request: request2, context, prefix: prefix2 }) => {
                  const method = request2.method;
                  const url = request2.url;
                  const pathname = prefix2 ? url.pathname.replace(prefix2, "") : url.pathname;
                  const match = await runWithSpan(
                    { name: "find_procedure" },
                    () => this.matcher.match(method, `/${pathname.replace(/^\/|\/$/g, "")}`)
                  );
                  if (!match) {
                    return { matched: false, response: void 0 };
                  }
                  span?.updateName(`${ORPC_NAME}.${match.path.join("/")}`);
                  span?.setAttribute("rpc.system", ORPC_NAME);
                  span?.setAttribute("rpc.method", match.path.join("."));
                  step = "decode_input";
                  let input = await runWithSpan(
                    { name: "decode_input" },
                    () => this.codec.decode(request2, match.params, match.procedure)
                  );
                  step = void 0;
                  if (isAsyncIteratorObject(input)) {
                    input = asyncIteratorWithSpan(
                      { name: "consume_event_iterator_input", signal: request2.signal },
                      input
                    );
                  }
                  const client = createProcedureClient(match.procedure, {
                    context,
                    path: match.path,
                    interceptors: this.clientInterceptors
                  });
                  step = "call_procedure";
                  const output = await client(input, {
                    signal: request2.signal,
                    lastEventId: flattenHeader(request2.headers["last-event-id"])
                  });
                  step = void 0;
                  const response = this.codec.encode(output, match.procedure);
                  return {
                    matched: true,
                    response
                  };
                }
              );
            } catch (e) {
              if (step !== "call_procedure") {
                setSpanError(span, e);
              }
              const error = step === "decode_input" && !(e instanceof ORPCError) ? new ORPCError("BAD_REQUEST", {
                message: `Malformed request. Ensure the request body is properly formatted and the 'Content-Type' header is set correctly.`,
                cause: e
              }) : toORPCError(e);
              const response = this.codec.encodeError(error);
              return {
                matched: true,
                response
              };
            }
          }
        );
      }
    );
  }
}
class StandardRPCCodec {
  constructor(serializer) {
    this.serializer = serializer;
  }
  async decode(request, _params, _procedure) {
    const serialized = request.method === "GET" ? parseEmptyableJSON(request.url.searchParams.getAll("data").at(-1)) : await request.body();
    return this.serializer.deserialize(serialized);
  }
  encode(output, _procedure) {
    return {
      status: 200,
      headers: {},
      body: this.serializer.serialize(output)
    };
  }
  encodeError(error) {
    return {
      status: error.status,
      headers: {},
      body: this.serializer.serialize(error.toJSON())
    };
  }
}
class StandardRPCMatcher {
  filter;
  tree = new NullProtoObj();
  pendingRouters = [];
  constructor(options = {}) {
    this.filter = options.filter ?? true;
  }
  init(router, path = []) {
    const laziedOptions = traverseContractProcedures({ router, path }, (traverseOptions) => {
      if (!value(this.filter, traverseOptions)) {
        return;
      }
      const { path: path2, contract } = traverseOptions;
      const httpPath = toHttpPath(path2);
      if (isProcedure(contract)) {
        this.tree[httpPath] = {
          path: path2,
          contract,
          procedure: contract,
          // this mean dev not used contract-first so we can used contract as procedure directly
          router
        };
      } else {
        this.tree[httpPath] = {
          path: path2,
          contract,
          procedure: void 0,
          router
        };
      }
    });
    this.pendingRouters.push(...laziedOptions.map((option) => ({
      ...option,
      httpPathPrefix: toHttpPath(option.path)
    })));
  }
  async match(_method, pathname) {
    if (this.pendingRouters.length) {
      const newPendingRouters = [];
      for (const pendingRouter of this.pendingRouters) {
        if (pathname.startsWith(pendingRouter.httpPathPrefix)) {
          const { default: router } = await unlazy(pendingRouter.router);
          this.init(router, pendingRouter.path);
        } else {
          newPendingRouters.push(pendingRouter);
        }
      }
      this.pendingRouters = newPendingRouters;
    }
    const match = this.tree[pathname];
    if (!match) {
      return void 0;
    }
    if (!match.procedure) {
      const { default: maybeProcedure } = await unlazy(getRouter(match.router, match.path));
      if (!isProcedure(maybeProcedure)) {
        throw new Error(`
          [Contract-First] Missing or invalid implementation for procedure at path: ${toHttpPath(match.path)}.
          Ensure that the procedure is correctly defined and matches the expected contract.
        `);
      }
      match.procedure = createContractedProcedure(maybeProcedure, match.contract);
    }
    return {
      path: match.path,
      procedure: match.procedure
    };
  }
}
class StandardRPCHandler extends StandardHandler {
  constructor(router, options = {}) {
    const jsonSerializer = new StandardRPCJsonSerializer(options);
    const serializer = new StandardRPCSerializer(jsonSerializer);
    const matcher = new StandardRPCMatcher(options);
    const codec = new StandardRPCCodec(serializer);
    super(router, matcher, codec, options);
  }
}
const STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT_SYMBOL = Symbol("STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT");
class StrictGetMethodPlugin {
  error;
  /**
   * make sure execute before batch plugin to get real method
   */
  order = 7e6;
  constructor(options = {}) {
    this.error = options.error ?? new ORPCError("METHOD_NOT_SUPPORTED");
  }
  init(options) {
    options.rootInterceptors ??= [];
    options.clientInterceptors ??= [];
    options.rootInterceptors.unshift((options2) => {
      const isGetMethod = options2.request.method === "GET";
      return options2.next({
        ...options2,
        context: {
          ...options2.context,
          [STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT_SYMBOL]: isGetMethod
        }
      });
    });
    options.clientInterceptors.unshift((options2) => {
      if (typeof options2.context[STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT_SYMBOL] !== "boolean") {
        throw new TypeError("[StrictGetMethodPlugin] strict GET method context has been corrupted or modified by another plugin or interceptor");
      }
      const procedureMethod = fallbackContractConfig("defaultMethod", options2.procedure["~orpc"].route.method);
      if (options2.context[STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT_SYMBOL] && procedureMethod !== "GET") {
        throw this.error;
      }
      return options2.next();
    });
  }
}
class CompositeFetchHandlerPlugin extends CompositeStandardHandlerPlugin {
  initRuntimeAdapter(options) {
    for (const plugin of this.plugins) {
      plugin.initRuntimeAdapter?.(options);
    }
  }
}
class FetchHandler {
  constructor(standardHandler, options = {}) {
    this.standardHandler = standardHandler;
    const plugin = new CompositeFetchHandlerPlugin(options.plugins);
    plugin.initRuntimeAdapter(options);
    this.adapterInterceptors = toArray(options.adapterInterceptors);
    this.toFetchResponseOptions = options;
  }
  toFetchResponseOptions;
  adapterInterceptors;
  async handle(request, ...rest) {
    return intercept(
      this.adapterInterceptors,
      {
        ...resolveFriendlyStandardHandleOptions(resolveMaybeOptionalOptions(rest)),
        request,
        toFetchResponseOptions: this.toFetchResponseOptions
      },
      async ({ request: request2, toFetchResponseOptions, ...options }) => {
        const standardRequest = toStandardLazyRequest(request2);
        const result = await this.standardHandler.handle(standardRequest, options);
        if (!result.matched) {
          return result;
        }
        return {
          matched: true,
          response: toFetchResponse(result.response, toFetchResponseOptions)
        };
      }
    );
  }
}
class RPCHandler extends FetchHandler {
  constructor(router, options = {}) {
    if (options.strictGetMethodPluginEnabled ?? true) {
      options.plugins ??= [];
      options.plugins.push(new StrictGetMethodPlugin());
    }
    super(new StandardRPCHandler(router, options), options);
  }
}
export {
  FetchHandler as F,
  RPCHandler as R,
  StandardHandler as S,
  getRouter as a,
  createRouterClient as b,
  createContractedProcedure as c,
  getLazyMeta as g,
  isProcedure as i,
  os as o,
  traverseContractProcedures as t,
  unlazy as u
};
