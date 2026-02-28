import { and, eq } from "drizzle-orm";
import { content as contentTable } from "@packages/database/schemas/content";
import { team } from "@packages/database/schemas/auth";
import { env } from "@packages/environment/server";
import { createFileRoute } from "@tanstack/react-router";
import { auth, db } from "@/integrations/orpc/server-instances";

const ALLOWED_TABLES = new Set(["content", "discussions"]);

async function handle({
	request,
	params,
}: {
	request: Request;
	params: { _splat: string };
}) {
	// Extract table name from URL path (e.g., /api/electric/content → "content")
	const table = (params._splat ?? "").split("/")[0];
	if (!ALLOWED_TABLES.has(table)) {
		return new Response("Not Found", { status: 404 });
	}

	// Validate authenticated session with active organization
	let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
	try {
		session = await auth.api.getSession({ headers: request.headers });
	} catch {
		session = null;
	}

	if (!session?.session.activeOrganizationId) {
		return new Response("Unauthorized", { status: 401 });
	}

	const url = new URL(request.url);

	// Forward Electric protocol params (cursor, live, offset, shape_handle, columns)
	// but strip our custom scoping params (teamId, contentId)
	const electricParams = new URLSearchParams();
	for (const [key, value] of url.searchParams) {
		if (key !== "teamId" && key !== "contentId") {
			electricParams.set(key, value);
		}
	}
	electricParams.set("table", table);

	if (table === "content") {
		const teamId = url.searchParams.get("teamId");
		if (!teamId) {
			return new Response("teamId query param required", { status: 400 });
		}

		// Verify the teamId belongs to the user's active organization
		const [teamRecord] = await db
			.select({ id: team.id })
			.from(team)
			.where(
				and(
					eq(team.id, teamId),
					eq(team.organizationId, session.session.activeOrganizationId),
				),
			)
			.limit(1);

		if (!teamRecord) {
			return new Response("Forbidden: team not in your organization", {
				status: 403,
			});
		}

		// Server-injected where clause — client cannot override this
		electricParams.set("where", `"team_id" = $1`);
		electricParams.set("params", JSON.stringify([teamId]));
	} else if (table === "discussions") {
		const contentId = url.searchParams.get("contentId");
		if (!contentId) {
			return new Response("contentId query param required", { status: 400 });
		}

		// Verify the content belongs to the user's active organization
		const [contentRecord] = await db
			.select({ organizationId: contentTable.organizationId })
			.from(contentTable)
			.where(eq(contentTable.id, contentId))
			.limit(1);

		if (!contentRecord) {
			return new Response("Not Found", { status: 404 });
		}
		if (contentRecord.organizationId !== session.session.activeOrganizationId) {
			return new Response("Forbidden: content not in your organization", {
				status: 403,
			});
		}

		electricParams.set("where", `"content_id" = $1`);
		electricParams.set("params", JSON.stringify([contentId]));
	}

	// Proxy the request to Electric Sync Engine
	// Pass through the streaming body (SSE / chunked transfer for live mode)
	const electricUrl = `${env.ELECTRIC_URL}/v1/shape?${electricParams}`;

	const fetchHeaders: HeadersInit = {};
	if (env.ELECTRIC_SECRET) {
		fetchHeaders.Authorization = `Bearer ${env.ELECTRIC_SECRET}`;
	}

	let electricResponse: Response;
	try {
		electricResponse = await fetch(electricUrl, {
			cache: "no-store",
			headers: fetchHeaders,
		});
	} catch {
		return new Response("Electric Sync Engine unavailable", { status: 503 });
	}

	return new Response(electricResponse.body, {
		status: electricResponse.status,
		headers: electricResponse.headers,
	});
}

export const Route = createFileRoute("/api/electric/$")({
	server: {
		handlers: {
			GET: handle,
			DELETE: handle, // Electric protocol uses DELETE to clean up shape subscriptions
		},
	},
});
