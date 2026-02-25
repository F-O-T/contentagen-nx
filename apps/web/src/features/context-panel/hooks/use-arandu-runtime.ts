import {
   type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
   unstable_useRemoteThreadListRuntime,
} from "@assistant-ui/react";
import {
   AssistantChatTransport,
   useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useMemo } from "react";
import { client } from "@/integrations/orpc/client";

type RemoteThreadInitializeResponse = Awaited<
   ReturnType<RemoteThreadListAdapter["initialize"]>
>;
type RemoteThreadListResponse = Awaited<
   ReturnType<RemoteThreadListAdapter["list"]>
>;

/**
 * A RemoteThreadListAdapter backed by Mastra memory threads via oRPC.
 *
 * - `list()` fetches recent threads for the current team/user from the server.
 * - `initialize(threadId)` passes the local UUID through as-is so Mastra
 *   receives the same threadId it uses for persistence.
 * - Other operations (rename, archive, delete) are no-ops — Mastra handles
 *   title generation server-side automatically.
 */
class MastraThreadListAdapter implements RemoteThreadListAdapter {
   private teamId: string;

   constructor(teamId: string) {
      this.teamId = teamId;
   }

   async list(): Promise<RemoteThreadListResponse> {
      try {
         const threads = await client.chat.getRecentThreads({
            teamId: this.teamId,
            limit: 20,
         });
         return {
            threads: threads.map((t) => ({
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

   async initialize(threadId: string): Promise<RemoteThreadInitializeResponse> {
      return { remoteId: threadId, externalId: threadId };
   }

   async rename(): Promise<void> {}
   async archive(): Promise<void> {}
   async unarchive(): Promise<void> {}
   async delete(): Promise<void> {}

   async generateTitle(): Promise<ReadableStream> {
      return new ReadableStream();
   }

   async fetch(threadId: string) {
      return {
         status: "regular" as const,
         remoteId: threadId,
         externalId: threadId,
      };
   }
}

/**
 * Creates an AssistantRuntime backed by Mastra thread persistence.
 *
 * Usage:
 * ```tsx
 * const runtime = useAranduRuntime({ teamId });
 * return (
 *   <AssistantRuntimeProvider runtime={runtime}>
 *     ...
 *   </AssistantRuntimeProvider>
 * );
 * ```
 */
export function useAranduRuntime({ teamId }: { teamId: string }) {
   const adapter = useMemo(() => new MastraThreadListAdapter(teamId), [teamId]);

   const transport = useMemo(
      () =>
         new AssistantChatTransport({
            api: "/api/chat",
            body: { teamId },
         }),
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
