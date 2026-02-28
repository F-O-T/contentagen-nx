import { createTool } from "@mastra/core/tools";
import { createContent } from "@packages/database/repositories/content-repository";
import type { DatabaseInstance } from "@packages/database/client";
import { z } from "zod";

function generateRandomSuffix(): string {
	return Math.random().toString(36).slice(2, 8);
}

function createSlug(title: string): string {
	return title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

export const createContentTool = createTool({
	id: "create-content",
	description:
		"Creates a new content record in the database. Use this when the user asks to create a new article, post, or content piece.",
	inputSchema: z.object({
		title: z.string().min(1).max(200).describe("Title for the new content piece (1-200 characters)"),
		keywords: z
			.array(z.string())
			.optional()
			.default([])
			.describe("Optional list of SEO keywords to associate with the content"),
		status: z
			.enum(["draft", "published"])
			.optional()
			.default("draft")
			.describe("Initial publication status. Defaults to 'draft'."),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		contentId: z.string(),
		title: z.string(),
		message: z.string(),
	}),
	execute: async (inputData, context) => {
		const db = context?.requestContext?.get("db") as DatabaseInstance | undefined;
		const teamId = context?.requestContext?.get("teamId") as string | undefined;
		const organizationId = context?.requestContext?.get("organizationId") as string | undefined;
		const memberId = context?.requestContext?.get("memberId") as string | undefined;

		if (!db || !teamId || !organizationId || !memberId) {
			return {
				success: false,
				contentId: "",
				title: inputData.title,
				message: "Missing required context: db, teamId, organizationId, or memberId not available.",
			};
		}

		const slug = `${createSlug(inputData.title)}-${generateRandomSuffix()}`;

		const result = await createContent(db, {
			meta: {
				title: inputData.title,
				description: "",
				slug,
				keywords: inputData.keywords ?? [],
			},
			status: inputData.status,
			organizationId,
			teamId,
			createdByMemberId: memberId,
		});

		if (!result) {
			return {
				success: false,
				contentId: "",
				title: inputData.title,
				message: "Failed to create content record.",
			};
		}

		return {
			success: true,
			contentId: result.id,
			title: inputData.title,
			message: `Content "${inputData.title}" created successfully as a ${inputData.status ?? "draft"}.`,
		};
	},
});
