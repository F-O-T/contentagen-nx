import {
   ContextMenu,
   ContextMenuContent,
   ContextMenuItem,
   ContextMenuSeparator,
   ContextMenuTrigger,
} from "@packages/ui/components/context-menu";
import { cn } from "@packages/ui/lib/utils";
import {
   BarChart3,
   ClipboardList,
   CreditCard,
   Database,
   FileText,
   House,
   LayoutDashboard,
   Lightbulb,
   Pin,
   PinOff,
   Search,
   Settings,
   Sparkles,
   X,
} from "lucide-react";
import { type MouseEvent, useCallback } from "react";
import type { TabType } from "@/hooks/use-tab-store";

// ── Icon mapping ─────────────────────────────────────────────────────────────

const TAB_ICON_MAP: Record<string, typeof House> = {
   House,
   FileText,
   LayoutDashboard,
   Lightbulb,
   ClipboardList,
   Settings,
   Search,
   CreditCard,
   Sparkles,
   Database,
   BarChart3,
};

const TAB_TYPE_ICON: Record<TabType, string> = {
   home: "House",
   "content-list": "FileText",
   "content-editor": "FileText",
   dashboard: "LayoutDashboard",
   insight: "Lightbulb",
   "insight-new": "Lightbulb",
   form: "ClipboardList",
   "form-submissions": "ClipboardList",
   settings: "Settings",
   search: "Search",
   "data-management": "Database",
   billing: "CreditCard",
   plans: "Sparkles",
   generic: "FileText",
};

function getTabIcon(type: TabType, iconOverride?: string) {
   const iconName = iconOverride ?? TAB_TYPE_ICON[type] ?? "FileText";
   return TAB_ICON_MAP[iconName] ?? FileText;
}

// ── Component ────────────────────────────────────────────────────────────────

interface TabItemProps {
   id: string;
   label: string;
   type: TabType;
   icon?: string;
   isActive: boolean;
   isPinned?: boolean;
   isDirty?: boolean;
   onFocus: (tabId: string) => void;
   onClose: (tabId: string) => void;
   onPin: (tabId: string) => void;
   onUnpin: (tabId: string) => void;
   onCloseOthers: (tabId: string) => void;
   onCloseAll: () => void;
}

export function TabItem({
   id,
   label,
   type,
   icon,
   isActive,
   isPinned,
   isDirty,
   onFocus,
   onClose,
   onPin,
   onUnpin,
   onCloseOthers,
   onCloseAll,
}: TabItemProps) {
   const Icon = getTabIcon(type, icon);

   const handleClick = useCallback(() => {
      onFocus(id);
   }, [id, onFocus]);

   const handleClose = useCallback(
      (e: MouseEvent) => {
         e.stopPropagation();
         onClose(id);
      },
      [id, onClose],
   );

   const handleMiddleClick = useCallback(
      (e: MouseEvent) => {
         // Middle-click to close
         if (e.button === 1 && !isPinned) {
            e.preventDefault();
            onClose(id);
         }
      },
      [id, isPinned, onClose],
   );

   return (
      <ContextMenu>
         <ContextMenuTrigger asChild>
            <button
               className={cn(
                  "group/tab relative flex h-8 min-w-0 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-medium transition-colors select-none",
                  isPinned && !isActive && "max-w-10",
                  !isPinned && "max-w-[200px]",
                  isActive
                     ? "border-primary text-foreground bg-background"
                     : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
               )}
               onClick={handleClick}
               onMouseDown={handleMiddleClick}
               title={label}
               type="button"
            >
               <Icon className="size-3.5 shrink-0" />
               {(!isPinned || isActive) && (
                  <span className="truncate">{label}</span>
               )}

               {/* Dirty dot */}
               {isDirty && !isPinned && (
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
               )}

               {/* Close button */}
               {!isPinned && (
                  <button
                     className={cn(
                        "ml-auto flex size-4 shrink-0 items-center justify-center rounded-sm transition-colors",
                        "hover:bg-muted-foreground/20",
                        isActive
                           ? "opacity-70 hover:opacity-100"
                           : "opacity-0 group-hover/tab:opacity-70 group-hover/tab:hover:opacity-100",
                     )}
                     onClick={handleClose}
                     tabIndex={-1}
                     type="button"
                  >
                     <X className="size-3" />
                  </button>
               )}
            </button>
         </ContextMenuTrigger>

         <ContextMenuContent>
            {isPinned ? (
               <ContextMenuItem onClick={() => onUnpin(id)}>
                  <PinOff className="mr-2 size-3.5" />
                  Desafixar
               </ContextMenuItem>
            ) : (
               <ContextMenuItem onClick={() => onPin(id)}>
                  <Pin className="mr-2 size-3.5" />
                  Fixar
               </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            {!isPinned && (
               <ContextMenuItem onClick={() => onClose(id)}>
                  Fechar
               </ContextMenuItem>
            )}
            <ContextMenuItem onClick={() => onCloseOthers(id)}>
               Fechar outras
            </ContextMenuItem>
            <ContextMenuItem onClick={onCloseAll}>Fechar todas</ContextMenuItem>
         </ContextMenuContent>
      </ContextMenu>
   );
}
