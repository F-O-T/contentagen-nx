import { createTool } from "@mastra/core/tools";
import { createForm } from "@packages/database/repositories/form-repository";
import type { DatabaseInstance } from "@packages/database/client";
import { z } from "zod";

export const createFormTool = createTool({
	id: "create-form",
	description: "Creates a new form.",
	inputSchema: z.object({
		name: z.string().min(1).max(100).describe("Name for the new form (1-100 characters)"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		formId: z.string(),
		name: z.string(),
		message: z.string(),
	}),
	execute: async (inputData, context) => {
		const db = context?.requestContext?.get("db") as DatabaseInstance | undefined;
		const teamId = context?.requestContext?.get("teamId") as string | undefined;
		const organizationId = context?.requestContext?.get("organizationId") as string | undefined;

		if (!db || !teamId || !organizationId) {
			return {
				success: false,
				formId: "",
				name: inputData.name,
				message: "Missing required context: db, teamId, or organizationId not available.",
			};
		}

		const result = await createForm(db, {
			name: inputData.name,
			organizationId,
			teamId,
			// fields is notNull in schema — start with an empty array (form builder fills it later)
			fields: [],
		});

		if (!result) {
			return {
				success: false,
				formId: "",
				name: inputData.name,
				message: "Failed to create form record.",
			};
		}

		return {
			success: true,
			formId: result.id,
			name: inputData.name,
			message: `Form "${inputData.name}" created successfully.`,
		};
	},
});
