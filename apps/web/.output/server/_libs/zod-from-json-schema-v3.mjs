import { a5 as literalType, a6 as nullType, a7 as arrayType, a8 as anyType, a9 as objectType, aa as booleanType, ab as unionType, ac as numberType, ad as stringType, ae as enumType, af as neverType, ag as intersectionType } from "./zod.mjs";
function convertJsonSchemaToZod(schema) {
  function addMetadata(zodSchema, jsonSchema) {
    if (jsonSchema.description) {
      zodSchema = zodSchema.describe(jsonSchema.description);
    }
    return zodSchema;
  }
  if (schema.const !== void 0) {
    if (typeof schema.const === "string") {
      return addMetadata(literalType(schema.const), schema);
    } else if (typeof schema.const === "number") {
      return addMetadata(literalType(schema.const), schema);
    } else if (typeof schema.const === "boolean") {
      return addMetadata(literalType(schema.const), schema);
    } else if (schema.const === null) {
      return addMetadata(nullType(), schema);
    }
    return addMetadata(literalType(schema.const), schema);
  }
  if (schema.type) {
    switch (schema.type) {
      case "string": {
        if (schema.enum) {
          if (schema.enum.length === 0) {
            return addMetadata(stringType(), schema);
          }
          return addMetadata(enumType(schema.enum), schema);
        }
        let stringSchema = stringType();
        if (schema.minLength !== void 0) {
          stringSchema = stringSchema.min(schema.minLength);
        }
        if (schema.maxLength !== void 0) {
          stringSchema = stringSchema.max(schema.maxLength);
        }
        if (schema.pattern !== void 0) {
          const regex = new RegExp(schema.pattern);
          stringSchema = stringSchema.regex(regex);
        }
        return addMetadata(stringSchema, schema);
      }
      case "number":
      case "integer": {
        if (schema.enum) {
          if (schema.enum.length === 0) {
            return addMetadata(numberType(), schema);
          }
          const options = schema.enum.map((val) => literalType(val));
          if (options.length === 1) {
            return addMetadata(options[0], schema);
          }
          if (options.length >= 2) {
            const unionSchema = unionType([options[0], options[1], ...options.slice(2)]);
            return addMetadata(unionSchema, schema);
          }
        }
        let numberSchema = schema.type === "integer" ? numberType().int() : numberType();
        if (schema.minimum !== void 0) {
          numberSchema = numberSchema.min(schema.minimum);
        }
        if (schema.maximum !== void 0) {
          numberSchema = numberSchema.max(schema.maximum);
        }
        if (schema.exclusiveMinimum !== void 0) {
          numberSchema = numberSchema.gt(schema.exclusiveMinimum);
        }
        if (schema.exclusiveMaximum !== void 0) {
          numberSchema = numberSchema.lt(schema.exclusiveMaximum);
        }
        if (schema.multipleOf !== void 0) {
          numberSchema = numberSchema.multipleOf(schema.multipleOf);
        }
        return addMetadata(numberSchema, schema);
      }
      case "boolean":
        if (schema.enum) {
          if (schema.enum.length === 0) {
            return addMetadata(booleanType(), schema);
          }
          const options = schema.enum.map((val) => literalType(val));
          if (options.length === 1) {
            return addMetadata(options[0], schema);
          }
          if (options.length >= 2) {
            const unionSchema = unionType([options[0], options[1], ...options.slice(2)]);
            return addMetadata(unionSchema, schema);
          }
        }
        return addMetadata(booleanType(), schema);
      case "null":
        return addMetadata(nullType(), schema);
      case "object":
        if (schema.properties) {
          const shape = {};
          for (const [key, propSchema] of Object.entries(
            schema.properties
          )) {
            shape[key] = convertJsonSchemaToZod(propSchema);
          }
          if (schema.required && Array.isArray(schema.required)) {
            const required = new Set(schema.required);
            for (const key of Object.keys(shape)) {
              if (!required.has(key)) {
                shape[key] = shape[key].optional();
              }
            }
          } else {
            for (const key of Object.keys(shape)) {
              shape[key] = shape[key].optional();
            }
          }
          let zodSchema;
          if (schema.additionalProperties !== false) {
            zodSchema = objectType(shape).passthrough();
          } else {
            zodSchema = objectType(shape);
          }
          return addMetadata(zodSchema, schema);
        }
        return addMetadata(objectType({}), schema);
      case "array": {
        let arraySchema;
        if (schema.items) {
          arraySchema = arrayType(convertJsonSchemaToZod(schema.items));
        } else {
          arraySchema = arrayType(anyType());
        }
        if (schema.minItems !== void 0) {
          arraySchema = arraySchema.min(schema.minItems);
        }
        if (schema.maxItems !== void 0) {
          arraySchema = arraySchema.max(schema.maxItems);
        }
        if (schema.uniqueItems === true) {
          arraySchema = arraySchema.refine(
            (items) => {
              const seen = /* @__PURE__ */ new Set();
              return items.every((item) => {
                if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
                  if (seen.has(item)) return false;
                  seen.add(item);
                  return true;
                }
                const serialized = JSON.stringify(item);
                if (seen.has(serialized)) return false;
                seen.add(serialized);
                return true;
              });
            },
            { message: "Array items must be unique" }
          );
        }
        return addMetadata(arraySchema, schema);
      }
    }
  }
  if (schema.enum) {
    if (schema.enum.length === 0) {
      return addMetadata(neverType(), schema);
    }
    const allStrings = schema.enum.every((val) => typeof val === "string");
    if (allStrings) {
      return addMetadata(enumType(schema.enum), schema);
    } else {
      const options = schema.enum.map((val) => literalType(val));
      if (options.length === 1) {
        return addMetadata(options[0], schema);
      }
      if (options.length >= 2) {
        const unionSchema = unionType([options[0], options[1], ...options.slice(2)]);
        return addMetadata(unionSchema, schema);
      }
    }
  }
  if (schema.anyOf && schema.anyOf.length >= 2) {
    const schemas = schema.anyOf.map(convertJsonSchemaToZod);
    return addMetadata(
      unionType([schemas[0], schemas[1], ...schemas.slice(2)]),
      schema
    );
  }
  if (schema.allOf) {
    return addMetadata(
      schema.allOf.reduce(
        (acc, s) => intersectionType(acc, convertJsonSchemaToZod(s)),
        objectType({})
      ),
      schema
    );
  }
  if (schema.oneOf && schema.oneOf.length >= 2) {
    const schemas = schema.oneOf.map(convertJsonSchemaToZod);
    return addMetadata(
      unionType([schemas[0], schemas[1], ...schemas.slice(2)]),
      schema
    );
  }
  return addMetadata(anyType(), schema);
}
export {
  convertJsonSchemaToZod as c
};
