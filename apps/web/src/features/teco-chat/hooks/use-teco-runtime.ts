import {
   type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
   unstable_useRemoteThreadListRuntime,
} from "@assistant-ui/react";
import {
   AssistantChatTransport,
   useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { client, orpc } from "@/integrations/orpc/client";

type RemoteThreadInitializeResponse = Awaited<
   ReturnType<RemoteThreadListAdapter["initialize"]>
>;
type RemoteThreadListResponse = Awaited<
   ReturnType<RemoteThreadListAdapter["list"]>
>;

export function useTecoRuntime({
   teamId,
   onThreadCreated,
}: {
   teamId: string;
   onThreadCreated?: (threadId: string) => void;
}) {
   const createThread = useMutation(orpc.chat.createThread.mutationOptions({}));
   const activeThreadIdRef = useRef<string | undefined>(undefined);
   const onThreadCreatedRef = useRef(onThreadCreated);
   onThreadCreatedRef.current = onThreadCreated;

   const adapter = useMemo(
      (): RemoteThreadListAdapter => ({
         list: async (): Promise<RemoteThreadListResponse> => {
            try {
               const result = await client.chat.listThreads({
                  teamId,
                  perPage: 20,
               });
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
         },
         // _threadId is the local client-generated ID — not used because the remote ID comes from the server after creation.
         initialize: async (
            _threadId: string,
         ): Promise<RemoteThreadInitializeResponse> => {
            const thread = await createThread.mutateAsync({ teamId });
            activeThreadIdRef.current = thread.id;
            onThreadCreatedRef.current?.(thread.id);
            return { remoteId: thread.id, externalId: thread.id };
         },
         fetch: async (threadId: string) => {
            activeThreadIdRef.current = threadId;
            return {
               status: "regular" as const,
               remoteId: threadId,
               externalId: threadId,
            };
         },
         rename: async () => {},
         archive: async () => {},
         unarchive: async () => {},
         delete: async (threadId: string) => {
            await client.chat.deleteThread({ threadId });
         },
         generateTitle: async () => new ReadableStream(),
      }),
      [teamId, createThread.mutateAsync],
   );

   const transport = useMemo(
      () =>
         new AssistantChatTransport({
            api: "/api/chat",
            body: () => ({ teamId, threadId: activeThreadIdRef.current }),
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
