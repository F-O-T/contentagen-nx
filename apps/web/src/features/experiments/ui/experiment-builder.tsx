import { Button } from "@packages/ui/components/button";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import {
   type ExperimentStatus,
   useExperimentConfig,
} from "../hooks/use-experiment-config";
import { ExperimentBuilderHeader } from "./experiment-builder-header";
import { ExperimentConfigTab } from "./experiment-config-tab";
import { ExperimentResultsTab } from "./experiment-results-tab";
import { ExperimentVariantsTab } from "./experiment-variants-tab";

const TABS = [
   { value: "config", label: "Configuração" },
   { value: "variants", label: "Variantes" },
   { value: "results", label: "Resultados" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function ExperimentBuilderSkeleton() {
   return (
      <div className="flex flex-col gap-0 h-full">
         <div className="border-b bg-background">
            <div className="container mx-auto px-4 py-4">
               <div className="flex items-center gap-3">
                  <Skeleton className="size-5" />
                  <Skeleton className="size-5" />
                  <Skeleton className="h-8 w-64" />
               </div>
            </div>
         </div>
         <div className="border-b bg-background">
            <div className="container mx-auto px-4">
               <div className="flex gap-0">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-24 ml-2" />
                  <Skeleton className="h-10 w-24 ml-2" />
               </div>
            </div>
         </div>
         <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
               <Skeleton className="h-24 w-full max-w-2xl" />
               <Skeleton className="h-40 w-full max-w-2xl" />
               <Skeleton className="h-16 w-full max-w-sm" />
            </div>
         </div>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────
// Edit mode inner component (needs Suspense)
// ─────────────────────────────────────────────────────────────

interface ExperimentBuilderEditContentProps {
   experimentId: string;
   activeTab: TabValue;
   onTabChange: (tab: TabValue) => void;
   backTo: { slug: string; teamSlug: string };
}

function ExperimentBuilderEditContent({
   experimentId,
   activeTab,
   onTabChange,
   backTo,
}: ExperimentBuilderEditContentProps) {
   const navigate = useNavigate();
   const { config, updateConfig, setName } = useExperimentConfig();

   const { data: experiment } = useSuspenseQuery(
      orpc.experiments.getById.queryOptions({ input: { id: experimentId } }),
   );

   // Populate config from loaded experiment on first load
   useEffect(() => {
      updateConfig({
         name: experiment.name,
         hypothesis: experiment.hypothesis ?? "",
         targetType: experiment.targetType as "content" | "form" | "cluster",
         goal: experiment.goal as
            | "conversion"
            | "ctr"
            | "time_on_page"
            | "form_submit",
      });
      // intentional: only run on first load (experiment.id as stable dep)
   }, [experiment.id]);

   const status = experiment.status as ExperimentStatus;
   const canEdit = status === "draft" || status === "paused";
   const variantCount = experiment.variants?.length ?? 0;

   const updateMutation = useMutation(
      orpc.experiments.update.mutationOptions({
         onSuccess: () => toast.success("Experimento atualizado!"),
         onError: (err) => toast.error(err.message ?? "Erro ao salvar"),
      }),
   );

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
               params: backTo as never,
            });
         },
         onError: (err) => toast.error(err.message ?? "Erro ao excluir"),
      }),
   );

   const handleSave = useCallback(() => {
      if (!config.name.trim()) {
         toast.error("O nome do experimento é obrigatório");
         return;
      }
      updateMutation.mutate({
         id: experimentId,
         name: config.name.trim(),
         hypothesis: config.hypothesis || undefined,
         targetType: config.targetType,
         goal: config.goal,
      });
   }, [config, experimentId, updateMutation]);

   return (
      <div className="flex flex-col gap-0 h-full">
         <ExperimentBuilderHeader
            backTo={backTo}
            isConcluding={concludeMutation.isPending}
            isDeleting={removeMutation.isPending}
            isPausing={pauseMutation.isPending}
            isSaving={updateMutation.isPending}
            isStarting={startMutation.isPending}
            name={config.name}
            onConclude={() => concludeMutation.mutate({ id: experimentId })}
            onDelete={() => removeMutation.mutate({ id: experimentId })}
            onNameChange={setName}
            onPause={() => pauseMutation.mutate({ id: experimentId })}
            onSave={handleSave}
            onStart={() => startMutation.mutate({ id: experimentId })}
            status={status}
            variantCount={variantCount}
         />

         {/* Tab bar */}
         <div className="border-b bg-background">
            <div className="container mx-auto px-4">
               <div className="flex items-center gap-0">
                  {TABS.map((tab) => (
                     <Button
                        className={cn(
                           "px-4 py-2.5 h-auto rounded-none border-b-2 text-sm font-medium",
                           activeTab === tab.value
                              ? "border-primary text-primary"
                              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                        )}
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        variant="ghost"
                     >
                        {tab.label}
                        {tab.value === "variants" && variantCount > 0 && (
                           <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {variantCount}
                           </span>
                        )}
                     </Button>
                  ))}
               </div>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6">
               {activeTab === "config" && (
                  <ExperimentConfigTab
                     canEdit={canEdit}
                     config={config}
                     onUpdate={updateConfig}
                  />
               )}
               {activeTab === "variants" && (
                  <ErrorBoundary
                     FallbackComponent={createErrorFallback({
                        errorTitle: "Erro ao carregar variantes",
                        errorDescription:
                           "Não foi possível carregar as variantes",
                        retryText: "Tentar novamente",
                     })}
                  >
                     <Suspense
                        fallback={
                           <div className="flex flex-col gap-2">
                              {Array.from({ length: 3 }).map((_, i) => (
                                 <Skeleton
                                    className="h-14 w-full rounded-lg"
                                    key={`var-sk-${i + 1}`}
                                 />
                              ))}
                           </div>
                        }
                     >
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
               )}
               {activeTab === "results" && (
                  <ErrorBoundary
                     FallbackComponent={createErrorFallback({
                        errorTitle: "Erro ao carregar resultados",
                        errorDescription:
                           "Não foi possível carregar os resultados",
                        retryText: "Tentar novamente",
                     })}
                  >
                     <Suspense
                        fallback={
                           <Skeleton className="h-64 w-full rounded-lg" />
                        }
                     >
                        <ExperimentResultsTab experimentId={experimentId} />
                     </Suspense>
                  </ErrorBoundary>
               )}
            </div>
         </div>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────
// Create mode inner component (no data loading)
// ─────────────────────────────────────────────────────────────

interface ExperimentBuilderCreateContentProps {
   activeTab: TabValue;
   onTabChange: (tab: TabValue) => void;
   backTo: { slug: string; teamSlug: string };
   onCreate: (config: {
      name: string;
      hypothesis?: string;
      targetType: string;
      goal: string;
   }) => void;
   isCreating: boolean;
}

function ExperimentBuilderCreateContent({
   activeTab,
   onTabChange,
   backTo,
   onCreate,
   isCreating,
}: ExperimentBuilderCreateContentProps) {
   const { config, updateConfig, setName } = useExperimentConfig();

   const handleSave = useCallback(() => {
      if (!config.name.trim()) {
         toast.error("O nome do experimento é obrigatório");
         return;
      }
      onCreate({
         name: config.name.trim(),
         hypothesis: config.hypothesis || undefined,
         targetType: config.targetType,
         goal: config.goal,
      });
   }, [config, onCreate]);

   return (
      <div className="flex flex-col gap-0 h-full">
         <ExperimentBuilderHeader
            backTo={backTo}
            isSaving={isCreating}
            name={config.name}
            onNameChange={setName}
            onSave={handleSave}
            status={null}
            variantCount={0}
         />

         {/* Tab bar — only Configuração is enabled in create mode */}
         <div className="border-b bg-background">
            <div className="container mx-auto px-4">
               <div className="flex items-center gap-0">
                  {TABS.map((tab) => {
                     const isDisabled = tab.value !== "config";
                     return (
                        <Button
                           className={cn(
                              "px-4 py-2.5 h-auto rounded-none border-b-2 text-sm font-medium",
                              activeTab === tab.value
                                 ? "border-primary text-primary"
                                 : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                              isDisabled && "opacity-40 cursor-not-allowed",
                           )}
                           disabled={isDisabled}
                           key={tab.value}
                           onClick={() => !isDisabled && onTabChange(tab.value)}
                           variant="ghost"
                        >
                           {tab.label}
                        </Button>
                     );
                  })}
               </div>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6">
               <ExperimentConfigTab
                  canEdit
                  config={config}
                  onUpdate={updateConfig}
               />
            </div>
         </div>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────
// Public interface
// ─────────────────────────────────────────────────────────────

export interface ExperimentBuilderProps {
   experimentId?: string;
   backTo: { slug: string; teamSlug: string };
   // Provided by parent in create mode
   onCreate?: (config: {
      name: string;
      hypothesis?: string;
      targetType: string;
      goal: string;
   }) => void;
   isCreating?: boolean;
   initialTab?: TabValue;
}

export function ExperimentBuilder({
   experimentId,
   backTo,
   onCreate,
   isCreating = false,
   initialTab = "config",
}: ExperimentBuilderProps) {
   const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

   const isEditMode = experimentId !== undefined;

   if (isEditMode) {
      return (
         <ErrorBoundary
            FallbackComponent={createErrorFallback({
               errorTitle: "Erro ao carregar experimento",
               errorDescription: "Não foi possível carregar o experimento",
               retryText: "Tentar novamente",
            })}
         >
            <Suspense fallback={<ExperimentBuilderSkeleton />}>
               <ExperimentBuilderEditContent
                  activeTab={activeTab}
                  backTo={backTo}
                  experimentId={experimentId}
                  onTabChange={setActiveTab}
               />
            </Suspense>
         </ErrorBoundary>
      );
   }

   return (
      <ExperimentBuilderCreateContent
         activeTab={activeTab}
         backTo={backTo}
         isCreating={isCreating}
         onCreate={onCreate ?? (() => {})}
         onTabChange={setActiveTab}
      />
   );
}
