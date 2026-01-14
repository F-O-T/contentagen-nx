import { Button } from "@packages/ui/components/button";
import { Check, X } from "lucide-react";
import { useEffect, useCallback } from "react";
import {
   acceptDiff,
   rejectDiff,
   useDiffContext,
} from "../context/diff-context";
import { DiffSplitView } from "./diff-split-view";

export function DiffView() {
   const {
      isOpen,
      originalText,
      suggestedText,
      originalTitle,
      suggestedTitle,
      diff,
      source,
   } = useDiffContext();

   const handleAccept = useCallback(() => {
      acceptDiff();
   }, []);

   const handleReject = useCallback(() => {
      rejectDiff();
   }, []);

   // Handle keyboard shortcuts
   useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleAccept();
         } else if (e.key === "Escape") {
            e.preventDefault();
            handleReject();
         }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [isOpen, handleAccept, handleReject]);

   if (!isOpen) return null;

   const title =
      source === "ai-edit"
         ? "Alteracoes Sugeridas pela IA"
         : "Comparacao de Versoes";

   return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
         <div className="fixed inset-4 flex flex-col bg-background border rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
               <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{title}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                     Ctrl+Enter para aceitar, Esc para rejeitar
                  </span>
               </div>
               <div className="flex items-center gap-2">
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={handleReject}
                     className="gap-1.5"
                  >
                     <X className="size-4" />
                     Rejeitar
                  </Button>
                  <Button size="sm" onClick={handleAccept} className="gap-1.5">
                     <Check className="size-4" />
                     Aceitar
                  </Button>
               </div>
            </div>

            {/* Split View */}
            <div className="flex-1 overflow-hidden">
               <DiffSplitView
                  originalText={originalText}
                  suggestedText={suggestedText}
                  originalTitle={originalTitle}
                  suggestedTitle={suggestedTitle}
                  diff={diff}
               />
            </div>
         </div>
      </div>
   );
}
