/**
 * FIM Panel Component
 *
 * Floating panel for FIM suggestions (cursor-tab mode).
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { Check, Sparkles, X } from "lucide-react";
import { clearFIM, getFIMState, useFIMState } from "../stores/fim-store";
import { cn } from "../utils";

interface FIMPanelProps {
   /**
    * Whether to show confidence score
    */
   showConfidence?: boolean;

   /**
    * Additional CSS class
    */
   className?: string;

   /**
    * Callback when accepted
    */
   onAccept?: (text: string) => void;

   /**
    * Callback when rejected
    */
   onReject?: () => void;
}

/**
 * FIM Floating Panel Component
 *
 * Shows FIM suggestions in a floating panel with accept/reject controls.
 */
export function FIMPanel({
   showConfidence = false,
   className,
   onAccept,
   onReject,
}: FIMPanelProps): React.JSX.Element | null {
   const [editor] = useLexicalComposerContext();
   const fimState = useFIMState();

   // Only show in cursor-tab mode with visible suggestion
   if (
      fimState.mode !== "cursor-tab" ||
      !fimState.isVisible ||
      !fimState.position
   ) {
      return null;
   }

   const handleAccept = () => {
      const state = getFIMState();
      if (!state.ghostText) return;

      editor.update(() => {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            selection.insertText(state.ghostText);
         }
      });

      onAccept?.(state.ghostText);
      clearFIM();
   };

   const handleReject = () => {
      onReject?.();
      clearFIM();
   };

   return (
      <div
         className={cn(
            "absolute z-50 bg-popover border border-border rounded-lg shadow-lg",
            "animate-in fade-in-0 slide-in-from-top-2",
            "max-w-md",
            className,
         )}
         style={{
            top: fimState.position.top,
            left: fimState.position.left,
            maxWidth: fimState.position.maxWidth ?? 400,
         }}
      >
         {/* Header */}
         <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Sugestão AI</span>

            {fimState.isLoading && (
               <span className="ml-auto text-xs text-muted-foreground animate-pulse">
                  Gerando...
               </span>
            )}

            {showConfidence && fimState.confidenceScore !== null && (
               <span
                  className={cn(
                     "ml-auto text-xs",
                     fimState.confidenceScore >= 0.7
                        ? "text-green-500"
                        : fimState.confidenceScore >= 0.5
                          ? "text-yellow-500"
                          : "text-red-500",
                  )}
               >
                  {Math.round(fimState.confidenceScore * 100)}% confiança
               </span>
            )}
         </div>

         {/* Content */}
         <div className="px-3 py-2 max-h-[200px] overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
               {fimState.ghostText || "..."}
            </pre>
         </div>

         {/* Actions */}
         <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border bg-muted/50">
            <button
               className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-accent"
               onClick={handleReject}
               type="button"
            >
               <X className="h-3 w-3" />
               <span>Rejeitar</span>
               <kbd className="ml-1 text-[10px] text-muted-foreground">Esc</kbd>
            </button>

            <button
               className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
               disabled={fimState.isLoading}
               onClick={handleAccept}
               type="button"
            >
               <Check className="h-3 w-3" />
               <span>Aceitar</span>
               <kbd className="ml-1 text-[10px] opacity-75">Tab</kbd>
            </button>
         </div>
      </div>
   );
}

/**
 * FIM Keyboard Hints Component
 */
export function FIMKeyboardHints(): React.JSX.Element | null {
   const fimState = useFIMState();

   if (!fimState.isVisible || !fimState.ghostText) {
      return null;
   }

   return (
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
         <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Tab</kbd>
         <span>aceitar</span>
         <span className="text-muted-foreground/50">|</span>
         <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
         <span>rejeitar</span>
      </div>
   );
}
