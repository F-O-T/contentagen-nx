import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Archive, Lightbulb, Send, Trash2, UserPen } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import {
   setChatMode,
   startNewPlan,
   useChatMode,
} from "@/features/content/context/chat-context";
import { ChatSidebar } from "@/features/content/ui/chat-sidebar";
import { ContentEditor } from "@/features/content/ui/content-editor";
import { ContentFrontmatterPanel } from "@/features/content/ui/content-frontmatter-panel";
import { RelatedPostsPanel } from "@/features/content/ui/related-posts-panel";
import { WriterAssignmentCredenza } from "@/features/content/ui/writer-assignment-credenza";
import {
   registerFrontmatterHandlers,
   unregisterFrontmatterHandlers,
} from "@/features/content/utils/frontmatter-tool-executor";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useContentCreationPreference } from "@/hooks/use-content-creation-preference";
import { useCredenza } from "@/hooks/use-credenza";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { Feature, useFeatureAccess } from "@/hooks/use-feature-access";
import { useTRPC } from "@/integrations/clients";

type ContentDetailsPageProps = {
   contentId: string;
};

function ContentDetailsPageSkeleton() {
   return (
      <div className="flex h-[calc(100vh-4rem)] -m-4">
         <main className="flex flex-1 flex-col overflow-hidden p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-3">
                  <Skeleton className="size-9" />
                  <div>
                     <Skeleton className="h-7 w-48" />
                     <Skeleton className="h-4 w-64 mt-1" />
                  </div>
               </div>
               <Skeleton className="h-6 w-20" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mb-4">
               <Skeleton className="h-8 w-20" />
               <Skeleton className="h-8 w-20" />
               <Skeleton className="h-8 w-20" />
            </div>

            {/* Metadata Bar */}
            <div className="flex items-center gap-4 border-b pb-3 mb-4">
               <Skeleton className="h-5 w-32" />
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-4 w-20" />
               <Skeleton className="h-4 w-16" />
            </div>

            {/* Editor */}
            <div className="flex-1">
               <Skeleton className="h-full w-full" />
            </div>
         </main>

         {/* Chat Sidebar */}
         <div className="w-80 shrink-0 border-l p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-[calc(100%-8rem)] w-full" />
            <Skeleton className="h-20 w-full mt-4" />
         </div>
      </div>
   );
}

