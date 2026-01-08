import {
   editDescriptionTool,
   getEditDescriptionInstructions,
} from "./edit-description-tool";
import {
   editKeywordsTool,
   getEditKeywordsInstructions,
} from "./edit-keywords-tool";
import { editSlugTool, getEditSlugInstructions } from "./edit-slug-tool";
import { editTitleTool, getEditTitleInstructions } from "./edit-title-tool";

export {
   editDescriptionTool,
   getEditDescriptionInstructions,
} from "./edit-description-tool";
export {
   editKeywordsTool,
   getEditKeywordsInstructions,
} from "./edit-keywords-tool";
export { editSlugTool, getEditSlugInstructions } from "./edit-slug-tool";
// Re-export tools
export { editTitleTool, getEditTitleInstructions } from "./edit-title-tool";

/**
 * All frontmatter editing tools bundled together
 */
export const frontmatterTools = {
   editTitle: editTitleTool,
   editDescription: editDescriptionTool,
   editSlug: editSlugTool,
   editKeywords: editKeywordsTool,
};

/**
 * Get all frontmatter tool instructions for the agent system prompt
 */
export function getAllFrontmatterToolInstructions(): string {
   return [
      getEditTitleInstructions(),
      getEditDescriptionInstructions(),
      getEditSlugInstructions(),
      getEditKeywordsInstructions(),
   ].join("\n");
}
