import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { QuickStartChecklist } from "@/features/onboarding/ui/quick-start-checklist";
import { HomeContentAnalyticsCard } from "./_components/home-content-analytics-card";
import { HomeContentStatsCard } from "./_components/home-content-stats-card";
import { HomeRecentContentSection } from "./_components/home-recent-content-section";
import { HomeSDKUsageCard } from "./_components/home-sdk-usage-card";

export const Route = createFileRoute(
	"/_authenticated/$slug/_dashboard/home/",
)({
	component: HomePage,
});

function HomePageErrorFallback(props: FallbackProps) {
	return createErrorFallback({
		errorDescription: "Não foi possível carregar o dashboard",
		errorTitle: "Erro ao carregar dashboard",
		retryText: "Tentar novamente",
	})(props);
}

function HomePageSkeleton() {
	return (
		<main className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-9 w-48" />
				<Skeleton className="h-5 w-80" />
			</div>

			{/* 4-column bento grid skeleton */}
			<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
				<Skeleton className="h-[260px] col-span-2 md:col-span-4" />
				<Skeleton className="h-[420px] col-span-2 md:col-span-1" />
				<Skeleton className="h-[420px] col-span-2 md:col-span-3" />
			</div>

			<Skeleton className="h-[300px] w-full" />
		</main>
	);
}

function HomePageHeader() {
	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
				Dashboard
			</h1>
			<p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
				Seu espaço de trabalho para criação de conteúdo com IA
			</p>
		</div>
	);
}

function HomePageContent() {
	return (
		<main className="flex flex-col gap-4">
			<HomePageHeader />

			{/* Quick Start checklist — visible until dismissed or all tasks done */}
			<QuickStartChecklist />

			{/* 4-column flexible bento grid */}
			<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
				{/* SDK Usage - spans 4 cols on md, 2 cols on mobile */}
				<HomeSDKUsageCard className="col-span-2 md:col-span-4" />
				
				{/* Content Stats - 1 col on md (narrower for pie chart) */}
				<HomeContentStatsCard className="col-span-2 md:col-span-1" />
				
				{/* Content Analytics - 3 cols on md (wider for multi-line chart) */}
				<HomeContentAnalyticsCard className="col-span-2 md:col-span-3" />
			</div>

			{/* Recent content - full width outside grid */}
			<HomeRecentContentSection />
		</main>
	);
}

function HomePage() {
	return (
		<ErrorBoundary FallbackComponent={HomePageErrorFallback}>
			<Suspense fallback={<HomePageSkeleton />}>
				<HomePageContent />
			</Suspense>
		</ErrorBoundary>
	);
}
