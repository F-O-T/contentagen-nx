import { e as intercept, t as toArray } from "./shared.mjs";
import { J as JsonSchemaXNativeType } from "./json-schema.mjs";
import { S as registry, T as globalRegistry } from "../../../_libs/zod.mjs";
import { F as Format, C as ContentEncoding } from "../../../_libs/json-schema-typed.mjs";
const JSON_SCHEMA_REGISTRY = registry();
const JSON_SCHEMA_INPUT_REGISTRY = registry();
const JSON_SCHEMA_OUTPUT_REGISTRY = registry();
class ZodToJsonSchemaConverter {
  maxLazyDepth;
  maxStructureDepth;
  anyJsonSchema;
  unsupportedJsonSchema;
  undefinedJsonSchema;
  interceptors;
  constructor(options = {}) {
    this.maxLazyDepth = options.maxLazyDepth ?? 2;
    this.maxStructureDepth = options.maxStructureDepth ?? 10;
    this.anyJsonSchema = options.anyJsonSchema ?? {};
    this.unsupportedJsonSchema = options.unsupportedJsonSchema ?? { not: {} };
    this.undefinedJsonSchema = options.undefinedJsonSchema ?? { not: {} };
    this.interceptors = options.interceptors ?? [];
  }
  condition(schema) {
    return schema !== void 0 && schema["~standard"].vendor === "zod" && "_zod" in schema;
  }
  convert(schema, options) {
    return this.#convert(schema, options, 0, 0);
  }
  #convert(schema, options, lazyDepth, structureDepth, isHandledCustomJSONSchema = false) {
    return intercept(
      this.interceptors,
      { schema, options, lazyDepth, isHandledCustomJSONSchema },
      ({ schema: schema2, options: options2, lazyDepth: lazyDepth2, isHandledCustomJSONSchema: isHandledCustomJSONSchema2 }) => {
        if (structureDepth > this.maxStructureDepth) {
          return [false, this.anyJsonSchema];
        }
        if (!options2.minStructureDepthForRef || options2.minStructureDepthForRef <= structureDepth) {
          const components = toArray(options2.components);
          for (const component of components) {
            if (component.schema === schema2 && component.allowedStrategies.includes(options2.strategy)) {
              return [component.required, { $ref: component.ref }];
            }
          }
        }
        if (!isHandledCustomJSONSchema2) {
          const customJSONSchema = this.#getCustomJsonSchema(schema2, options2);
          if (customJSONSchema) {
            const [required, json] = this.#convert(schema2, options2, lazyDepth2, structureDepth, true);
            return [required, { ...json, ...customJSONSchema }];
          }
        }
        switch (schema2._zod.def.type) {
          case "string": {
            const string = schema2;
            const json = { type: "string" };
            const { minimum, maximum, format, patterns, contentEncoding } = string._zod.bag;
            if (typeof minimum === "number") {
              json.minLength = minimum;
            }
            if (typeof maximum === "number") {
              json.maxLength = maximum;
            }
            if (typeof contentEncoding === "string") {
              json.contentEncoding = this.#handleContentEncoding(contentEncoding);
            }
            if (typeof format === "string" && format !== "regex" && json.contentEncoding === void 0) {
              json.format = this.#handleStringFormat(format);
            }
            if (patterns instanceof Set && json.contentEncoding === void 0 && json.format === void 0) {
              for (const pattern of patterns) {
                if (json.pattern === void 0) {
                  json.pattern = pattern.source;
                } else {
                  json.allOf ??= [];
                  json.allOf.push({ pattern: pattern.source });
                }
              }
            }
            if (format === "jwt" && json.contentEncoding === void 0 && json.format === void 0 && json.pattern === void 0) {
              json.pattern = /^[\w-]+\.[\w-]+\.[\w-]+$/.source;
            }
            return [true, json];
          }
          case "number": {
            const number = schema2;
            const json = { type: "number" };
            const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = number._zod.bag;
            if (typeof format === "string" && format?.includes("int")) {
              json.type = "integer";
            }
            if (typeof minimum === "number") {
              json.minimum = minimum;
            }
            if (typeof maximum === "number") {
              json.maximum = maximum;
            }
            if (typeof exclusiveMinimum === "number") {
              json.exclusiveMinimum = exclusiveMinimum;
            }
            if (typeof exclusiveMaximum === "number") {
              json.exclusiveMaximum = exclusiveMaximum;
            }
            if (typeof multipleOf === "number") {
              json.multipleOf = multipleOf;
            }
            return [true, json];
          }
          case "boolean": {
            return [true, { type: "boolean" }];
          }
          case "bigint": {
            return [true, {
              "type": "string",
              "pattern": "^-?[0-9]+$",
              "x-native-type": JsonSchemaXNativeType.BigInt
            }];
          }
          case "date": {
            return [true, {
              "type": "string",
              "format": Format.DateTime,
              "x-native-type": JsonSchemaXNativeType.Date
            }];
          }
          case "null": {
            return [true, { type: "null" }];
          }
          case "undefined":
          case "void": {
            return [false, this.undefinedJsonSchema];
          }
          case "any": {
            return [false, this.anyJsonSchema];
          }
          case "unknown": {
            return [false, this.anyJsonSchema];
          }
          case "never": {
            return [true, this.unsupportedJsonSchema];
          }
          case "array": {
            const array = schema2;
            const json = { type: "array" };
            const { minimum, maximum } = array._zod.bag;
            if (typeof minimum === "number") {
              json.minItems = minimum;
            }
            if (typeof maximum === "number") {
              json.maxItems = maximum;
            }
            json.items = this.#handleArrayItemJsonSchema(this.#convert(array._zod.def.element, options2, lazyDepth2, structureDepth + 1), options2);
            return [true, json];
          }
          case "object": {
            const object = schema2;
            const json = { type: "object" };
            for (const [key, value] of Object.entries(object._zod.def.shape)) {
              const [itemRequired, itemJson] = this.#convert(value, options2, lazyDepth2, structureDepth + 1);
              json.properties ??= {};
              json.properties[key] = itemJson;
              if (itemRequired) {
                json.required ??= [];
                json.required.push(key);
              }
            }
            if (object._zod.def.catchall) {
              if (object._zod.def.catchall._zod.def.type === "never") {
                json.additionalProperties = false;
              } else {
                const [_, addJson] = this.#convert(object._zod.def.catchall, options2, lazyDepth2, structureDepth + 1);
                json.additionalProperties = addJson;
              }
            }
            return [true, json];
          }
          case "union": {
            const union = schema2;
            const anyOf = [];
            let required = true;
            for (const item of union._zod.def.options) {
              const [itemRequired, itemJson] = this.#convert(item, options2, lazyDepth2, structureDepth + 1);
              if (!itemRequired) {
                required = false;
              }
              if (options2.strategy === "input") {
                if (itemJson !== this.undefinedJsonSchema && itemJson !== this.unsupportedJsonSchema) {
                  anyOf.push(itemJson);
                }
              } else {
                if (itemJson !== this.undefinedJsonSchema) {
                  anyOf.push(itemJson);
                }
              }
            }
            return [required, { anyOf }];
          }
          case "intersection": {
            const intersection = schema2;
            const json = { allOf: [] };
            let required = false;
            for (const item of [intersection._zod.def.left, intersection._zod.def.right]) {
              const [itemRequired, itemJson] = this.#convert(item, options2, lazyDepth2, structureDepth + 1);
              json.allOf.push(itemJson);
              if (itemRequired) {
                required = true;
              }
            }
            return [required, json];
          }
          case "tuple": {
            const tuple = schema2;
            const json = { type: "array", prefixItems: [] };
            for (const item of tuple._zod.def.items) {
              json.prefixItems.push(this.#handleArrayItemJsonSchema(this.#convert(item, options2, lazyDepth2, structureDepth + 1), options2));
            }
            if (tuple._zod.def.rest) {
              json.items = this.#handleArrayItemJsonSchema(this.#convert(tuple._zod.def.rest, options2, lazyDepth2, structureDepth + 1), options2);
            }
            const { minimum, maximum } = tuple._zod.bag;
            if (typeof minimum === "number") {
              json.minItems = minimum;
            }
            if (typeof maximum === "number") {
              json.maxItems = maximum;
            }
            return [true, json];
          }
          case "record": {
            const record = schema2;
            const json = { type: "object" };
            json.propertyNames = this.#convert(record._zod.def.keyType, options2, lazyDepth2, structureDepth + 1)[1];
            json.additionalProperties = this.#convert(record._zod.def.valueType, options2, lazyDepth2, structureDepth + 1)[1];
            return [true, json];
          }
          case "map": {
            const map = schema2;
            return [true, {
              "type": "array",
              "items": {
                type: "array",
                prefixItems: [
                  this.#handleArrayItemJsonSchema(this.#convert(map._zod.def.keyType, options2, lazyDepth2, structureDepth + 1), options2),
                  this.#handleArrayItemJsonSchema(this.#convert(map._zod.def.valueType, options2, lazyDepth2, structureDepth + 1), options2)
                ],
                maxItems: 2,
                minItems: 2
              },
              "x-native-type": JsonSchemaXNativeType.Map
            }];
          }
          case "set": {
            const set = schema2;
            return [true, {
              "type": "array",
              "uniqueItems": true,
              "items": this.#handleArrayItemJsonSchema(this.#convert(set._zod.def.valueType, options2, lazyDepth2, structureDepth + 1), options2),
              "x-native-type": JsonSchemaXNativeType.Set
            }];
          }
          case "enum": {
            const enum_ = schema2;
            return [true, { enum: Object.values(enum_._zod.def.entries) }];
          }
          case "literal": {
            const literal = schema2;
            let required = true;
            const values = /* @__PURE__ */ new Set();
            for (const value of literal._zod.def.values) {
              if (value === void 0) {
                required = false;
              } else {
                values.add(typeof value === "bigint" ? value.toString() : value);
              }
            }
            const json = values.size === 0 ? this.undefinedJsonSchema : values.size === 1 ? { const: values.values().next().value } : { enum: Array.from(values) };
            return [required, json];
          }
          case "file": {
            const file = schema2;
            const oneOf = [];
            const { mime } = file._zod.bag;
            if (mime === void 0 || Array.isArray(mime) && mime.every((m) => typeof m === "string")) {
              for (const type of mime ?? ["*/*"]) {
                oneOf.push({
                  type: "string",
                  contentMediaType: type
                });
              }
            }
            return [true, oneOf.length === 1 ? oneOf[0] : { anyOf: oneOf }];
          }
          case "transform": {
            return [false, this.anyJsonSchema];
          }
          case "nullable": {
            const nullable = schema2;
            const [required, json] = this.#convert(nullable._zod.def.innerType, options2, lazyDepth2, structureDepth);
            return [required, { anyOf: [json, { type: "null" }] }];
          }
          case "nonoptional": {
            const nonoptional = schema2;
            const [, json] = this.#convert(nonoptional._zod.def.innerType, options2, lazyDepth2, structureDepth);
            return [true, json];
          }
          case "success": {
            return [true, { type: "boolean" }];
          }
          case "default":
          case "prefault": {
            const default_ = schema2;
            const [, json] = this.#convert(default_._zod.def.innerType, options2, lazyDepth2, structureDepth);
            return [false, {
              ...json,
              default: default_._zod.def.defaultValue
            }];
          }
          case "catch": {
            const catch_ = schema2;
            return this.#convert(catch_._zod.def.innerType, options2, lazyDepth2, structureDepth);
          }
          case "nan": {
            return [true, options2.strategy === "input" ? this.unsupportedJsonSchema : { type: "null" }];
          }
          case "pipe": {
            const pipe = schema2;
            return this.#convert(
              // prefer out schema when in schema is preprocess/transform
              options2.strategy === "input" && pipe._zod.def.in._zod.def.type !== "transform" ? pipe._zod.def.in : pipe._zod.def.out,
              options2,
              lazyDepth2,
              structureDepth
            );
          }
          case "readonly": {
            const readonly_ = schema2;
            const [required, json] = this.#convert(readonly_._zod.def.innerType, options2, lazyDepth2, structureDepth);
            return [required, { ...json, readOnly: true }];
          }
          case "template_literal": {
            const templateLiteral = schema2;
            return [true, {
              type: "string",
              pattern: templateLiteral._zod.pattern.source
            }];
          }
          case "optional": {
            const optional = schema2;
            const [, json] = this.#convert(optional._zod.def.innerType, options2, lazyDepth2, structureDepth);
            return [false, json];
          }
          case "lazy": {
            const lazy = schema2;
            const currentLazyDepth = lazyDepth2 + 1;
            if (currentLazyDepth > this.maxLazyDepth) {
              return [false, this.anyJsonSchema];
            }
            return this.#convert(lazy._zod.def.getter(), options2, currentLazyDepth, structureDepth);
          }
          default: {
            schema2._zod.def.type;
            return [true, this.unsupportedJsonSchema];
          }
        }
      }
    );
  }
  #getCustomJsonSchema(schema, options) {
    if (options.strategy === "input" && JSON_SCHEMA_INPUT_REGISTRY.has(schema)) {
      return JSON_SCHEMA_INPUT_REGISTRY.get(schema);
    }
    if (options.strategy === "output" && JSON_SCHEMA_OUTPUT_REGISTRY.has(schema)) {
      return JSON_SCHEMA_OUTPUT_REGISTRY.get(schema);
    }
    if (JSON_SCHEMA_REGISTRY.has(schema)) {
      return JSON_SCHEMA_REGISTRY.get(schema);
    }
    const global = globalRegistry.get(schema);
    if (global) {
      return {
        title: global.title,
        description: global.description,
        examples: Array.isArray(global.examples) ? global.examples : void 0
      };
    }
  }
  #handleArrayItemJsonSchema([required, schema], options) {
    if (required || options.strategy === "input" || schema.default !== void 0) {
      return schema;
    }
    if (schema === this.undefinedJsonSchema) {
      return { type: "null" };
    }
    return {
      anyOf: [
        // schema can contain { type: 'null' } so we should use anyOf instead of oneOf
        schema,
        { type: "null" }
      ]
    };
  }
  #handleStringFormat(format) {
    if (format === "guid") {
      return Format.UUID;
    }
    if (format === "url") {
      return Format.URI;
    }
    if (format === "datetime") {
      return Format.DateTime;
    }
    return Object.values(Format).includes(format) ? format : void 0;
  }
  #handleContentEncoding(contentEncoding) {
    return Object.values(ContentEncoding).includes(contentEncoding) ? contentEncoding : void 0;
  }
}
export {
  ZodToJsonSchemaConverter as Z
};
