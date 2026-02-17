/**
 * EnhancedComposer
 *
 * Wraps ComposerPrimitive.Input with slash command (/) and @ mention (@) popover support.
 * Intercepting onChange to detect triggers and show the appropriate popover.
 */

import { ComposerPrimitive, useComposerRuntime } from "@assistant-ui/react";
import { useStore } from "@tanstack/react-store";
import { cn } from "@packages/ui/lib/utils";
import { useCallback, useState } from "react";
import { editorContextStore } from "../stores/editor-context-store";

// ============================================================================
// Constants
// ============================================================================

const SLASH_COMMANDS = [
   {
      id: "melhore",
      label: "/melhore",
      description: "Melhorar texto",
      prompt: "Melhore a qualidade e clareza deste texto:",
   },
   {
      id: "expand",
      label: "/expand",
      description: "Expandir seção",
      prompt: "Expanda esta seção com mais detalhes:",
   },
   {
      id: "resumo",
      label: "/resumo",
      description: "Resumir conteúdo",
      prompt: "Faça um resumo conciso deste conteúdo:",
   },
   {
      id: "seo",
      label: "/seo",
      description: "Otimizar para SEO",
      prompt: "Otimize este conteúdo para SEO mantendo a naturalidade:",
   },
   {
      id: "pesquise",
      label: "/pesquise",
      description: "Pesquisar tema",
      prompt: "Pesquise e traga informações atualizadas sobre:",
   },
   {
      id: "corrige",
      label: "/corrige",
      description: "Corrigir erros",
      prompt: "Corrija erros gramaticais e ortográficos:",
   },
] as const;

const AT_MENTIONS = [
   {
      id: "selecao",
      label: "@selecao",
      description: "Texto selecionado",
   },
   {
      id: "documento",
      label: "@documento",
      description: "Documento completo",
   },
   {
      id: "titulo",
      label: "@titulo",
      description: "Título e metadados",
   },
] as const;

// ============================================================================
// Types
// ============================================================================

interface EnhancedComposerProps {
   className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function EnhancedComposer({ className }: EnhancedComposerProps) {
   const composerRuntime = useComposerRuntime();

   const [slashOpen, setSlashOpen] = useState(false);
   const [atOpen, setAtOpen] = useState(false);
   const [filterText, setFilterText] = useState("");

   const selectedText = useStore(editorContextStore, (s) => s.selectedText);
   const documentMarkdown = useStore(editorContextStore, (s) => s.documentMarkdown);

   // Detect triggers on input change
   const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
         const value = e.target.value;

         // Slash command detection: value starts with /
         if (value.startsWith("/")) {
            const filter = value.slice(1).toLowerCase();
            setFilterText(filter);
            setSlashOpen(true);
            setAtOpen(false);
            return;
         }

         // @ mention detection: find last @ followed by non-whitespace
         const atMatch = value.match(/@([^\s]*)$/);
         if (atMatch) {
            const filter = atMatch[1].toLowerCase();
            setFilterText(filter);
            setAtOpen(true);
            setSlashOpen(false);
            return;
         }

         // No trigger active
         setSlashOpen(false);
         setAtOpen(false);
         setFilterText("");
      },
      [],
   );

   // Handle Escape to close popovers
   const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
         if (e.key === "Escape") {
            setSlashOpen(false);
            setAtOpen(false);
         }
      },
      [],
   );

   // Select a slash command — prefill composer text with prompt + space
   const handleSlashSelect = useCallback(
      (prompt: string) => {
         composerRuntime.setText(`${prompt} `);
         setSlashOpen(false);
         setFilterText("");
      },
      [composerRuntime],
   );

   // Resolve an @ mention token to its context string
   const resolveAtMention = useCallback(
      (id: string): string => {
         switch (id) {
            case "selecao":
               if (selectedText) {
                  return `[seleção: "${selectedText.slice(0, 100)}"]`;
               }
               return "[seleção vazia]";
            case "documento":
               if (documentMarkdown) {
                  return "[documento completo incluído]";
               }
               return "[documento vazio]";
            case "titulo":
               return "[título e metadados]";
            default:
               return `[@${id}]`;
         }
      },
      [selectedText, documentMarkdown],
   );

   // Select an @ mention — replace the @... token in composer text
   const handleAtSelect = useCallback(
      (id: string) => {
         const currentText = composerRuntime.getState().text;
         const resolved = resolveAtMention(id);
         // Replace the last @... token with the resolved value
         const newText = currentText.replace(/@([^\s]*)$/, resolved);
         composerRuntime.setText(newText + " ");
         setAtOpen(false);
         setFilterText("");
      },
      [composerRuntime, resolveAtMention],
   );

   // Filter commands based on what the user typed after the trigger
   const filteredSlashCommands = SLASH_COMMANDS.filter(
      (cmd) =>
         filterText === "" ||
         cmd.id.startsWith(filterText) ||
         cmd.label.slice(1).startsWith(filterText),
   );

   const filteredAtMentions = AT_MENTIONS.filter(
      (mention) =>
         filterText === "" ||
         mention.id.startsWith(filterText) ||
         mention.label.slice(1).startsWith(filterText),
   );

   const showSlash = slashOpen && filteredSlashCommands.length > 0;
   const showAt = atOpen && filteredAtMentions.length > 0;

   return (
      <div className="relative flex-1 flex flex-col">
         {/* Slash command popover */}
         {showSlash && (
            <div className="absolute bottom-full left-0 right-0 mb-1 z-50 rounded-lg border bg-popover text-popover-foreground shadow-md overflow-hidden">
               <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide border-b">
                  Comandos
               </div>
               {filteredSlashCommands.map((cmd) => (
                  <button
                     key={cmd.id}
                     type="button"
                     className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                     onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur before click
                        handleSlashSelect(cmd.prompt);
                     }}
                  >
                     <span className="font-medium text-primary shrink-0">{cmd.label}</span>
                     <span className="text-muted-foreground text-xs">{cmd.description}</span>
                  </button>
               ))}
            </div>
         )}

         {/* @ mention popover */}
         {showAt && (
            <div className="absolute bottom-full left-0 right-0 mb-1 z-50 rounded-lg border bg-popover text-popover-foreground shadow-md overflow-hidden">
               <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide border-b">
                  Mencionar
               </div>
               {filteredAtMentions.map((mention) => (
                  <button
                     key={mention.id}
                     type="button"
                     className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                     onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur before click
                        handleAtSelect(mention.id);
                     }}
                  >
                     <span className="font-medium text-primary shrink-0">{mention.label}</span>
                     <span className="text-muted-foreground text-xs">{mention.description}</span>
                  </button>
               ))}
            </div>
         )}

         <ComposerPrimitive.Input
            className={cn(
               "px-3 py-2 text-sm rounded-lg resize-none",
               "bg-muted border-none",
               "focus:outline-none focus:ring-2 focus:ring-ring",
               "min-h-[60px] max-h-[120px]",
               "disabled:opacity-50 disabled:cursor-not-allowed",
               className,
            )}
            placeholder="Como posso ajudar com seu conteudo? Digite / para comandos ou @ para mencionar contexto"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
         />
      </div>
   );
}
