import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@packages/ui/components/assistant-ui/thread";
import { ThreadList } from "@packages/ui/components/assistant-ui/thread-list";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { closeContextPanel } from "@/features/context-panel/use-context-panel";
import { useAranduRuntime } from "@/features/context-panel/hooks/use-arandu-runtime";
import { useActiveTeam } from "@/hooks/use-active-team";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/chat",
)({
   component: ChatPage,
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

function ChatPageContent({ teamId }: { teamId: string }) {
   const runtime = useAranduRuntime({ teamId });

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         <div className="flex h-full w-full overflow-hidden">
            {/* Thread list sidebar */}
            <div className="hidden w-56 shrink-0 border-r border-border/60 bg-accent  md:flex md:flex-col">
               <ThreadList welcomeIconUrl="/arandu.svg" />
            </div>

            {/* Chat area */}
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
               <Thread
                  quickSuggestions={QUICK_SUGGESTIONS}
                  welcomeIconUrl="/arandu.svg"
                  welcomeSubtitle="Seu assistente de conteúdo com IA."
                  welcomeTitle="Como posso te ajudar?"
               />
            </div>
         </div>
      </AssistantRuntimeProvider>
   );
}

function ChatPage() {
   const { activeTeamId } = useActiveTeam();

   useEffect(() => {
      closeContextPanel();
   }, []);

   if (!activeTeamId) return null;

   return <ChatPageContent teamId={activeTeamId} />;
}
