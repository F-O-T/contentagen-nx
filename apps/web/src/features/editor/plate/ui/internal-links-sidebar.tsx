"use client";

import { Component, Suspense, type ReactNode } from "react";

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
               <p className="text-sm text-muted-foreground">
                  Não foi possível carregar as sugestões.
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
import { Separator } from "@packages/ui/components/separator";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { insertLink } from "@platejs/link";
import { ExternalLink, Link2, Link2Off } from "lucide-react";
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

const STATUS_VARIANT: Record<
   string,
   "default" | "secondary" | "outline" | "destructive"
> = {
   published: "default",
   draft: "secondary",
   archived: "outline",
};

function SuggestionItem({
   suggestion,
}: {
   suggestion: Suggestion;
}) {
   const editor = useEditorRef();

   function handleInsertLink() {
      // insertLink requires an active selection in the editor.
      // If no selection exists, focus the editor first so insertLink can place the node.
      if (!editor.selection) {
         editor.tf.focus();
      }
      insertLink(editor, {
         url: suggestion.url,
         text: suggestion.title,
      });
   }

   return (
      <div className="group flex items-start gap-2 rounded-md p-2 hover:bg-accent/50 transition-colors">
         <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
               {suggestion.title || "Sem título"}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
               /{suggestion.slug}
            </p>
            <div className="flex items-center gap-1 mt-1">
               <Badge
                  variant={STATUS_VARIANT[suggestion.status] ?? "outline"}
                  className="text-[10px] h-4 px-1"
               >
                  {STATUS_LABELS[suggestion.status] ?? suggestion.status}
               </Badge>
            </div>
         </div>

         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     size="icon"
                     variant="ghost"
                     className="size-6"
                     onClick={handleInsertLink}
                  >
                     <Link2 className="size-3" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>Inserir link</TooltipContent>
            </Tooltip>

            <Tooltip>
               <TooltipTrigger asChild>
                  <a
                     href={suggestion.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className={cn(
                        "inline-flex size-6 items-center justify-center rounded-md",
                        "text-sm font-medium ring-offset-background transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                     )}
                  >
                     <ExternalLink className="size-3" />
                  </a>
               </TooltipTrigger>
               <TooltipContent>Abrir em nova aba</TooltipContent>
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
      <div className="flex flex-col gap-1">
         <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs text-muted-foreground">
               Papel:{" "}
               <span className="font-medium text-foreground">
                  {ROLE_LABELS[role] ?? role}
               </span>
            </span>
         </div>

         <Separator className="mb-1" />

         {suggestions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
               <Link2Off className="size-8 text-muted-foreground" />
               <p className="text-sm text-muted-foreground">
                  Nenhuma sugestão de link disponível.
               </p>
               <p className="text-xs text-muted-foreground">
                  Adicione este conteúdo a um cluster para ver sugestões de
                  links internos.
               </p>
            </div>
         ) : (
            <div className="flex flex-col gap-0.5">
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
   className?: string;
}

export function InternalLinksSidebar({
   contentId,
   className,
}: InternalLinksSidebarProps) {
   return (
      <TooltipProvider>
         <div
            className={cn(
               "flex h-full w-64 flex-col border-l bg-background",
               className,
            )}
         >
            <div className="flex items-center gap-2 px-3 py-3 border-b">
               <Link2 className="size-4 text-muted-foreground shrink-0" />
               <h3 className="text-sm font-semibold">Links do Cluster</h3>
            </div>

            <ScrollArea className="flex-1">
               <div className="p-2">
                  <SuggestionsErrorBoundary>
                     <Suspense
                        fallback={
                           <div className="flex flex-col gap-2 p-2">
                              {Array.from({ length: 3 }, (_, i) => (
                                 <div
                                    key={`skeleton-${i + 1}`}
                                    className="h-14 rounded-md bg-accent/50 animate-pulse"
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
