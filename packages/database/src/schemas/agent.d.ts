export declare const agent: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "agent";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "agent";
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "agent";
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
        personaConfig: import("drizzle-orm/pg-core").PgColumn<{
            name: "persona_config";
            tableName: "agent";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                metadata: {
                    name: string;
                    description: string;
                };
                voice?: {
                    communication?: "I" | "we" | "you" | undefined;
                } | undefined;
                audience?: {
                    base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
                } | undefined;
                formatting?: {
                    style?: "structured" | "narrative" | "list_based" | undefined;
                    listStyle?: "bullets" | "numbered" | undefined;
                } | undefined;
                language?: {
                    primary?: "en" | "pt" | "es" | undefined;
                    variant?: string | undefined;
                } | undefined;
                brand?: {
                    integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
                    blacklistWords?: string[] | undefined;
                } | undefined;
                purpose?: "blog_post" | "linkedin_post" | "twitter_thread" | "instagram_post" | "instagram_story" | "tiktok_script" | "email_newsletter" | "reddit_post" | "youtube_script" | "slide_deck" | "video_script" | "technical_documentation" | undefined;
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
                metadata: {
                    name: string;
                    description: string;
                };
                voice?: {
                    communication?: "I" | "we" | "you" | undefined;
                } | undefined;
                audience?: {
                    base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
                } | undefined;
                formatting?: {
                    style?: "structured" | "narrative" | "list_based" | undefined;
                    listStyle?: "bullets" | "numbered" | undefined;
                } | undefined;
                language?: {
                    primary?: "en" | "pt" | "es" | undefined;
                    variant?: string | undefined;
                } | undefined;
                brand?: {
                    integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
                    blacklistWords?: string[] | undefined;
                } | undefined;
                purpose?: "blog_post" | "linkedin_post" | "twitter_thread" | "instagram_post" | "instagram_story" | "tiktok_script" | "email_newsletter" | "reddit_post" | "youtube_script" | "slide_deck" | "video_script" | "technical_documentation" | undefined;
            };
        }>;
        systemPrompt: import("drizzle-orm/pg-core").PgColumn<{
            name: "system_prompt";
            tableName: "agent";
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
        name: import("drizzle-orm/pg-core").PgColumn<{
            name: "name";
            tableName: "agent";
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
        description: import("drizzle-orm/pg-core").PgColumn<{
            name: "description";
            tableName: "agent";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isActive: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_active";
            tableName: "agent";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        totalDrafts: import("drizzle-orm/pg-core").PgColumn<{
            name: "total_drafts";
            tableName: "agent";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        totalPublished: import("drizzle-orm/pg-core").PgColumn<{
            name: "total_published";
            tableName: "agent";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        uploadedFiles: import("drizzle-orm/pg-core").PgColumn<{
            name: "uploaded_files";
            tableName: "agent";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                fileName: string;
                fileUrl: string;
                uploadedAt: string;
            }[];
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
                fileName: string;
                fileUrl: string;
                uploadedAt: string;
            }[];
        }>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "agent";
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
            tableName: "agent";
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
        lastGeneratedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_generated_at";
            tableName: "agent";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const agentRelations: import("drizzle-orm").Relations<"agent", {
    user: import("drizzle-orm").One<"user", true>;
}>;
export type AgentSelect = typeof agent.$inferSelect;
export type AgentInsert = typeof agent.$inferInsert;
export declare const AgentInsertSchema: import("drizzle-zod").BuildSchema<"insert", {
    id: import("drizzle-orm/pg-core").PgColumn<{
        name: "id";
        tableName: "agent";
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
    userId: import("drizzle-orm/pg-core").PgColumn<{
        name: "user_id";
        tableName: "agent";
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
    personaConfig: import("drizzle-orm/pg-core").PgColumn<{
        name: "persona_config";
        tableName: "agent";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            metadata: {
                name: string;
                description: string;
            };
            voice?: {
                communication?: "I" | "we" | "you" | undefined;
            } | undefined;
            audience?: {
                base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
            } | undefined;
            formatting?: {
                style?: "structured" | "narrative" | "list_based" | undefined;
                listStyle?: "bullets" | "numbered" | undefined;
            } | undefined;
            language?: {
                primary?: "en" | "pt" | "es" | undefined;
                variant?: string | undefined;
            } | undefined;
            brand?: {
                integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
                blacklistWords?: string[] | undefined;
            } | undefined;
            purpose?: "blog_post" | "linkedin_post" | "twitter_thread" | "instagram_post" | "instagram_story" | "tiktok_script" | "email_newsletter" | "reddit_post" | "youtube_script" | "slide_deck" | "video_script" | "technical_documentation" | undefined;
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
            metadata: {
                name: string;
                description: string;
            };
            voice?: {
                communication?: "I" | "we" | "you" | undefined;
            } | undefined;
            audience?: {
                base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
            } | undefined;
            formatting?: {
                style?: "structured" | "narrative" | "list_based" | undefined;
                listStyle?: "bullets" | "numbered" | undefined;
            } | undefined;
            language?: {
                primary?: "en" | "pt" | "es" | undefined;
                variant?: string | undefined;
            } | undefined;
            brand?: {
                integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
                blacklistWords?: string[] | undefined;
            } | undefined;
            purpose?: "blog_post" | "linkedin_post" | "twitter_thread" | "instagram_post" | "instagram_story" | "tiktok_script" | "email_newsletter" | "reddit_post" | "youtube_script" | "slide_deck" | "video_script" | "technical_documentation" | undefined;
        };
    }>;
    systemPrompt: import("drizzle-orm/pg-core").PgColumn<{
        name: "system_prompt";
        tableName: "agent";
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
    name: import("drizzle-orm/pg-core").PgColumn<{
        name: "name";
        tableName: "agent";
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
    description: import("drizzle-orm/pg-core").PgColumn<{
        name: "description";
        tableName: "agent";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    isActive: import("drizzle-orm/pg-core").PgColumn<{
        name: "is_active";
        tableName: "agent";
        dataType: "boolean";
        columnType: "PgBoolean";
        data: boolean;
        driverParam: boolean;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    totalDrafts: import("drizzle-orm/pg-core").PgColumn<{
        name: "total_drafts";
        tableName: "agent";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    totalPublished: import("drizzle-orm/pg-core").PgColumn<{
        name: "total_published";
        tableName: "agent";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    uploadedFiles: import("drizzle-orm/pg-core").PgColumn<{
        name: "uploaded_files";
        tableName: "agent";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            fileName: string;
            fileUrl: string;
            uploadedAt: string;
        }[];
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
            fileName: string;
            fileUrl: string;
            uploadedAt: string;
        }[];
    }>;
    createdAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "created_at";
        tableName: "agent";
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
        tableName: "agent";
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
    lastGeneratedAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "last_generated_at";
        tableName: "agent";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
}, undefined>;
export declare const AgentSelectSchema: import("drizzle-zod").BuildSchema<"select", {
    id: import("drizzle-orm/pg-core").PgColumn<{
        name: "id";
        tableName: "agent";
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
    userId: import("drizzle-orm/pg-core").PgColumn<{
        name: "user_id";
        tableName: "agent";
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
    personaConfig: import("drizzle-orm/pg-core").PgColumn<{
        name: "persona_config";
        tableName: "agent";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            metadata: {
                name: string;
                description: string;
            };
            voice?: {
                communication?: "I" | "we" | "you" | undefined;
            } | undefined;
            audience?: {
                base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
            } | undefined;
            formatting?: {
                style?: "structured" | "narrative" | "list_based" | undefined;
                listStyle?: "bullets" | "numbered" | undefined;
            } | undefined;
            language?: {
                primary?: "en" | "pt" | "es" | undefined;
                variant?: string | undefined;
            } | undefined;
            brand?: {
                integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
                blacklistWords?: string[] | undefined;
            } | undefined;
            purpose?: "blog_post" | "linkedin_post" | "twitter_thread" | "instagram_post" | "instagram_story" | "tiktok_script" | "email_newsletter" | "reddit_post" | "youtube_script" | "slide_deck" | "video_script" | "technical_documentation" | undefined;
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
            metadata: {
                name: string;
                description: string;
            };
            voice?: {
                communication?: "I" | "we" | "you" | undefined;
            } | undefined;
            audience?: {
                base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
            } | undefined;
            formatting?: {
                style?: "structured" | "narrative" | "list_based" | undefined;
                listStyle?: "bullets" | "numbered" | undefined;
            } | undefined;
            language?: {
                primary?: "en" | "pt" | "es" | undefined;
                variant?: string | undefined;
            } | undefined;
            brand?: {
                integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
                blacklistWords?: string[] | undefined;
            } | undefined;
            purpose?: "blog_post" | "linkedin_post" | "twitter_thread" | "instagram_post" | "instagram_story" | "tiktok_script" | "email_newsletter" | "reddit_post" | "youtube_script" | "slide_deck" | "video_script" | "technical_documentation" | undefined;
        };
    }>;
    systemPrompt: import("drizzle-orm/pg-core").PgColumn<{
        name: "system_prompt";
        tableName: "agent";
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
    name: import("drizzle-orm/pg-core").PgColumn<{
        name: "name";
        tableName: "agent";
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
    description: import("drizzle-orm/pg-core").PgColumn<{
        name: "description";
        tableName: "agent";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    isActive: import("drizzle-orm/pg-core").PgColumn<{
        name: "is_active";
        tableName: "agent";
        dataType: "boolean";
        columnType: "PgBoolean";
        data: boolean;
        driverParam: boolean;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    totalDrafts: import("drizzle-orm/pg-core").PgColumn<{
        name: "total_drafts";
        tableName: "agent";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    totalPublished: import("drizzle-orm/pg-core").PgColumn<{
        name: "total_published";
        tableName: "agent";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    uploadedFiles: import("drizzle-orm/pg-core").PgColumn<{
        name: "uploaded_files";
        tableName: "agent";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            fileName: string;
            fileUrl: string;
            uploadedAt: string;
        }[];
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
            fileName: string;
            fileUrl: string;
            uploadedAt: string;
        }[];
    }>;
    createdAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "created_at";
        tableName: "agent";
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
        tableName: "agent";
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
    lastGeneratedAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "last_generated_at";
        tableName: "agent";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
}, undefined>;
export declare const AgentUpdateSchema: import("drizzle-zod").BuildSchema<"update", {
    id: import("drizzle-orm/pg-core").PgColumn<{
        name: "id";
        tableName: "agent";
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
    userId: import("drizzle-orm/pg-core").PgColumn<{
        name: "user_id";
        tableName: "agent";
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
    personaConfig: import("drizzle-orm/pg-core").PgColumn<{
        name: "persona_config";
        tableName: "agent";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            metadata: {
                name: string;
                description: string;
            };
            voice?: {
                communication?: "I" | "we" | "you" | undefined;
            } | undefined;
            audience?: {
                base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
            } | undefined;
            formatting?: {
                style?: "structured" | "narrative" | "list_based" | undefined;
                listStyle?: "bullets" | "numbered" | undefined;
            } | undefined;
            language?: {
                primary?: "en" | "pt" | "es" | undefined;
                variant?: string | undefined;
            } | undefined;
            brand?: {
                integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
                blacklistWords?: string[] | undefined;
            } | undefined;
            purpose?: "blog_post" | "linkedin_post" | "twitter_thread" | "instagram_post" | "instagram_story" | "tiktok_script" | "email_newsletter" | "reddit_post" | "youtube_script" | "slide_deck" | "video_script" | "technical_documentation" | undefined;
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
            metadata: {
                name: string;
                description: string;
            };
            voice?: {
                communication?: "I" | "we" | "you" | undefined;
            } | undefined;
            audience?: {
                base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
            } | undefined;
            formatting?: {
                style?: "structured" | "narrative" | "list_based" | undefined;
                listStyle?: "bullets" | "numbered" | undefined;
            } | undefined;
            language?: {
                primary?: "en" | "pt" | "es" | undefined;
                variant?: string | undefined;
            } | undefined;
            brand?: {
                integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
                blacklistWords?: string[] | undefined;
            } | undefined;
            purpose?: "blog_post" | "linkedin_post" | "twitter_thread" | "instagram_post" | "instagram_story" | "tiktok_script" | "email_newsletter" | "reddit_post" | "youtube_script" | "slide_deck" | "video_script" | "technical_documentation" | undefined;
        };
    }>;
    systemPrompt: import("drizzle-orm/pg-core").PgColumn<{
        name: "system_prompt";
        tableName: "agent";
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
    name: import("drizzle-orm/pg-core").PgColumn<{
        name: "name";
        tableName: "agent";
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
    description: import("drizzle-orm/pg-core").PgColumn<{
        name: "description";
        tableName: "agent";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    isActive: import("drizzle-orm/pg-core").PgColumn<{
        name: "is_active";
        tableName: "agent";
        dataType: "boolean";
        columnType: "PgBoolean";
        data: boolean;
        driverParam: boolean;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    totalDrafts: import("drizzle-orm/pg-core").PgColumn<{
        name: "total_drafts";
        tableName: "agent";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    totalPublished: import("drizzle-orm/pg-core").PgColumn<{
        name: "total_published";
        tableName: "agent";
        dataType: "number";
        columnType: "PgInteger";
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
    uploadedFiles: import("drizzle-orm/pg-core").PgColumn<{
        name: "uploaded_files";
        tableName: "agent";
        dataType: "json";
        columnType: "PgJsonb";
        data: {
            fileName: string;
            fileUrl: string;
            uploadedAt: string;
        }[];
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
            fileName: string;
            fileUrl: string;
            uploadedAt: string;
        }[];
    }>;
    createdAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "created_at";
        tableName: "agent";
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
        tableName: "agent";
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
    lastGeneratedAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "last_generated_at";
        tableName: "agent";
        dataType: "date";
        columnType: "PgTimestamp";
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
    }, {}, {}>;
}, undefined>;
//# sourceMappingURL=agent.d.ts.map