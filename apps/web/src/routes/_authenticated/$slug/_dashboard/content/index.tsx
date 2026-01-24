import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { ContentListSection } from "@/features/content/ui/content-list-section";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/content/",
)({
	component: ContentPage,
});

function ContentPageErrorFallback(props: FallbackProps) {
	return createErrorFallback({
		errorDescription: "Não foi possível carregar a lista de conteúdos",
		errorTitle: "Erro ao carregar conteúdos",
		retryText: "Tentar novamente",
	})(props);
}

function ContentPageSkeleton() {
	return (
		<main className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-9 w-48" />
				<Skeleton className="h-5 w-80" />
			</div>

			{/* Stats cards skeleton */}
			<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={`stat-skeleton-${i + 1}`} className="h-24" />
				))}
			</div>

			{/* Table skeleton */}
			<Skeleton className="h-[400px] w-full" />
		</main>
	);
}

function ContentPageHeader() {
	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
				Conteúdo
			</h1>
			<p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
				Gerencie e crie conteúdo para seu site
			</p>
		</div>
	);
}

function ContentPageContent() {
	return (
		<main className="flex flex-col gap-4">
			<ContentPageHeader />
			<ContentListSection />
		</main>
	);
}

function ContentPage() {
	return (
		<ErrorBoundary FallbackComponent={ContentPageErrorFallback}>
			<Suspense fallback={<ContentPageSkeleton />}>
				<ContentPageContent />
			</Suspense>
		</ErrorBoundary>
	);
}
