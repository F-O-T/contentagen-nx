import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const readContentBodyTool = createTool({
	id: "read-content-body",
	description:
		"Reads the current content body from the editor. Returns the full text in markdown format along with a word count. Use this tool before analyzing, reviewing, or editing existing content.",
	inputSchema: z.object({}),
	outputSchema: z.object({
		markdown: z.string().describe("The current content body in markdown format"),
		wordCount: z.number().describe("Approximate word count"),
	}),
	// biome-ignore lint/suspicious/noExplicitAny: requestContext type varies across Mastra versions
	execute: async (_input, { requestContext }: any) => {
		const getContentBody = requestContext?.get("getContentBody") as
			| (() => Promise<{ markdown: string; wordCount: number } | null>)
			| undefined;

		if (!getContentBody) {
			return { markdown: "", wordCount: 0 };
		}

		const result = await getContentBody();
		if (!result) {
			return { markdown: "", wordCount: 0 };
		}

		return result;
	},
});
