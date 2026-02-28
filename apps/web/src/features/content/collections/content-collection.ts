import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";

// Raw Postgres column names (snake_case) — NOT Drizzle camelCase field names
export type ContentRow = {
	id: string;
	team_id: string;
	organization_id: string;
	writer_id: string | null;
	created_by_member_id: string;
	status: "draft" | "published" | "archived";
	share_status: "private" | "shared";
	draft_origin: "manual" | "ai_generated";
	meta: Record<string, unknown>;
	body: string | null;
	created_at: string;
	updated_at: string;
};

/**
 * Creates (or reuses) an Electric collection for team-scoped content.
 * TanStack DB deduplicates by id — safe to call multiple times with the same teamId.
 *
 * Returns null during SSR — Electric requires an absolute URL and window access.
 */
export function createContentCollection(teamId: string) {
	if (typeof window === "undefined") return null;
	return createCollection(
		electricCollectionOptions<ContentRow>({
			id: `content-${teamId}`,
			shapeOptions: {
				url: `${window.location.origin}/api/electric/content`,
				params: { teamId },
			},
			getKey: (item) => item.id,
		}),
	);
}
