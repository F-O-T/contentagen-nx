import { S as StandardHandler, t as traverseContractProcedures, g as getLazyMeta, u as unlazy, a as getRouter, i as isProcedure, c as createContractedProcedure, F as FetchHandler } from "./server.mjs";
import { f as fallbackContractConfig } from "./contract.mjs";
import { i as isObject, s as stringifyJSON, v as value, c as tryDecodeURIComponent } from "./shared.mjs";
import { c as createRouter, f as findRoute, a as addRoute } from "../../../_libs/rou3.mjs";
import { S as StandardOpenAPIJsonSerializer, a as StandardBracketNotationSerializer, b as StandardOpenAPISerializer, s as standardizeHTTPPath } from "./openapi-client.mjs";
import { t as toHttpPath, i as isORPCErrorStatus } from "./client.mjs";
import { T as TypeName } from "../../../_libs/json-schema-typed.mjs";
class StandardOpenAPICodec {
  constructor(serializer, options = {}) {
    this.serializer = serializer;
    this.customErrorResponseBodyEncoder = options.customErrorResponseBodyEncoder;
  }
  customErrorResponseBodyEncoder;
  async decode(request, params, procedure) {
    const inputStructure = fallbackContractConfig("defaultInputStructure", procedure["~orpc"].route.inputStructure);
    if (inputStructure === "compact") {
      const data = request.method === "GET" ? this.serializer.deserialize(request.url.searchParams) : this.serializer.deserialize(await request.body());
      if (data === void 0) {
        return params;
      }
      if (isObject(data)) {
        return {
          ...params,
          ...data
        };
      }
      return data;
    }
    const deserializeSearchParams = () => {
      return this.serializer.deserialize(request.url.searchParams);
    };
    return {
      params,
      get query() {
        const value2 = deserializeSearchParams();
        Object.defineProperty(this, "query", { value: value2, writable: true });
        return value2;
      },
      set query(value2) {
        Object.defineProperty(this, "query", { value: value2, writable: true });
      },
      headers: request.headers,
      body: this.serializer.deserialize(await request.body())
    };
  }
  encode(output, procedure) {
    const successStatus = fallbackContractConfig("defaultSuccessStatus", procedure["~orpc"].route.successStatus);
    const outputStructure = fallbackContractConfig("defaultOutputStructure", procedure["~orpc"].route.outputStructure);
    if (outputStructure === "compact") {
      return {
        status: successStatus,
        headers: {},
        body: this.serializer.serialize(output)
      };
    }
    if (!this.#isDetailedOutput(output)) {
      throw new Error(`
        Invalid "detailed" output structure:
        • Expected an object with optional properties:
          - status (number 200-399)
          - headers (Record<string, string | string[]>)
          - body (any)
        • No extra keys allowed.

        Actual value:
          ${stringifyJSON(output)}
      `);
    }
    return {
      status: output.status ?? successStatus,
      headers: output.headers ?? {},
      body: this.serializer.serialize(output.body)
    };
  }
  encodeError(error) {
    const body = this.customErrorResponseBodyEncoder?.(error) ?? error.toJSON();
    return {
      status: error.status,
      headers: {},
      body: this.serializer.serialize(body, { outputFormat: "plain" })
    };
  }
  #isDetailedOutput(output) {
    if (!isObject(output)) {
      return false;
    }
    if (output.headers && !isObject(output.headers)) {
      return false;
    }
    if (output.status !== void 0 && (typeof output.status !== "number" || !Number.isInteger(output.status) || isORPCErrorStatus(output.status))) {
      return false;
    }
    return true;
  }
}
function toRou3Pattern(path) {
  return standardizeHTTPPath(path).replace(/\/\{\+([^}]+)\}/g, "/**:$1").replace(/\/\{([^}]+)\}/g, "/:$1");
}
function decodeParams(params) {
  return Object.fromEntries(Object.entries(params).map(([key, value2]) => [key, tryDecodeURIComponent(value2)]));
}
class StandardOpenAPIMatcher {
  filter;
  tree = createRouter();
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
      const method = fallbackContractConfig("defaultMethod", contract["~orpc"].route.method);
      const httpPath = toRou3Pattern(contract["~orpc"].route.path ?? toHttpPath(path2));
      if (isProcedure(contract)) {
        addRoute(this.tree, method, httpPath, {
          path: path2,
          contract,
          procedure: contract,
          // this mean dev not used contract-first so we can used contract as procedure directly
          router
        });
      } else {
        addRoute(this.tree, method, httpPath, {
          path: path2,
          contract,
          procedure: void 0,
          router
        });
      }
    });
    this.pendingRouters.push(...laziedOptions.map((option) => ({
      ...option,
      httpPathPrefix: toHttpPath(option.path),
      laziedPrefix: getLazyMeta(option.router).prefix
    })));
  }
  async match(method, pathname) {
    if (this.pendingRouters.length) {
      const newPendingRouters = [];
      for (const pendingRouter of this.pendingRouters) {
        if (!pendingRouter.laziedPrefix || pathname.startsWith(pendingRouter.laziedPrefix) || pathname.startsWith(pendingRouter.httpPathPrefix)) {
          const { default: router } = await unlazy(pendingRouter.router);
          this.init(router, pendingRouter.path);
        } else {
          newPendingRouters.push(pendingRouter);
        }
      }
      this.pendingRouters = newPendingRouters;
    }
    const match = findRoute(this.tree, method, pathname);
    if (!match) {
      return void 0;
    }
    if (!match.data.procedure) {
      const { default: maybeProcedure } = await unlazy(getRouter(match.data.router, match.data.path));
      if (!isProcedure(maybeProcedure)) {
        throw new Error(`
          [Contract-First] Missing or invalid implementation for procedure at path: ${toHttpPath(match.data.path)}.
          Ensure that the procedure is correctly defined and matches the expected contract.
        `);
      }
      match.data.procedure = createContractedProcedure(maybeProcedure, match.data.contract);
    }
    return {
      path: match.data.path,
      procedure: match.data.procedure,
      params: match.params ? decodeParams(match.params) : void 0
    };
  }
}
class StandardOpenAPIHandler extends StandardHandler {
  constructor(router, options) {
    const jsonSerializer = new StandardOpenAPIJsonSerializer(options);
    const bracketNotationSerializer = new StandardBracketNotationSerializer(options);
    const serializer = new StandardOpenAPISerializer(jsonSerializer, bracketNotationSerializer);
    const matcher = new StandardOpenAPIMatcher(options);
    const codec = new StandardOpenAPICodec(serializer, options);
    super(router, matcher, codec, options);
  }
}
class OpenAPIHandler extends FetchHandler {
  constructor(router, options = {}) {
    super(new StandardOpenAPIHandler(router, options), options);
  }
}
/* @__PURE__ */ new Set([
  TypeName.String,
  TypeName.Number,
  TypeName.Integer,
  TypeName.Boolean,
  TypeName.Null
]);
class CompositeSchemaConverter {
  converters;
  constructor(converters) {
    this.converters = converters;
  }
  async convert(schema, options) {
    for (const converter of this.converters) {
      if (await converter.condition(schema, options)) {
        return converter.convert(schema, options);
      }
    }
    return [false, {}];
  }
}
export {
  CompositeSchemaConverter as C,
  OpenAPIHandler as O
};
