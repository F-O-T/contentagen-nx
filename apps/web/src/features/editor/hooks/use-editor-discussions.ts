import { useMutation, useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import { orpc } from "@/integrations/orpc/client";
import {
	createDiscussionsCollection,
	type DiscussionRow,
} from "../collections/discussions-collection";

export function useEditorDiscussions(contentId: string | undefined) {
	// Electric collection for live discussion rows (scoped to this content).
	// Null when contentId is undefined (Electric is disabled).
	const collection = useMemo(
		() => (contentId ? createDiscussionsCollection(contentId) : null),
		[contentId],
	);

	// Live query — updates instantly when collaborators create/resolve discussions.
	// Returns undefined data when the query function returns null/undefined (disabled).
	const { data: liveRows, isReady } = useLiveQuery(
		(q) => (collection ? q.from({ discussions: collection }) : null),
		[collection],
	);

	// oRPC query — kept ONLY for user data (userId → user info map) and as
	// the initial fallback before Electric has synced its first batch of rows.
	// staleTime: Infinity because user data does not change within a session.
	const { data } = useQuery({
		...orpc.discussions.getByContent.queryOptions({
			input: { contentId: contentId as string },
			staleTime: Number.POSITIVE_INFINITY,
		}),
		enabled: !!contentId,
	});

	// Mutations — all through oRPC for credit enforcement + event emission.
	const createMutation = useMutation(orpc.discussions.create.mutationOptions());
	const addReplyMutation = useMutation(
		orpc.discussions.addReply.mutationOptions(),
	);
	const resolveMutation = useMutation(
		orpc.discussions.resolve.mutationOptions(),
	);
	const removeMutation = useMutation(orpc.discussions.remove.mutationOptions());
	const updateReplyMutation = useMutation(
		orpc.discussions.updateReply.mutationOptions(),
	);
	const removeReplyMutation = useMutation(
		orpc.discussions.removeReply.mutationOptions(),
	);

	// Hybrid source selection:
	// - Once Electric has synced at least one row, prefer liveRows (real-time).
	// - Fall back to oRPC data during initial Electric sync (liveRows is undefined
	//   or empty before the first Electric snapshot arrives).
	//
	// NOTE: The return type is intentionally broad (unknown[]) because the two
	// sources have different shapes:
	//   - oRPC: camelCase fields + nested `comments` array (matches TDiscussion)
	//   - Electric: snake_case flat DiscussionRow (no nested replies)
	// The consumer (plate-editor.tsx) already casts `discussions as TDiscussion[]`
	// so it handles both shapes at the cast boundary.
	// biome-ignore lint/suspicious/noExplicitAny: hybrid Electric/oRPC shape union — consumer casts to TDiscussion[]
	const discussions: any[] = isReady
		? (liveRows as DiscussionRow[])
		: (data?.discussions ?? []);

	return {
		discussions,
		users: data?.users ?? {}, // still from oRPC — user table is not in Electric shape
		mutations: {
			create: createMutation,
			addReply: addReplyMutation,
			resolve: resolveMutation,
			remove: removeMutation,
			updateReply: updateReplyMutation,
			removeReply: removeReplyMutation,
		},
	};
}
