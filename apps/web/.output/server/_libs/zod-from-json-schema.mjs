import { g as any, a1 as never, a as string, n as number, c as boolean, m as _null, h as array, f as custom, i as union, l as literal, _ as _enum, L as ZodNumber, a2 as file, o as object, K as ZodString, A as tuple, I as ZodArray, a3 as intersection, G as ZodObject, a4 as ZodRecord } from "./zod.mjs";
var TypeHandler = class {
  apply(types, schema) {
    if (!schema.type) return;
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    const typeSet = new Set(allowedTypes);
    if (!typeSet.has("string")) {
      types.string = false;
    }
    if (!typeSet.has("number") && !typeSet.has("integer")) {
      types.number = false;
    }
    if (!typeSet.has("boolean")) {
      types.boolean = false;
    }
    if (!typeSet.has("null")) {
      types.null = false;
    }
    if (!typeSet.has("array")) {
      types.array = false;
    }
    if (!typeSet.has("object")) {
      types.object = false;
    }
    if (typeSet.has("integer") && types.number !== false) {
      const currentNumber = types.number || number();
      if (currentNumber instanceof ZodNumber) {
        types.number = currentNumber.int();
      }
    }
  }
};
var ConstHandler = class {
  apply(types, schema) {
    if (schema.const === void 0) return;
    const constValue = schema.const;
    types.string = false;
    types.number = false;
    types.boolean = false;
    types.null = false;
    types.array = false;
    types.object = false;
    if (typeof constValue === "string") {
      types.string = literal(constValue);
    } else if (typeof constValue === "number") {
      types.number = literal(constValue);
    } else if (typeof constValue === "boolean") {
      types.boolean = literal(constValue);
    } else if (constValue === null) {
      types.null = _null();
    } else if (Array.isArray(constValue)) {
      types.array = void 0;
    } else if (typeof constValue === "object") {
      types.object = void 0;
    }
  }
};
var EnumHandler = class {
  apply(types, schema) {
    if (!schema.enum) return;
    if (schema.enum.length === 0) {
      if (!schema.type) {
        types.string = false;
        types.number = false;
        types.boolean = false;
        types.null = false;
        types.array = false;
        types.object = false;
      }
      return;
    }
    const valuesByType = {
      string: schema.enum.filter((v) => typeof v === "string"),
      number: schema.enum.filter((v) => typeof v === "number"),
      boolean: schema.enum.filter((v) => typeof v === "boolean"),
      null: schema.enum.filter((v) => v === null),
      array: schema.enum.filter((v) => Array.isArray(v)),
      object: schema.enum.filter((v) => typeof v === "object" && v !== null && !Array.isArray(v))
    };
    types.string = this.createTypeSchema(valuesByType.string, "string");
    types.number = this.createTypeSchema(valuesByType.number, "number");
    types.boolean = this.createTypeSchema(valuesByType.boolean, "boolean");
    types.null = valuesByType.null.length > 0 ? _null() : false;
    types.array = valuesByType.array.length > 0 ? void 0 : false;
    types.object = valuesByType.object.length > 0 ? void 0 : false;
  }
  createTypeSchema(values, type) {
    if (values.length === 0) return false;
    if (values.length === 1) {
      return literal(values[0]);
    }
    if (type === "string") {
      return _enum(values);
    }
    if (type === "number") {
      const [first, second, ...rest] = values;
      return union([literal(first), literal(second), ...rest.map((v) => literal(v))]);
    }
    if (type === "boolean") {
      return union([literal(true), literal(false)]);
    }
    return false;
  }
};
var FileHandler = class {
  apply(types, schema) {
    const stringSchema = schema;
    if (stringSchema.type === "string" && stringSchema.format === "binary" && stringSchema.contentEncoding === "binary") {
      let fileSchema = file();
      if (stringSchema.minLength !== void 0) {
        fileSchema = fileSchema.min(stringSchema.minLength);
      }
      if (stringSchema.maxLength !== void 0) {
        fileSchema = fileSchema.max(stringSchema.maxLength);
      }
      if (stringSchema.contentMediaType !== void 0) {
        fileSchema = fileSchema.mime(stringSchema.contentMediaType);
      }
      types.file = fileSchema;
      types.string = false;
    }
  }
};
var ImplicitStringHandler = class {
  apply(types, schema) {
    const stringSchema = schema;
    if (schema.type === void 0 && (stringSchema.minLength !== void 0 || stringSchema.maxLength !== void 0 || stringSchema.pattern !== void 0)) {
      if (types.string === void 0) {
        types.string = string();
      }
    }
  }
};
var MinLengthHandler = class {
  apply(types, schema) {
    const stringSchema = schema;
    if (stringSchema.minLength === void 0) return;
    if (types.string !== false) {
      const currentString = types.string || string();
      if (currentString instanceof ZodString) {
        types.string = currentString.refine(
          (value) => {
            const graphemeLength = Array.from(value).length;
            return graphemeLength >= stringSchema.minLength;
          },
          { message: `String must be at least ${stringSchema.minLength} characters long` }
        );
      }
    }
  }
};
var MaxLengthHandler = class {
  apply(types, schema) {
    const stringSchema = schema;
    if (stringSchema.maxLength === void 0) return;
    if (types.string !== false) {
      const currentString = types.string || string();
      if (currentString instanceof ZodString) {
        types.string = currentString.refine(
          (value) => {
            const graphemeLength = Array.from(value).length;
            return graphemeLength <= stringSchema.maxLength;
          },
          { message: `String must be at most ${stringSchema.maxLength} characters long` }
        );
      }
    }
  }
};
var PatternHandler = class {
  apply(types, schema) {
    const stringSchema = schema;
    if (!stringSchema.pattern) return;
    if (types.string !== false) {
      const currentString = types.string || string();
      if (currentString instanceof ZodString) {
        const regex = new RegExp(stringSchema.pattern);
        types.string = currentString.regex(regex);
      }
    }
  }
};
var MinimumHandler = class {
  apply(types, schema) {
    const numberSchema = schema;
    if (numberSchema.minimum === void 0) return;
    if (types.number !== false) {
      const currentNumber = types.number || number();
      if (currentNumber instanceof ZodNumber) {
        types.number = currentNumber.min(numberSchema.minimum);
      }
    }
  }
};
var MaximumHandler = class {
  apply(types, schema) {
    const numberSchema = schema;
    if (numberSchema.maximum === void 0) return;
    if (types.number !== false) {
      const currentNumber = types.number || number();
      if (currentNumber instanceof ZodNumber) {
        types.number = currentNumber.max(numberSchema.maximum);
      }
    }
  }
};
var ExclusiveMinimumHandler = class {
  apply(types, schema) {
    const numberSchema = schema;
    if (numberSchema.exclusiveMinimum === void 0) return;
    if (types.number !== false) {
      const currentNumber = types.number || number();
      if (currentNumber instanceof ZodNumber) {
        if (typeof numberSchema.exclusiveMinimum === "number") {
          types.number = currentNumber.gt(numberSchema.exclusiveMinimum);
        } else {
          types.number = false;
        }
      }
    }
  }
};
var ExclusiveMaximumHandler = class {
  apply(types, schema) {
    const numberSchema = schema;
    if (numberSchema.exclusiveMaximum === void 0) return;
    if (types.number !== false) {
      const currentNumber = types.number || number();
      if (currentNumber instanceof ZodNumber) {
        if (typeof numberSchema.exclusiveMaximum === "number") {
          types.number = currentNumber.lt(numberSchema.exclusiveMaximum);
        } else {
          types.number = false;
        }
      }
    }
  }
};
var MultipleOfHandler = class {
  apply(types, schema) {
    const numberSchema = schema;
    if (numberSchema.multipleOf === void 0) return;
    if (types.number !== false) {
      const currentNumber = types.number || number();
      if (currentNumber instanceof ZodNumber) {
        types.number = currentNumber.refine(
          (value) => {
            if (numberSchema.multipleOf === 0) return false;
            const quotient = value / numberSchema.multipleOf;
            const rounded = Math.round(quotient);
            const tolerance = Math.min(
              Math.abs(value) * Number.EPSILON * 10,
              Math.abs(numberSchema.multipleOf) * Number.EPSILON * 10
            );
            return Math.abs(quotient - rounded) <= tolerance / Math.abs(numberSchema.multipleOf);
          },
          { message: `Must be a multiple of ${numberSchema.multipleOf}` }
        );
      }
    }
  }
};
var ImplicitArrayHandler = class {
  apply(types, schema) {
    const arraySchema = schema;
    if (schema.type === void 0 && (arraySchema.minItems !== void 0 || arraySchema.maxItems !== void 0 || arraySchema.items !== void 0 || arraySchema.prefixItems !== void 0)) {
      if (types.array === void 0) {
        types.array = array(any());
      }
    }
  }
};
var MinItemsHandler = class {
  apply(types, schema) {
    const arraySchema = schema;
    if (arraySchema.minItems === void 0) return;
    if (types.array !== false) {
      types.array = (types.array || array(any())).min(arraySchema.minItems);
    }
  }
};
var MaxItemsHandler = class {
  apply(types, schema) {
    const arraySchema = schema;
    if (arraySchema.maxItems === void 0) return;
    if (types.array !== false) {
      types.array = (types.array || array(any())).max(arraySchema.maxItems);
    }
  }
};
var ItemsHandler = class {
  apply(types, schema) {
    const arraySchema = schema;
    if (types.array === false) return;
    if (Array.isArray(arraySchema.items)) {
      types.array = types.array || array(any());
    } else if (arraySchema.items && typeof arraySchema.items !== "boolean" && !arraySchema.prefixItems) {
      const itemSchema = convertJsonSchemaToZod(arraySchema.items);
      let newArray = array(itemSchema);
      if (types.array && types.array instanceof ZodArray) {
        const existingDef = types.array._def;
        if (existingDef.checks) {
          existingDef.checks.forEach((check) => {
            if (check._zod && check._zod.def) {
              const def = check._zod.def;
              if (def.check === "min_length" && def.minimum !== void 0) {
                newArray = newArray.min(def.minimum);
              } else if (def.check === "max_length" && def.maximum !== void 0) {
                newArray = newArray.max(def.maximum);
              }
            }
          });
        }
      }
      types.array = newArray;
    } else if (typeof arraySchema.items === "boolean" && arraySchema.items === false) {
      if (!arraySchema.prefixItems) {
        types.array = array(any()).max(0);
      } else {
        types.array = types.array || array(any());
      }
    } else if (typeof arraySchema.items === "boolean" && arraySchema.items === true) {
      types.array = types.array || array(any());
    } else if (arraySchema.prefixItems) {
      types.array = types.array || array(any());
    }
  }
};
var TupleHandler = class {
  apply(types, schema) {
    if (schema.type !== "array") return;
    const arraySchema = schema;
    if (!Array.isArray(arraySchema.items)) return;
    if (types.array === false) return;
    const itemSchemas = arraySchema.items.map((itemSchema) => convertJsonSchemaToZod(itemSchema));
    let tuple$1;
    if (itemSchemas.length === 0) {
      tuple$1 = tuple([]);
    } else {
      tuple$1 = tuple(itemSchemas);
    }
    if (arraySchema.minItems !== void 0 && arraySchema.minItems > itemSchemas.length) {
      tuple$1 = false;
    }
    if (arraySchema.maxItems !== void 0 && arraySchema.maxItems < itemSchemas.length) {
      tuple$1 = false;
    }
    types.tuple = tuple$1;
    types.array = false;
  }
};
var PropertiesHandler = class {
  apply(types, schema) {
    const objectSchema = schema;
    if (types.object === false) return;
    if (objectSchema.properties || objectSchema.required || objectSchema.additionalProperties !== void 0) {
      types.object = types.object || object({}).passthrough();
    }
  }
};
var ImplicitObjectHandler = class {
  apply(types, schema) {
    const objectSchema = schema;
    if (schema.type === void 0 && (objectSchema.maxProperties !== void 0 || objectSchema.minProperties !== void 0)) {
      if (types.object === void 0) {
        types.object = object({}).passthrough();
      }
    }
  }
};
var MaxPropertiesHandler = class {
  apply(types, schema) {
    const objectSchema = schema;
    if (objectSchema.maxProperties === void 0) return;
    if (types.object !== false) {
      const baseObject = types.object || object({}).passthrough();
      types.object = baseObject.refine(
        (obj) => Object.keys(obj).length <= objectSchema.maxProperties,
        { message: `Object must have at most ${objectSchema.maxProperties} properties` }
      );
    }
  }
};
var MinPropertiesHandler = class {
  apply(types, schema) {
    const objectSchema = schema;
    if (objectSchema.minProperties === void 0) return;
    if (types.object !== false) {
      const baseObject = types.object || object({}).passthrough();
      types.object = baseObject.refine(
        (obj) => Object.keys(obj).length >= objectSchema.minProperties,
        { message: `Object must have at least ${objectSchema.minProperties} properties` }
      );
    }
  }
};
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => keysB.includes(key) && deepEqual(a[key], b[key]));
  }
  return false;
}
function createUniqueItemsValidator() {
  return (value) => {
    if (!Array.isArray(value)) {
      return true;
    }
    const seen = [];
    return value.every((item) => {
      const isDuplicate = seen.some((seenItem) => deepEqual(item, seenItem));
      if (isDuplicate) {
        return false;
      }
      seen.push(item);
      return true;
    });
  };
}
function isValidWithSchema(schema, value) {
  return schema.safeParse(value).success;
}
var NotHandler = class {
  apply(zodSchema, schema) {
    if (!schema.not) return zodSchema;
    const notSchema = convertJsonSchemaToZod(schema.not);
    return zodSchema.refine(
      (value) => !isValidWithSchema(notSchema, value),
      { message: "Value must not match the 'not' schema" }
    );
  }
};
var UniqueItemsHandler = class {
  apply(zodSchema, schema) {
    const arraySchema = schema;
    if (arraySchema.uniqueItems !== true) return zodSchema;
    return zodSchema.refine(createUniqueItemsValidator(), {
      message: "Array items must be unique"
    });
  }
};
var AllOfHandler = class {
  apply(zodSchema, schema) {
    if (!schema.allOf || schema.allOf.length === 0) return zodSchema;
    const allOfSchemas = schema.allOf.map((s) => convertJsonSchemaToZod(s));
    return allOfSchemas.reduce(
      (acc, s) => intersection(acc, s),
      zodSchema
    );
  }
};
var AnyOfHandler = class {
  apply(zodSchema, schema) {
    if (!schema.anyOf || schema.anyOf.length === 0) return zodSchema;
    const anyOfSchema = schema.anyOf.length === 1 ? convertJsonSchemaToZod(schema.anyOf[0]) : union([
      convertJsonSchemaToZod(schema.anyOf[0]),
      convertJsonSchemaToZod(schema.anyOf[1]),
      ...schema.anyOf.slice(2).map((s) => convertJsonSchemaToZod(s))
    ]);
    return intersection(zodSchema, anyOfSchema);
  }
};
var OneOfHandler = class {
  apply(zodSchema, schema) {
    if (!schema.oneOf || schema.oneOf.length === 0) return zodSchema;
    const oneOfSchemas = schema.oneOf.map((s) => convertJsonSchemaToZod(s));
    return zodSchema.refine(
      (value) => {
        let validCount = 0;
        for (const oneOfSchema of oneOfSchemas) {
          const result = oneOfSchema.safeParse(value);
          if (result.success) {
            validCount++;
            if (validCount > 1) return false;
          }
        }
        return validCount === 1;
      },
      { message: "Value must match exactly one of the oneOf schemas" }
    );
  }
};
var PrefixItemsHandler = class {
  apply(zodSchema, schema) {
    const arraySchema = schema;
    if (arraySchema.prefixItems && Array.isArray(arraySchema.prefixItems)) {
      const prefixItems = arraySchema.prefixItems;
      const prefixSchemas = prefixItems.map((itemSchema) => convertJsonSchemaToZod(itemSchema));
      return zodSchema.refine(
        (value) => {
          if (!Array.isArray(value)) return true;
          for (let i = 0; i < Math.min(value.length, prefixSchemas.length); i++) {
            if (!isValidWithSchema(prefixSchemas[i], value[i])) {
              return false;
            }
          }
          if (value.length > prefixSchemas.length) {
            if (typeof arraySchema.items === "boolean" && arraySchema.items === false) {
              return false;
            } else if (arraySchema.items && typeof arraySchema.items === "object" && !Array.isArray(arraySchema.items)) {
              const additionalItemSchema = convertJsonSchemaToZod(arraySchema.items);
              for (let i = prefixSchemas.length; i < value.length; i++) {
                if (!isValidWithSchema(additionalItemSchema, value[i])) {
                  return false;
                }
              }
            }
          }
          return true;
        },
        { message: "Array does not match prefixItems schema" }
      );
    }
    return zodSchema;
  }
};
var ObjectPropertiesHandler = class {
  apply(zodSchema, schema) {
    const objectSchema = schema;
    if (!objectSchema.properties && !objectSchema.required && objectSchema.additionalProperties !== false) {
      return zodSchema;
    }
    if (zodSchema instanceof ZodObject || zodSchema instanceof ZodRecord) {
      const shape = {};
      if (objectSchema.properties) {
        for (const [key, propSchema] of Object.entries(objectSchema.properties)) {
          if (propSchema !== void 0) {
            shape[key] = convertJsonSchemaToZod(propSchema);
          }
        }
      }
      if (objectSchema.required && Array.isArray(objectSchema.required)) {
        const required = new Set(objectSchema.required);
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
      if (objectSchema.additionalProperties === false) {
        return object(shape);
      } else {
        return object(shape).passthrough();
      }
    }
    return zodSchema.refine(
      (value) => {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          return true;
        }
        if (objectSchema.properties) {
          for (const [propName, propSchema] of Object.entries(objectSchema.properties)) {
            if (propSchema !== void 0) {
              const propExists = Object.getOwnPropertyDescriptor(value, propName) !== void 0;
              if (propExists) {
                const zodPropSchema = convertJsonSchemaToZod(propSchema);
                const propResult = zodPropSchema.safeParse(value[propName]);
                if (!propResult.success) {
                  return false;
                }
              }
            }
          }
        }
        if (objectSchema.required && Array.isArray(objectSchema.required)) {
          for (const requiredProp of objectSchema.required) {
            const propExists = Object.getOwnPropertyDescriptor(value, requiredProp) !== void 0;
            if (!propExists) {
              return false;
            }
          }
        }
        if (objectSchema.additionalProperties === false && objectSchema.properties) {
          const allowedProps = new Set(Object.keys(objectSchema.properties));
          for (const prop in value) {
            if (!allowedProps.has(prop)) {
              return false;
            }
          }
        }
        return true;
      },
      { message: "Object constraints validation failed" }
    );
  }
};
var EnumComplexHandler = class {
  apply(zodSchema, schema) {
    if (!schema.enum || schema.enum.length === 0) return zodSchema;
    const complexValues = schema.enum.filter(
      (v) => Array.isArray(v) || typeof v === "object" && v !== null
    );
    if (complexValues.length === 0) return zodSchema;
    return zodSchema.refine(
      (value) => {
        if (typeof value !== "object" || value === null) return true;
        return complexValues.some(
          (enumValue) => deepEqual(value, enumValue)
        );
      },
      { message: "Value must match one of the enum values" }
    );
  }
};
var ConstComplexHandler = class {
  apply(zodSchema, schema) {
    if (schema.const === void 0) return zodSchema;
    const constValue = schema.const;
    if (typeof constValue !== "object" || constValue === null) {
      return zodSchema;
    }
    return zodSchema.refine(
      (value) => deepEqual(value, constValue),
      { message: "Value must equal the const value" }
    );
  }
};
var MetadataHandler = class {
  apply(zodSchema, schema) {
    if (schema.description) {
      zodSchema = zodSchema.describe(schema.description);
    }
    return zodSchema;
  }
};
var ProtoRequiredHandler = class {
  apply(zodSchema, schema) {
    var _a;
    const objectSchema = schema;
    if (!((_a = objectSchema.required) == null ? void 0 : _a.includes("__proto__")) || schema.type !== void 0) {
      return zodSchema;
    }
    return any().refine(
      (value) => this.validateRequired(value, objectSchema.required),
      { message: "Missing required properties" }
    );
  }
  validateRequired(value, required) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return true;
    }
    return required.every(
      (prop) => Object.prototype.hasOwnProperty.call(value, prop)
    );
  }
};
var ContainsHandler = class {
  apply(zodSchema, schema) {
    var _a;
    const arraySchema = schema;
    if (arraySchema.contains === void 0) return zodSchema;
    const containsSchema = convertJsonSchemaToZod(arraySchema.contains);
    const minContains = (_a = arraySchema.minContains) != null ? _a : 1;
    const maxContains = arraySchema.maxContains;
    return zodSchema.refine(
      (value) => {
        if (!Array.isArray(value)) {
          return true;
        }
        let matchCount = 0;
        for (const item of value) {
          if (isValidWithSchema(containsSchema, item)) {
            matchCount++;
          }
        }
        if (matchCount < minContains) {
          return false;
        }
        if (maxContains !== void 0 && matchCount > maxContains) {
          return false;
        }
        return true;
      },
      { message: "Array must contain required items matching the schema" }
    );
  }
};
var DefaultHandler = class {
  apply(zodSchema, schema) {
    const { default: v } = schema;
    if (v === void 0) return zodSchema;
    if (!zodSchema.safeParse(v).success) {
      return zodSchema;
    }
    return zodSchema.default(v);
  }
};
var primitiveHandlers = [
  // Type constraints - should run first
  new ConstHandler(),
  new EnumHandler(),
  new TypeHandler(),
  // File schema detection - must run before string constraints
  new FileHandler(),
  // Implicit type detection - must run before other constraints
  new ImplicitStringHandler(),
  new ImplicitArrayHandler(),
  new ImplicitObjectHandler(),
  // String constraints
  new MinLengthHandler(),
  new MaxLengthHandler(),
  new PatternHandler(),
  // Number constraints
  new MinimumHandler(),
  new MaximumHandler(),
  new ExclusiveMinimumHandler(),
  new ExclusiveMaximumHandler(),
  new MultipleOfHandler(),
  // Array constraints - TupleHandler must run before ItemsHandler
  new TupleHandler(),
  new MinItemsHandler(),
  new MaxItemsHandler(),
  new ItemsHandler(),
  // Object constraints
  new MaxPropertiesHandler(),
  new MinPropertiesHandler(),
  new PropertiesHandler()
];
var refinementHandlers = [
  // Handle special cases first
  new ProtoRequiredHandler(),
  new EnumComplexHandler(),
  new ConstComplexHandler(),
  // Logical combinations
  new AllOfHandler(),
  new AnyOfHandler(),
  new OneOfHandler(),
  // Type-specific refinements
  new PrefixItemsHandler(),
  new ObjectPropertiesHandler(),
  // Array refinements
  new ContainsHandler(),
  // Other refinements
  new NotHandler(),
  new UniqueItemsHandler(),
  new DefaultHandler(),
  // Metadata last
  new MetadataHandler()
];
function convertJsonSchemaToZod(schema) {
  if (typeof schema === "boolean") {
    return schema ? any() : never();
  }
  const types = {};
  for (const handler of primitiveHandlers) {
    handler.apply(types, schema);
  }
  const allowedSchemas = [];
  if (types.string !== false) {
    allowedSchemas.push(types.string || string());
  }
  if (types.number !== false) {
    allowedSchemas.push(types.number || number());
  }
  if (types.boolean !== false) {
    allowedSchemas.push(types.boolean || boolean());
  }
  if (types.null !== false) {
    allowedSchemas.push(types.null || _null());
  }
  if (types.array !== false) {
    allowedSchemas.push(types.array || array(any()));
  }
  if (types.tuple !== false && types.tuple !== void 0) {
    allowedSchemas.push(types.tuple);
  }
  if (types.object !== false) {
    if (types.object) {
      allowedSchemas.push(types.object);
    } else {
      const objectSchema = custom((val) => {
        return typeof val === "object" && val !== null && !Array.isArray(val);
      }, "Must be an object, not an array");
      allowedSchemas.push(objectSchema);
    }
  }
  if (types.file !== false && types.file !== void 0) {
    allowedSchemas.push(types.file);
  }
  let zodSchema;
  if (allowedSchemas.length === 0) {
    zodSchema = never();
  } else if (allowedSchemas.length === 1) {
    zodSchema = allowedSchemas[0];
  } else {
    const hasConstraints = Object.keys(schema).some(
      (key) => key !== "$schema" && key !== "title" && key !== "description"
    );
    if (!hasConstraints) {
      zodSchema = any();
    } else {
      zodSchema = union(allowedSchemas);
    }
  }
  for (const handler of refinementHandlers) {
    zodSchema = handler.apply(zodSchema, schema);
  }
  return zodSchema;
}
export {
  convertJsonSchemaToZod as c
};
