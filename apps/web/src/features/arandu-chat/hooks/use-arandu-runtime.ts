import {
	type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
	unstable_useRemoteThreadListRuntime,
} from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { client, orpc } from "@/integrations/orpc/client";

type RemoteThreadInitializeResponse = Awaited<ReturnType<RemoteThreadListAdapter["initialize"]>>;
type RemoteThreadListResponse = Awaited<ReturnType<RemoteThreadListAdapter["list"]>>;

class MastraThreadListAdapter implements RemoteThreadListAdapter {
	constructor(
		private teamId: string,
		private onCreate: (input: { teamId: string }) => Promise<{ id: string }>,
	) {}

	async list(): Promise<RemoteThreadListResponse> {
		try {
			const result = await client.chat.listThreads({ teamId: this.teamId, perPage: 20 });
			return {
				threads: result.threads.map((t) => ({
					status: "regular" as const,
					remoteId: t.id,
					externalId: t.id,
					title: t.title ?? undefined,
				})),
			};
		} catch {
			return { threads: [] };
		}
	}

	async initialize(_threadId: string): Promise<RemoteThreadInitializeResponse> {
		const thread = await this.onCreate({ teamId: this.teamId });
		return { remoteId: thread.id, externalId: thread.id };
	}

	async rename(): Promise<void> {}
	async archive(): Promise<void> {}
	async unarchive(): Promise<void> {}
	async delete(): Promise<void> {}

	async generateTitle(): Promise<ReadableStream> {
		return new ReadableStream();
	}

	async fetch(threadId: string) {
		return { status: "regular" as const, remoteId: threadId, externalId: threadId };
	}
}

export function useAranduRuntime({ teamId }: { teamId: string }) {
	const createThread = useMutation(orpc.chat.createThread.mutationOptions({}));

	const adapter = useMemo(
		() => new MastraThreadListAdapter(teamId, (input) => createThread.mutateAsync(input)),
		[teamId, createThread.mutateAsync],
	);

	const transport = useMemo(
		() => new AssistantChatTransport({ api: "/api/chat", body: { teamId } }),
		[teamId],
	);

	return unstable_useRemoteThreadListRuntime({
		runtimeHook: function RuntimeHook() {
			return useChatRuntime({ transport });
		},
		adapter,
		allowNesting: true,
	});
}
