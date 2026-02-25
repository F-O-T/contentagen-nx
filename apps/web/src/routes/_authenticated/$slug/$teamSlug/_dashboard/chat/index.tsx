import { Thread } from "@/features/arandu-chat/ui/thread";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_authenticated/$slug/$teamSlug/_dashboard/chat/",
)({
	component: ChatIndexPage,
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

function ChatIndexPage() {
	return (
		<Thread
			quickSuggestions={QUICK_SUGGESTIONS}
			welcomeIconUrl="/arandu.svg"
			welcomeSubtitle="Seu assistente de conteúdo com IA."
			welcomeTitle="Como posso te ajudar?"
		/>
	);
}
