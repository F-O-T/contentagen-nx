import { z } from "zod";
export declare const VoiceConfigSchema: z.ZodObject<{
    communication: z.ZodEnum<["I", "we", "you"]>;
}, "strip", z.ZodTypeAny, {
    communication: "I" | "we" | "you";
}, {
    communication: "I" | "we" | "you";
}>;
export declare const AudienceConfigSchema: z.ZodObject<{
    base: z.ZodEnum<["general_public", "professionals", "beginners", "customers"]>;
}, "strip", z.ZodTypeAny, {
    base: "general_public" | "professionals" | "beginners" | "customers";
}, {
    base: "general_public" | "professionals" | "beginners" | "customers";
}>;
export declare const FormatConfigSchema: z.ZodObject<{
    style: z.ZodEnum<["structured", "narrative", "list_based"]>;
    listStyle: z.ZodOptional<z.ZodEnum<["bullets", "numbered"]>>;
}, "strip", z.ZodTypeAny, {
    style: "structured" | "narrative" | "list_based";
    listStyle?: "bullets" | "numbered" | undefined;
}, {
    style: "structured" | "narrative" | "list_based";
    listStyle?: "bullets" | "numbered" | undefined;
}>;
export declare const LanguageConfigSchema: z.ZodObject<{
    primary: z.ZodEnum<["en", "pt", "es"]>;
    variant: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    primary: "en" | "pt" | "es";
    variant?: string | undefined;
}, {
    primary: "en" | "pt" | "es";
    variant?: string | undefined;
}>;
export declare const BrandConfigSchema: z.ZodObject<{
    integrationStyle: z.ZodEnum<["strict_guideline", "flexible_guideline", "reference_only", "creative_blend"]>;
    blacklistWords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    integrationStyle: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend";
    blacklistWords?: string[] | undefined;
}, {
    integrationStyle: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend";
    blacklistWords?: string[] | undefined;
}>;
export declare const PurposeChannelSchema: z.ZodEnum<["blog_post", "linkedin_post", "twitter_thread", "instagram_post", "instagram_story", "tiktok_script", "email_newsletter", "reddit_post", "youtube_script", "slide_deck", "video_script", "technical_documentation"]>;
export declare const PersonaConfigSchema: z.ZodObject<{
    metadata: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
    }, {
        name: string;
        description: string;
    }>;
    voice: z.ZodOptional<z.ZodObject<{
        communication: z.ZodOptional<z.ZodEnum<["I", "we", "you"]>>;
    }, "strip", z.ZodTypeAny, {
        communication?: "I" | "we" | "you" | undefined;
    }, {
        communication?: "I" | "we" | "you" | undefined;
    }>>;
    audience: z.ZodOptional<z.ZodObject<{
        base: z.ZodOptional<z.ZodEnum<["general_public", "professionals", "beginners", "customers"]>>;
    }, "strip", z.ZodTypeAny, {
        base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
    }, {
        base?: "general_public" | "professionals" | "beginners" | "customers" | undefined;
    }>>;
    formatting: z.ZodOptional<z.ZodObject<{
        style: z.ZodOptional<z.ZodEnum<["structured", "narrative", "list_based"]>>;
        listStyle: z.ZodOptional<z.ZodOptional<z.ZodEnum<["bullets", "numbered"]>>>;
    }, "strip", z.ZodTypeAny, {
        style?: "structured" | "narrative" | "list_based" | undefined;
        listStyle?: "bullets" | "numbered" | undefined;
    }, {
        style?: "structured" | "narrative" | "list_based" | undefined;
        listStyle?: "bullets" | "numbered" | undefined;
    }>>;
    language: z.ZodOptional<z.ZodObject<{
        primary: z.ZodOptional<z.ZodEnum<["en", "pt", "es"]>>;
        variant: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        primary?: "en" | "pt" | "es" | undefined;
        variant?: string | undefined;
    }, {
        primary?: "en" | "pt" | "es" | undefined;
        variant?: string | undefined;
    }>>;
    brand: z.ZodOptional<z.ZodObject<{
        integrationStyle: z.ZodOptional<z.ZodEnum<["strict_guideline", "flexible_guideline", "reference_only", "creative_blend"]>>;
        blacklistWords: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
        blacklistWords?: string[] | undefined;
    }, {
        integrationStyle?: "strict_guideline" | "flexible_guideline" | "reference_only" | "creative_blend" | undefined;
        blacklistWords?: string[] | undefined;
    }>>;
    purpose: z.ZodOptional<z.ZodEnum<["blog_post", "linkedin_post", "twitter_thread", "instagram_post", "instagram_story", "tiktok_script", "email_newsletter", "reddit_post", "youtube_script", "slide_deck", "video_script", "technical_documentation"]>>;
}, "strip", z.ZodTypeAny, {
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
}, {
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
}>;
export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;
export type AudienceConfig = z.infer<typeof AudienceConfigSchema>;
export type FormatConfig = z.infer<typeof FormatConfigSchema>;
export type LanguageConfig = z.infer<typeof LanguageConfigSchema>;
export type BrandConfig = z.infer<typeof BrandConfigSchema>;
export type PurposeChannel = z.infer<typeof PurposeChannelSchema>;
export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;
//# sourceMappingURL=agent-types.d.ts.map