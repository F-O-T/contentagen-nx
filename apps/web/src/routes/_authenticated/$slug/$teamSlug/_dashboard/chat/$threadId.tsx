import {
   AssistantRuntimeProvider,
   useAssistantRuntime,
} from "@assistant-ui/react";
import {
   AssistantChatTransport,
   useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { useEffect, useMemo } from "react";
import { chatContextStore } from "@/features/teco-chat/stores/chat-context-store";
import { Thread } from "@/features/teco-chat/ui/thread";
import { useActiveTeam } from "@/hooks/use-active-team";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/chat/$threadId",
)({
   component: ChatThreadPage,
});

const QUICK_SUGGESTIONS = [
   { label: "Criar artigo", prompt: "Crie um artigo completo sobre " },
   {
      label: "Analisar SEO",
      prompt: "Analise o SEO deste conteúdo e sugira melhorias: ",
   },
   { label: "Pesquisar", prompt: "Pesquise sobre " },
   { label: "Otimizar texto", prompt: "Otimize este texto para SEO: " },
   { label: "Estratégia", prompt: "Crie uma estratégia de conteúdo para " },
];

function ChatThreadPage() {
   const { threadId } = Route.useParams();
   const { activeTeamId } = useActiveTeam();

   // Sync the outer runtime's active thread state with the current URL param.
   // This makes the sidebar thread list highlight the active thread correctly,
   // and also adds newly-created threads (from chat/index.tsx) to the list.
   const outerRuntime = useAssistantRuntime();
   useEffect(() => {
      outerRuntime.threads.switchToThread(threadId);
   }, [outerRuntime, threadId]);

   const { data: messages } = useSuspenseQuery(
      orpc.chat.getThreadMessages.queryOptions({ input: { threadId } }),
   );

   const transport = useMemo(
      () =>
         new AssistantChatTransport({
            api: "/api/chat",
            body: () => {
               const { mode } = chatContextStore.state;
               return {
                  teamId: activeTeamId,
                  threadId,
                  mode,
               };
            },
         }),
      [activeTeamId, threadId],
   );

   const runtime = useChatRuntime({
      transport,
      messages: messages as UIMessage[],
   });

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         <Thread
            quickSuggestions={QUICK_SUGGESTIONS}
            welcomeIconUrl="/mascot.svg"
            welcomeSubtitle="Seu assistente de conteúdo com IA."
            welcomeTitle="Como posso te ajudar?"
         />
      </AssistantRuntimeProvider>
   );
}
