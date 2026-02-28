import {
   type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
   unstable_useRemoteThreadListRuntime,
} from "@assistant-ui/react";
import {
   AssistantChatTransport,
   useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";
import { client, orpc } from "@/integrations/orpc/client";
import { chatContextStore } from "@/features/teco-chat/stores/chat-context-store";

type RemoteThreadInitializeResponse = Awaited<
   ReturnType<RemoteThreadListAdapter["initialize"]>
>;
type RemoteThreadListResponse = Awaited<
   ReturnType<RemoteThreadListAdapter["list"]>
>;

interface UseTecoRuntimeOptions {
   teamId: string;
   onThreadCreated?: (threadId: string) => void;
}

export function useTecoRuntime({
   teamId,
   onThreadCreated,
}: UseTecoRuntimeOptions) {
   const createThread = useMutation(orpc.chat.createThread.mutationOptions({}));
   const teamIdRef = useRef(teamId);
   teamIdRef.current = teamId;
   const activeThreadIdRef = useRef<string | undefined>(undefined);
   const pendingThreadRef = useRef<Promise<string> | undefined>(undefined);
   const onThreadCreatedRef = useRef(onThreadCreated);
   onThreadCreatedRef.current = onThreadCreated;
   const createThreadRef = useRef(createThread.mutateAsync);
   createThreadRef.current = createThread.mutateAsync;

   const ensureThread = useCallback(async (): Promise<string> => {
      if (activeThreadIdRef.current) return activeThreadIdRef.current;
      pendingThreadRef.current ??= createThreadRef
         .current({ teamId: teamIdRef.current })
         .then((thread) => {
            activeThreadIdRef.current = thread.id;
            onThreadCreatedRef.current?.(thread.id);
            return thread.id;
         })
         .finally(() => {
            pendingThreadRef.current = undefined;
         });
      return pendingThreadRef.current;
   }, []);

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
            const id = await ensureThread();
            return { remoteId: id, externalId: id };
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
      [teamId, ensureThread],
   );

   const transport = useMemo(
      () =>
         new AssistantChatTransport({
            api: "/api/chat",
            body: async () => {
               const threadId = await ensureThread();
               const { contextId, mode, workflow, model, thinkingBudget } = chatContextStore.state;
               return {
                  teamId,
                  threadId,
                  model,
                  mode,
                  ...(thinkingBudget > 0 ? { thinkingBudget } : {}),
                  ...(contextId ? { contextId } : {}),
                  ...(workflow ? { workflow } : {}),
               };
            },
         }),
      [teamId, ensureThread],
   );

   return unstable_useRemoteThreadListRuntime({
      runtimeHook: function RuntimeHook() {
         return useChatRuntime({ transport });
      },
      adapter,
      allowNesting: true,
   });
}
