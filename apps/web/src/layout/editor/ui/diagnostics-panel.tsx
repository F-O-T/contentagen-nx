/**
 * Diagnostics Panel - Bottom sheet for spelling/grammar errors
 *
 * Toggleable panel showing:
 * - Spelling errors from Hunspell
 * - Fix suggestions for each error
 * - One-click fix actions
 */

import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { AlertCircle, CheckCircle2, Lightbulb, X } from "lucide-react";
import type { SpellingError } from "@/features/editor/schemas";
import { useDiagnosticsState } from "@/features/editor/stores/diagnostics-store";
import { toggleDiagnosticsPanel } from "../hooks/use-editor-state";

// ============================================================================
// Main Component
// ============================================================================

export function DiagnosticsPanel() {
   const diagnostics = useDiagnosticsState();
   const errors = diagnostics.spellingErrors || [];

   return (
      <div className="max-h-[240px] flex flex-col shrink-0">
         {/* Header */}
         <div className="px-4 py-2 border-b flex items-center justify-between bg-muted/50 shrink-0">
            <div className="flex items-center gap-2">
               <AlertCircle className="size-4 text-red-500" />
               <span className="text-sm font-medium">Diagnosticos</span>
               <Badge className="text-xs" variant="secondary">
                  {errors.length} erro{errors.length !== 1 ? "s" : ""}
               </Badge>
            </div>
            <Button
               className="size-7"
               onClick={toggleDiagnosticsPanel}
               size="icon"
               variant="ghost"
            >
               <X className="size-4" />
            </Button>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-auto p-2">
            {errors.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="size-8 mb-2 text-green-500" />
                  <p className="text-sm">Nenhum erro encontrado</p>
                  <p className="text-xs">Seu texto esta otimo!</p>
               </div>
            ) : (
               <div className="space-y-1">
                  {errors.map((error, index) => (
                     <DiagnosticItem error={error} key={`error-${index + 1}`} />
                  ))}
               </div>
            )}
         </div>

         {/* Footer with shortcuts */}
         <div className="px-4 py-1.5 border-t text-xs text-muted-foreground bg-muted/50 shrink-0">
            <span>Ctrl+Shift+D para fechar</span>
         </div>
      </div>
   );
}

// ============================================================================
// Sub-components
// ============================================================================

interface DiagnosticItemProps {
   error: SpellingError;
}

function DiagnosticItem({ error }: DiagnosticItemProps) {
   const hasSuggestion = !!error.suggestion;

   return (
      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
         <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />

         <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  "{error.original}"
               </span>
               <span className="text-xs text-muted-foreground">
                  posição {error.offset}
               </span>
            </div>

            {hasSuggestion && (
               <div className="flex items-center gap-1.5 mt-1">
                  <Lightbulb className="size-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">
                     Sugestão:
                  </span>
                  <Button
                     className="h-5 text-xs px-1.5 py-0"
                     onClick={() => {
                        // TODO: Implement fix suggestion
                        console.log(
                           `Fix "${error.original}" with "${error.suggestion}"`,
                        );
                     }}
                     size="sm"
                     variant="outline"
                  >
                     {error.suggestion}
                  </Button>
               </div>
            )}
         </div>
      </div>
   );
}
