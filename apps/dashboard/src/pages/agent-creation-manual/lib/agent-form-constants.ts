import {
   contentTypeEnum,
   voiceToneEnum,
   targetAudienceEnum,
   formattingStyleEnum,
} from "@api/schemas/content-schema";

/**
 * Converts a snake_case or underscore string to Title Case.
 */
function toLabel(value: string): string {
   return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const CONTENT_TYPES: readonly {
   value: (typeof contentTypeEnum.enumValues)[number];
   label: string;
}[] = contentTypeEnum.enumValues.map((value) => ({
   value,
   label: toLabel(value),
}));

export const VOICE_TONES: readonly {
   value: (typeof voiceToneEnum.enumValues)[number];
   label: string;
}[] = voiceToneEnum.enumValues.map((value) => ({
   value,
   label: toLabel(value),
}));

export const TARGET_AUDIENCES: readonly {
   value: (typeof targetAudienceEnum.enumValues)[number];
   label: string;
}[] = targetAudienceEnum.enumValues.map((value) => ({
   value,
   label: toLabel(value),
}));

export const FORMATTING_STYLES: readonly {
   value: (typeof formattingStyleEnum.enumValues)[number];
   label: string;
}[] = formattingStyleEnum.enumValues.map((value) => ({
   value,
   label: toLabel(value),
}));
