/**
 * Diff View Component
 *
 * Side-by-side diff display for edit preview.
 */

import { Minus, Plus, X } from "lucide-react";
import { diffStyles } from "../core/theme";
import {
   countAdditions,
   countRemovals,
   hasChanges,
   hideDiff,
   useDiffState,
} from "../stores/diff-store";
import { cn } from "../utils";

interface DiffViewProps {
   /**
    * Whether to show line numbers
    */
   showLineNumbers?: boolean;

   /**
    * Whether to show a header
    */
   showHeader?: boolean;

   /**
    * Additional CSS class
    */
   className?: string;

   /**
    * Callback when closed
    */
   onClose?: () => void;
}

/**
 * Diff View Component
 *
 * Displays a side-by-side diff of original and modified content.
 */
export function DiffView({
   showLineNumbers = true,
   showHeader = true,
   className,
   onClose,
}: DiffViewProps): React.JSX.Element | null {
   const diffState = useDiffState();

   if (!diffState.isVisible) {
      return null;
   }

   const additions = countAdditions(diffState.lines);
   const removals = countRemovals(diffState.lines);
   const hasAnyChanges = hasChanges(diffState.lines);

   const handleClose = () => {
      hideDiff();
      onClose?.();
   };

   return (
      <div
         className={cn(
            "border border-border rounded-lg overflow-hidden",
            className,
         )}
      >
         {/* Header */}
         {showHeader && (
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
               <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">Alterações</span>

                  {hasAnyChanges && (
                     <>
                        <span className="flex items-center gap-1 text-green-600">
                           <Plus className="h-3 w-3" />
                           <span>{additions}</span>
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                           <Minus className="h-3 w-3" />
                           <span>{removals}</span>
                        </span>
                     </>
                  )}

                  {!hasAnyChanges && (
                     <span className="text-muted-foreground">
                        Sem alterações
                     </span>
                  )}
               </div>

               <button
                  className="p-1 rounded hover:bg-accent"
                  onClick={handleClose}
                  type="button"
               >
                  <X className="h-4 w-4" />
               </button>
            </div>
         )}

         {/* Diff content */}
         <div className="max-h-[400px] overflow-y-auto font-mono text-sm">
            {diffState.lines.map((line, index) => (
               <div
                  className={cn(
                     "flex",
                     line.type === "added" && diffStyles.added,
                     line.type === "removed" && diffStyles.removed,
                     line.type === "unchanged" && diffStyles.unchanged,
                  )}
                  key={`diff-line-${index + 1}`}
               >
                  {/* Line number */}
                  {showLineNumbers && (
                     <div className="w-12 px-2 py-1 text-right text-muted-foreground/50 select-none border-r border-border/50">
                        {line.lineNumber ?? ""}
                     </div>
                  )}

                  {/* Line indicator */}
                  <div className="w-6 px-1 py-1 text-center select-none">
                     {line.type === "added" && (
                        <Plus className="h-4 w-4 text-green-600" />
                     )}
                     {line.type === "removed" && (
                        <Minus className="h-4 w-4 text-red-600" />
                     )}
                  </div>

                  {/* Line content */}
                  <div className="flex-1 px-2 py-1 whitespace-pre-wrap">
                     {line.content || " "}
                  </div>
               </div>
            ))}

            {diffState.lines.length === 0 && (
               <div className="p-4 text-center text-muted-foreground">
                  Aguardando conteúdo...
               </div>
            )}
         </div>
      </div>
   );
}

/**
 * Inline diff display (simpler, for small changes)
 */
export function InlineDiff({
   original,
   modified,
   className,
}: {
   original: string;
   modified: string;
   className?: string;
}): React.JSX.Element {
   return (
      <div className={cn("space-y-2", className)}>
         {/* Original */}
         <div>
            <span className="text-xs text-muted-foreground block mb-1">
               Original:
            </span>
            <div className={cn("p-2 rounded text-sm", diffStyles.removed)}>
               {original}
            </div>
         </div>

         {/* Modified */}
         <div>
            <span className="text-xs text-muted-foreground block mb-1">
               Sugerido:
            </span>
            <div className={cn("p-2 rounded text-sm", diffStyles.added)}>
               {modified}
            </div>
         </div>
      </div>
   );
}

/**
 * Split diff view (two columns)
 */
export function SplitDiffView({
   className,
}: {
   className?: string;
}): React.JSX.Element | null {
   const diffState = useDiffState();

   if (!diffState.isVisible) {
      return null;
   }

   return (
      <div className={cn("grid grid-cols-2 gap-4", className)}>
         {/* Original */}
         <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-red-500/10 border-b border-border">
               <span className="text-sm font-medium text-red-600">
                  Original
               </span>
            </div>
            <div className="p-4 font-mono text-sm whitespace-pre-wrap">
               {diffState.original}
            </div>
         </div>

         {/* Modified */}
         <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-green-500/10 border-b border-border">
               <span className="text-sm font-medium text-green-600">
                  Modificado
               </span>
            </div>
            <div className="p-4 font-mono text-sm whitespace-pre-wrap">
               {diffState.modified}
            </div>
         </div>
      </div>
   );
}
