"use client";

import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { Check, FileText, Sparkles, X } from "lucide-react";
import { useState } from "react";

type Suggestion = {
   id: string;
   title: string;
   description: string;
   slug: string;
   relevance: number;
};

type RelatedPostsSuggestionsProps = {
   suggestions: Suggestion[];
   isLoading: boolean;
   onApprove: (targetContentId: string) => void;
   onClose: () => void;
   isApproving?: string; // ID of item being approved
};

export function RelatedPostsSuggestions({
   suggestions,
   isLoading,
   onApprove,
   onClose,
   isApproving,
}: RelatedPostsSuggestionsProps) {
   const [dismissed, setDismissed] = useState<Set<string>>(new Set());

   const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.id));

   const handleDismiss = (id: string) => {
      setDismissed((prev) => new Set([...prev, id]));
   };

   if (isLoading) {
      return (
         <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4" />
                  <span>Buscando sugestões...</span>
               </div>
            </div>
            <div className="space-y-2">
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
            </div>
         </div>
      );
   }

   if (visibleSuggestions.length === 0) {
      return (
         <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="size-4 text-primary" />
                  <span>Sugestões IA</span>
               </div>
               <Button
                  className="size-6"
                  onClick={onClose}
                  size="icon"
                  variant="ghost"
               >
                  <X className="size-3.5" />
               </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-6 text-center">
               <FileText className="size-8 text-muted-foreground mb-2" />
               <p className="text-sm text-muted-foreground">
                  {suggestions.length === 0
                     ? "Nenhuma sugestão encontrada"
                     : "Todas as sugestões foram processadas"}
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className="pt-2 space-y-2">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
               <Sparkles className="size-4 text-primary" />
               <span>Sugestões IA</span>
               <Badge className="text-xs" variant="secondary">
                  {visibleSuggestions.length}
               </Badge>
            </div>
            <Button
               className="size-6"
               onClick={onClose}
               size="icon"
               variant="ghost"
            >
               <X className="size-3.5" />
            </Button>
         </div>

         <div className="space-y-2">
            {visibleSuggestions.map((suggestion) => (
               <div
                  className={cn(
                     "flex items-center gap-3 p-2 rounded-md bg-background border",
                     isApproving === suggestion.id && "opacity-50",
                  )}
                  key={suggestion.id}
               >
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                           {suggestion.title}
                        </p>
                        <Badge
                           className="text-xs shrink-0 bg-primary/10 text-primary border-primary/20"
                           variant="outline"
                        >
                           {suggestion.relevance}% match
                        </Badge>
                     </div>
                     {suggestion.description && (
                        <p className="text-xs text-muted-foreground truncate">
                           {suggestion.description}
                        </p>
                     )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                     <Button
                        className="size-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        disabled={isApproving === suggestion.id}
                        onClick={() => onApprove(suggestion.id)}
                        size="icon"
                        title="Adicionar"
                        variant="ghost"
                     >
                        <Check className="size-4" />
                     </Button>
                     <Button
                        className="size-7 text-muted-foreground hover:text-destructive"
                        disabled={isApproving === suggestion.id}
                        onClick={() => handleDismiss(suggestion.id)}
                        size="icon"
                        title="Ignorar"
                        variant="ghost"
                     >
                        <X className="size-4" />
                     </Button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
