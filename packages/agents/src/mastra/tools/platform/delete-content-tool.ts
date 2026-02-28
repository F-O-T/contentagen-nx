import { createTool } from "@mastra/core/tools";
import { deleteContent } from "@packages/database/repositories/content-repository";
import type { DatabaseInstance } from "@packages/database/client";
import { z } from "zod";

export const deleteContentTool = createTool({
	id: "delete-content",
	description:
		"Deletes a content record permanently. Ask for user confirmation before calling this.",
	inputSchema: z.object({
		contentId: z.string().uuid().describe("UUID of the content record to delete permanently"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
	}),
	execute: async (inputData, context) => {
		const db = context?.requestContext?.get("db") as DatabaseInstance | undefined;

		if (!db) {
			return {
				success: false,
				message: "Missing required context: db not available.",
			};
		}

		const teamId = context?.requestContext?.get("teamId") as string | undefined;

		if (!teamId) {
			return {
				success: false,
				message: "Missing team context",
			};
		}

		await deleteContent(db, inputData.contentId);

		return {
			success: true,
			message: `Content ${inputData.contentId} has been permanently deleted.`,
		};
	},
});
