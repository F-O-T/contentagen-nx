import { createTool } from "@mastra/core/tools";
import { createDashboard } from "@packages/database/repositories/dashboard-repository";
import type { DatabaseInstance } from "@packages/database/client";
import { z } from "zod";

export const createDashboardTool = createTool({
	id: "create-dashboard",
	description: "Creates a new analytics dashboard.",
	inputSchema: z.object({
		name: z.string().min(1).max(100).describe("Name for the new dashboard (1-100 characters)"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		dashboardId: z.string(),
		name: z.string(),
		message: z.string(),
	}),
	execute: async (inputData, context) => {
		const db = context?.requestContext?.get("db") as DatabaseInstance | undefined;
		const teamId = context?.requestContext?.get("teamId") as string | undefined;
		const organizationId = context?.requestContext?.get("organizationId") as string | undefined;
		const userId = context?.requestContext?.get("userId") as string | undefined;

		if (!db || !teamId || !organizationId || !userId) {
			return {
				success: false,
				dashboardId: "",
				name: inputData.name,
				message: "Missing required context: db, teamId, organizationId, or userId not available.",
			};
		}

		const result = await createDashboard(db, {
			name: inputData.name,
			organizationId,
			teamId,
			createdBy: userId,
		});

		if (!result) {
			return {
				success: false,
				dashboardId: "",
				name: inputData.name,
				message: "Failed to create dashboard record.",
			};
		}

		return {
			success: true,
			dashboardId: result.id,
			name: inputData.name,
			message: `Dashboard "${inputData.name}" created successfully.`,
		};
	},
});
