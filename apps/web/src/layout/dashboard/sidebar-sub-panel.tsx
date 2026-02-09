// apps/web/src/layout/dashboard/sidebar-sub-panel.tsx
import { Input } from "@packages/ui/components/input";
import { cn } from "@packages/ui/lib/utils";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
   closeSubPanel,
   setManualClose,
   useSidebarNav,
} from "@/hooks/use-sidebar-nav";
import { SubSidebarItemList } from "./sub-sidebar-item-list";
import { SubSidebarNewMenu } from "./sub-sidebar-new-menu";

const SECTION_TITLES: Record<string, string> = {
   dashboards: "Dashboards",
   insights: "Insights",
};

export function SidebarSubPanel() {
   const { activeSubPanel } = useSidebarNav();
   const [searchQuery, setSearchQuery] = useState("");
   const panelRef = useRef<HTMLDivElement>(null);
   const isOpen = activeSubPanel !== null;

   const handleClose = () => {
      closeSubPanel();
      setManualClose();
      setSearchQuery("");
   };

   // Close on click outside (on the backdrop)
   const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
         handleClose();
      }
   };

   // Close on Escape
   useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Escape") {
            handleClose();
         }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [isOpen]);

   // Reset search when section changes
   useEffect(() => {
      setSearchQuery("");
   }, [activeSubPanel]);

   if (!isOpen || !activeSubPanel) return null;

   return (
      <>
         {/* Backdrop with blur — Escape is handled by the global keydown listener above */}
         {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop overlay for dismissing the sub-panel */}
         <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px] transition-opacity"
            onClick={handleBackdropClick}
            onKeyDown={(e) => {
               if (e.key === "Escape") handleClose();
            }}
         />

         {/* Floating panel — positioned next to the sidebar */}
         <div
            className={cn(
               "fixed z-50 top-2 bottom-2 left-[var(--sidebar-panel-left)] w-[280px]",
               "rounded-lg border bg-background shadow-xl",
               "flex flex-col overflow-hidden",
               "animate-in slide-in-from-left-2 fade-in-0 duration-200",
            )}
            ref={panelRef}
            style={
               {
                  // Will be set via CSS variable from the sidebar width
                  "--sidebar-panel-left":
                     "calc(var(--sidebar-width, 220px) + 8px)",
               } as React.CSSProperties
            }
         >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
               <h2 className="text-sm font-semibold">
                  {SECTION_TITLES[activeSubPanel]}
               </h2>
               <div className="flex items-center gap-0.5">
                  <SubSidebarNewMenu section={activeSubPanel} />
                  <button
                     aria-label="Fechar painel"
                     className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                     onClick={handleClose}
                     type="button"
                  >
                     <X className="size-4" />
                  </button>
               </div>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
               <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                     className="h-8 pl-8 text-sm"
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Buscar..."
                     value={searchQuery}
                  />
               </div>
            </div>

            {/* Item List (reused from existing sub-sidebar) */}
            <div className="flex-1 overflow-y-auto">
               <SubSidebarItemList
                  searchQuery={searchQuery}
                  section={activeSubPanel}
               />
            </div>
         </div>
      </>
   );
}
