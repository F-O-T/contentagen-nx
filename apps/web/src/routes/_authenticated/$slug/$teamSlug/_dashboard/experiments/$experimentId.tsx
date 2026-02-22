import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
   ArrowLeft,
   ChevronDown,
   FlaskConical,
   Loader2,
   Pause,
   Play,
   Trophy,
   Trash2,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { ExperimentResultsTab } from "@/features/experiments/ui/experiment-results-tab";
import { ExperimentStatusBadge } from "@/features/experiments/ui/experiment-status-badge";
import { ExperimentVariantsTab } from "@/features/experiments/ui/experiment-variants-tab";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/experiments/$experimentId",
)({
   component: ExperimentDetailPage,
});

// ============================================================
// Skeletons
// ============================================================

function ExperimentDetailSkeleton() {
   return (
      <main className="flex flex-col gap-6">
         <div className="flex items-center gap-2">
            <Skeleton className="size-8" />
            <Skeleton className="h-5 w-32" />
         </div>
         <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
               <Skeleton className="h-9 w-64" />
               <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-5 w-96" />
         </div>
         <Skeleton className="h-10 w-64" />
         <Skeleton className="h-[300px] w-full" />
      </main>
   );
}

function ExperimentDetailErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorTitle: "Erro ao carregar experimento",
      errorDescription: "Não foi possível carregar os detalhes do experimento",
      retryText: "Tentar novamente",
   })(props);
}

// ============================================================
// Tab skeletons
// ============================================================

function TabContentSkeleton() {
   return (
      <div className="flex flex-col gap-3 pt-2">
         {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
               className="h-16 w-full rounded-lg"
               key={`tab-sk-${i + 1}`}
            />
         ))}
      </div>
   );
}

// ============================================================
// Header actions
// ============================================================

type ExperimentStatus = "draft" | "running" | "paused" | "concluded";

interface ExperimentHeaderActionsProps {
   experimentId: string;
   status: ExperimentStatus;
   variantCount: number;
   slug: string;
   teamSlug: string;
}

function ExperimentHeaderActions({
   experimentId,
   status,
   variantCount,
   slug,
   teamSlug,
}: ExperimentHeaderActionsProps) {
   const navigate = useNavigate();
   const { openAlertDialog } = useAlertDialog();

   const startMutation = useMutation(
      orpc.experiments.start.mutationOptions({
         onSuccess: () => toast.success("Experimento iniciado!"),
         onError: (err) => toast.error(err.message ?? "Erro ao iniciar"),
      }),
   );

   const pauseMutation = useMutation(
      orpc.experiments.pause.mutationOptions({
         onSuccess: () => toast.success("Experimento pausado"),
         onError: (err) => toast.error(err.message ?? "Erro ao pausar"),
      }),
   );

   const concludeMutation = useMutation(
      orpc.experiments.conclude.mutationOptions({
         onSuccess: () => toast.success("Experimento concluído"),
         onError: (err) => toast.error(err.message ?? "Erro ao concluir"),
      }),
   );

   const removeMutation = useMutation(
      orpc.experiments.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Experimento excluído");
            navigate({
               to: "/$slug/$teamSlug/experiments",
               params: { slug, teamSlug },
            });
         },
         onError: (err) => toast.error(err.message ?? "Erro ao excluir"),
      }),
   );

   const isAnyPending =
      startMutation.isPending ||
      pauseMutation.isPending ||
      concludeMutation.isPending ||
      removeMutation.isPending;

   const canStart =
      (status === "draft" || status === "paused") && variantCount >= 2;
   const canStartButNeedsVariants =
      (status === "draft" || status === "paused") && variantCount < 2;

   const handleDelete = () => {
      openAlertDialog({
         title: "Excluir experimento?",
         description:
            "Esta ação não pode ser desfeita. Todos os dados serão perdidos.",
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await removeMutation.mutateAsync({ id: experimentId });
         },
      });
   };

   const handleConclude = () => {
      openAlertDialog({
         title: "Concluir experimento?",
         description:
            "O experimento será marcado como concluído. Você pode opcionalmente definir um vencedor depois.",
         actionLabel: "Concluir",
         cancelLabel: "Cancelar",
         onAction: async () => {
            await concludeMutation.mutateAsync({ id: experimentId });
         },
      });
   };

   return (
      <div className="flex items-center gap-2">
         {/* Primary action */}
         {status === "running" && (
            <Button
               disabled={isAnyPending}
               onClick={() => pauseMutation.mutate({ id: experimentId })}
               size="sm"
               variant="outline"
            >
               {pauseMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
               ) : (
                  <Pause className="mr-2 size-4" />
               )}
               Pausar
            </Button>
         )}

         {canStart && (
            <Button
               disabled={isAnyPending}
               onClick={() => startMutation.mutate({ id: experimentId })}
               size="sm"
            >
               {startMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
               ) : (
                  <Play className="mr-2 size-4" />
               )}
               {status === "paused" ? "Retomar" : "Iniciar"}
            </Button>
         )}

         {canStartButNeedsVariants && (
            <Button disabled size="sm" title="Adicione pelo menos 2 variantes">
               <Play className="mr-2 size-4" />
               Iniciar
            </Button>
         )}

         {/* Secondary actions */}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button disabled={isAnyPending} size="sm" variant="outline">
                  <ChevronDown className="size-4" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               {(status === "running" || status === "paused") && (
                  <>
                     <DropdownMenuItem onClick={handleConclude}>
                        <Trophy className="mr-2 size-4" />
                        Concluir experimento
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                  </>
               )}
               {status !== "running" && (
                  <DropdownMenuItem
                     className="text-destructive focus:text-destructive"
                     onClick={handleDelete}
                  >
                     <Trash2 className="mr-2 size-4" />
                     Excluir experimento
                  </DropdownMenuItem>
               )}
               {status === "running" && (
                  <DropdownMenuItem className="text-muted-foreground" disabled>
                     <Trash2 className="mr-2 size-4" />
                     Pause primeiro para excluir
                  </DropdownMenuItem>
               )}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}

