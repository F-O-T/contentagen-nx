import {
   getGraphSearchInstructions,
   graphSearchTool,
} from "./graph-search-tool";
import {
   getSearchPreviousContentInstructions,
   searchPreviousContentTool,
} from "./search-previous-content-tool";

export {
   getGraphSearchInstructions,
   graphSearchTool,
} from "./graph-search-tool";
// Re-export for direct access
export {
   getSearchPreviousContentInstructions,
   searchPreviousContentTool,
} from "./search-previous-content-tool";

/**
 * All RAG tools bundled together
 */
export const ragTools = {
   searchPreviousContent: searchPreviousContentTool,
   graphSearch: graphSearchTool,
};

/**
 * Get all RAG tool instructions for the agent system prompt
 */
export function getAllRagToolInstructions(): string {
   return `
# RAG TOOLS
These tools allow you to search and reference previously published content.

${getSearchPreviousContentInstructions()}

${getGraphSearchInstructions()}
`;
}
