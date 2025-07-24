// Updated to import from new database schema
import {
   VoiceConfigSchema,
   AudienceConfigSchema,
   FormatConfigSchema,
   LanguageConfigSchema,
   BrandConfigSchema,
   RepurposeChannelSchema,
} from "@packages/database";

// Helper to extract literal values from TypeBox unions
function extractLiterals(schema: any): string[] {
   if (schema.anyOf) {
      return schema.anyOf.map((v: any) => v.const);
   }
   if (schema.type === "string" && schema.enum) {
      return schema.enum;
   }
   if (schema.oneOf) {
      return schema.oneOf.map((v: any) => v.const);
   }
   return [];
}

// Schema-driven value lists for form fields
export const VOICE_TONES = extractLiterals(
   VoiceConfigSchema.properties.toneMix.items.value.type,
).map((value) => ({
   value,
   label: value.charAt(0).toUpperCase() + value.slice(1),
}));

export const AUDIENCE_BASES = extractLiterals(
   AudienceConfigSchema.properties.base,
).map((value) => ({
   value,
   label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export const AUDIENCE_EXPERTISE = extractLiterals(
   AudienceConfigSchema.properties.expertise.type,
).map((value) => ({
   value,
   label: value.charAt(0).toUpperCase() + value.slice(1),
}));

export const FORMATTING_STYLES = extractLiterals(
   FormatConfigSchema.properties.style,
).map((value) => ({
   value,
   label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export const BRAND_INTEGRATIONS = extractLiterals(
   BrandConfigSchema.properties.integrationStyle,
).map((value) => ({
   value,
   label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export const REPURPOSE_CHANNELS = extractLiterals(RepurposeChannelSchema).map(
   (value) => ({
      value,
      label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
   }),
);

// Communication styles (from VoiceConfigSchema)
export const COMMUNICATION_STYLES = extractLiterals(
   VoiceConfigSchema.properties.communication,
).map((value) => ({
   value,
   label: value.charAt(0).toUpperCase() + value.slice(1),
}));

// All legacy/duplicate constant definitions have been removed. Only schema-driven lists remain.
