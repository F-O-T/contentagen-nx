"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { insertLink } from "@platejs/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ExternalLink, Link2, Link2Off, Pencil, X } from "lucide-react";
import { useEditorRef } from "platejs/react";
import { orpc } from "@/integrations/orpc/client";

interface Suggestion {
   id: string;
   title: string;
   slug: string;
   status: string;
   url: string;
}

const STATUS_VARIANT: Record<
   string,
   "default" | "secondary" | "outline" | "destructive"
> = {
   published: "default",
   draft: "secondary",
   archived: "outline",
};

const STATUS_LABELS: Record<string, string> = {
   published: "Publicado",
   draft: "Rascunho",
   archived: "Arquivado",
};

const ROLE_LABELS: Record<string, string> = {
   pillar: "Pilar",
   satellite: "Satélite",
   standalone: "Independente",
};

const ROLE_COLORS: Record<string, string> = {
   pillar: "text-violet-500 dark:text-violet-400",
   satellite: "text-sky-500 dark:text-sky-400",
   standalone: "text-muted-foreground",
};

const SuggestionsErrorFallback = createErrorFallback({
   errorTitle: "Erro ao carregar sugestões",
   errorDescription: "Não foi possível carregar os links do cluster.",
   retryText: "Tentar novamente",
});

function SuggestionsTable({
   suggestions,
   role,
}: {
   suggestions: Suggestion[];
   role: string;
}) {
   const editor = useEditorRef();
   const navigate = useNavigate();
   const params = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };

   function handleInsertLink(suggestion: Suggestion) {
      if (!editor.selection) {
         editor.tf.focus();
         editor.tf.select(editor.api.end([]));
      }
      insertLink(editor, { url: suggestion.url, text: suggestion.title });
   }

   function handleNavigate(suggestion: Suggestion) {
      navigate({
         to: `/${params.slug}/${params.teamSlug}/content/${suggestion.id}`,
      });
   }

   if (suggestions.length === 0) {
      return (
         <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
            <Link2Off className="size-7 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
               Adicione este conteúdo a um cluster para ver sugestões de links
               internos.
            </p>
         </div>
      );
   }

   return (
      <div className="flex flex-col">
         {/* Role label */}
         <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
            <span
               className={cn(
                  "text-[11px] font-semibold uppercase tracking-widest",
                  ROLE_COLORS[role] ?? "text-muted-foreground",
               )}
            >
               {ROLE_LABELS[role] ?? role}
            </span>
            <span className="text-[11px] text-muted-foreground/40">
               {suggestions.length}
            </span>
         </div>

         <Table>
            <TableHeader>
               <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="h-7 px-3 text-[10px] font-medium text-muted-foreground/60 w-full">
                     Título
                  </TableHead>
                  <TableHead className="h-7 px-2 text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap">
                     Status
                  </TableHead>
                  <TableHead className="h-7 w-[76px]" />
               </TableRow>
            </TableHeader>
            <TableBody>
               {suggestions.map((suggestion) => (
                  <TableRow
                     key={suggestion.id}
                     className="group border-b border-border/30 hover:bg-accent/50 cursor-default"
                  >
                     {/* Title — max-w-0 enables CSS truncation inside a table cell */}
                     <TableCell className="px-3 py-2.5 max-w-0">
                        <Button
                           type="button"
                           variant="link"
                           className="h-auto w-full justify-start p-0 text-xs font-medium text-foreground hover:text-foreground"
                           onClick={() => handleNavigate(suggestion)}
                        >
                           <span className="truncate block w-full">
                              {suggestion.title || "Sem título"}
                           </span>
                        </Button>
                     </TableCell>

                     {/* Status */}
                     <TableCell className="px-2 py-2.5 whitespace-nowrap">
                        <Badge
                           variant={STATUS_VARIANT[suggestion.status] ?? "outline"}
                           className="text-[10px] h-4 px-1.5 font-normal"
                        >
                           {STATUS_LABELS[suggestion.status] ?? suggestion.status}
                        </Badge>
                     </TableCell>

                     {/* Actions */}
                     <TableCell className="px-1.5 py-2.5">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6 rounded"
                                    onClick={() => handleNavigate(suggestion)}
                                 >
                                    <Pencil className="size-3" />
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                 Editar conteúdo
                              </TooltipContent>
                           </Tooltip>

                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6 rounded"
                                    asChild
                                 >
                                    <a
                                       href={`/${params.slug}/${params.teamSlug}/content/${suggestion.id}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                    >
                                       <ExternalLink className="size-3" />
                                    </a>
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                 Abrir em nova aba
                              </TooltipContent>
                           </Tooltip>

                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6 rounded"
                                    onClick={() => handleInsertLink(suggestion)}
                                 >
                                    <Link2 className="size-3" />
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                 Inserir link
                              </TooltipContent>
                           </Tooltip>
                        </div>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </div>
   );
}

function SuggestionsList({ contentId }: { contentId: string }) {
   const { data } = useSuspenseQuery(
      orpc.relatedContent.getSuggestions.queryOptions({
         input: { contentId },
         staleTime: 60_000,
      }),
   );

   const { role, suggestions } = data;

   return <SuggestionsTable suggestions={suggestions} role={role} />;
}

interface InternalLinksSidebarProps {
   contentId: string;
   onClose?: () => void;
   className?: string;
}

export function InternalLinksSidebar({
   contentId,
   onClose,
   className,
}: InternalLinksSidebarProps) {
   return (
      <TooltipProvider>
         <div
            className={cn(
               "flex h-full w-72 flex-col border-l bg-background shrink-0",
               className,
            )}
         >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b">
               <Link2 className="size-3.5 text-muted-foreground/60 shrink-0" />
               <span className="text-sm font-semibold flex-1">
                  Links do Cluster
               </span>
               {onClose && (
                  <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     className="size-6 rounded text-muted-foreground"
                     onClick={onClose}
                  >
                     <X className="size-3.5" />
                  </Button>
               )}
            </div>

            <ScrollArea className="flex-1">
               <ErrorBoundary FallbackComponent={SuggestionsErrorFallback}>
                  <Suspense
                     fallback={
                        <div className="flex flex-col gap-1.5 p-3">
                           {Array.from({ length: 3 }, (_, i) => (
                              <div
                                 key={`skeleton-${i + 1}`}
                                 className="h-10 rounded bg-accent/30 animate-pulse"
                              />
                           ))}
                        </div>
                     }
                  >
                     <SuggestionsList contentId={contentId} />
                  </Suspense>
               </ErrorBoundary>
            </ScrollArea>
         </div>
      </TooltipProvider>
   );
}
