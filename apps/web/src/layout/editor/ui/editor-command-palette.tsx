/**
 * Command palette (Cmd+Shift+P):
 * - Search-based command execution
 * - Categories: Actions, Panels, Navigation
 */

import {
   CommandDialog,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
   CommandSeparator,
} from "@packages/ui/components/command";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
   AlertCircle,
   Archive,
   CheckCircle,
   Download,
   FileText,
   Home,
   type LucideIcon,
   MessageSquare,
   Save,
   Settings,
   Trash2,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import {
   setCommandPaletteOpen,
   toggleChatSidebar,
   toggleConfigPanel,
   toggleDiagnosticsPanel,
   useCommandPalette,
} from "../hooks/use-editor-state";

// ============================================================================
// Types
// ============================================================================

interface CommandItem {
   id: string;
   label: string;
   description?: string;
   icon: LucideIcon;
   shortcut?: string;
   category: "actions" | "navigation" | "panels";
   action: () => void;
}

interface EditorCommandPaletteProps {
   onSave: () => void;
   onPublish: () => void;
   onArchive: () => void;
   onDelete: () => void;
   status: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function EditorCommandPalette({
   onSave,
   onPublish,
   onArchive,
   onDelete,
   status,
}: EditorCommandPaletteProps) {
   const isOpen = useCommandPalette();
   const navigate = useNavigate();
   const { slug } = useParams({
      from: "/_authenticated/$slug/_editor/$contentId",
   });

   // Build command list
   const commands = useMemo<CommandItem[]>(() => {
      const items: CommandItem[] = [];

      // === Actions ===
      items.push({
         id: "action-save",
         label: "Salvar",
         icon: Save,
         shortcut: "Cmd+S",
         category: "actions",
         action: onSave,
      });

      if (status === "draft") {
         items.push({
            id: "action-publish",
            label: "Publicar",
            icon: CheckCircle,
            category: "actions",
            action: onPublish,
         });
      }

      if (status !== "archived") {
         items.push({
            id: "action-archive",
            label: "Arquivar",
            icon: Archive,
            category: "actions",
            action: onArchive,
         });
      }

      items.push(
         {
            id: "action-delete",
            label: "Excluir",
            icon: Trash2,
            category: "actions",
            action: onDelete,
         },
         {
            id: "action-export",
            label: "Exportar",
            description: "Baixar em varios formatos",
            icon: Download,
            category: "actions",
            action: () => {
               // TODO: Export functionality
            },
         },
      );

      // === Panels ===
      items.push(
         {
            id: "panel-chat",
            label: "Abrir/Fechar Chat AI",
            icon: MessageSquare,
            shortcut: "Ctrl+B",
            category: "panels",
            action: () => {
               toggleChatSidebar();
            },
         },
         {
            id: "panel-diagnostics",
            label: "Abrir/Fechar Diagnosticos",
            icon: AlertCircle,
            shortcut: "Ctrl+Shift+D",
            category: "panels",
            action: () => {
               toggleDiagnosticsPanel();
            },
         },
         {
            id: "panel-settings",
            label: "Abrir/Fechar Configuracoes",
            icon: Settings,
            category: "panels",
            action: () => {
               toggleConfigPanel();
            },
         },
      );

      // === Navigation ===
      items.push(
         {
            id: "nav-content-list",
            label: "Ir para Lista de Conteudos",
            icon: FileText,
            category: "navigation",
            action: () => {
               navigate({ to: `/${slug}/content` });
            },
         },
         {
            id: "nav-home",
            label: "Ir para Home",
            icon: Home,
            category: "navigation",
            action: () => {
               navigate({ to: `/${slug}/home` });
            },
         },
      );

      return items;
   }, [status, onSave, onPublish, onArchive, onDelete, navigate, slug]);

   // Group commands by category
   const groupedCommands = useMemo(() => {
      const groups: Record<string, CommandItem[]> = {
         actions: [],
         panels: [],
         navigation: [],
      };

      for (const cmd of commands) {
         groups[cmd.category].push(cmd);
      }

      return groups;
   }, [commands]);

   // Handle command execution
   const executeCommand = useCallback((command: CommandItem) => {
      setCommandPaletteOpen(false);
      // Execute after dialog closes for smoother UX
      requestAnimationFrame(() => {
         command.action();
      });
   }, []);

   return (
      <CommandDialog onOpenChange={setCommandPaletteOpen} open={isOpen}>
         <CommandInput placeholder="Buscar comando..." />
         <CommandList>
            <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>

            {/* Actions */}
            {groupedCommands.actions.length > 0 && (
               <CommandGroup heading="Acoes">
                  {groupedCommands.actions.map((cmd) => (
                     <CommandPaletteItem
                        command={cmd}
                        key={cmd.id}
                        onSelect={() => executeCommand(cmd)}
                     />
                  ))}
               </CommandGroup>
            )}

            <CommandSeparator />

            {/* Panels */}
            {groupedCommands.panels.length > 0 && (
               <CommandGroup heading="Paineis">
                  {groupedCommands.panels.map((cmd) => (
                     <CommandPaletteItem
                        command={cmd}
                        key={cmd.id}
                        onSelect={() => executeCommand(cmd)}
                     />
                  ))}
               </CommandGroup>
            )}

            <CommandSeparator />

            {/* Navigation */}
            {groupedCommands.navigation.length > 0 && (
               <CommandGroup heading="Navegacao">
                  {groupedCommands.navigation.map((cmd) => (
                     <CommandPaletteItem
                        command={cmd}
                        key={cmd.id}
                        onSelect={() => executeCommand(cmd)}
                     />
                  ))}
               </CommandGroup>
            )}
         </CommandList>
      </CommandDialog>
   );
}

// ============================================================================
// Sub-components
// ============================================================================

interface CommandPaletteItemProps {
   command: CommandItem;
   onSelect: () => void;
}

function CommandPaletteItem({ command, onSelect }: CommandPaletteItemProps) {
   const Icon = command.icon;

   return (
      <CommandItem className="flex items-center gap-3" onSelect={onSelect}>
         <Icon className="size-4 text-muted-foreground" />
         <div className="flex-1">
            <span>{command.label}</span>
            {command.description && (
               <span className="ml-2 text-xs text-muted-foreground">
                  {command.description}
               </span>
            )}
         </div>
         {command.shortcut && (
            <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
               {command.shortcut}
            </kbd>
         )}
      </CommandItem>
   );
}
