import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";

// Raw Postgres column names (snake_case) — NOT Drizzle camelCase field names
export type ContentRow = {
	id: string;
	team_id: string;
	organization_id: string;
	writer_id: string | null;
	created_by_member_id: string | null;
	status: "draft" | "published" | "archived";
	meta: Record<string, unknown> | null;
	body: string | null;
	created_at: string;
	updated_at: string;
};

/**
 * Creates (or reuses) an Electric collection for team-scoped content.
 * TanStack DB deduplicates by id — safe to call multiple times with the same teamId.
 */
export function createContentCollection(teamId: string) {
	return createCollection(
		electricCollectionOptions<ContentRow>({
			id: `content-${teamId}`,
			shapeOptions: {
				url: "/api/electric/content",
				params: { teamId },
			},
			getKey: (item) => item.id,
		}),
	);
}
