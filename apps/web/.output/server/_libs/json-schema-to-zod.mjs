const parseAnyOf = (schema, refs) => {
  return schema.anyOf.length ? schema.anyOf.length === 1 ? parseSchema(schema.anyOf[0], {
    ...refs,
    path: [...refs.path, "anyOf", 0]
  }) : `z.union([${schema.anyOf.map((schema2, i) => parseSchema(schema2, { ...refs, path: [...refs.path, "anyOf", i] })).join(", ")}])` : `z.any()`;
};
const parseBoolean = (_schema) => {
  return "z.boolean()";
};
const parseDefault = (_schema) => {
  return "z.any()";
};
const parseMultipleType = (schema, refs) => {
  return `z.union([${schema.type.map((type) => parseSchema({ ...schema, type }, { ...refs, withoutDefaults: true })).join(", ")}])`;
};
const parseNot = (schema, refs) => {
  return `z.any().refine((value) => !${parseSchema(schema.not, {
    ...refs,
    path: [...refs.path, "not"]
  })}.safeParse(value).success, "Invalid input: Should NOT be valid against schema")`;
};
const parseNull = (_schema) => {
  return "z.null()";
};
const half = (arr) => {
  return [arr.slice(0, arr.length / 2), arr.slice(arr.length / 2)];
};
const originalIndex = Symbol("Original index");
const ensureOriginalIndex = (arr) => {
  let newArr = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (typeof item === "boolean") {
      newArr.push(item ? { [originalIndex]: i } : { [originalIndex]: i, not: {} });
    } else if (originalIndex in item) {
      return arr;
    } else {
      newArr.push({ ...item, [originalIndex]: i });
    }
  }
  return newArr;
};
function parseAllOf(schema, refs) {
  if (schema.allOf.length === 0) {
    return "z.never()";
  } else if (schema.allOf.length === 1) {
    const item = schema.allOf[0];
    return parseSchema(item, {
      ...refs,
      path: [...refs.path, "allOf", item[originalIndex]]
    });
  } else {
    const [left, right] = half(ensureOriginalIndex(schema.allOf));
    return `z.intersection(${parseAllOf({ allOf: left }, refs)}, ${parseAllOf({
      allOf: right
    }, refs)})`;
  }
}
function withMessage(schema, key, get) {
  const value = schema[key];
  let r = "";
  if (value !== void 0) {
    const got = get({ value, json: JSON.stringify(value) });
    if (got) {
      const opener = got[0];
      const prefix = got.length === 3 ? got[1] : "";
      const closer = got.length === 3 ? got[2] : got[1];
      r += opener;
      if (schema.errorMessage?.[key] !== void 0) {
        r += prefix + JSON.stringify(schema.errorMessage[key]);
      }
      r += closer;
    }
  }
  return r;
}
const parseArray = (schema, refs) => {
  if (Array.isArray(schema.items)) {
    return `z.tuple([${schema.items.map((v, i) => parseSchema(v, { ...refs, path: [...refs.path, "items", i] }))}])`;
  }
  let r = !schema.items ? "z.array(z.any())" : `z.array(${parseSchema(schema.items, {
    ...refs,
    path: [...refs.path, "items"]
  })})`;
  r += withMessage(schema, "minItems", ({ json }) => [
    `.min(${json}`,
    ", ",
    ")"
  ]);
  r += withMessage(schema, "maxItems", ({ json }) => [
    `.max(${json}`,
    ", ",
    ")"
  ]);
  if (schema.uniqueItems === true) {
    r += withMessage(schema, "uniqueItems", () => [
      ".unique(",
      "",
      ")"
    ]);
  }
  return r;
};
const parseConst = (schema) => {
  return `z.literal(${JSON.stringify(schema.const)})`;
};
const parseEnum = (schema) => {
  if (schema.enum.length === 0) {
    return "z.never()";
  } else if (schema.enum.length === 1) {
    return `z.literal(${JSON.stringify(schema.enum[0])})`;
  } else if (schema.enum.every((x) => typeof x === "string")) {
    return `z.enum([${schema.enum.map((x) => JSON.stringify(x))}])`;
  } else {
    return `z.union([${schema.enum.map((x) => `z.literal(${JSON.stringify(x)})`).join(", ")}])`;
  }
};
const parseIfThenElse = (schema, refs) => {
  const $if = parseSchema(schema.if, { ...refs, path: [...refs.path, "if"] });
  const $then = parseSchema(schema.then, {
    ...refs,
    path: [...refs.path, "then"]
  });
  const $else = parseSchema(schema.else, {
    ...refs,
    path: [...refs.path, "else"]
  });
  return `z.union([${$then}, ${$else}]).superRefine((value,ctx) => {
  const result = ${$if}.safeParse(value).success
    ? ${$then}.safeParse(value)
    : ${$else}.safeParse(value);
  if (!result.success) {
    result.error.errors.forEach((error) => ctx.addIssue(error))
  }
})`;
};
const parseNumber = (schema) => {
  let r = "z.number()";
  if (schema.type === "integer") {
    r += withMessage(schema, "type", () => [".int(", ")"]);
  } else {
    r += withMessage(schema, "format", ({ value }) => {
      if (value === "int64") {
        return [".int(", ")"];
      }
    });
  }
  r += withMessage(schema, "multipleOf", ({ value, json }) => {
    if (value === 1) {
      if (r.startsWith("z.number().int(")) {
        return;
      }
      return [".int(", ")"];
    }
    return [`.multipleOf(${json}`, ", ", ")"];
  });
  if (typeof schema.minimum === "number") {
    if (schema.exclusiveMinimum === true) {
      r += withMessage(schema, "minimum", ({ json }) => [
        `.gt(${json}`,
        ", ",
        ")"
      ]);
    } else {
      r += withMessage(schema, "minimum", ({ json }) => [
        `.gte(${json}`,
        ", ",
        ")"
      ]);
    }
  } else if (typeof schema.exclusiveMinimum === "number") {
    r += withMessage(schema, "exclusiveMinimum", ({ json }) => [
      `.gt(${json}`,
      ", ",
      ")"
    ]);
  }
  if (typeof schema.maximum === "number") {
    if (schema.exclusiveMaximum === true) {
      r += withMessage(schema, "maximum", ({ json }) => [
        `.lt(${json}`,
        ", ",
        ")"
      ]);
    } else {
      r += withMessage(schema, "maximum", ({ json }) => [
        `.lte(${json}`,
        ", ",
        ")"
      ]);
    }
  } else if (typeof schema.exclusiveMaximum === "number") {
    r += withMessage(schema, "exclusiveMaximum", ({ json }) => [
      `.lt(${json}`,
      ", ",
      ")"
    ]);
  }
  return r;
};
const parseOneOf = (schema, refs) => {
  return schema.oneOf.length ? schema.oneOf.length === 1 ? parseSchema(schema.oneOf[0], {
    ...refs,
    path: [...refs.path, "oneOf", 0]
  }) : `z.any().superRefine((x, ctx) => {
    const schemas = [${schema.oneOf.map((schema2, i) => parseSchema(schema2, {
    ...refs,
    path: [...refs.path, "oneOf", i]
  })).join(", ")}];
    const errors = schemas.reduce<z.ZodError[]>(
      (errors, schema) =>
        ((result) =>
          result.error ? [...errors, result.error] : errors)(
          schema.safeParse(x),
        ),
      [],
    );
    if (schemas.length - errors.length !== 1) {
      ctx.addIssue({
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema",
      });
    }
  })` : "z.any()";
};
const expandJsdocs = (jsdocs) => {
  const lines = jsdocs.split("\n");
  const result = lines.length === 1 ? lines[0] : `
${lines.map((x) => `* ${x}`).join("\n")}
`;
  return `/**${result}*/
`;
};
const addJsdocs = (schema, parsed) => {
  const description = schema.description;
  if (!description) {
    return parsed;
  }
  return `
${expandJsdocs(description)}${parsed}`;
};
function parseObject(objectSchema, refs) {
  let properties = void 0;
  if (objectSchema.properties) {
    if (!Object.keys(objectSchema.properties).length) {
      properties = "z.object({})";
    } else {
      properties = "z.object({ ";
      properties += Object.keys(objectSchema.properties).map((key) => {
        const propSchema = objectSchema.properties[key];
        let result = `${JSON.stringify(key)}: ${parseSchema(propSchema, {
          ...refs,
          path: [...refs.path, "properties", key]
        })}`;
        if (refs.withJsdocs && typeof propSchema === "object") {
          result = addJsdocs(propSchema, result);
        }
        const hasDefault = typeof propSchema === "object" && propSchema.default !== void 0;
        const required = Array.isArray(objectSchema.required) ? objectSchema.required.includes(key) : typeof propSchema === "object" && propSchema.required === true;
        const optional = !hasDefault && !required;
        return optional ? `${result}.optional()` : result;
      }).join(", ");
      properties += " })";
    }
  }
  const additionalProperties = objectSchema.additionalProperties !== void 0 ? parseSchema(objectSchema.additionalProperties, {
    ...refs,
    path: [...refs.path, "additionalProperties"]
  }) : void 0;
  let patternProperties = void 0;
  if (objectSchema.patternProperties) {
    const parsedPatternProperties = Object.fromEntries(Object.entries(objectSchema.patternProperties).map(([key, value]) => {
      return [
        key,
        parseSchema(value, {
          ...refs,
          path: [...refs.path, "patternProperties", key]
        })
      ];
    }, {}));
    patternProperties = "";
    if (properties) {
      if (additionalProperties) {
        patternProperties += `.catchall(z.union([${[
          ...Object.values(parsedPatternProperties),
          additionalProperties
        ].join(", ")}]))`;
      } else if (Object.keys(parsedPatternProperties).length > 1) {
        patternProperties += `.catchall(z.union([${Object.values(parsedPatternProperties).join(", ")}]))`;
      } else {
        patternProperties += `.catchall(${Object.values(parsedPatternProperties)})`;
      }
    } else {
      if (additionalProperties) {
        patternProperties += `z.record(z.union([${[
          ...Object.values(parsedPatternProperties),
          additionalProperties
        ].join(", ")}]))`;
      } else if (Object.keys(parsedPatternProperties).length > 1) {
        patternProperties += `z.record(z.union([${Object.values(parsedPatternProperties).join(", ")}]))`;
      } else {
        patternProperties += `z.record(${Object.values(parsedPatternProperties)})`;
      }
    }
    patternProperties += ".superRefine((value, ctx) => {\n";
    patternProperties += "for (const key in value) {\n";
    if (additionalProperties) {
      if (objectSchema.properties) {
        patternProperties += `let evaluated = [${Object.keys(objectSchema.properties).map((key) => JSON.stringify(key)).join(", ")}].includes(key)
`;
      } else {
        patternProperties += `let evaluated = false
`;
      }
    }
    for (const key in objectSchema.patternProperties) {
      patternProperties += "if (key.match(new RegExp(" + JSON.stringify(key) + "))) {\n";
      if (additionalProperties) {
        patternProperties += "evaluated = true\n";
      }
      patternProperties += "const result = " + parsedPatternProperties[key] + ".safeParse(value[key])\n";
      patternProperties += "if (!result.success) {\n";
      patternProperties += `ctx.addIssue({
          path: [...ctx.path, key],
          code: 'custom',
          message: \`Invalid input: Key matching regex /\${key}/ must match schema\`,
          params: {
            issues: result.error.issues
          }
        })
`;
      patternProperties += "}\n";
      patternProperties += "}\n";
    }
    if (additionalProperties) {
      patternProperties += "if (!evaluated) {\n";
      patternProperties += "const result = " + additionalProperties + ".safeParse(value[key])\n";
      patternProperties += "if (!result.success) {\n";
      patternProperties += `ctx.addIssue({
          path: [...ctx.path, key],
          code: 'custom',
          message: \`Invalid input: must match catchall schema\`,
          params: {
            issues: result.error.issues
          }
        })
`;
      patternProperties += "}\n";
      patternProperties += "}\n";
    }
    patternProperties += "}\n";
    patternProperties += "})";
  }
  let output = properties ? patternProperties ? properties + patternProperties : additionalProperties ? additionalProperties === "z.never()" ? properties + ".strict()" : properties + `.catchall(${additionalProperties})` : properties : patternProperties ? patternProperties : additionalProperties ? `z.record(${additionalProperties})` : "z.record(z.any())";
  if (its.an.anyOf(objectSchema)) {
    output += `.and(${parseAnyOf({
      ...objectSchema,
      anyOf: objectSchema.anyOf.map((x) => typeof x === "object" && !x.type && (x.properties || x.additionalProperties || x.patternProperties) ? { ...x, type: "object" } : x)
    }, refs)})`;
  }
  if (its.a.oneOf(objectSchema)) {
    output += `.and(${parseOneOf({
      ...objectSchema,
      oneOf: objectSchema.oneOf.map((x) => typeof x === "object" && !x.type && (x.properties || x.additionalProperties || x.patternProperties) ? { ...x, type: "object" } : x)
    }, refs)})`;
  }
  if (its.an.allOf(objectSchema)) {
    output += `.and(${parseAllOf({
      ...objectSchema,
      allOf: objectSchema.allOf.map((x) => typeof x === "object" && !x.type && (x.properties || x.additionalProperties || x.patternProperties) ? { ...x, type: "object" } : x)
    }, refs)})`;
  }
  return output;
}
const parseString = (schema) => {
  let r = "z.string()";
  r += withMessage(schema, "format", ({ value }) => {
    switch (value) {
      case "email":
        return [".email(", ")"];
      case "ip":
        return [".ip(", ")"];
      case "ipv4":
        return ['.ip({ version: "v4"', ", message: ", " })"];
      case "ipv6":
        return ['.ip({ version: "v6"', ", message: ", " })"];
      case "uri":
        return [".url(", ")"];
      case "uuid":
        return [".uuid(", ")"];
      case "date-time":
        return [".datetime({ offset: true", ", message: ", " })"];
      case "time":
        return [".time(", ")"];
      case "date":
        return [".date(", ")"];
      case "binary":
        return [".base64(", ")"];
      case "duration":
        return [".duration(", ")"];
    }
  });
  r += withMessage(schema, "pattern", ({ json }) => [
    `.regex(new RegExp(${json})`,
    ", ",
    ")"
  ]);
  r += withMessage(schema, "minLength", ({ json }) => [
    `.min(${json}`,
    ", ",
    ")"
  ]);
  r += withMessage(schema, "maxLength", ({ json }) => [
    `.max(${json}`,
    ", ",
    ")"
  ]);
  r += withMessage(schema, "contentEncoding", ({ value }) => {
    if (value === "base64") {
      return [".base64(", ")"];
    }
  });
  const contentMediaType = withMessage(schema, "contentMediaType", ({ value }) => {
    if (value === "application/json") {
      return [
        '.transform((str, ctx) => { try { return JSON.parse(str); } catch (err) { ctx.addIssue({ code: "custom", message: "Invalid JSON" }); }}',
        ", ",
        ")"
      ];
    }
  });
  if (contentMediaType != "") {
    r += contentMediaType;
    r += withMessage(schema, "contentSchema", ({ value }) => {
      if (value && value instanceof Object) {
        return [
          `.pipe(${parseSchema(value)}`,
          ", ",
          ")"
        ];
      }
    });
  }
  return r;
};
const parseSimpleDiscriminatedOneOf = (schema, refs) => {
  return schema.oneOf.length ? schema.oneOf.length === 1 ? parseSchema(schema.oneOf[0], {
    ...refs,
    path: [...refs.path, "oneOf", 0]
  }) : `z.discriminatedUnion("${schema.discriminator.propertyName}", [${schema.oneOf.map((schema2, i) => parseSchema(schema2, {
    ...refs,
    path: [...refs.path, "oneOf", i]
  })).join(", ")}])` : "z.any()";
};
const omit = (obj, ...keys) => Object.keys(obj).reduce((acc, key) => {
  if (!keys.includes(key)) {
    acc[key] = obj[key];
  }
  return acc;
}, {});
const parseNullable = (schema, refs) => {
  return `${parseSchema(omit(schema, "nullable"), refs, true)}.nullable()`;
};
const parseSchema = (schema, refs = { seen: /* @__PURE__ */ new Map(), path: [] }, blockMeta) => {
  if (typeof schema !== "object")
    return schema ? "z.any()" : "z.never()";
  if (refs.parserOverride) {
    const custom = refs.parserOverride(schema, refs);
    if (typeof custom === "string") {
      return custom;
    }
  }
  let seen = refs.seen.get(schema);
  if (seen) {
    if (seen.r !== void 0) {
      return seen.r;
    }
    if (refs.depth === void 0 || seen.n >= refs.depth) {
      return "z.any()";
    }
    seen.n += 1;
  } else {
    seen = { r: void 0, n: 0 };
    refs.seen.set(schema, seen);
  }
  let parsed = selectParser(schema, refs);
  if (!blockMeta) {
    if (!refs.withoutDescribes) {
      parsed = addDescribes(schema, parsed);
    }
    if (!refs.withoutDefaults) {
      parsed = addDefaults(schema, parsed);
    }
    parsed = addAnnotations(schema, parsed);
  }
  seen.r = parsed;
  return parsed;
};
const addDescribes = (schema, parsed) => {
  if (schema.description) {
    parsed += `.describe(${JSON.stringify(schema.description)})`;
  }
  return parsed;
};
const addDefaults = (schema, parsed) => {
  if (schema.default !== void 0) {
    parsed += `.default(${JSON.stringify(schema.default)})`;
  }
  return parsed;
};
const addAnnotations = (schema, parsed) => {
  if (schema.readOnly) {
    parsed += ".readonly()";
  }
  return parsed;
};
const selectParser = (schema, refs) => {
  if (its.a.nullable(schema)) {
    return parseNullable(schema, refs);
  } else if (its.an.object(schema)) {
    return parseObject(schema, refs);
  } else if (its.an.array(schema)) {
    return parseArray(schema, refs);
  } else if (its.an.anyOf(schema)) {
    return parseAnyOf(schema, refs);
  } else if (its.an.allOf(schema)) {
    return parseAllOf(schema, refs);
  } else if (its.a.simpleDiscriminatedOneOf(schema)) {
    return parseSimpleDiscriminatedOneOf(schema, refs);
  } else if (its.a.oneOf(schema)) {
    return parseOneOf(schema, refs);
  } else if (its.a.not(schema)) {
    return parseNot(schema, refs);
  } else if (its.an.enum(schema)) {
    return parseEnum(schema);
  } else if (its.a.const(schema)) {
    return parseConst(schema);
  } else if (its.a.multipleType(schema)) {
    return parseMultipleType(schema, refs);
  } else if (its.a.primitive(schema, "string")) {
    return parseString(schema);
  } else if (its.a.primitive(schema, "number") || its.a.primitive(schema, "integer")) {
    return parseNumber(schema);
  } else if (its.a.primitive(schema, "boolean")) {
    return parseBoolean();
  } else if (its.a.primitive(schema, "null")) {
    return parseNull();
  } else if (its.a.conditional(schema)) {
    return parseIfThenElse(schema, refs);
  } else {
    return parseDefault();
  }
};
const its = {
  an: {
    object: (x) => x.type === "object",
    array: (x) => x.type === "array",
    anyOf: (x) => x.anyOf !== void 0,
    allOf: (x) => x.allOf !== void 0,
    enum: (x) => x.enum !== void 0
  },
  a: {
    nullable: (x) => x.nullable === true,
    multipleType: (x) => Array.isArray(x.type),
    not: (x) => x.not !== void 0,
    const: (x) => x.const !== void 0,
    primitive: (x, p) => x.type === p,
    conditional: (x) => Boolean("if" in x && x.if && "then" in x && "else" in x && x.then && x.else),
    simpleDiscriminatedOneOf: (x) => {
      if (!x.oneOf || !Array.isArray(x.oneOf) || x.oneOf.length === 0 || !x.discriminator || typeof x.discriminator !== "object" || !("propertyName" in x.discriminator) || typeof x.discriminator.propertyName !== "string") {
        return false;
      }
      const discriminatorProp = x.discriminator.propertyName;
      return x.oneOf.every((schema) => {
        if (!schema || typeof schema !== "object" || schema.type !== "object" || !schema.properties || typeof schema.properties !== "object" || !(discriminatorProp in schema.properties)) {
          return false;
        }
        const property = schema.properties[discriminatorProp];
        return property && typeof property === "object" && property.type === "string" && // Ensure discriminator has a constant value (const or single-value enum)
        (property.const !== void 0 || property.enum && Array.isArray(property.enum) && property.enum.length === 1) && // Ensure discriminator property is required
        Array.isArray(schema.required) && schema.required.includes(discriminatorProp);
      });
    },
    oneOf: (x) => x.oneOf !== void 0
  }
};
const jsonSchemaToZod = (schema, { module, name, type, noImport, ...rest } = {}) => {
  if (type && (!name || module !== "esm")) {
    throw new Error("Option `type` requires `name` to be set and `module` to be `esm`");
  }
  let result = parseSchema(schema, {
    module,
    name,
    path: [],
    seen: /* @__PURE__ */ new Map(),
    ...rest
  });
  const jsdocs = rest.withJsdocs && typeof schema !== "boolean" && schema.description ? expandJsdocs(schema.description) : "";
  if (module === "cjs") {
    result = `${jsdocs}module.exports = ${name ? `{ ${JSON.stringify(name)}: ${result} }` : result}
`;
    if (!noImport) {
      result = `${jsdocs}const { z } = require("zod")

${result}`;
    }
  } else if (module === "esm") {
    result = `${jsdocs}export ${name ? `const ${name} =` : `default`} ${result}
`;
    if (!noImport) {
      result = `import { z } from "zod"

${result}`;
    }
  } else if (name) {
    result = `${jsdocs}const ${name} = ${result}`;
  }
  if (type && name) {
    let typeName = typeof type === "string" ? type : `${name[0].toUpperCase()}${name.substring(1)}`;
    result += `export type ${typeName} = z.infer<typeof ${name}>
`;
  }
  return result;
};
export {
  addJsdocs as a,
  parseAnyOf as b,
  parseOneOf as c,
  parseAllOf as d,
  its as i,
  jsonSchemaToZod as j,
  parseSchema as p
};
