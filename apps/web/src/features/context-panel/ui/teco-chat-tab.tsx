import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTecoRuntime } from "@/features/teco-chat/hooks/use-teco-runtime";
import type { QuickSuggestion } from "@/features/teco-chat/ui/thread";
import { formatTimeAgo, Thread } from "@/features/teco-chat/ui/thread";
import { useActiveTeam } from "@/hooks/use-active-team";
import { orpc } from "@/integrations/orpc/client";

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
   { label: "Criar artigo", prompt: "Crie um artigo completo sobre " },
   {
      label: "Analisar SEO",
      prompt: "Analise o SEO deste conteúdo e sugira melhorias: ",
   },
   { label: "Pesquisar", prompt: "Pesquise sobre " },
   { label: "Otimizar texto", prompt: "Otimize este texto para SEO: " },
   { label: "Estratégia", prompt: "Crie uma estratégia de conteúdo para " },
];

function RecentThreadsList({ teamId }: { teamId: string }) {
   const { data } = useSuspenseQuery(
      orpc.chat.listThreads.queryOptions({
         input: { teamId, page: 0, perPage: 5 },
      }),
   );
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   return (
      <>
         {data.threads.map((t) => (
            <Link
               className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60"
               key={t.id}
               params={{ slug, teamSlug, threadId: t.id }}
               to="/$slug/$teamSlug/chat/$threadId"
            >
               <span className="flex-1 truncate text-sm text-foreground/80">
                  {t.title}
               </span>
               <span className="shrink-0 text-xs text-muted-foreground/60">
                  {formatTimeAgo(t.updatedAt)}
               </span>
            </Link>
         ))}
      </>
   );
}

function TecoChatTabInner({ teamId }: { teamId: string }) {
   return (
      <div className="h-full [&_.aui-user-message-content]:bg-background [&_.aui-user-message-content]:text-foreground">
         <Thread
            quickSuggestions={QUICK_SUGGESTIONS}
            recentThreadsSlot={
               <Suspense fallback={null}>
                  <RecentThreadsList teamId={teamId} />
               </Suspense>
            }
            welcomeIconUrl="/mascot.svg"
            welcomeSubtitle="Seu assistente de conteúdo com IA."
            welcomeTitle="Como posso te ajudar?"
         />
      </div>
   );
}

export function TecoChatTab() {
   const { activeTeamId } = useActiveTeam();
   const runtime = useTecoRuntime({ teamId: activeTeamId ?? "" });

   if (!activeTeamId) return null;

   return (
      <AssistantRuntimeProvider runtime={runtime}>
         <TecoChatTabInner teamId={activeTeamId} />
      </AssistantRuntimeProvider>
   );
}
