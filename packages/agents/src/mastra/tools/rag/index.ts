import {
	getSearchPreviousContentInstructions,
	searchPreviousContentTool,
} from "./search-previous-content-tool";

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
};

/**
 * Get all RAG tool instructions for the agent system prompt
 */
export function getAllRagToolInstructions(): string {
	return `
# RAG TOOLS
These tools allow you to search and reference previously published content.

${getSearchPreviousContentInstructions()}
`;
}
