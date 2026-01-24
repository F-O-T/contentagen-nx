"use client";

import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
   ChevronDown,
   ChevronUp,
   Link2,
   Plus,
   Sparkles,
   Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCredenza } from "@/hooks/use-credenza";
import { useTRPC } from "@/integrations/clients";
import { RelatedPostsSearchCredenza } from "./related-posts-search-credenza";
import { RelatedPostsSuggestions } from "./related-posts-suggestions";

type RelatedPostsPanelProps = {
   contentId: string;
   disabled?: boolean;
   className?: string;
};

export function RelatedPostsPanel({
   contentId,
   disabled = false,
   className,
}: RelatedPostsPanelProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [showSuggestions, setShowSuggestions] = useState(false);
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { openCredenza, closeCredenza } = useCredenza();

   // Fetch related content
   const { data: relatedContent, isLoading } = useQuery(
      trpc.content.getRelatedContent.queryOptions({ contentId }),
   );

   // Fetch AI suggestions (lazy - only when showSuggestions is true)
   const {
      data: suggestionsData,
      isLoading: isSuggestionsLoading,
      refetch: refetchSuggestions,
   } = useQuery({
      ...trpc.content.getRelatedContentSuggestions.queryOptions({ contentId }),
      enabled: showSuggestions,
   });

   // Remove related content mutation
   const removeMutation = useMutation(
      trpc.content.removeRelatedContent.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo removido");
            queryClient.invalidateQueries({
               queryKey: trpc.content.getRelatedContent.queryKey({ contentId }),
            });
         },
         onError: (error) => {
            toast.error(error.message || "Erro ao remover conteúdo");
         },
      }),
   );

   // Add suggestion mutation (with ai_suggested type)
   const addSuggestionMutation = useMutation(
      trpc.content.addRelatedContent.mutationOptions({
         onSuccess: () => {
            toast.success("Sugestão adicionada");
            queryClient.invalidateQueries({
               queryKey: trpc.content.getRelatedContent.queryKey({ contentId }),
            });
            // Refetch suggestions to update the list
            refetchSuggestions();
         },
         onError: (error) => {
            toast.error(error.message || "Erro ao adicionar sugestão");
         },
      }),
   );

   const handleApproveSuggestion = (targetContentId: string) => {
      addSuggestionMutation.mutate({
         sourceContentId: contentId,
         targetContentId,
         relationType: "ai_suggested",
      });
   };

   const handleAddRelatedPost = () => {
      openCredenza({
         children: (
            <RelatedPostsSearchCredenza
               contentId={contentId}
               excludeIds={[
                  contentId,
                  ...(relatedContent?.map((r) => r.targetContent.id) ?? []),
               ]}
               onSelect={() => {
                  closeCredenza();
                  queryClient.invalidateQueries({
                     queryKey: trpc.content.getRelatedContent.queryKey({
                        contentId,
                     }),
                  });
               }}
            />
         ),
      });
   };

   const handleRemove = (targetContentId: string) => {
      removeMutation.mutate({
         sourceContentId: contentId,
         targetContentId,
      });
   };

   const relatedCount = relatedContent?.length ?? 0;

   return (
      <Collapsible
         className={cn("border rounded-md bg-muted/30", className)}
         onOpenChange={setIsOpen}
         open={isOpen}
      >
         <CollapsibleTrigger asChild>
            <button
               className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
               type="button"
            >
               <div className="flex items-center gap-2">
                  <Link2 className="size-4 text-muted-foreground" />
                  <span>Conteúdos Relacionados</span>
                  {relatedCount > 0 && (
                     <Badge className="text-xs" variant="secondary">
                        {relatedCount}
                     </Badge>
                  )}
               </div>
               {isOpen ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
               ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
               )}
            </button>
         </CollapsibleTrigger>

         <CollapsibleContent className="px-4 pb-4 space-y-3">
            {isLoading ? (
               <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
               </div>
            ) : relatedContent && relatedContent.length > 0 ? (
               <div className="space-y-2">
                  {relatedContent.map((item) => (
                     <div
                        className="flex items-center gap-3 p-2 rounded-md bg-background border"
                        key={item.id}
                     >
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium truncate">
                              {item.targetContent.meta.title}
                           </p>
                           {item.targetContent.meta.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                 {item.targetContent.meta.description}
                              </p>
                           )}
                        </div>
                        <Badge
                           className={cn(
                              "text-xs shrink-0",
                              item.targetContent.status === "published"
                                 ? "bg-green-500/10 text-green-600 border-green-200"
                                 : "bg-amber-500/10 text-amber-600 border-amber-200",
                           )}
                           variant="outline"
                        >
                           {item.targetContent.status === "published"
                              ? "Publicado"
                              : "Rascunho"}
                        </Badge>
                        <Button
                           className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                           disabled={disabled || removeMutation.isPending}
                           onClick={() => handleRemove(item.targetContent.id)}
                           size="icon"
                           variant="ghost"
                        >
                           <Trash2 className="size-4" />
                        </Button>
                     </div>
                  ))}
               </div>
            ) : (
               <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum conteúdo relacionado
               </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
               <Button
                  className="flex-1"
                  disabled={disabled}
                  onClick={handleAddRelatedPost}
                  size="sm"
                  variant="outline"
               >
                  <Plus className="size-4 mr-2" />
                  Adicionar
               </Button>
               <Button
                  className="flex-1"
                  disabled={disabled || showSuggestions}
                  onClick={() => setShowSuggestions(true)}
                  size="sm"
                  variant="outline"
               >
                  <Sparkles className="size-4 mr-2" />
                  Sugestões IA
               </Button>
            </div>

            {/* AI Suggestions */}
            {showSuggestions && (
               <RelatedPostsSuggestions
                  isApproving={
                     addSuggestionMutation.isPending
                        ? addSuggestionMutation.variables?.targetContentId
                        : undefined
                  }
                  isLoading={isSuggestionsLoading}
                  onApprove={handleApproveSuggestion}
                  onClose={() => setShowSuggestions(false)}
                  suggestions={suggestionsData?.suggestions ?? []}
               />
            )}
         </CollapsibleContent>
      </Collapsible>
   );
}
