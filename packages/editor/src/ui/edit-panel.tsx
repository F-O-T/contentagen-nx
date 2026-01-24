/**
 * Edit Panel Component
 *
 * Floating prompt panel for inline AI editing (Ctrl+K).
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { Check, Send, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { hideDiff } from "../stores/diff-store";
import {
   clearEdit,
   getEditState,
   setEditInstruction,
   useEditState,
} from "../stores/edit-store";
import { cn } from "../utils";

interface EditPanelProps {
   /**
    * Callback to submit edit instruction
    */
   onSubmit?: (instruction: string) => void;

   /**
    * Callback when edit is accepted
    */
   onAccept?: () => void;

   /**
    * Callback when edit is rejected
    */
   onReject?: () => void;

   /**
    * Additional CSS class
    */
   className?: string;
}

/**
 * Edit Panel Component
 *
 * Shows when user presses Ctrl+K with selected text.
 */
export function EditPanel({
   onSubmit,
   onAccept,
   onReject,
   className,
}: EditPanelProps): React.JSX.Element | null {
   const [editor] = useLexicalComposerContext();
   const editState = useEditState();
   const inputRef = useRef<HTMLInputElement>(null);
   const [localInstruction, setLocalInstruction] = useState("");

   // Focus input when panel opens
   useEffect(() => {
      if (editState.phase === "prompting" && inputRef.current) {
         inputRef.current.focus();
      }
   }, [editState.phase]);

   // Sync local instruction with store
   useEffect(() => {
      setLocalInstruction(editState.instruction);
   }, [editState.instruction]);

   const handleSubmit = useCallback(
      (e: React.FormEvent) => {
         e.preventDefault();
         if (!localInstruction.trim()) return;

         setEditInstruction(localInstruction);
         onSubmit?.(localInstruction);
      },
      [localInstruction, onSubmit],
   );

   const handleAccept = useCallback(() => {
      const state = getEditState();
      if (!state.streamedResult) return;

      editor.update(() => {
         const selection = $getSelection();
         if ($isRangeSelection(selection)) {
            selection.insertText(state.streamedResult);
         }
      });

      onAccept?.();
      clearEdit();
      hideDiff();
   }, [editor, onAccept]);

   const handleReject = useCallback(() => {
      onReject?.();
      clearEdit();
      hideDiff();
   }, [onReject]);

   // Hide if not active
   if (editState.phase === "idle" || !editState.position) {
      return null;
   }

   return (
      <div
         className={cn(
            "absolute z-50 bg-popover border border-border rounded-lg shadow-lg",
            "animate-in fade-in-0 slide-in-from-top-2",
            "w-[400px]",
            className,
         )}
         style={{
            top: editState.position.top,
            left: editState.position.left,
         }}
      >
         {/* Header */}
         <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Editar com AI</span>

            <button
               className="ml-auto p-1 rounded hover:bg-accent"
               onClick={handleReject}
               type="button"
            >
               <X className="h-4 w-4" />
            </button>
         </div>

         {/* Selected text preview */}
         <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">
               Texto selecionado:
            </p>
            <p className="text-sm line-clamp-2">{editState.selectedText}</p>
         </div>

         {/* Prompt input */}
         {editState.phase === "prompting" && (
            <form className="p-3" onSubmit={handleSubmit}>
               <div className="flex gap-2">
                  <input
                     className={cn(
                        "flex-1 px-3 py-2 text-sm rounded-md",
                        "bg-background border border-input",
                        "focus:outline-none focus:ring-2 focus:ring-ring",
                     )}
                     onChange={(e) => setLocalInstruction(e.target.value)}
                     placeholder="Ex: Reescreva de forma mais formal..."
                     ref={inputRef}
                     type="text"
                     value={localInstruction}
                  />
                  <button
                     className={cn(
                        "px-3 py-2 rounded-md",
                        "bg-primary text-primary-foreground",
                        "hover:bg-primary/90",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                     )}
                     disabled={!localInstruction.trim()}
                     type="submit"
                  >
                     <Send className="h-4 w-4" />
                  </button>
               </div>
            </form>
         )}

         {/* Streaming result */}
         {(editState.phase === "streaming" ||
            editState.phase === "complete") && (
            <div className="p-3">
               <p className="text-xs text-muted-foreground mb-2">Resultado:</p>
               <div className="max-h-[200px] overflow-y-auto p-2 bg-muted/30 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap">
                     {editState.streamedResult || "Gerando..."}
                  </pre>
               </div>
            </div>
         )}

         {/* Actions for complete state */}
         {editState.phase === "complete" && (
            <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border bg-muted/50">
               <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded hover:bg-accent"
                  onClick={handleReject}
                  type="button"
               >
                  <X className="h-4 w-4" />
                  <span>Rejeitar</span>
               </button>

               <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleAccept}
                  type="button"
               >
                  <Check className="h-4 w-4" />
                  <span>Aceitar</span>
                  <kbd className="ml-1 text-[10px] opacity-75">Ctrl+Enter</kbd>
               </button>
            </div>
         )}
      </div>
   );
}

/**
 * Edit Keyboard Hints Component
 */
export function EditKeyboardHints(): React.JSX.Element {
   return (
      <div className="text-xs text-muted-foreground space-y-1">
         <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+K</kbd>
            <span>Editar com AI</span>
         </div>
         <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+Enter</kbd>
            <span>Aceitar edição</span>
         </div>
         <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd>
            <span>Cancelar</span>
         </div>
      </div>
   );
}

/**
 * Selection hint shown when text is selected
 */
export function EditSelectionHint(): React.JSX.Element | null {
   const [hasSelection, setHasSelection] = useState(false);
   const [editor] = useLexicalComposerContext();

   useEffect(() => {
      const checkSelection = () => {
         editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) && !selection.isCollapsed()) {
               setHasSelection(true);
            } else {
               setHasSelection(false);
            }
         });
      };

      const removeListener = editor.registerUpdateListener(() => {
         checkSelection();
      });

      return removeListener;
   }, [editor]);

   if (!hasSelection) {
      return null;
   }

   return (
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
         <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
            Ctrl+K
         </kbd>
         <span>para editar com AI</span>
      </div>
   );
}
