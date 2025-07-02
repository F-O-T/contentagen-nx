import type { contentLengthEnum } from "@api/schemas/content-schema";

export const CONTENT_LENGTHS: readonly {
   value: (typeof contentLengthEnum.enumValues)[number];
   label: string;
   description: string;
}[] = [
   {
      value: "short",
      label: "Short",
      description: "Quick and concise content (500-800 words)",
   },
   {
      value: "medium",
      label: "Medium",
      description: "Balanced content with good detail (800-1500 words)",
   },
   {
      value: "long",
      label: "Long",
      description: "Comprehensive and in-depth content (1500+ words)",
   },
];
