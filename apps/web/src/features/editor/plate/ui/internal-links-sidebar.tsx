"use client";

import { Component, type ReactNode, Suspense } from "react";

class SuggestionsErrorBoundary extends Component<
   { children: ReactNode },
   { hasError: boolean }
> {
   constructor(props: { children: ReactNode }) {
      super(props);
      this.state = { hasError: false };
   }
   static getDerivedStateFromError() {
      return { hasError: true };
   }
   render() {
      if (this.state.hasError) {
         return (
            <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
               <p className="text-xs text-muted-foreground">
                  Não foi possível carregar.
               </p>
            </div>
         );
      }
      return this.props.children;
   }
}

import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
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
import { ExternalLink, Link2, Link2Off, Network, X } from "lucide-react";
import { useEditorRef } from "platejs/react";
import { orpc } from "@/integrations/orpc/client";

interface Suggestion {
   id: string;
   title: string;
   slug: string;
   status: string;
   url: string;
}

interface SuggestionsListProps {
   contentId: string;
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
   pillar: "text-violet-600 dark:text-violet-400",
   satellite: "text-sky-600 dark:text-sky-400",
   standalone: "text-muted-foreground",
};

function SuggestionItem({ suggestion }: { suggestion: Suggestion }) {
   const editor = useEditorRef();
   const navigate = useNavigate();
   const params = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };

   function handleInsertLink() {
      if (!editor.selection) {
         editor.tf.focus();
         editor.tf.select(editor.api.end([]));
      }
      insertLink(editor, { url: suggestion.url, text: suggestion.title });
   }

   function handleNavigate() {
      navigate({
         to: `/${params.slug}/${params.teamSlug}/content/${suggestion.id}`,
      });
   }

   return (
      <div className="group relative flex items-center gap-2 rounded-md px-2 py-2.5 hover:bg-accent/60 transition-colors cursor-default overflow-hidden">
         {/* Content — must have min-w-0 to allow truncation inside flex */}
         <div className="flex-1 min-w-0 overflow-hidden">
            <button
               className="block w-full text-left min-w-0"
               onClick={handleNavigate}
               type="button"
            >
               <p className="text-sm font-medium leading-snug truncate hover:underline">
                  {suggestion.title || "Sem título"}
               </p>
            </button>
            <div className="flex items-center gap-1.5 mt-1 min-w-0">
               <Badge
                  className="text-[10px] h-4 px-1.5 font-normal shrink-0"
                  variant={STATUS_VARIANT[suggestion.status] ?? "outline"}
               >
                  {STATUS_LABELS[suggestion.status] ?? suggestion.status}
               </Badge>
               <span className="text-[10px] text-muted-foreground/50 truncate font-mono min-w-0">
                  /{suggestion.slug}
               </span>
            </div>
         </div>

         {/* Actions — always shrink-0, slide in on hover */}
         <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className="size-6 rounded"
                     onClick={handleNavigate}
                     size="icon"
                     variant="ghost"
                  >
                     <Network className="size-3" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent side="left">Editar conteúdo</TooltipContent>
            </Tooltip>

            <Tooltip>
               <TooltipTrigger asChild>
                  <a
                     className={cn(
                        "inline-flex size-6 items-center justify-center rounded",
                        "text-xs ring-offset-background transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                     )}
                     href={`/${params.slug}/${params.teamSlug}/content/${suggestion.id}`}
                     rel="noopener noreferrer"
                     target="_blank"
                  >
                     <ExternalLink className="size-3" />
                  </a>
               </TooltipTrigger>
               <TooltipContent side="left">Abrir em nova aba</TooltipContent>
            </Tooltip>

            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className="size-6 rounded"
                     onClick={handleInsertLink}
                     size="icon"
                     variant="ghost"
                  >
                     <Link2 className="size-3" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent side="left">Inserir link</TooltipContent>
            </Tooltip>
         </div>
      </div>
   );
}

function SuggestionsList({ contentId }: SuggestionsListProps) {
   const { data } = useSuspenseQuery(
      orpc.relatedContent.getSuggestions.queryOptions({
         input: { contentId },
         staleTime: 60_000,
      }),
   );

   const { role, suggestions } = data;

   return (
      <div className="flex flex-col gap-0.5">
         {/* Role header */}
         <div className="flex items-center gap-2 px-2 py-2">
            <span
               className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  ROLE_COLORS[role] ?? "text-muted-foreground",
               )}
            >
               {ROLE_LABELS[role] ?? role}
            </span>
            <span className="text-xs text-muted-foreground/50">
               · {suggestions.length}{" "}
               {suggestions.length === 1 ? "link" : "links"}
            </span>
         </div>

         {suggestions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
               <Link2Off className="size-6 text-muted-foreground/30" />
               <p className="text-xs text-muted-foreground/60">
                  Adicione este conteúdo a um cluster para ver sugestões.
               </p>
            </div>
         ) : (
            <div className="flex flex-col">
               {suggestions.map((suggestion) => (
                  <SuggestionItem key={suggestion.id} suggestion={suggestion} />
               ))}
            </div>
         )}
      </div>
   );
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
               "flex h-full min-w-72 flex-col border-l bg-background shrink-0 overflow-hidden",
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
                  <button
                     className="size-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                     onClick={onClose}
                     type="button"
                  >
                     <X className="size-3.5" />
                  </button>
               )}
            </div>

            <ScrollArea className="flex-1">
               <div className="p-1">
                  <SuggestionsErrorBoundary>
                     <Suspense
                        fallback={
                           <div className="flex flex-col gap-1.5 p-2">
                              {Array.from({ length: 3 }, (_, i) => (
                                 <div
                                    className="h-10 rounded bg-accent/30 animate-pulse"
                                    key={`skeleton-${i + 1}`}
                                 />
                              ))}
                           </div>
                        }
                     >
                        <SuggestionsList contentId={contentId} />
                     </Suspense>
                  </SuggestionsErrorBoundary>
               </div>
            </ScrollArea>
         </div>
      </TooltipProvider>
   );
}
