import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { EditorPage } from "@/features/editor/ui/editor-page";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/content/$contentId",
)({
   beforeLoad: async ({ context, params }) => {
      await context.queryClient.prefetchQuery(
         orpc.content.getById.queryOptions({
            input: { id: params.contentId },
         }),
      );
   },
   component: EditorRoute,
});

function EditorErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: "Não foi possível carregar o editor de conteúdo",
      errorTitle: "Erro ao carregar editor",
      retryText: "Tentar novamente",
   })(props);
}

function EditorSkeleton() {
   return (
      <div className="flex h-screen bg-background">
         {/* Activity bar skeleton */}
         <div className="flex flex-col items-center py-2 w-12 bg-muted/30 border-r gap-2">
            <Skeleton className="size-10 rounded-md" />
            <Skeleton className="size-10 rounded-md" />
            <Skeleton className="size-10 rounded-md" />
            <Skeleton className="size-10 rounded-md" />
         </div>

         {/* Main area */}
         <div className="flex-1 flex flex-col">
            {/* Nav bar skeleton */}
            <div className="flex items-center justify-between h-12 px-4 border-b bg-muted/30">
               <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
               </div>
               <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="size-8" />
               </div>
            </div>

            {/* Editor area */}
            <div className="flex-1 flex min-h-0">
               {/* Editor */}
               <div className="flex-1 flex flex-col">
                  {/* Frontmatter skeleton */}
                  <div className="border-b px-4 py-3">
                     <Skeleton className="h-4 w-20 mb-2" />
                     <div className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                     </div>
                  </div>

                  {/* Content skeleton */}
                  <div className="flex-1 p-4 space-y-3">
                     <Skeleton className="h-5 w-full" />
                     <Skeleton className="h-5 w-4/5" />
                     <Skeleton className="h-5 w-full" />
                     <Skeleton className="h-5 w-3/5" />
                  </div>
               </div>

               {/* Chat sidebar skeleton */}
               <div className="w-80 border-l bg-muted/20">
                  <div className="p-3 border-b">
                     <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="p-3 space-y-3">
                     <Skeleton className="h-16 w-full" />
                     <Skeleton className="h-16 w-full" />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function EditorRoute() {
   const { contentId } = Route.useParams();

   return (
      <ErrorBoundary FallbackComponent={EditorErrorFallback}>
         <Suspense fallback={<EditorSkeleton />}>
            <EditorPage contentId={contentId} />
         </Suspense>
      </ErrorBoundary>
   );
}
