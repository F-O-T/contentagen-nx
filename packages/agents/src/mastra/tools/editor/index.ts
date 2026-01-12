import {
   addExternalLinksTool,
   getAddExternalLinksInstructions,
} from "./add-external-links-tool";
import {
   addInternalLinksTool,
   getAddInternalLinksInstructions,
} from "./add-internal-links-tool";
import { deleteTextTool, getDeleteTextInstructions } from "./delete-text-tool";
import { formatTextTool, getFormatTextInstructions } from "./format-text-tool";
import {
   generateQuickAnswerTool,
   getGenerateQuickAnswerInstructions,
} from "./generate-quick-answer-tool";
import {
   getImproveReadabilityInstructions,
   improveReadabilityTool,
} from "./improve-readability-tool";
import {
   getInjectKeywordsInstructions,
   injectKeywordsTool,
} from "./inject-keywords-tool";
import {
   getInsertCodeBlockInstructions,
   insertCodeBlockTool,
} from "./insert-code-block-tool";
import {
   getInsertHeadingInstructions,
   insertHeadingTool,
} from "./insert-heading-tool";
import {
   getInsertImageInstructions,
   insertImageTool,
} from "./insert-image-tool";
import { getInsertListInstructions, insertListTool } from "./insert-list-tool";
import {
   getInsertTableInstructions,
   insertTableTool,
} from "./insert-table-tool";
import { getInsertTextInstructions, insertTextTool } from "./insert-text-tool";
import {
   getOptimizeMetaInstructions,
   optimizeMetaTool,
} from "./optimize-meta-tool";
// New SEO action tools
import {
   getOptimizeTitleInstructions,
   optimizeTitleTool,
} from "./optimize-title-tool";
import {
   getReplaceTextInstructions,
   replaceTextTool,
} from "./replace-text-tool";
import {
   getSuggestImagesInstructions,
   suggestImagesTool,
} from "./suggest-images-tool";

export {
   addExternalLinksTool,
   getAddExternalLinksInstructions,
} from "./add-external-links-tool";
export {
   addInternalLinksTool,
   getAddInternalLinksInstructions,
} from "./add-internal-links-tool";
// Re-export tools
export { deleteTextTool, getDeleteTextInstructions } from "./delete-text-tool";
export { formatTextTool, getFormatTextInstructions } from "./format-text-tool";
export {
   generateQuickAnswerTool,
   getGenerateQuickAnswerInstructions,
} from "./generate-quick-answer-tool";
export {
   getImproveReadabilityInstructions,
   improveReadabilityTool,
} from "./improve-readability-tool";
export {
   getInjectKeywordsInstructions,
   injectKeywordsTool,
} from "./inject-keywords-tool";
export {
   getInsertCodeBlockInstructions,
   insertCodeBlockTool,
} from "./insert-code-block-tool";
export {
   getInsertHeadingInstructions,
   insertHeadingTool,
} from "./insert-heading-tool";
export {
   getInsertImageInstructions,
   insertImageTool,
} from "./insert-image-tool";
export {
   getInsertListInstructions,
   insertListTool,
} from "./insert-list-tool";
export {
   getInsertTableInstructions,
   insertTableTool,
} from "./insert-table-tool";
export {
   getInsertTextInstructions,
   insertTextTool,
} from "./insert-text-tool";
export {
   getOptimizeMetaInstructions,
   optimizeMetaTool,
} from "./optimize-meta-tool";
// Re-export new SEO action tools
export {
   getOptimizeTitleInstructions,
   optimizeTitleTool,
} from "./optimize-title-tool";
export {
   getReplaceTextInstructions,
   replaceTextTool,
} from "./replace-text-tool";
export {
   getSuggestImagesInstructions,
   suggestImagesTool,
} from "./suggest-images-tool";

// Combined instructions for all editor tools
export function getAllEditorToolInstructions(): string {
   return `
# EDITOR TOOLS
These tools allow you to manipulate the blog post content directly.

${getInsertTextInstructions()}
${getReplaceTextInstructions()}
${getDeleteTextInstructions()}
${getFormatTextInstructions()}
${getInsertHeadingInstructions()}
${getInsertListInstructions()}
${getInsertCodeBlockInstructions()}
${getInsertTableInstructions()}
${getInsertImageInstructions()}

# SEO OPTIMIZATION TOOLS
These tools help optimize content for search engines.

${getInjectKeywordsInstructions()}
${getAddInternalLinksInstructions()}
${getImproveReadabilityInstructions()}

# NEW SEO ACTION TOOLS
These tools fix specific SEO issues detected by analysis tools.

${getOptimizeTitleInstructions()}
${getOptimizeMetaInstructions()}
${getGenerateQuickAnswerInstructions()}
${getSuggestImagesInstructions()}
${getAddExternalLinksInstructions()}
`;
}

// All editor tools as an object for agent registration
export const editorTools = {
   // Basic editing tools
   insertText: insertTextTool,
   replaceText: replaceTextTool,
   deleteText: deleteTextTool,
   formatText: formatTextTool,
   insertHeading: insertHeadingTool,
   insertList: insertListTool,
   insertCodeBlock: insertCodeBlockTool,
   insertTable: insertTableTool,
   insertImage: insertImageTool,
   // Existing SEO tools
   injectKeywords: injectKeywordsTool,
   addInternalLinks: addInternalLinksTool,
   improveReadability: improveReadabilityTool,
   // New SEO action tools
   optimizeTitle: optimizeTitleTool,
   optimizeMeta: optimizeMetaTool,
   generateQuickAnswer: generateQuickAnswerTool,
   suggestImages: suggestImagesTool,
   addExternalLinks: addExternalLinksTool,
};
