import {
   contentTypeEnum,
   voiceToneEnum,
   targetAudienceEnum,
   formattingStyleEnum,
} from "@api/schemas/agent-schema";
import type {
   brandIntegrationEnum,
   communicationStyleEnum,
} from "@api/schemas/agent-schema";

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

export const BRAND_INTEGRATIONS: readonly {
   value: (typeof brandIntegrationEnum.enumValues)[number];
   label: string;
   description: string;
}[] = [
   {
      value: "strict_guideline",
      label: "Strict Guideline",
      description:
         "Content must strictly follow brand guidelines. No deviations allowed.",
   },
   {
      value: "flexible_guideline",
      label: "Flexible Guideline",
      description:
         "Content should generally follow brand guidelines, but some flexibility is allowed.",
   },
   {
      value: "reference_only",
      label: "Reference Only",
      description:
         "Brand guidelines are for reference only; content can be more creative.",
   },
   {
      value: "creative_blend",
      label: "Creative Blend",
      description: "Blend brand guidelines creatively for unique content.",
   },
];

export const COMMUNICATION_STYLES: readonly {
   value: (typeof communicationStyleEnum.enumValues)[number];
   label: string;
   description: string;
}[] = [
   {
      value: "first_person",
      label: "First Person",
      description: "The AI communicates as a singular person (I/me/my).",
   },
   {
      value: "third_person",
      label: "Third Person",
      description: "The AI communicates in third person (he/she/they/it).",
   },
];
