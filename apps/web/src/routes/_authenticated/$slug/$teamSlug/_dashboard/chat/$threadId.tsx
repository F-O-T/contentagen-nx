import { useAssistantRuntime } from "@assistant-ui/react";
import { Thread } from "@/features/arandu-chat/ui/thread";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

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
	const runtime = useAssistantRuntime();

	useEffect(() => {
		runtime.threads.switchToThread(threadId);
	}, [runtime, threadId]);

	return (
		<Thread
			quickSuggestions={QUICK_SUGGESTIONS}
			welcomeIconUrl="/arandu.svg"
			welcomeSubtitle="Seu assistente de conteúdo com IA."
			welcomeTitle="Como posso te ajudar?"
		/>
	);
}
