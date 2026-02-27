import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";

// Raw Postgres column names from the discussions table
export type DiscussionRow = {
	id: string;
	content_id: string;
	block_id: string | null;
	user_id: string;
	document_content: unknown;
	is_resolved: boolean;
	is_ai: boolean;
	created_at: string;
	updated_at: string;
};

/**
 * Creates (or reuses) an Electric collection for discussions scoped to a content item.
 */
export function createDiscussionsCollection(contentId: string) {
	return createCollection(
		electricCollectionOptions<DiscussionRow>({
			id: `discussions-${contentId}`,
			shapeOptions: {
				url: "/api/electric/discussions",
				params: { contentId },
			},
			getKey: (item) => item.id,
		}),
	);
}
