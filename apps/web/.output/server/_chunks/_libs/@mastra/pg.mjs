import { M as MastraVector, a as MastraError, E as ErrorCategory, b as ErrorDomain, c as createVectorErrorId, p as parseSqlIdentifier, B as BaseFilterTranslator, d as parseFieldKey } from "./core.mjs";
import { M as Mutex } from "../../../_libs/async-mutex.mjs";
import * as pg from "pg";
import { e } from "../../../_libs/xxhash-wasm.mjs";
var isPoolConfig = (cfg) => {
  return "pool" in cfg;
};
var isConnectionStringConfig = (cfg) => {
  return "connectionString" in cfg && typeof cfg.connectionString === "string";
};
var isHostConfig = (cfg) => {
  return "host" in cfg && "database" in cfg && "user" in cfg && "password" in cfg;
};
var isCloudSqlConfig = (cfg) => {
  return "stream" in cfg || "password" in cfg && typeof cfg.password === "function";
};
var validateConfig = (name, config) => {
  if (!config.id || typeof config.id !== "string" || config.id.trim() === "") {
    throw new Error(`${name}: id must be provided and cannot be empty.`);
  }
  if (isPoolConfig(config)) {
    if (!config.pool) {
      throw new Error(`${name}: pool must be provided when using pool config.`);
    }
    return;
  }
  if (isConnectionStringConfig(config)) {
    if (!config.connectionString || typeof config.connectionString !== "string" || config.connectionString.trim() === "") {
      throw new Error(
        `${name}: connectionString must be provided and cannot be empty. Passing an empty string may cause fallback to local Postgres defaults.`
      );
    }
  } else if (isCloudSqlConfig(config)) ;
  else if (isHostConfig(config)) {
    const required = ["host", "database", "user", "password"];
    for (const key of required) {
      if (!config[key] || typeof config[key] !== "string" || config[key].trim() === "") {
        throw new Error(
          `${name}: ${key} must be provided and cannot be empty. Passing an empty string may cause fallback to local Postgres defaults.`
        );
      }
    }
  } else {
    throw new Error(
      `${name}: invalid config. Provide either {pool}, {connectionString}, {host,port,database,user,password}, or a pg ClientConfig (e.g., Cloud SQL connector with \`stream\`).`
    );
  }
};
var PGFilterTranslator = class extends BaseFilterTranslator {
  getSupportedOperators() {
    return {
      ...BaseFilterTranslator.DEFAULT_OPERATORS,
      custom: ["$contains", "$size"]
    };
  }
  translate(filter) {
    if (this.isEmpty(filter)) {
      return filter;
    }
    this.validateFilter(filter);
    return this.translateNode(filter);
  }
  translateNode(node, currentPath = "") {
    const withPath = (result2) => currentPath ? { [currentPath]: result2 } : result2;
    if (this.isPrimitive(node)) {
      return withPath({ $eq: this.normalizeComparisonValue(node) });
    }
    if (Array.isArray(node)) {
      return withPath({ $in: this.normalizeArrayValues(node) });
    }
    if (node instanceof RegExp) {
      return withPath(this.translateRegexPattern(node.source, node.flags));
    }
    const entries = Object.entries(node);
    const result = {};
    if (node && "$options" in node && !("$regex" in node)) {
      throw new Error("$options is not valid without $regex");
    }
    if (node && "$regex" in node) {
      const options = node.$options || "";
      return withPath(this.translateRegexPattern(node.$regex, options));
    }
    for (const [key, value] of entries) {
      if (key === "$options") continue;
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      if (this.isLogicalOperator(key)) {
        result[key] = Array.isArray(value) ? value.map((filter) => this.translateNode(filter)) : this.translateNode(value);
      } else if (this.isOperator(key)) {
        if (this.isArrayOperator(key) && !Array.isArray(value) && key !== "$elemMatch") {
          result[key] = [value];
        } else if (this.isBasicOperator(key) && Array.isArray(value)) {
          result[key] = JSON.stringify(value);
        } else {
          result[key] = value;
        }
      } else if (typeof value === "object" && value !== null) {
        const hasOperators = Object.keys(value).some((k) => this.isOperator(k));
        if (hasOperators) {
          result[newPath] = this.translateNode(value);
        } else {
          Object.assign(result, this.translateNode(value, newPath));
        }
      } else {
        result[newPath] = this.translateNode(value);
      }
    }
    return result;
  }
  translateRegexPattern(pattern, options = "") {
    if (!options) return { $regex: pattern };
    const flags = options.split("").filter((f) => "imsux".includes(f)).join("");
    return { $regex: flags ? `(?${flags})${pattern}` : pattern };
  }
};
var createBasicOperator = (symbol) => {
  return (key, paramIndex) => {
    const jsonPathKey = parseJsonPathKey(key);
    return {
      sql: `CASE 
        WHEN $${paramIndex}::text IS NULL THEN metadata#>>'{${jsonPathKey}}' IS ${symbol === "=" ? "" : "NOT"} NULL
        ELSE metadata#>>'{${jsonPathKey}}' ${symbol} $${paramIndex}::text
      END`,
      needsValue: true
    };
  };
};
var createNumericOperator = (symbol) => {
  return (key, paramIndex, value) => {
    const jsonPathKey = parseJsonPathKey(key);
    const isNumeric = typeof value === "number" || typeof value === "string" && !isNaN(Number(value)) && value.trim() !== "";
    if (isNumeric) {
      return {
        sql: `(metadata#>>'{${jsonPathKey}}')::numeric ${symbol} $${paramIndex}::numeric`,
        needsValue: true
      };
    } else {
      return {
        sql: `metadata#>>'{${jsonPathKey}}' ${symbol} $${paramIndex}::text`,
        needsValue: true
      };
    }
  };
};
function buildElemMatchConditions(value, paramIndex) {
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("$elemMatch requires an object with conditions");
  }
  const conditions = [];
  const values = [];
  Object.entries(value).forEach(([field, val]) => {
    const nextParamIndex = paramIndex + values.length;
    let paramOperator;
    let paramKey;
    let paramValue;
    if (field.startsWith("$")) {
      paramOperator = field;
      paramKey = "";
      paramValue = val;
    } else if (typeof val === "object" && !Array.isArray(val)) {
      const [op, opValue] = Object.entries(val || {})[0] || [];
      paramOperator = op;
      paramKey = field;
      paramValue = opValue;
    } else {
      paramOperator = "$eq";
      paramKey = field;
      paramValue = val;
    }
    const operatorFn = FILTER_OPERATORS[paramOperator];
    if (!operatorFn) {
      throw new Error(`Invalid operator: ${paramOperator}`);
    }
    const result = operatorFn(paramKey, nextParamIndex, paramValue);
    const sql = result.sql.replaceAll("metadata#>>", "elem#>>");
    conditions.push(sql);
    if (result.needsValue) {
      values.push(paramValue);
    }
  });
  return {
    sql: conditions.join(" AND "),
    values
  };
}
var FILTER_OPERATORS = {
  $eq: createBasicOperator("="),
  $ne: createBasicOperator("!="),
  $gt: createNumericOperator(">"),
  $gte: createNumericOperator(">="),
  $lt: createNumericOperator("<"),
  $lte: createNumericOperator("<="),
  // Array Operators
  $in: (key, paramIndex) => {
    const jsonPathKey = parseJsonPathKey(key);
    return {
      sql: `(
        CASE
          WHEN jsonb_typeof(metadata->'${jsonPathKey}') = 'array' THEN
            EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(metadata->'${jsonPathKey}') as elem
              WHERE elem = ANY($${paramIndex}::text[])
            )
          ELSE metadata#>>'{${jsonPathKey}}' = ANY($${paramIndex}::text[])
        END
      )`,
      needsValue: true
    };
  },
  $nin: (key, paramIndex) => {
    const jsonPathKey = parseJsonPathKey(key);
    return {
      sql: `(
        CASE
          WHEN jsonb_typeof(metadata->'${jsonPathKey}') = 'array' THEN
            NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(metadata->'${jsonPathKey}') as elem
              WHERE elem = ANY($${paramIndex}::text[])
            )
          ELSE metadata#>>'{${jsonPathKey}}' != ALL($${paramIndex}::text[])
        END
      )`,
      needsValue: true
    };
  },
  $all: (key, paramIndex) => {
    const jsonPathKey = parseJsonPathKey(key);
    return {
      sql: `CASE WHEN array_length($${paramIndex}::text[], 1) IS NULL THEN false 
            ELSE (metadata#>'{${jsonPathKey}}')::jsonb ?& $${paramIndex}::text[] END`,
      needsValue: true
    };
  },
  $elemMatch: (key, paramIndex, value) => {
    const { sql, values } = buildElemMatchConditions(value, paramIndex);
    const jsonPathKey = parseJsonPathKey(key);
    return {
      sql: `(
        CASE
          WHEN jsonb_typeof(metadata->'${jsonPathKey}') = 'array' THEN
            EXISTS (
              SELECT 1 
              FROM jsonb_array_elements(metadata->'${jsonPathKey}') as elem
              WHERE ${sql}
            )
          ELSE FALSE
        END
      )`,
      needsValue: true,
      transformValue: () => values
    };
  },
  // Element Operators
  $exists: (key) => {
    const jsonPathKey = parseJsonPathKey(key);
    return {
      sql: `metadata ? '${jsonPathKey}'`,
      needsValue: false
    };
  },
  // Logical Operators
  $and: (key) => ({ sql: `(${key})`, needsValue: false }),
  $or: (key) => ({ sql: `(${key})`, needsValue: false }),
  $not: (key) => ({ sql: `NOT (${key})`, needsValue: false }),
  $nor: (key) => ({ sql: `NOT (${key})`, needsValue: false }),
  // Regex Operators
  $regex: (key, paramIndex) => {
    const jsonPathKey = parseJsonPathKey(key);
    return {
      sql: `metadata#>>'{${jsonPathKey}}' ~ $${paramIndex}`,
      needsValue: true
    };
  },
  $contains: (key, paramIndex, value) => {
    const jsonPathKey = parseJsonPathKey(key);
    let sql;
    if (Array.isArray(value)) {
      sql = `(metadata->'${jsonPathKey}') ?& $${paramIndex}`;
    } else if (typeof value === "string") {
      sql = `metadata->>'${jsonPathKey}' ILIKE '%' || $${paramIndex} || '%' ESCAPE '\\'`;
    } else {
      sql = `metadata->>'${jsonPathKey}' = $${paramIndex}`;
    }
    return {
      sql,
      needsValue: true,
      transformValue: () => Array.isArray(value) ? value.map(String) : typeof value === "string" ? escapeLikePattern(value) : value
    };
  },
  /**
   * $objectContains: Postgres-only operator for true JSONB object containment.
   * Usage: { field: { $objectContains: { ...subobject } } }
   */
  // $objectContains: (key, paramIndex) => ({
  //   sql: `metadata @> $${paramIndex}::jsonb`,
  //   needsValue: true,
  //   transformValue: value => {
  //     const parts = key.split('.');
  //     return JSON.stringify(parts.reduceRight((value, key) => ({ [key]: value }), value));
  //   },
  // }),
  $size: (key, paramIndex) => {
    const jsonPathKey = parseJsonPathKey(key);
    return {
      sql: `(
      CASE
        WHEN jsonb_typeof(metadata#>'{${jsonPathKey}}') = 'array' THEN 
          jsonb_array_length(metadata#>'{${jsonPathKey}}') = $${paramIndex}
        ELSE FALSE
      END
    )`,
      needsValue: true
    };
  }
};
var parseJsonPathKey = (key) => {
  const parsedKey = key !== "" ? parseFieldKey(key) : "";
  return parsedKey.replace(/\./g, ",");
};
function escapeLikePattern(str) {
  return str.replace(/([%_\\])/g, "\\$1");
}
function buildDeleteFilterQuery(filter) {
  const values = [];
  function buildCondition(key, value, parentPath) {
    if (["$and", "$or", "$not", "$nor"].includes(key)) {
      return handleLogicalOperator(key, value);
    }
    if (!value || typeof value !== "object") {
      values.push(value);
      return `metadata#>>'{${parseJsonPathKey(key)}}' = $${values.length}`;
    }
    const [[operator, operatorValue] = []] = Object.entries(value);
    if (operator === "$not") {
      const entries = Object.entries(operatorValue);
      const conditions2 = entries.map(([nestedOp, nestedValue]) => {
        if (!FILTER_OPERATORS[nestedOp]) {
          throw new Error(`Invalid operator in $not condition: ${nestedOp}`);
        }
        const operatorFn2 = FILTER_OPERATORS[nestedOp];
        const operatorResult2 = operatorFn2(key, values.length + 1, nestedValue);
        if (operatorResult2.needsValue) {
          values.push(nestedValue);
        }
        return operatorResult2.sql;
      }).join(" AND ");
      return `NOT (${conditions2})`;
    }
    const operatorFn = FILTER_OPERATORS[operator];
    const operatorResult = operatorFn(key, values.length + 1, operatorValue);
    if (operatorResult.needsValue) {
      const transformedValue = operatorResult.transformValue ? operatorResult.transformValue() : operatorValue;
      if (Array.isArray(transformedValue) && operator === "$elemMatch") {
        values.push(...transformedValue);
      } else {
        values.push(transformedValue);
      }
    }
    return operatorResult.sql;
  }
  function handleLogicalOperator(key, value, parentPath) {
    if (key === "$not") {
      const entries = Object.entries(value);
      const conditions3 = entries.map(([fieldKey, fieldValue]) => buildCondition(fieldKey, fieldValue)).join(" AND ");
      return `NOT (${conditions3})`;
    }
    if (!value || value.length === 0) {
      switch (key) {
        case "$and":
        case "$nor":
          return "true";
        // Empty $and/$nor match everything
        case "$or":
          return "false";
        // Empty $or matches nothing
        default:
          return "true";
      }
    }
    const joinOperator = key === "$or" || key === "$nor" ? "OR" : "AND";
    const conditions2 = value.map((f) => {
      const entries = Object.entries(f || {});
      if (entries.length === 0) return "";
      const [firstKey, firstValue] = entries[0] || [];
      if (["$and", "$or", "$not", "$nor"].includes(firstKey)) {
        return buildCondition(firstKey, firstValue);
      }
      return entries.map(([k, v]) => buildCondition(k, v)).join(` ${joinOperator} `);
    });
    const joined = conditions2.join(` ${joinOperator} `);
    const operatorFn = FILTER_OPERATORS[key];
    return operatorFn(joined, 0, value).sql;
  }
  if (!filter) {
    return { sql: "", values };
  }
  const conditions = Object.entries(filter).map(([key, value]) => buildCondition(key, value)).filter(Boolean).join(" AND ");
  return { sql: conditions ? `WHERE ${conditions}` : "", values };
}
function buildFilterQuery(filter, minScore, topK) {
  const values = [minScore, topK];
  function buildCondition(key, value, parentPath) {
    if (["$and", "$or", "$not", "$nor"].includes(key)) {
      return handleLogicalOperator(key, value);
    }
    if (!value || typeof value !== "object") {
      values.push(value);
      return `metadata#>>'{${parseJsonPathKey(key)}}' = $${values.length}`;
    }
    const [[operator, operatorValue] = []] = Object.entries(value);
    if (operator === "$not") {
      const entries = Object.entries(operatorValue);
      const conditions2 = entries.map(([nestedOp, nestedValue]) => {
        if (!FILTER_OPERATORS[nestedOp]) {
          throw new Error(`Invalid operator in $not condition: ${nestedOp}`);
        }
        const operatorFn2 = FILTER_OPERATORS[nestedOp];
        const operatorResult2 = operatorFn2(key, values.length + 1, nestedValue);
        if (operatorResult2.needsValue) {
          values.push(nestedValue);
        }
        return operatorResult2.sql;
      }).join(" AND ");
      return `NOT (${conditions2})`;
    }
    const operatorFn = FILTER_OPERATORS[operator];
    const operatorResult = operatorFn(key, values.length + 1, operatorValue);
    if (operatorResult.needsValue) {
      const transformedValue = operatorResult.transformValue ? operatorResult.transformValue() : operatorValue;
      if (Array.isArray(transformedValue) && operator === "$elemMatch") {
        values.push(...transformedValue);
      } else {
        values.push(transformedValue);
      }
    }
    return operatorResult.sql;
  }
  function handleLogicalOperator(key, value, parentPath) {
    if (key === "$not") {
      const entries = Object.entries(value);
      const conditions3 = entries.map(([fieldKey, fieldValue]) => buildCondition(fieldKey, fieldValue)).join(" AND ");
      return `NOT (${conditions3})`;
    }
    if (!value || value.length === 0) {
      switch (key) {
        case "$and":
        case "$nor":
          return "true";
        // Empty $and/$nor match everything
        case "$or":
          return "false";
        // Empty $or matches nothing
        default:
          return "true";
      }
    }
    const joinOperator = key === "$or" || key === "$nor" ? "OR" : "AND";
    const conditions2 = value.map((f) => {
      const entries = Object.entries(f || {});
      if (entries.length === 0) return "";
      const [firstKey, firstValue] = entries[0] || [];
      if (["$and", "$or", "$not", "$nor"].includes(firstKey)) {
        return buildCondition(firstKey, firstValue);
      }
      return entries.map(([k, v]) => buildCondition(k, v)).join(` ${joinOperator} `);
    });
    const joined = conditions2.join(` ${joinOperator} `);
    const operatorFn = FILTER_OPERATORS[key];
    return operatorFn(joined, 0, value).sql;
  }
  if (!filter) {
    return { sql: "", values };
  }
  const conditions = Object.entries(filter).map(([key, value]) => buildCondition(key, value)).filter(Boolean).join(" AND ");
  return { sql: conditions ? `WHERE ${conditions}` : "", values };
}
var PgVector = class extends MastraVector {
  pool;
  describeIndexCache = /* @__PURE__ */ new Map();
  createdIndexes = /* @__PURE__ */ new Map();
  indexVectorTypes = /* @__PURE__ */ new Map();
  mutexesByName = /* @__PURE__ */ new Map();
  schema;
  setupSchemaPromise = null;
  installVectorExtensionPromise = null;
  vectorExtensionInstalled = void 0;
  vectorExtensionSchema = null;
  vectorExtensionVersion = null;
  schemaSetupComplete = void 0;
  cacheWarmupPromise = null;
  constructor(config) {
    try {
      validateConfig("PgVector", config);
      super({ id: config.id });
      this.schema = config.schemaName;
      let poolConfig;
      if (isConnectionStringConfig(config)) {
        poolConfig = {
          connectionString: config.connectionString,
          ssl: config.ssl,
          max: config.max ?? 20,
          idleTimeoutMillis: config.idleTimeoutMillis ?? 3e4,
          connectionTimeoutMillis: 2e3,
          ...config.pgPoolOptions
        };
      } else if (isCloudSqlConfig(config)) {
        poolConfig = {
          ...config,
          max: config.pgPoolOptions?.max ?? 20,
          idleTimeoutMillis: config.pgPoolOptions?.idleTimeoutMillis ?? 3e4,
          connectionTimeoutMillis: 2e3,
          ...config.pgPoolOptions
        };
      } else if (isHostConfig(config)) {
        poolConfig = {
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
          password: config.password,
          ssl: config.ssl,
          max: config.max ?? 20,
          idleTimeoutMillis: config.idleTimeoutMillis ?? 3e4,
          connectionTimeoutMillis: 2e3,
          ...config.pgPoolOptions
        };
      } else {
        throw new Error("PgVector: invalid configuration provided");
      }
      this.pool = new pg.Pool(poolConfig);
      this.cacheWarmupPromise = (async () => {
        try {
          const existingIndexes = await this.listIndexes();
          await Promise.all(
            existingIndexes.map(async (indexName) => {
              const info = await this.getIndexInfo({ indexName });
              const key = await this.getIndexCacheKey({
                indexName,
                metric: info.metric,
                dimension: info.dimension,
                type: info.type,
                vectorType: info.vectorType
              });
              this.createdIndexes.set(indexName, key);
              this.indexVectorTypes.set(indexName, info.vectorType);
            })
          );
        } catch (error) {
          this.logger?.debug("Cache warming skipped or failed", { error });
        }
      })();
    } catch (error) {
      throw new MastraError(
        {
          id: createVectorErrorId("PG", "INITIALIZATION", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            schemaName: "schemaName" in config ? config.schemaName ?? "" : ""
          }
        },
        error
      );
    }
  }
  getMutexByName(indexName) {
    if (!this.mutexesByName.has(indexName)) this.mutexesByName.set(indexName, new Mutex());
    return this.mutexesByName.get(indexName);
  }
  /**
   * Detects which schema contains the vector extension and its version
   */
  async detectVectorExtensionSchema(client) {
    try {
      const result = await client.query(`
        SELECT n.nspname as schema_name, e.extversion as version
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE e.extname = 'vector'
        LIMIT 1;
      `);
      if (result.rows.length > 0) {
        this.vectorExtensionSchema = result.rows[0].schema_name;
        this.vectorExtensionVersion = result.rows[0].version;
        this.logger.debug("Vector extension found", {
          schema: this.vectorExtensionSchema,
          version: this.vectorExtensionVersion
        });
        return this.vectorExtensionSchema;
      }
      return null;
    } catch (error) {
      this.logger.debug("Could not detect vector extension schema", { error });
      return null;
    }
  }
  /**
   * Checks if the installed pgvector version supports halfvec type.
   * halfvec was introduced in pgvector 0.7.0.
   */
  supportsHalfvec() {
    if (!this.vectorExtensionVersion) {
      return false;
    }
    const parts = this.vectorExtensionVersion.split(".");
    const major = parseInt(parts[0] ?? "", 10);
    const minor = parseInt(parts[1] ?? "", 10);
    if (isNaN(major) || isNaN(minor)) {
      return false;
    }
    return major > 0 || major === 0 && minor >= 7;
  }
  /**
   * Gets the properly qualified vector type name
   * @param vectorType - The type of vector storage ('vector' or 'halfvec')
   */
  getVectorTypeName(vectorType = "vector") {
    if (this.vectorExtensionSchema) {
      if (this.vectorExtensionSchema === "pg_catalog") {
        return vectorType;
      }
      const validatedSchema = parseSqlIdentifier(this.vectorExtensionSchema, "vector extension schema");
      return `${validatedSchema}.${vectorType}`;
    }
    return vectorType;
  }
  /**
   * Gets the operator class for index creation based on metric and vector type.
   * pgvector uses different operator classes for vector vs halfvec types.
   */
  getMetricOperatorClass(metric, vectorType) {
    const prefix = vectorType === "halfvec" ? "halfvec" : "vector";
    switch (metric) {
      case "cosine":
        return `${prefix}_cosine_ops`;
      case "euclidean":
        return `${prefix}_l2_ops`;
      case "dotproduct":
        return `${prefix}_ip_ops`;
      default:
        return `${prefix}_cosine_ops`;
    }
  }
  getTableName(indexName) {
    const parsedIndexName = parseSqlIdentifier(indexName, "index name");
    const quotedIndexName = `"${parsedIndexName}"`;
    const quotedSchemaName = this.getSchemaName();
    const quotedVectorName = `"${parsedIndexName}_vector_idx"`;
    return {
      tableName: quotedSchemaName ? `${quotedSchemaName}.${quotedIndexName}` : quotedIndexName,
      vectorIndexName: quotedVectorName
    };
  }
  getSchemaName() {
    return this.schema ? `"${parseSqlIdentifier(this.schema, "schema name")}"` : void 0;
  }
  transformFilter(filter) {
    const translator = new PGFilterTranslator();
    return translator.translate(filter);
  }
  async getIndexInfo({ indexName }) {
    if (!this.describeIndexCache.has(indexName)) {
      this.describeIndexCache.set(indexName, await this.describeIndex({ indexName }));
    }
    return this.describeIndexCache.get(indexName);
  }
  async query({
    indexName,
    queryVector,
    topK = 10,
    filter,
    includeVector = false,
    minScore = -1,
    ef,
    probes
  }) {
    try {
      if (!Number.isInteger(topK) || topK <= 0) {
        throw new Error("topK must be a positive integer");
      }
      if (!Array.isArray(queryVector) || !queryVector.every((x) => typeof x === "number" && Number.isFinite(x))) {
        throw new Error("queryVector must be an array of finite numbers");
      }
    } catch (error) {
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "QUERY", "INVALID_INPUT"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.USER,
          details: {
            indexName
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const vectorStr = `[${queryVector.join(",")}]`;
      const translatedFilter = this.transformFilter(filter);
      const { sql: filterQuery, values: filterValues } = buildFilterQuery(translatedFilter, minScore, topK);
      const indexInfo = await this.getIndexInfo({ indexName });
      if (indexInfo.type === "hnsw") {
        const calculatedEf = ef ?? Math.max(topK, (indexInfo?.config?.m ?? 16) * topK);
        const searchEf = Math.min(1e3, Math.max(1, calculatedEf));
        await client.query(`SET LOCAL hnsw.ef_search = ${searchEf}`);
      }
      if (indexInfo.type === "ivfflat" && probes) {
        await client.query(`SET LOCAL ivfflat.probes = ${probes}`);
      }
      const { tableName } = this.getTableName(indexName);
      const qualifiedVectorType = this.getVectorTypeName(indexInfo.vectorType);
      const query = `
        WITH vector_scores AS (
          SELECT
            vector_id as id,
            1 - (embedding <=> '${vectorStr}'::${qualifiedVectorType}) as score,
            metadata
            ${includeVector ? ", embedding" : ""}
          FROM ${tableName}
          ${filterQuery}
        )
        SELECT *
        FROM vector_scores
        WHERE score > $1
        ORDER BY score DESC
        LIMIT $2`;
      const result = await client.query(query, filterValues);
      await client.query("COMMIT");
      return result.rows.map(({ id, score, metadata, embedding }) => ({
        id,
        score,
        metadata,
        ...includeVector && embedding && { vector: JSON.parse(embedding) }
      }));
    } catch (error) {
      await client.query("ROLLBACK");
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "QUERY", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client.release();
    }
  }
  async upsert({
    indexName,
    vectors,
    metadata,
    ids,
    deleteFilter
  }) {
    const { tableName } = this.getTableName(indexName);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (deleteFilter) {
        this.logger?.debug(`Deleting vectors matching filter before upsert`, { indexName, deleteFilter });
        const translatedFilter = this.transformFilter(deleteFilter);
        const { sql: filterQuery, values: filterValues } = buildDeleteFilterQuery(translatedFilter);
        const whereClause = filterQuery.trim().replace(/^WHERE\s+/i, "");
        if (whereClause) {
          const deleteQuery = `DELETE FROM ${tableName} WHERE ${whereClause}`;
          const result = await client.query(deleteQuery, filterValues);
          this.logger?.debug(`Deleted ${result.rowCount || 0} vectors before upsert`, {
            indexName,
            deletedCount: result.rowCount || 0
          });
        }
      }
      const vectorIds = ids || vectors.map(() => crypto.randomUUID());
      const indexInfo = await this.getIndexInfo({ indexName });
      const qualifiedVectorType = this.getVectorTypeName(indexInfo.vectorType);
      for (let i = 0; i < vectors.length; i++) {
        const query = `
          INSERT INTO ${tableName} (vector_id, embedding, metadata)
          VALUES ($1, $2::${qualifiedVectorType}, $3::jsonb)
          ON CONFLICT (vector_id)
          DO UPDATE SET
            embedding = $2::${qualifiedVectorType},
            metadata = $3::jsonb
          RETURNING embedding::text
        `;
        await client.query(query, [vectorIds[i], `[${vectors[i]?.join(",")}]`, JSON.stringify(metadata?.[i] || {})]);
      }
      await client.query("COMMIT");
      this.logger?.debug(`Upserted ${vectors.length} vectors to ${indexName}`, {
        indexName,
        vectorCount: vectors.length,
        hadDeleteFilter: !!deleteFilter
      });
      return vectorIds;
    } catch (error) {
      await client.query("ROLLBACK");
      if (error instanceof Error && error.message?.includes("expected") && error.message?.includes("dimensions")) {
        const match = error.message.match(/expected (\d+) dimensions, not (\d+)/);
        if (match) {
          const [, expected, actual] = match;
          const mastraError2 = new MastraError(
            {
              id: createVectorErrorId("PG", "UPSERT", "INVALID_INPUT"),
              domain: ErrorDomain.MASTRA_VECTOR,
              category: ErrorCategory.USER,
              text: `Vector dimension mismatch: Index "${indexName}" expects ${expected} dimensions but got ${actual} dimensions. Either use a matching embedding model or delete and recreate the index with the new dimension.`,
              details: {
                indexName,
                expected: expected ?? "",
                actual: actual ?? ""
              }
            },
            error
          );
          this.logger?.trackException(mastraError2);
          throw mastraError2;
        }
      }
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "UPSERT", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client.release();
    }
  }
  hasher = e();
  async getIndexCacheKey({
    indexName,
    dimension,
    metric,
    type,
    vectorType = "vector"
  }) {
    const input = indexName + dimension + metric + (type || "ivfflat") + vectorType;
    return (await this.hasher).h32(input);
  }
  cachedIndexExists(indexName, newKey) {
    const existingIndexCacheKey = this.createdIndexes.get(indexName);
    return existingIndexCacheKey && existingIndexCacheKey === newKey;
  }
  async setupSchema(client) {
    if (!this.schema || this.schemaSetupComplete) {
      return;
    }
    if (!this.setupSchemaPromise) {
      this.setupSchemaPromise = (async () => {
        try {
          const schemaCheck = await client.query(
            `
            SELECT EXISTS (
              SELECT 1 FROM information_schema.schemata
              WHERE schema_name = $1
            )
          `,
            [this.schema]
          );
          const schemaExists = schemaCheck.rows[0].exists;
          if (!schemaExists) {
            try {
              await client.query(`CREATE SCHEMA IF NOT EXISTS ${this.getSchemaName()}`);
              this.logger.info(`Schema "${this.schema}" created successfully`);
            } catch (error) {
              this.logger.error(`Failed to create schema "${this.schema}"`, { error });
              throw new Error(
                `Unable to create schema "${this.schema}". This requires CREATE privilege on the database. Either create the schema manually or grant CREATE privilege to the user.`
              );
            }
          }
          this.schemaSetupComplete = true;
          this.logger.debug(`Schema "${this.schema}" is ready for use`);
        } catch (error) {
          this.schemaSetupComplete = void 0;
          this.setupSchemaPromise = null;
          throw error;
        } finally {
          this.setupSchemaPromise = null;
        }
      })();
    }
    await this.setupSchemaPromise;
  }
  async createIndex({
    indexName,
    dimension,
    metric = "cosine",
    indexConfig = {},
    buildIndex = true,
    vectorType = "vector"
  }) {
    const { tableName } = this.getTableName(indexName);
    try {
      if (!indexName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        throw new Error("Invalid index name format");
      }
      if (!Number.isInteger(dimension) || dimension <= 0) {
        throw new Error("Dimension must be a positive integer");
      }
      if (vectorType !== "vector" && vectorType !== "halfvec") {
        throw new Error('vectorType must be "vector" or "halfvec"');
      }
    } catch (error) {
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "CREATE_INDEX", "INVALID_INPUT"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.USER,
          details: {
            indexName
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    }
    const indexCacheKey = await this.getIndexCacheKey({
      indexName,
      dimension,
      type: indexConfig.type,
      metric,
      vectorType
    });
    if (this.cachedIndexExists(indexName, indexCacheKey)) {
      return;
    }
    const mutex = this.getMutexByName(`create-${indexName}`);
    await mutex.runExclusive(async () => {
      if (this.cachedIndexExists(indexName, indexCacheKey)) {
        return;
      }
      const client = await this.pool.connect();
      try {
        await this.setupSchema(client);
        await this.installVectorExtension(client);
        if (vectorType === "halfvec" && !this.supportsHalfvec()) {
          throw new MastraError({
            id: createVectorErrorId("PG", "CREATE_INDEX", "HALFVEC_NOT_SUPPORTED"),
            text: `halfvec type requires pgvector >= 0.7.0, but version ${this.vectorExtensionVersion || "unknown"} is installed. Either upgrade pgvector or use vectorType: 'vector' (which supports up to 2000 dimensions for indexes).`,
            domain: ErrorDomain.MASTRA_VECTOR,
            category: ErrorCategory.USER,
            details: {
              indexName,
              requestedVectorType: vectorType,
              pgvectorVersion: this.vectorExtensionVersion || "unknown",
              requiredVersion: "0.7.0"
            }
          });
        }
        if (this.schema && this.vectorExtensionSchema && this.schema !== this.vectorExtensionSchema && this.vectorExtensionSchema !== "pg_catalog") {
          await client.query(`SET search_path TO ${this.getSchemaName()}, "${this.vectorExtensionSchema}"`);
        }
        const qualifiedVectorType = this.getVectorTypeName(vectorType);
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id SERIAL PRIMARY KEY,
            vector_id TEXT UNIQUE NOT NULL,
            embedding ${qualifiedVectorType}(${dimension}),
            metadata JSONB DEFAULT '{}'::jsonb
          );
        `);
        this.createdIndexes.set(indexName, indexCacheKey);
        this.indexVectorTypes.set(indexName, vectorType);
        if (buildIndex) {
          await this.setupIndex({ indexName, metric, indexConfig, vectorType }, client);
        }
      } catch (error) {
        this.createdIndexes.delete(indexName);
        this.indexVectorTypes.delete(indexName);
        throw error;
      } finally {
        client.release();
      }
    }).catch((error) => {
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "CREATE_INDEX", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    });
  }
  async buildIndex({ indexName, metric = "cosine", indexConfig }) {
    const client = await this.pool.connect();
    try {
      await this.setupIndex({ indexName, metric, indexConfig }, client);
    } catch (error) {
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "BUILD_INDEX", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client.release();
    }
  }
  async setupIndex({ indexName, metric, indexConfig, vectorType = "vector" }, client) {
    const mutex = this.getMutexByName(`build-${indexName}`);
    await mutex.runExclusive(async () => {
      const isConfigEmpty = !indexConfig || Object.keys(indexConfig).length === 0 || !indexConfig.type && !indexConfig.ivf && !indexConfig.hnsw;
      const indexType = isConfigEmpty ? "ivfflat" : indexConfig.type || "ivfflat";
      const { tableName, vectorIndexName } = this.getTableName(indexName);
      let existingIndexInfo = null;
      let dimension = 0;
      try {
        existingIndexInfo = await this.getIndexInfo({ indexName });
        dimension = existingIndexInfo.dimension;
        if (isConfigEmpty && existingIndexInfo.metric === metric) {
          if (existingIndexInfo.type === "flat") {
            this.logger?.debug(`No index exists for ${vectorIndexName}, will create default ivfflat index`);
          } else {
            this.logger?.debug(
              `Index ${vectorIndexName} already exists (type: ${existingIndexInfo.type}, metric: ${existingIndexInfo.metric}), preserving existing configuration`
            );
            const cacheKey = await this.getIndexCacheKey({
              indexName,
              dimension,
              type: existingIndexInfo.type,
              metric: existingIndexInfo.metric,
              vectorType: existingIndexInfo.vectorType
            });
            this.createdIndexes.set(indexName, cacheKey);
            this.indexVectorTypes.set(indexName, existingIndexInfo.vectorType);
            return;
          }
        }
        let configMatches = existingIndexInfo.metric === metric && existingIndexInfo.type === indexType;
        if (indexType === "hnsw") {
          configMatches = configMatches && existingIndexInfo.config.m === (indexConfig.hnsw?.m ?? 8) && existingIndexInfo.config.efConstruction === (indexConfig.hnsw?.efConstruction ?? 32);
        } else if (indexType === "flat") {
          configMatches = configMatches && existingIndexInfo.type === "flat";
        } else if (indexType === "ivfflat" && indexConfig.ivf?.lists) {
          configMatches = configMatches && existingIndexInfo.config.lists === indexConfig.ivf?.lists;
        }
        if (configMatches) {
          this.logger?.debug(`Index ${vectorIndexName} already exists with same configuration, skipping recreation`);
          const cacheKey = await this.getIndexCacheKey({
            indexName,
            dimension,
            type: existingIndexInfo.type,
            metric: existingIndexInfo.metric,
            vectorType: existingIndexInfo.vectorType
          });
          this.createdIndexes.set(indexName, cacheKey);
          this.indexVectorTypes.set(indexName, existingIndexInfo.vectorType);
          return;
        }
        this.logger?.info(`Index ${vectorIndexName} configuration changed, rebuilding index`);
        await client.query(`DROP INDEX IF EXISTS ${vectorIndexName}`);
        this.describeIndexCache.delete(indexName);
      } catch {
        this.logger?.debug(`Index ${indexName} doesn't exist yet, will create it`);
      }
      if (indexType === "flat") {
        this.describeIndexCache.delete(indexName);
        return;
      }
      const effectiveVectorType = existingIndexInfo?.vectorType ?? vectorType;
      const metricOp = this.getMetricOperatorClass(metric, effectiveVectorType);
      let indexSQL;
      if (indexType === "hnsw") {
        const m = indexConfig.hnsw?.m ?? 8;
        const efConstruction = indexConfig.hnsw?.efConstruction ?? 32;
        indexSQL = `
          CREATE INDEX IF NOT EXISTS ${vectorIndexName}
          ON ${tableName}
          USING hnsw (embedding ${metricOp})
          WITH (
            m = ${m},
            ef_construction = ${efConstruction}
          )
        `;
      } else {
        let lists;
        if (indexConfig.ivf?.lists) {
          lists = indexConfig.ivf.lists;
        } else {
          const size = (await client.query(`SELECT COUNT(*) FROM ${tableName}`)).rows[0].count;
          lists = Math.max(100, Math.min(4e3, Math.floor(Math.sqrt(size) * 2)));
        }
        indexSQL = `
          CREATE INDEX IF NOT EXISTS ${vectorIndexName}
          ON ${tableName}
          USING ivfflat (embedding ${metricOp})
          WITH (lists = ${lists});
        `;
      }
      await client.query(indexSQL);
    });
  }
  async installVectorExtension(client) {
    if (this.vectorExtensionInstalled) {
      return;
    }
    if (!this.installVectorExtensionPromise) {
      this.installVectorExtensionPromise = (async () => {
        try {
          const existingSchema = await this.detectVectorExtensionSchema(client);
          if (existingSchema) {
            this.vectorExtensionInstalled = true;
            this.vectorExtensionSchema = existingSchema;
            this.logger.info(`Vector extension already installed in schema: ${existingSchema}`);
            return;
          }
          try {
            if (this.schema && this.schema !== "public") {
              try {
                await client.query(`CREATE EXTENSION IF NOT EXISTS vector SCHEMA ${this.getSchemaName()}`);
                const installedSchema2 = await this.detectVectorExtensionSchema(client);
                if (installedSchema2) {
                  this.vectorExtensionInstalled = true;
                  this.logger.info(`Vector extension installed in schema: ${installedSchema2}`);
                  return;
                }
                this.vectorExtensionInstalled = true;
                this.vectorExtensionSchema = this.schema;
                this.logger.info(`Vector extension installed in schema: ${this.schema}`);
                return;
              } catch (schemaError) {
                this.logger.debug(`Could not install vector extension in schema ${this.schema}, trying public schema`, {
                  error: schemaError
                });
              }
            }
            await client.query("CREATE EXTENSION IF NOT EXISTS vector");
            const installedSchema = await this.detectVectorExtensionSchema(client);
            if (installedSchema) {
              this.vectorExtensionInstalled = true;
              this.vectorExtensionSchema = installedSchema;
              this.logger.info(`Vector extension installed in schema: ${installedSchema}`);
            }
          } catch (error) {
            this.logger.warn(
              "Could not install vector extension. This requires superuser privileges. If the extension is already installed, you can ignore this warning.",
              { error }
            );
            const existingSchema2 = await this.detectVectorExtensionSchema(client);
            if (existingSchema2) {
              this.vectorExtensionInstalled = true;
              this.vectorExtensionSchema = existingSchema2;
              this.logger.info(`Vector extension found in schema: ${existingSchema2}`);
            }
          }
        } catch (error) {
          this.logger.error("Error setting up vector extension", { error });
          this.vectorExtensionInstalled = void 0;
          this.installVectorExtensionPromise = null;
          throw error;
        } finally {
          this.installVectorExtensionPromise = null;
        }
      })();
    }
    await this.installVectorExtensionPromise;
  }
  async listIndexes() {
    const client = await this.pool.connect();
    try {
      const mastraTablesQuery = `
        SELECT DISTINCT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = $1
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns c
          WHERE c.table_schema = t.table_schema
          AND c.table_name = t.table_name
          AND c.column_name = 'vector_id'
          AND c.data_type = 'text'
        )
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns c
          WHERE c.table_schema = t.table_schema
          AND c.table_name = t.table_name
          AND c.column_name = 'embedding'
          AND c.udt_name IN ('vector', 'halfvec')
        )
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns c
          WHERE c.table_schema = t.table_schema
          AND c.table_name = t.table_name
          AND c.column_name = 'metadata'
          AND c.data_type = 'jsonb'
        );
      `;
      const mastraTables = await client.query(mastraTablesQuery, [this.schema || "public"]);
      return mastraTables.rows.map((row) => row.table_name);
    } catch (e2) {
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "LIST_INDEXES", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY
        },
        e2
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client.release();
    }
  }
  /**
   * Retrieves statistics about a vector index.
   *
   * @param {string} indexName - The name of the index to describe
   * @returns A promise that resolves to the index statistics including dimension, count and metric
   */
  async describeIndex({ indexName }) {
    const client = await this.pool.connect();
    try {
      const { tableName } = this.getTableName(indexName);
      const tableExistsQuery = `
        SELECT udt_name
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = $2
          AND udt_name IN ('vector', 'halfvec')
        LIMIT 1;
      `;
      const tableExists = await client.query(tableExistsQuery, [this.schema || "public", indexName]);
      if (tableExists.rows.length === 0) {
        throw new Error(`Vector table ${tableName} does not exist`);
      }
      const vectorType = tableExists.rows[0].udt_name === "halfvec" ? "halfvec" : "vector";
      const dimensionQuery = `
                SELECT atttypmod as dimension
                FROM pg_attribute
                WHERE attrelid = $1::regclass
                AND attname = 'embedding';
            `;
      const countQuery = `
                SELECT COUNT(*) as count
                FROM ${tableName};
            `;
      const indexQuery = `
            SELECT
                am.amname as index_method,
                pg_get_indexdef(i.indexrelid) as index_def,
                opclass.opcname as operator_class
            FROM pg_index i
            JOIN pg_class c ON i.indexrelid = c.oid
            JOIN pg_am am ON c.relam = am.oid
            JOIN pg_opclass opclass ON i.indclass[0] = opclass.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE c.relname = $1
            AND n.nspname = $2;
            `;
      const [dimResult, countResult, indexResult] = await Promise.all([
        client.query(dimensionQuery, [tableName]),
        client.query(countQuery),
        client.query(indexQuery, [`${indexName}_vector_idx`, this.schema || "public"])
      ]);
      const { index_method, index_def, operator_class } = indexResult.rows[0] || {
        index_method: "flat",
        index_def: "",
        operator_class: "cosine"
      };
      const metric = operator_class.includes("l2") ? "euclidean" : operator_class.includes("ip") ? "dotproduct" : "cosine";
      const config = {};
      if (index_method === "hnsw") {
        const m = index_def.match(/m\s*=\s*'?(\d+)'?/)?.[1];
        const efConstruction = index_def.match(/ef_construction\s*=\s*'?(\d+)'?/)?.[1];
        if (m) config.m = parseInt(m);
        if (efConstruction) config.efConstruction = parseInt(efConstruction);
      } else if (index_method === "ivfflat") {
        const lists = index_def.match(/lists\s*=\s*'?(\d+)'?/)?.[1];
        if (lists) config.lists = parseInt(lists);
      }
      return {
        dimension: dimResult.rows[0].dimension,
        count: parseInt(countResult.rows[0].count),
        metric,
        type: index_method,
        vectorType,
        config
      };
    } catch (e2) {
      await client.query("ROLLBACK");
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "DESCRIBE_INDEX", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName
          }
        },
        e2
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client.release();
    }
  }
  async deleteIndex({ indexName }) {
    const client = await this.pool.connect();
    try {
      const { tableName } = this.getTableName(indexName);
      await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
      this.createdIndexes.delete(indexName);
      this.indexVectorTypes.delete(indexName);
      this.describeIndexCache.delete(indexName);
    } catch (error) {
      await client.query("ROLLBACK");
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "DELETE_INDEX", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client.release();
    }
  }
  async truncateIndex({ indexName }) {
    const client = await this.pool.connect();
    try {
      const { tableName } = this.getTableName(indexName);
      await client.query(`TRUNCATE ${tableName}`);
    } catch (e2) {
      await client.query("ROLLBACK");
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "TRUNCATE_INDEX", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName
          }
        },
        e2
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client.release();
    }
  }
  async disconnect() {
    if (this.cacheWarmupPromise) {
      try {
        await this.cacheWarmupPromise;
      } catch {
      }
    }
    await this.pool.end();
  }
  /**
   * Updates a vector by its ID with the provided vector and/or metadata.
   * @param indexName - The name of the index containing the vector.
   * @param id - The ID of the vector to update.
   * @param update - An object containing the vector and/or metadata to update.
   * @param update.vector - An optional array of numbers representing the new vector.
   * @param update.metadata - An optional record containing the new metadata.
   * @returns A promise that resolves when the update is complete.
   * @throws Will throw an error if no updates are provided or if the update operation fails.
   */
  async updateVector({ indexName, id, filter, update }) {
    let client;
    try {
      if (!update.vector && !update.metadata) {
        throw new Error("No updates provided");
      }
      if (!id && !filter) {
        throw new MastraError({
          id: createVectorErrorId("PG", "UPDATE_VECTOR", "NO_TARGET"),
          text: "Either id or filter must be provided",
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.USER,
          details: { indexName }
        });
      }
      if (id && filter) {
        throw new MastraError({
          id: createVectorErrorId("PG", "UPDATE_VECTOR", "MUTUALLY_EXCLUSIVE"),
          text: "Cannot provide both id and filter - they are mutually exclusive",
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.USER,
          details: { indexName }
        });
      }
      client = await this.pool.connect();
      const { tableName } = this.getTableName(indexName);
      const indexInfo = await this.getIndexInfo({ indexName });
      const qualifiedVectorType = this.getVectorTypeName(indexInfo.vectorType);
      let updateParts = [];
      let values = [];
      let valueIndex = 1;
      if (update.vector) {
        updateParts.push(`embedding = $${valueIndex}::${qualifiedVectorType}`);
        values.push(`[${update.vector.join(",")}]`);
        valueIndex++;
      }
      if (update.metadata) {
        updateParts.push(`metadata = $${valueIndex}::jsonb`);
        values.push(JSON.stringify(update.metadata));
        valueIndex++;
      }
      if (updateParts.length === 0) {
        return;
      }
      let whereClause;
      let whereValues;
      if (id) {
        whereClause = `vector_id = $${valueIndex}`;
        whereValues = [id];
      } else {
        if (!filter || Object.keys(filter).length === 0) {
          throw new MastraError({
            id: createVectorErrorId("PG", "UPDATE_VECTOR", "EMPTY_FILTER"),
            text: "Cannot update with empty filter",
            domain: ErrorDomain.MASTRA_VECTOR,
            category: ErrorCategory.USER,
            details: { indexName }
          });
        }
        const translatedFilter = this.transformFilter(filter);
        const { sql: filterQuery, values: filterValues } = buildDeleteFilterQuery(translatedFilter);
        whereClause = filterQuery.trim().replace(/^WHERE\s+/i, "");
        if (!whereClause) {
          throw new MastraError({
            id: createVectorErrorId("PG", "UPDATE_VECTOR", "INVALID_FILTER"),
            text: "Filter produced empty WHERE clause",
            domain: ErrorDomain.MASTRA_VECTOR,
            category: ErrorCategory.USER,
            details: { indexName, filter: JSON.stringify(filter) }
          });
        }
        whereClause = whereClause.replace(/\$(\d+)/g, (match, num) => {
          const newIndex = parseInt(num) + valueIndex - 1;
          return `$${newIndex}`;
        });
        whereValues = filterValues;
      }
      const query = `
        UPDATE ${tableName}
        SET ${updateParts.join(", ")}
        WHERE ${whereClause}
      `;
      const result = await client.query(query, [...values, ...whereValues]);
      this.logger?.info(`Updated ${result.rowCount || 0} vectors in ${indexName}`, {
        indexName,
        id: id ? id : void 0,
        filter: filter ? filter : void 0,
        updatedCount: result.rowCount || 0
      });
    } catch (error) {
      if (error instanceof MastraError) {
        throw error;
      }
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "UPDATE_VECTOR", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName,
            ...id && { id },
            ...filter && { filter: JSON.stringify(filter) }
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client?.release();
    }
  }
  /**
   * Deletes a vector by its ID.
   * @param indexName - The name of the index containing the vector.
   * @param id - The ID of the vector to delete.
   * @returns A promise that resolves when the deletion is complete.
   * @throws Will throw an error if the deletion operation fails.
   */
  async deleteVector({ indexName, id }) {
    let client;
    try {
      client = await this.pool.connect();
      const { tableName } = this.getTableName(indexName);
      const query = `
        DELETE FROM ${tableName}
        WHERE vector_id = $1
      `;
      await client.query(query, [id]);
    } catch (error) {
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "DELETE_VECTOR", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName,
            id
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client?.release();
    }
  }
  /**
   * Delete vectors matching a metadata filter.
   * @param indexName - The name of the index containing the vectors.
   * @param filter - The filter to match vectors for deletion.
   * @returns A promise that resolves when the deletion is complete.
   * @throws Will throw an error if the deletion operation fails.
   */
  async deleteVectors({ indexName, filter, ids }) {
    let client;
    try {
      client = await this.pool.connect();
      const { tableName } = this.getTableName(indexName);
      if (!filter && !ids) {
        throw new MastraError({
          id: createVectorErrorId("PG", "DELETE_VECTORS", "NO_TARGET"),
          text: "Either filter or ids must be provided",
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.USER,
          details: { indexName }
        });
      }
      if (filter && ids) {
        throw new MastraError({
          id: createVectorErrorId("PG", "DELETE_VECTORS", "MUTUALLY_EXCLUSIVE"),
          text: "Cannot provide both filter and ids - they are mutually exclusive",
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.USER,
          details: { indexName }
        });
      }
      let query;
      let values;
      if (ids) {
        if (ids.length === 0) {
          throw new MastraError({
            id: createVectorErrorId("PG", "DELETE_VECTORS", "EMPTY_IDS"),
            text: "Cannot delete with empty ids array",
            domain: ErrorDomain.MASTRA_VECTOR,
            category: ErrorCategory.USER,
            details: { indexName }
          });
        }
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
        query = `DELETE FROM ${tableName} WHERE vector_id IN (${placeholders})`;
        values = ids;
      } else {
        if (!filter || Object.keys(filter).length === 0) {
          throw new MastraError({
            id: createVectorErrorId("PG", "DELETE_VECTORS", "EMPTY_FILTER"),
            text: "Cannot delete with empty filter. Use deleteIndex to delete all vectors.",
            domain: ErrorDomain.MASTRA_VECTOR,
            category: ErrorCategory.USER,
            details: { indexName }
          });
        }
        const translatedFilter = this.transformFilter(filter);
        const { sql: filterQuery, values: filterValues } = buildDeleteFilterQuery(translatedFilter);
        const whereClause = filterQuery.trim().replace(/^WHERE\s+/i, "");
        if (!whereClause) {
          throw new MastraError({
            id: createVectorErrorId("PG", "DELETE_VECTORS", "INVALID_FILTER"),
            text: "Filter produced empty WHERE clause",
            domain: ErrorDomain.MASTRA_VECTOR,
            category: ErrorCategory.USER,
            details: { indexName, filter: JSON.stringify(filter) }
          });
        }
        query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
        values = filterValues;
      }
      const result = await client.query(query, values);
      this.logger?.info(`Deleted ${result.rowCount || 0} vectors from ${indexName}`, {
        indexName,
        filter: filter ? filter : void 0,
        ids: ids ? ids : void 0,
        deletedCount: result.rowCount || 0
      });
    } catch (error) {
      if (error instanceof MastraError) {
        throw error;
      }
      const mastraError = new MastraError(
        {
          id: createVectorErrorId("PG", "DELETE_VECTORS", "FAILED"),
          domain: ErrorDomain.MASTRA_VECTOR,
          category: ErrorCategory.THIRD_PARTY,
          details: {
            indexName,
            ...filter && { filter: JSON.stringify(filter) },
            ...ids && { idsCount: ids.length }
          }
        },
        error
      );
      this.logger?.trackException(mastraError);
      throw mastraError;
    } finally {
      client?.release();
    }
  }
};
export {
  PgVector as P
};
