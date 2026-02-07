import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { FormsList } from "@/features/forms/ui/forms-list";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/forms/",
)({
	component: FormsPage,
});

function FormsPageErrorFallback(props: FallbackProps) {
	return createErrorFallback({
		errorDescription: "Não foi possível carregar a lista de formulários",
		errorTitle: "Erro ao carregar formulários",
		retryText: "Tentar novamente",
	})(props);
}

function FormsPageSkeleton() {
	return (
		<main className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-9 w-48" />
				<Skeleton className="h-5 w-80" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={`form-skeleton-${i + 1}`} className="h-[160px]" />
				))}
			</div>
		</main>
	);
}

function FormsPageHeader() {
	const { slug } = useParams({ strict: false });

	return (
		<div className="flex items-center justify-between gap-4">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
					Formulários
				</h1>
				<p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
					Crie e gerencie formulários para coletar dados dos visitantes
				</p>
			</div>
			<Button asChild>
				<Link to="/$slug/forms/new" params={{ slug: slug || "" }}>
					<Plus className="mr-2 size-4" />
					Criar formulário
				</Link>
			</Button>
		</div>
	);
}

function FormsPageContent() {
	return (
		<main className="flex flex-col gap-4">
			<FormsPageHeader />
			<FormsList />
		</main>
	);
}

function FormsPage() {
	return (
		<ErrorBoundary FallbackComponent={FormsPageErrorFallback}>
			<Suspense fallback={<FormsPageSkeleton />}>
				<FormsPageContent />
			</Suspense>
		</ErrorBoundary>
	);
}
