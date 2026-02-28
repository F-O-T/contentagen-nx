import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { ContentListSection } from "@/features/content/ui/content-list-section";
import {
   resetChatContext,
   setChatMode,
} from "@/features/teco-chat/stores/chat-context-store";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/content/",
)({
   loader: () => { setChatMode("content-list"); },
   onLeave: () => { resetChatContext(); },
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
         <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
               <Skeleton className="h-9 w-48" />
               <Skeleton className="h-5 w-80" />
            </div>
            <Skeleton className="h-9 w-24" />
         </div>

         {/* Stats cards skeleton */}
         <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
               <Skeleton className="h-24" key={`stat-skeleton-${i + 1}`} />
            ))}
         </div>

         {/* Table skeleton */}
         <Skeleton className="h-[400px] w-full" />
      </main>
   );
}

function ContentPageContent() {
   return (
      <main className="flex flex-col gap-4">
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
