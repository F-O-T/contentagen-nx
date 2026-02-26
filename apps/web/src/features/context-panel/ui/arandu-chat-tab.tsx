import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread, formatTimeAgo } from "@/features/arandu-chat/ui/thread";
import { useAranduRuntime } from "@/features/arandu-chat/hooks/use-arandu-runtime";
import { useThreadList } from "@/features/arandu-chat/hooks/use-thread-list";
import type { QuickSuggestion } from "@/features/arandu-chat/ui/thread";
import { useActiveTeam } from "@/hooks/use-active-team";
import { Link, useParams } from "@tanstack/react-router";
import { Suspense } from "react";

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
	{ label: "Criar artigo", prompt: "Crie um artigo completo sobre " },
	{ label: "Analisar SEO", prompt: "Analise o SEO deste conteúdo e sugira melhorias: " },
	{ label: "Pesquisar", prompt: "Pesquise sobre " },
	{ label: "Otimizar texto", prompt: "Otimize este texto para SEO: " },
	{ label: "Estratégia", prompt: "Crie uma estratégia de conteúdo para " },
];

function RecentThreadsList({ teamId }: { teamId: string }) {
	const threads = useThreadList({ teamId, perPage: 5 });
	const { slug, teamSlug } = useParams({ from: "/_authenticated/$slug/$teamSlug/_dashboard" });

	return (
		<>
			{threads.map((t) => (
				<Link
					className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60"
					key={t.id}
					params={{ slug, teamSlug, threadId: t.id }}
					to="/$slug/$teamSlug/chat/$threadId"
				>
					<span className="flex-1 truncate text-sm text-foreground/80">{t.title}</span>
					<span className="shrink-0 text-xs text-muted-foreground/60">{formatTimeAgo(t.updatedAt)}</span>
				</Link>
			))}
		</>
	);
}

function AranduChatTabInner({ teamId }: { teamId: string }) {
	return (
		<Thread
			quickSuggestions={QUICK_SUGGESTIONS}
			welcomeIconUrl="/arandu.svg"
			welcomeSubtitle="Seu assistente de conteúdo com IA."
			welcomeTitle="Como posso te ajudar?"
			recentThreadsSlot={
				<Suspense fallback={null}>
					<RecentThreadsList teamId={teamId} />
				</Suspense>
			}
		/>
	);
}

export function AranduChatTab() {
	const { activeTeamId } = useActiveTeam();
	const runtime = useAranduRuntime({ teamId: activeTeamId ?? "" });

	if (!activeTeamId) return null;

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<AranduChatTabInner teamId={activeTeamId} />
		</AssistantRuntimeProvider>
	);
}
