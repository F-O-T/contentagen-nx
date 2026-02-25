import { Thread } from "@packages/ui/components/assistant-ui/thread";
import type { QuickSuggestion, RecentThread } from "@packages/ui/components/assistant-ui/thread";
import { useActiveTeam } from "@/hooks/use-active-team";
import { orpc } from "@/integrations/orpc/client";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
   { label: "Criar artigo", prompt: "Crie um artigo completo sobre " },
   { label: "Analisar SEO", prompt: "Analise o SEO deste conteúdo e sugira melhorias: " },
   { label: "Pesquisar", prompt: "Pesquise sobre " },
   { label: "Otimizar texto", prompt: "Otimize este texto para SEO: " },
   { label: "Estratégia", prompt: "Crie uma estratégia de conteúdo para " },
];

function AranduThread({
   teamId,
   threadId,
   recentThreads,
}: {
   teamId: string;
   threadId: string;
   recentThreads: RecentThread[];
}) {
   const runtime = useChatRuntime({
      transport: new AssistantChatTransport({
         api: "/api/chat",
         body: { teamId, threadId },
      }),
   });

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         <Thread
            welcomeTitle="Como posso te ajudar?"
            welcomeSubtitle="Seu assistente de conteúdo com IA."
            quickSuggestions={QUICK_SUGGESTIONS}
            recentThreads={recentThreads}
         />
      </AssistantRuntimeProvider>
   );
}

export function AranduChatTab() {
   const { activeTeamId } = useActiveTeam();
   const [threadId, setThreadId] = useState<string>(() => crypto.randomUUID());

   const { data: rawThreads = [] } = useQuery(
      orpc.chat.getRecentThreads.queryOptions({
         input: { teamId: activeTeamId ?? "", limit: 5 },
         enabled: !!activeTeamId,
      }),
   );

   const recentThreads: RecentThread[] = rawThreads.map((t) => ({
      id: t.id,
      title: t.title,
      updatedAt: t.updatedAt,
      onClick: () => setThreadId(t.id),
   }));

   if (!activeTeamId) return null;

   return (
      <AranduThread
         key={threadId}
         teamId={activeTeamId}
         threadId={threadId}
         recentThreads={recentThreads}
      />
   );
}
