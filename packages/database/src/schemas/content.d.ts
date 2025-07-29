import { z } from "zod";
export declare const ContentRequestSchema: z.ZodObject<{
    topic: z.ZodString;
    briefDescription: z.ZodObject<{
        type: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            text: z.ZodOptional<z.ZodString>;
            attrs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            marks: z.ZodOptional<z.ZodArray<z.ZodObject<{
                type: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: string;
            }, {
                type: string;
            }>, "many">>;
            content: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            content?: any[] | undefined;
            text?: string | undefined;
            attrs?: Record<string, any> | undefined;
            marks?: {
                type: string;
            }[] | undefined;
        }, {
            type: string;
            content?: any[] | undefined;
            text?: string | undefined;
            attrs?: Record<string, any> | undefined;
            marks?: {
                type: string;
            }[] | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: string;
        content: {
            type: string;
            content?: any[] | undefined;
            text?: string | undefined;
            attrs?: Record<string, any> | undefined;
            marks?: {
                type: string;
            }[] | undefined;
        }[];
    }, {
        type: string;
        content: {
            type: string;
            content?: any[] | undefined;
            text?: string | undefined;
            attrs?: Record<string, any> | undefined;
            marks?: {
                type: string;
            }[] | undefined;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    topic: string;
    briefDescription: {
        type: string;
        content: {
            type: string;
            content?: any[] | undefined;
            text?: string | undefined;
            attrs?: Record<string, any> | undefined;
            marks?: {
                type: string;
            }[] | undefined;
        }[];
    };
}, {
    topic: string;
    briefDescription: {
        type: string;
        content: {
            type: string;
            content?: any[] | undefined;
            text?: string | undefined;
            attrs?: Record<string, any> | undefined;
            marks?: {
                type: string;
            }[] | undefined;
        }[];
    };
}>;
export type ContentRequest = z.infer<typeof ContentRequestSchema>;
export declare const ContentStatsSchema: z.ZodObject<{
    wordsCount: z.ZodOptional<z.ZodNumber>;
    readTimeMinutes: z.ZodOptional<z.ZodNumber>;
    qualityScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    wordsCount?: number | undefined;
    readTimeMinutes?: number | undefined;
    qualityScore?: number | undefined;
}, {
    wordsCount?: number | undefined;
    readTimeMinutes?: number | undefined;
    qualityScore?: number | undefined;
}>;
export type ContentStats = z.infer<typeof ContentStatsSchema>;
export declare const ContentMetaSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    topics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sources: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    slug?: string | undefined;
    tags?: string[] | undefined;
    topics?: string[] | undefined;
    sources?: string[] | undefined;
}, {
    slug?: string | undefined;
    tags?: string[] | undefined;
    topics?: string[] | undefined;
    sources?: string[] | undefined;
}>;
export type ContentMeta = z.infer<typeof ContentMetaSchema>;
export declare const contentStatusEnum: import("drizzle-orm/pg-core").PgEnum<["draft", "approved", "generating"]>;
export declare const content: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "content";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "content";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        agentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "agent_id";
            tableName: "content";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "content";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        title: import("drizzle-orm/pg-core").PgColumn<{
            name: "title";
            tableName: "content";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        body: import("drizzle-orm/pg-core").PgColumn<{
            name: "body";
            tableName: "content";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "content";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "draft" | "approved" | "generating";
            driverParam: string;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["draft", "approved", "generating"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        meta: import("drizzle-orm/pg-core").PgColumn<{
            name: "meta";
            tableName: "content";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                slug?: string | undefined;
                tags?: string[] | undefined;
                topics?: string[] | undefined;
                sources?: string[] | undefined;
            };
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: {
                slug?: string | undefined;
                tags?: string[] | undefined;
                topics?: string[] | undefined;
                sources?: string[] | undefined;
            };
        }>;
        request: import("drizzle-orm/pg-core").PgColumn<{
            name: "request";
            tableName: "content";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                topic: string;
                briefDescription: {
                    type: string;
                    content: {
                        type: string;
                        content?: any[] | undefined;
                        text?: string | undefined;
                        attrs?: Record<string, any> | undefined;
                        marks?: {
                            type: string;
                        }[] | undefined;
                    }[];
                };
            };
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: {
                topic: string;
                briefDescription: {
                    type: string;
                    content: {
                        type: string;
                        content?: any[] | undefined;
                        text?: string | undefined;
                        attrs?: Record<string, any> | undefined;
                        marks?: {
                            type: string;
                        }[] | undefined;
                    }[];
                };
            };
        }>;
        stats: import("drizzle-orm/pg-core").PgColumn<{
            name: "stats";
            tableName: "content";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                wordsCount?: number | undefined;
                readTimeMinutes?: number | undefined;
                qualityScore?: number | undefined;
            };
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: {
                wordsCount?: number | undefined;
                readTimeMinutes?: number | undefined;
                qualityScore?: number | undefined;
            };
        }>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "content";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "content";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type Content = typeof content.$inferSelect;
export type ContentInsert = typeof content.$inferInsert;
export declare const ContentInsertSchema: import("drizzle-zod").BuildSchema<"insert", {
    id: import("drizzle-orm/pg-core").PgColumn<{
        name: "id";
        tableName: "content";
        dataType: "string";
        columnType: "PgUUID";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: true;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    agentId: import("drizzle-orm/pg-core").PgColumn<{
        name: "agent_id";
        tableName: "content";
        dataType: "string";
        columnType: "PgUUID";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    userId: import("drizzle-orm/pg-core").PgColumn<{
        name: "user_id";
        tableName: "content";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    title: import("drizzle-orm/pg-core").PgColumn<{
        name: "title";
        tableName: "content";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    body: import("drizzle-orm/pg-core").PgColumn<{
        name: "body";
        tableName: "content";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    status: import("drizzle-orm/pg-core").PgColumn<{
        name: "status";
        tableName: "content";
        dataType: "string";
        columnType: "PgEnumColumn";
        data: "draft" | "approved" | "generating";
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: ["draft", "approved", "generating"];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    meta: import("drizzle-orm/pg-core").PgColumn<{
        name: "meta";
        tableName: "content";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            slug?: string | undefined;
            tags?: string[] | undefined;
            topics?: string[] | undefined;
            sources?: string[] | undefined;
        };
        driverParam: unknown;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {
        $type: {
            slug?: string | undefined;
            tags?: string[] | undefined;
            topics?: string[] | undefined;
            sources?: string[] | undefined;
        };
    }>;
    request: import("drizzle-orm/pg-core").PgColumn<{
        name: "request";
        tableName: "content";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            topic: string;
            briefDescription: {
                type: string;
                content: {
                    type: string;
                    content?: any[] | undefined;
                    text?: string | undefined;
                    attrs?: Record<string, any> | undefined;
                    marks?: {
                        type: string;
                    }[] | undefined;
                }[];
            };
        };
        driverParam: unknown;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {
        $type: {
            topic: string;
            briefDescription: {
                type: string;
                content: {
                    type: string;
                    content?: any[] | undefined;
                    text?: string | undefined;
                    attrs?: Record<string, any> | undefined;
                    marks?: {
                        type: string;
                    }[] | undefined;
                }[];
            };
        };
    }>;
    stats: import("drizzle-orm/pg-core").PgColumn<{
        name: "stats";
        tableName: "content";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            wordsCount?: number | undefined;
            readTimeMinutes?: number | undefined;
            qualityScore?: number | undefined;
        };
        driverParam: unknown;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {
        $type: {
            wordsCount?: number | undefined;
            readTimeMinutes?: number | undefined;
            qualityScore?: number | undefined;
        };
    }>;
    createdAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "created_at";
        tableName: "content";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: true;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "updated_at";
        tableName: "content";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: true;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
}, undefined>;
export declare const ContentSelectSchema: import("drizzle-zod").BuildSchema<"select", {
    id: import("drizzle-orm/pg-core").PgColumn<{
        name: "id";
        tableName: "content";
        dataType: "string";
        columnType: "PgUUID";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: true;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    agentId: import("drizzle-orm/pg-core").PgColumn<{
        name: "agent_id";
        tableName: "content";
        dataType: "string";
        columnType: "PgUUID";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    userId: import("drizzle-orm/pg-core").PgColumn<{
        name: "user_id";
        tableName: "content";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    title: import("drizzle-orm/pg-core").PgColumn<{
        name: "title";
        tableName: "content";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    body: import("drizzle-orm/pg-core").PgColumn<{
        name: "body";
        tableName: "content";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    status: import("drizzle-orm/pg-core").PgColumn<{
        name: "status";
        tableName: "content";
        dataType: "string";
        columnType: "PgEnumColumn";
        data: "draft" | "approved" | "generating";
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: ["draft", "approved", "generating"];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    meta: import("drizzle-orm/pg-core").PgColumn<{
        name: "meta";
        tableName: "content";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            slug?: string | undefined;
            tags?: string[] | undefined;
            topics?: string[] | undefined;
            sources?: string[] | undefined;
        };
        driverParam: unknown;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {
        $type: {
            slug?: string | undefined;
            tags?: string[] | undefined;
            topics?: string[] | undefined;
            sources?: string[] | undefined;
        };
    }>;
    request: import("drizzle-orm/pg-core").PgColumn<{
        name: "request";
        tableName: "content";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            topic: string;
            briefDescription: {
                type: string;
                content: {
                    type: string;
                    content?: any[] | undefined;
                    text?: string | undefined;
                    attrs?: Record<string, any> | undefined;
                    marks?: {
                        type: string;
                    }[] | undefined;
                }[];
            };
        };
        driverParam: unknown;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {
        $type: {
            topic: string;
            briefDescription: {
                type: string;
                content: {
                    type: string;
                    content?: any[] | undefined;
                    text?: string | undefined;
                    attrs?: Record<string, any> | undefined;
                    marks?: {
                        type: string;
                    }[] | undefined;
                }[];
            };
        };
    }>;
    stats: import("drizzle-orm/pg-core").PgColumn<{
        name: "stats";
        tableName: "content";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            wordsCount?: number | undefined;
            readTimeMinutes?: number | undefined;
            qualityScore?: number | undefined;
        };
        driverParam: unknown;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {
        $type: {
            wordsCount?: number | undefined;
            readTimeMinutes?: number | undefined;
            qualityScore?: number | undefined;
        };
    }>;
    createdAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "created_at";
        tableName: "content";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: true;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "updated_at";
        tableName: "content";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: true;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
}, undefined>;
export declare const ContentUpdateSchema: import("drizzle-zod").BuildSchema<"update", {
    id: import("drizzle-orm/pg-core").PgColumn<{
        name: "id";
        tableName: "content";
        dataType: "string";
        columnType: "PgUUID";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: true;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    agentId: import("drizzle-orm/pg-core").PgColumn<{
        name: "agent_id";
        tableName: "content";
        dataType: "string";
        columnType: "PgUUID";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    userId: import("drizzle-orm/pg-core").PgColumn<{
        name: "user_id";
        tableName: "content";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    title: import("drizzle-orm/pg-core").PgColumn<{
        name: "title";
        tableName: "content";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    body: import("drizzle-orm/pg-core").PgColumn<{
        name: "body";
        tableName: "content";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    status: import("drizzle-orm/pg-core").PgColumn<{
        name: "status";
        tableName: "content";
        dataType: "string";
        columnType: "PgEnumColumn";
        data: "draft" | "approved" | "generating";
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: ["draft", "approved", "generating"];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    meta: import("drizzle-orm/pg-core").PgColumn<{
        name: "meta";
        tableName: "content";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            slug?: string | undefined;
            tags?: string[] | undefined;
            topics?: string[] | undefined;
            sources?: string[] | undefined;
        };
        driverParam: unknown;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {
        $type: {
            slug?: string | undefined;
            tags?: string[] | undefined;
            topics?: string[] | undefined;
            sources?: string[] | undefined;
        };
    }>;
    request: import("drizzle-orm/pg-core").PgColumn<{
        name: "request";
        tableName: "content";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            topic: string;
            briefDescription: {
                type: string;
                content: {
                    type: string;
                    content?: any[] | undefined;
                    text?: string | undefined;
                    attrs?: Record<string, any> | undefined;
                    marks?: {
                        type: string;
                    }[] | undefined;
                }[];
            };
        };
        driverParam: unknown;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {
        $type: {
            topic: string;
            briefDescription: {
                type: string;
                content: {
                    type: string;
                    content?: any[] | undefined;
                    text?: string | undefined;
                    attrs?: Record<string, any> | undefined;
                    marks?: {
                        type: string;
                    }[] | undefined;
                }[];
            };
        };
    }>;
    stats: import("drizzle-orm/pg-core").PgColumn<{
        name: "stats";
        tableName: "content";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            wordsCount?: number | undefined;
            readTimeMinutes?: number | undefined;
            qualityScore?: number | undefined;
        };
        driverParam: unknown;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {
        $type: {
            wordsCount?: number | undefined;
            readTimeMinutes?: number | undefined;
            qualityScore?: number | undefined;
        };
    }>;
    createdAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "created_at";
        tableName: "content";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: true;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    updatedAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "updated_at";
        tableName: "content";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: true;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
}, undefined>;
//# sourceMappingURL=content.d.ts.map