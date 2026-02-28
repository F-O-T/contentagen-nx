import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";

// Raw Postgres column names from the discussions table
export type DiscussionRow = {
	id: string;
	content_id: string;
	block_id: string;
	user_id: string;
	document_content: string | null;
	is_resolved: boolean;
	is_ai: boolean;
	created_at: string;
	updated_at: string;
};

/**
 * Creates (or reuses) an Electric collection for discussions scoped to a content item.
 *
 * Returns null during SSR — Electric requires an absolute URL and window access.
 */
export function createDiscussionsCollection(contentId: string) {
	if (typeof window === "undefined") return null;
	return createCollection(
		electricCollectionOptions<DiscussionRow>({
			id: `discussions-${contentId}`,
			shapeOptions: {
				url: `${window.location.origin}/api/electric/discussions`,
				params: { contentId },
				onError: (error) => {
					// Suppress unhandled error logs — the hook falls back to oRPC data.
					// This handles stale shape handles (Electric restart) and
					// content-not-found (404) scenarios gracefully.
					console.warn("[Electric] discussions sync error:", error);
				},
			},
			getKey: (item) => item.id,
		}),
	);
}
