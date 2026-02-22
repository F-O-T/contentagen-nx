import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useEarlyAccess } from "@/hooks/use-early-access";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/clusters",
)({
   component: ClustersProductPage,
});

function ClustersProductSkeleton() {
   return (
      <div className="space-y-6">
         <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
         </div>
         <Skeleton className="h-32 w-full" />
      </div>
   );
}

function ClustersProductErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Clusters de Conteúdo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Configurações de clusters de conteúdo deste projeto.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as configurações
            </p>
            <Button onClick={resetErrorBoundary} variant="outline">
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

function ClustersProductContent() {
   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Clusters de Conteúdo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Organize conteúdos em clusters com posts pillar e posts satélite.
            </p>
         </div>

         <section className="space-y-4">
            <div>
               <h2 className="text-lg font-medium">
                  Como funcionam os clusters
               </h2>
               <p className="text-sm text-muted-foreground">
                  Um cluster de conteúdo é composto por um post pillar (conteúdo
                  principal, abrangente) e vários posts satélite (conteúdos
                  menores e focados que linkam de volta ao pillar). Isso melhora
                  a autoridade temática e o SEO.
               </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
               <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                     <Network className="size-4" />
                  </div>
                  <h3 className="text-sm font-medium">Post Pillar</h3>
                  <p className="text-xs text-muted-foreground">
                     Conteúdo abrangente que cobre um tema amplo e serve como
                     referência central do cluster.
                  </p>
               </div>
               <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                     <Network className="size-4" />
                  </div>
                  <h3 className="text-sm font-medium">Posts Satélite</h3>
                  <p className="text-xs text-muted-foreground">
                     Conteúdos menores e focados que exploram subtópicos e
                     linkam de volta ao post pillar.
                  </p>
               </div>
               <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                     <Network className="size-4" />
                  </div>
                  <h3 className="text-sm font-medium">Embed de Changelog</h3>
                  <p className="text-xs text-muted-foreground">
                     Exiba os posts do cluster como um changelog embarcável no
                     seu site via SDK.
                  </p>
               </div>
            </div>
         </section>
      </div>
   );
}

function ClustersProductPage() {
   const { isEnrolled, loaded } = useEarlyAccess();

   if (!loaded) {
      return <ClustersProductSkeleton />;
   }

   if (!isEnrolled("content-clusters")) {
      return (
         <div className="space-y-6">
            <div>
               <h1 className="text-2xl font-semibold font-serif">
                  Clusters de Conteúdo
               </h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Organize conteúdos em clusters com posts pillar e posts
                  satélite.
               </p>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <p className="text-sm text-muted-foreground mb-4">
                  Acesso negado. Cadastre-se no programa de acesso antecipado.
               </p>
            </div>
         </div>
      );
   }

   return (
      <ErrorBoundary FallbackComponent={ClustersProductErrorFallback}>
         <Suspense fallback={<ClustersProductSkeleton />}>
            <ClustersProductContent />
         </Suspense>
      </ErrorBoundary>
   );
}