function ContentDetailsPageError({ error }: { error: Error }) {
   return (
      <main className="flex flex-col gap-6">
         <div className="flex items-center gap-4">
            <div className="flex-1">
               <h1 className="text-2xl font-bold">
                  {"Conteúdo não encontrado"}
               </h1>
            </div>
         </div>
         <div className="text-center py-8">
            <p className="text-muted-foreground">
               {"Ocorreu um erro. Por favor, tente novamente."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
               {error.message}
            </p>
         </div>
      </main>
   );
}

function ContentDetailsPageContent({ contentId }: ContentDetailsPageProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const navigate = useNavigate();
   const { activeOrganization } = useActiveOrganization();
   const { openAlertDialog } = useAlertDialog();
   const { openCredenza, closeCredenza } = useCredenza();
   const [isSaving, setIsSaving] = useState(false);
   const [isSavingMeta, setIsSavingMeta] = useState(false);

   // Feature access for tier-based routing
   const { hasFeature } = useFeatureAccess();
   const hasPlanMode = hasFeature(Feature.CHAT_PLAN_MODE);
   const hasChat = hasFeature(Feature.CHAT);

   // Pro user's preferred creation mode
   const { preference: creationPreference } = useContentCreationPreference();

   // Get chat mode from context (useChatMode uses selector for proper reactivity)
   const chatMode = useChatMode();

   const { data: content } = useSuspenseQuery(
      trpc.content.getById.queryOptions({ id: contentId }),
   );

   // Writer assignment mutation
   const assignWriterMutation = useMutation(
      trpc.content.update.mutationOptions({
         onSuccess: () => {
            closeCredenza();
            queryClient.invalidateQueries({
               queryKey: trpc.content.getById.queryKey({ id: contentId }),
            });
            toast.success("Escritor atualizado");
         },
         onError: (error) => {
            toast.error(error.message || "Erro ao atualizar escritor");
         },
      }),
   );

   // Initialize chat mode based on tier on first render
   useEffect(() => {
      // FREE users: no chat access, so mode doesn't matter
      // LITE users: force writer mode (no plan mode access)
      // PRO users: use their preference for new content, otherwise respect existing mode
      if (hasChat && !hasPlanMode) {
         // LITE tier - force writer mode
         setChatMode("writer");
      } else if (hasPlanMode) {
         // PRO tier - if content is new (no body), use preference
         if (!content.body?.trim()) {
            setChatMode(creationPreference);
         }
         // If content has body, keep current mode (could be plan or writer)
      }
   }, [hasChat, hasPlanMode, content.body, creationPreference]);

   // Determine if we're in planning mode (full-page chat) or editing mode (split view)
   // Tier-aware logic:
   // - FREE: never show planning (no chat access)
   // - LITE: never show planning (only writer mode)
   // - PRO: show planning if content is new AND chatMode is "plan"
   const canShowPlanning = hasPlanMode && !content.body?.trim();
   const isPlanning = canShowPlanning && chatMode === "plan";

   // Handler to open writer assignment credenza
   const handleOpenWriterAssignment = () => {
      openCredenza({
         children: (
            <WriterAssignmentCredenza
               contentId={contentId}
               currentWriterId={content.writerId}
               isPending={assignWriterMutation.isPending}
               onSelect={(writerId) => {
                  assignWriterMutation.mutate({
                     id: contentId,
                     data: { writerId },
                  });
               }}
            />
         ),
      });
   };

   // Handler when plan agent detects no writer assigned
   const handleWriterSelectionNeeded = useCallback(() => {
      openCredenza({
         children: (
            <WriterAssignmentCredenza
               contentId={contentId}
               currentWriterId={content.writerId}
               isPending={assignWriterMutation.isPending}
               onSelect={(writerId) => {
                  assignWriterMutation.mutate(
                     {
                        id: contentId,
                        data: { writerId },
                     },
                     {
                        onSuccess: () => {
                           closeCredenza();
                           toast.success(
                              "Escritor selecionado! Agora diga o que você gostaria de escrever.",
                           );
                        },
                     },
                  );
               }}
            />
         ),
      });
   }, [
      openCredenza,
      contentId,
      content.writerId,
      assignWriterMutation,
      closeCredenza,
   ]);

   // Handler to start a new plan (Pro only)
   const handleStartNewPlan = () => {
      startNewPlan();
   };

   // Handler to skip planning (Pro only)
   const handleSkipPlanning = () => {
      setChatMode("writer");
   };

   // Auto-open writer selection if in planning mode without a writer
   useEffect(() => {
      if (isPlanning && !content.writerId) {
         handleWriterSelectionNeeded();
      }
   }, [isPlanning, content.writerId, handleWriterSelectionNeeded]);

   const updateMutation = useMutation(
      trpc.content.update.mutationOptions({
         onSuccess: () => {
            setIsSaving(false);
            queryClient.invalidateQueries({
               queryKey: trpc.content.getById.queryKey({ id: contentId }),
            });
         },
         onError: (error) => {
            setIsSaving(false);
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const updateMetaMutation = useMutation(
      trpc.content.update.mutationOptions({
         onSuccess: () => {
            setIsSavingMeta(false);
            queryClient.invalidateQueries({
               queryKey: trpc.content.getById.queryKey({ id: contentId }),
            });
         },
         onError: (error) => {
            setIsSavingMeta(false);
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const deleteMutation = useMutation(
      trpc.content.delete.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo excluído com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
            navigate({
               to: "/$slug/content",
               params: { slug: activeOrganization.slug },
            });
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const publishMutation = useMutation(
      trpc.content.publish.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo publicado com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.content.getById.queryKey({ id: contentId }),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const archiveMutation = useMutation(
      trpc.content.archive.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo arquivado com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.content.getById.queryKey({ id: contentId }),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const { call: debouncedSave, flush: flushContentSave } =
      useDebouncedCallback((body: string) => {
         setIsSaving(true);
         updateMutation.mutate({
            id: contentId,
            data: { body },
         });
      }, 1000);

   const handleContentChange = useCallback(
      (body: string) => {
         debouncedSave(body);
      },
      [debouncedSave],
   );

   // Callback when agent completes - flush any pending content save
   const handleAgentComplete = useCallback(() => {
      flushContentSave();
   }, [flushContentSave]);

   const handleMetaChange = useCallback(
      (metaUpdates: Partial<typeof content.meta>) => {
         setIsSavingMeta(true);
         updateMetaMutation.mutate({
            id: contentId,
            data: {
               meta: metaUpdates, // Only send changed fields, server merges with existing
            },
         });
      },
      [contentId, updateMetaMutation],
   );

   // Register frontmatter handlers for agent tool execution
   useEffect(() => {
      const optimisticUpdate = (updates: Partial<typeof content.meta>) => {
         // Immediately update the cache for instant UI feedback
         queryClient.setQueryData(
            trpc.content.getById.queryKey({ id: contentId }),
            (old: typeof content | undefined) =>
               old ? { ...old, meta: { ...old.meta, ...updates } } : old,
         );
      };

      registerFrontmatterHandlers({
         updateTitle: (title) => {
            optimisticUpdate({ title });
            handleMetaChange({ title });
         },
         updateDescription: (description) => {
            optimisticUpdate({ description });
            handleMetaChange({ description });
         },
         updateSlug: (slug) => {
            optimisticUpdate({ slug });
            handleMetaChange({ slug });
         },
         updateKeywords: (keywords) => {
            optimisticUpdate({ keywords });
            handleMetaChange({ keywords });
         },
      });

      return () => {
         unregisterFrontmatterHandlers();
      };
   }, [handleMetaChange, queryClient, trpc.content.getById, contentId]);

   const handleDelete = () => {
      openAlertDialog({
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         description: `${"Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."} "${content.meta.title}"?`,
         onAction: () => deleteMutation.mutate({ id: contentId }),
         title: "Confirmar Exclusão",
         variant: "destructive",
      });
   };

   const handlePublish = () => {
      publishMutation.mutate({ id: contentId });
   };

   const handleArchive = () => {
      archiveMutation.mutate({ id: contentId });
   };

   const STATUS_COLORS: Record<string, string> = {
      archived: "bg-slate-500/10 text-slate-600 border-slate-200",
      draft: "bg-amber-500/10 text-amber-600 border-amber-200",
      published: "bg-green-500/10 text-green-600 border-green-200",
   };

   // Full-page chat layout (planning mode - Pro only)
   if (isPlanning) {
      return (
         <TooltipProvider>
            <div className="flex h-[calc(100vh-4rem)] -m-4">
               {/* Full-page Chat */}
               <ChatSidebar
                  contentId={contentId}
                  contentMeta={{
                     title: content.meta.title,
                     description: content.meta.description,
                     slug: content.meta.slug,
                     keywords: content.meta.keywords,
                     status: content.status,
                  }}
                  fullPage
                  onAgentComplete={handleAgentComplete}
                  onSkipPlan={handleSkipPlanning}
               />
            </div>
         </TooltipProvider>
      );
   }

   // Split view layout (editing mode)
   return (
      <TooltipProvider>
         <div className="flex h-[calc(100vh-4rem)] -m-4">
            {/* Main Content */}
            <main className="flex flex-1 flex-col overflow-hidden p-4">
               {/* Header */}
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                     <div>
                        <h1 className="text-2xl font-bold">
                           {content.meta.title || "Sem título"}
                        </h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                           {content.meta.description || "Detalhes do conteúdo"}
                           {isSaving && (
                              <span className="text-xs text-amber-600">
                                 {"Salvando..."}
                              </span>
                           )}
                        </p>
                     </div>
                  </div>
                  <Badge
                     className={STATUS_COLORS[content.status]}
                     variant="outline"
                  >
                     {content.status}
                  </Badge>
               </div>

               {/* Actions */}
               <div className="flex items-center gap-2 mb-4">
                  <Button
                     className="text-destructive hover:text-destructive"
                     onClick={handleDelete}
                     size="sm"
                     variant="outline"
                  >
                     <Trash2 className="size-4 mr-2" />
                     {"Excluir"}
                  </Button>
                  {content.status === "draft" && (
                     <Button
                        disabled={publishMutation.isPending}
                        onClick={handlePublish}
                        size="sm"
                        variant="outline"
                     >
                        <Send className="size-4 mr-2" />
                        {"Publicar"}
                     </Button>
                  )}
                  {content.status !== "archived" && (
                     <Button
                        disabled={archiveMutation.isPending}
                        onClick={handleArchive}
                        size="sm"
                        variant="outline"
                     >
                        <Archive className="size-4 mr-2" />
                        {"Arquivar"}
                     </Button>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Writer assignment button (LITE & PRO) */}
                  {hasChat && (
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              onClick={handleOpenWriterAssignment}
                              size="sm"
                              variant="outline"
                           >
                              <UserPen className="size-4 mr-2" />
                              {content.writerId
                                 ? "Trocar escritor"
                                 : "Atribuir escritor"}
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Selecione um escritor IA para ajudar</p>
                        </TooltipContent>
                     </Tooltip>
                  )}

                  {/* New Plan button (PRO only) */}
                  {hasPlanMode && (
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              onClick={handleStartNewPlan}
                              size="sm"
                              variant="outline"
                           >
                              <Lightbulb className="size-4 mr-2" />
                              Novo Plano
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Iniciar nova sessão de planejamento</p>
                        </TooltipContent>
                     </Tooltip>
                  )}
               </div>

               {/* Frontmatter Panel */}
               <ContentFrontmatterPanel
                  body={content.body || ""}
                  className="mb-4"
                  contentId={contentId}
                  disabled={content.status === "archived"}
                  isSaving={isSavingMeta}
                  meta={content.meta}
                  onMetaChange={handleMetaChange}
               />

               {/* Related Posts Panel */}
               <RelatedPostsPanel
                  className="mb-4"
                  contentId={contentId}
                  disabled={content.status === "archived"}
               />

               {/* Editor - fills remaining space */}
               <div className="flex-1 overflow-hidden min-h-0">
                  <ContentEditor
                     className="h-full"
                     disabled={content.status === "archived"}
                     initialContent={content.body || ""}
                     key={contentId}
                     onChange={handleContentChange}
                     placeholder={"Comece a escrever..."}
                  />
               </div>
            </main>

            {/* Chat Sidebar - always shown, upgrade prompt in Chat tab for FREE users */}
            <ChatSidebar
               contentId={contentId}
               contentMeta={{
                  title: content.meta.title,
                  description: content.meta.description,
                  slug: content.meta.slug,
                  keywords: content.meta.keywords,
                  status: content.status,
               }}
               onAgentComplete={handleAgentComplete}
            />
         </div>
      </TooltipProvider>
   );
}

export function ContentDetailsPage({ contentId }: ContentDetailsPageProps) {
   return (
      <ErrorBoundary FallbackComponent={ContentDetailsPageError}>
         <Suspense fallback={<ContentDetailsPageSkeleton />}>
            <ContentDetailsPageContent contentId={contentId} />
         </Suspense>
      </ErrorBoundary>
   );
}