// ============================================================
// Detail content (behind suspense)
// ============================================================

const TARGET_TYPE_LABELS: Record<string, string> = {
   content: "Conteúdo",
   form: "Formulário",
   cluster: "Cluster",
};

const GOAL_LABELS: Record<string, string> = {
   conversion: "Conversão",
   ctr: "CTR",
   time_on_page: "Tempo na página",
   form_submit: "Envio de formulário",
};

function ExperimentDetailContent() {
   const { experimentId, slug, teamSlug } = Route.useParams();

   const { data: experiment } = useSuspenseQuery(
      orpc.experiments.getById.queryOptions({
         input: { id: experimentId },
      }),
   );

   const status = experiment.status as ExperimentStatus;
   const variantCount = experiment.variants?.length ?? 0;

   return (
      <main className="flex flex-col gap-6">
         {/* Back link */}
         <Link
            className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            params={{ slug, teamSlug }}
            to="/$slug/$teamSlug/experiments"
         >
            <ArrowLeft className="size-4" />
            Todos os experimentos
         </Link>

         {/* Header */}
         <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
               <div className="flex items-center gap-3 flex-wrap">
                  <FlaskConical className="size-5 text-muted-foreground shrink-0" />
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif leading-tight truncate">
                     {experiment.name}
                  </h1>
                  <ExperimentStatusBadge status={status} />
               </div>

               {experiment.hypothesis && (
                  <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                     {experiment.hypothesis}
                  </p>
               )}

               <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                     Alvo:{" "}
                     <span className="font-medium text-foreground">
                        {TARGET_TYPE_LABELS[experiment.targetType] ??
                           experiment.targetType}
                     </span>
                  </span>
                  <span>
                     Métrica:{" "}
                     <span className="font-medium text-foreground">
                        {GOAL_LABELS[experiment.goal] ?? experiment.goal}
                     </span>
                  </span>
                  {experiment.startedAt && (
                     <span>
                        Iniciado em:{" "}
                        <span className="font-medium text-foreground">
                           {new Date(experiment.startedAt).toLocaleDateString(
                              "pt-BR",
                           )}
                        </span>
                     </span>
                  )}
               </div>
            </div>

            <ExperimentHeaderActions
               experimentId={experimentId}
               slug={slug}
               status={status}
               teamSlug={teamSlug}
               variantCount={variantCount}
            />
         </div>

         {/* Tabs */}
         <Tabs defaultValue="variants">
            <TabsList>
               <TabsTrigger value="variants">
                  Variantes
                  {variantCount > 0 && (
                     <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {variantCount}
                     </span>
                  )}
               </TabsTrigger>
               <TabsTrigger value="results">Resultados</TabsTrigger>
            </TabsList>

            <TabsContent className="pt-4" value="variants">
               <ErrorBoundary FallbackComponent={ExperimentDetailErrorFallback}>
                  <Suspense fallback={<TabContentSkeleton />}>
                     <ExperimentVariantsTab
                        experimentId={experimentId}
                        status={status}
                        targetType={
                           experiment.targetType as
                              | "content"
                              | "form"
                              | "cluster"
                        }
                        winnerId={experiment.winnerId ?? null}
                     />
                  </Suspense>
               </ErrorBoundary>
            </TabsContent>

            <TabsContent className="pt-4" value="results">
               <ErrorBoundary FallbackComponent={ExperimentDetailErrorFallback}>
                  <Suspense fallback={<TabContentSkeleton />}>
                     <ExperimentResultsTab experimentId={experimentId} />
                  </Suspense>
               </ErrorBoundary>
            </TabsContent>
         </Tabs>
      </main>
   );
}

// ============================================================
// Page root
// ============================================================

function ExperimentDetailPage() {
   return (
      <ErrorBoundary FallbackComponent={ExperimentDetailErrorFallback}>
         <Suspense fallback={<ExperimentDetailSkeleton />}>
            <ExperimentDetailContent />
         </Suspense>
      </ErrorBoundary>
   );
}
