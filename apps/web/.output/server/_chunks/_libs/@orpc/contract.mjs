import { i as isORPCErrorStatus, f as fallbackORPCErrorStatus, O as ORPCError } from "./client.mjs";
class ValidationError extends Error {
  issues;
  data;
  constructor(options) {
    super(options.message, options);
    this.issues = options.issues;
    this.data = options.data;
  }
}
function mergeErrorMap(errorMap1, errorMap2) {
  return { ...errorMap1, ...errorMap2 };
}
async function validateORPCError(map, error) {
  const { code, status, message, data, cause, defined } = error;
  const config = map?.[error.code];
  if (!config || fallbackORPCErrorStatus(error.code, config.status) !== error.status) {
    return defined ? new ORPCError(code, { defined: false, status, message, data, cause }) : error;
  }
  if (!config.data) {
    return defined ? error : new ORPCError(code, { defined: true, status, message, data, cause });
  }
  const validated = await config.data["~standard"].validate(error.data);
  if (validated.issues) {
    return defined ? new ORPCError(code, { defined: false, status, message, data, cause }) : error;
  }
  return new ORPCError(code, { defined: true, status, message, data: validated.value, cause });
}
class ContractProcedure {
  /**
   * This property holds the defined options for the contract procedure.
   */
  "~orpc";
  constructor(def) {
    if (def.route?.successStatus && isORPCErrorStatus(def.route.successStatus)) {
      throw new Error("[ContractProcedure] Invalid successStatus.");
    }
    if (Object.values(def.errorMap).some((val) => val && val.status && !isORPCErrorStatus(val.status))) {
      throw new Error("[ContractProcedure] Invalid error status code.");
    }
    this["~orpc"] = def;
  }
}
function isContractProcedure(item) {
  if (item instanceof ContractProcedure) {
    return true;
  }
  return (typeof item === "object" || typeof item === "function") && item !== null && "~orpc" in item && typeof item["~orpc"] === "object" && item["~orpc"] !== null && "errorMap" in item["~orpc"] && "route" in item["~orpc"] && "meta" in item["~orpc"];
}
function mergeMeta(meta1, meta2) {
  return { ...meta1, ...meta2 };
}
function mergeRoute(a, b) {
  return { ...a, ...b };
}
function prefixRoute(route, prefix) {
  if (!route.path) {
    return route;
  }
  return {
    ...route,
    path: `${prefix}${route.path}`
  };
}
function unshiftTagRoute(route, tags) {
  return {
    ...route,
    tags: [...tags, ...route.tags ?? []]
  };
}
function mergePrefix(a, b) {
  return a ? `${a}${b}` : b;
}
function mergeTags(a, b) {
  return a ? [...a, ...b] : b;
}
function enhanceRoute(route, options) {
  let router = route;
  if (options.prefix) {
    router = prefixRoute(router, options.prefix);
  }
  if (options.tags?.length) {
    router = unshiftTagRoute(router, options.tags);
  }
  return router;
}
function enhanceContractRouter(router, options) {
  if (isContractProcedure(router)) {
    const enhanced2 = new ContractProcedure({
      ...router["~orpc"],
      errorMap: mergeErrorMap(options.errorMap, router["~orpc"].errorMap),
      route: enhanceRoute(router["~orpc"].route, options)
    });
    return enhanced2;
  }
  const enhanced = {};
  for (const key in router) {
    enhanced[key] = enhanceContractRouter(router[key], options);
  }
  return enhanced;
}
class ContractBuilder extends ContractProcedure {
  constructor(def) {
    super(def);
    this["~orpc"].prefix = def.prefix;
    this["~orpc"].tags = def.tags;
  }
  /**
   * Sets or overrides the initial meta.
   *
   * @see {@link https://orpc.dev/docs/metadata Metadata Docs}
   */
  $meta(initialMeta) {
    return new ContractBuilder({
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
    return new ContractBuilder({
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
    return new ContractBuilder({
      ...this["~orpc"],
      inputSchema: initialInputSchema
    });
  }
  /**
   * Adds type-safe custom errors to the contract.
   * The provided errors are spared-merged with any existing errors in the contract.
   *
   * @see {@link https://orpc.dev/docs/error-handling#type%E2%80%90safe-error-handling Type-Safe Error Handling Docs}
   */
  errors(errors) {
    return new ContractBuilder({
      ...this["~orpc"],
      errorMap: mergeErrorMap(this["~orpc"].errorMap, errors)
    });
  }
  /**
   * Sets or updates the metadata for the contract.
   * The provided metadata is spared-merged with any existing metadata in the contract.
   *
   * @see {@link https://orpc.dev/docs/metadata Metadata Docs}
   */
  meta(meta) {
    return new ContractBuilder({
      ...this["~orpc"],
      meta: mergeMeta(this["~orpc"].meta, meta)
    });
  }
  /**
   * Sets or updates the route definition for the contract.
   * The provided route is spared-merged with any existing route in the contract.
   * This option is typically relevant when integrating with OpenAPI.
   *
   * @see {@link https://orpc.dev/docs/openapi/routing OpenAPI Routing Docs}
   * @see {@link https://orpc.dev/docs/openapi/input-output-structure OpenAPI Input/Output Structure Docs}
   */
  route(route) {
    return new ContractBuilder({
      ...this["~orpc"],
      route: mergeRoute(this["~orpc"].route, route)
    });
  }
  /**
   * Defines the input validation schema for the contract.
   *
   * @see {@link https://orpc.dev/docs/procedure#input-output-validation Input Validation Docs}
   */
  input(schema) {
    return new ContractBuilder({
      ...this["~orpc"],
      inputSchema: schema
    });
  }
  /**
   * Defines the output validation schema for the contract.
   *
   * @see {@link https://orpc.dev/docs/procedure#input-output-validation Output Validation Docs}
   */
  output(schema) {
    return new ContractBuilder({
      ...this["~orpc"],
      outputSchema: schema
    });
  }
  /**
   * Prefixes all procedures in the contract router.
   * The provided prefix is post-appended to any existing router prefix.
   *
   * @note This option does not affect procedures that do not define a path in their route definition.
   *
   * @see {@link https://orpc.dev/docs/openapi/routing#route-prefixes OpenAPI Route Prefixes Docs}
   */
  prefix(prefix) {
    return new ContractBuilder({
      ...this["~orpc"],
      prefix: mergePrefix(this["~orpc"].prefix, prefix)
    });
  }
  /**
   * Adds tags to all procedures in the contract router.
   * This helpful when you want to group procedures together in the OpenAPI specification.
   *
   * @see {@link https://orpc.dev/docs/openapi/openapi-specification#operation-metadata OpenAPI Operation Metadata Docs}
   */
  tag(...tags) {
    return new ContractBuilder({
      ...this["~orpc"],
      tags: mergeTags(this["~orpc"].tags, tags)
    });
  }
  /**
   * Applies all of the previously defined options to the specified contract router.
   *
   * @see {@link https://orpc.dev/docs/router#extending-router Extending Router Docs}
   */
  router(router) {
    return enhanceContractRouter(router, this["~orpc"]);
  }
}
new ContractBuilder({
  errorMap: {},
  route: {},
  meta: {}
});
const DEFAULT_CONFIG = {
  defaultMethod: "POST",
  defaultSuccessStatus: 200,
  defaultSuccessDescription: "OK",
  defaultInputStructure: "compact",
  defaultOutputStructure: "compact"
};
function fallbackContractConfig(key, value) {
  if (value === void 0) {
    return DEFAULT_CONFIG[key];
  }
  return value;
}
export {
  ValidationError as V,
  mergeErrorMap as a,
  mergeMeta as b,
  mergeRoute as c,
  mergeTags as d,
  enhanceRoute as e,
  fallbackContractConfig as f,
  isContractProcedure as i,
  mergePrefix as m,
  validateORPCError as v
};
