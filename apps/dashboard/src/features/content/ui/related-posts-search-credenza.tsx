"use client";

import { Badge } from "@packages/ui/components/badge";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Input } from "@packages/ui/components/input";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileText, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

type RelatedPostsSearchCredenzaProps = {
   contentId: string;
   excludeIds: string[];
   onSelect: (targetContentId: string) => void;
};

export function RelatedPostsSearchCredenza({
   contentId,
   excludeIds,
   onSelect,
}: RelatedPostsSearchCredenzaProps) {
   const [searchTerm, setSearchTerm] = useState("");
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   // Fetch all published content
   const { data: allContent, isLoading } = useQuery(
      trpc.content.listAllContent.queryOptions({
         status: ["published", "draft"],
         limit: 100,
      }),
   );

   // Add related content mutation
   const addMutation = useMutation(
      trpc.content.addRelatedContent.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo vinculado");
            queryClient.invalidateQueries({
               queryKey: trpc.content.getRelatedContent.queryKey({ contentId }),
            });
         },
         onError: (error) => {
            toast.error(error.message || "Erro ao vincular conteúdo");
         },
      }),
   );

   // Filter content based on search and exclude IDs
   const filteredContent = useMemo(() => {
      if (!allContent?.items) return [];

      return allContent.items.filter((item) => {
         // Exclude already linked content and current content
         if (excludeIds.includes(item.id)) return false;

         // Filter by search term
         if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            return (
               item.meta.title.toLowerCase().includes(lowerSearch) ||
               item.meta.description?.toLowerCase().includes(lowerSearch)
            );
         }

         return true;
      });
   }, [allContent?.items, excludeIds, searchTerm]);

   const handleSelect = (targetContentId: string) => {
      addMutation.mutate(
         {
            sourceContentId: contentId,
            targetContentId,
            relationType: "manual",
         },
         {
            onSuccess: () => {
               onSelect(targetContentId);
            },
         },
      );
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Adicionar Conteúdo Relacionado</CredenzaTitle>
            <CredenzaDescription>
               Selecione um conteúdo para vincular
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {/* Search input */}
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
               <Input
                  className="pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar conteúdos..."
                  value={searchTerm}
               />
            </div>

            {/* Content list */}
            <ScrollArea className="h-[300px] rounded-md border">
               {isLoading ? (
                  <div className="p-4 space-y-3">
                     <Skeleton className="h-16 w-full" />
                     <Skeleton className="h-16 w-full" />
                     <Skeleton className="h-16 w-full" />
                  </div>
               ) : filteredContent.length > 0 ? (
                  <div className="p-2 space-y-1">
                     {filteredContent.map((item) => (
                        <button
                           className={cn(
                              "w-full flex items-start gap-3 p-3 rounded-md text-left hover:bg-muted/50 transition-colors",
                              addMutation.isPending && "opacity-50",
                           )}
                           disabled={addMutation.isPending}
                           key={item.id}
                           onClick={() => handleSelect(item.id)}
                           type="button"
                        >
                           <FileText className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                 {item.meta.title}
                              </p>
                              {item.meta.description && (
                                 <p className="text-xs text-muted-foreground line-clamp-2">
                                    {item.meta.description}
                                 </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                 <Badge
                                    className={cn(
                                       "text-xs",
                                       item.status === "published"
                                          ? "bg-green-500/10 text-green-600 border-green-200"
                                          : "bg-amber-500/10 text-amber-600 border-amber-200",
                                    )}
                                    variant="outline"
                                 >
                                    {item.status === "published"
                                       ? "Publicado"
                                       : "Rascunho"}
                                 </Badge>
                                 {item.agent && (
                                    <span className="text-xs text-muted-foreground">
                                       por {item.agent.name}
                                    </span>
                                 )}
                              </div>
                           </div>
                           {addMutation.isPending &&
                           addMutation.variables?.targetContentId ===
                              item.id ? (
                              <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
                           ) : (
                              <Check className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                           )}
                        </button>
                     ))}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                     <FileText className="size-10 text-muted-foreground mb-2" />
                     <p className="text-sm text-muted-foreground">
                        {searchTerm
                           ? "Nenhum conteúdo encontrado"
                           : "Nenhum conteúdo disponível"}
                     </p>
                  </div>
               )}
            </ScrollArea>
         </CredenzaBody>
      </>
   );
}
