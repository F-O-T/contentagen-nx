import { Input } from "@packages/ui/components/input";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarManager,
   SidebarProvider,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Search, X } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { useSidebarNav } from "../hooks/use-sidebar-nav";
import { SubSidebarItemList } from "./sub-sidebar-item-list";
import { SubSidebarNewMenu } from "./sub-sidebar-new-menu";

const SECTION_TITLES: Record<string, string> = {
   dashboards: "Dashboards",
   insights: "Insights",
};

export function SidebarSubPanel() {
   const { activeSection } = useSidebarNav();

   return (
      <SidebarProvider
         defaultOpen={false}
         style={
            {
               "--sidebar-width": "280px",
            } as React.CSSProperties
         }
      >
         <SidebarManager name="sub-panel">
            <SubPanelSidebar activeSection={activeSection} />
         </SidebarManager>
      </SidebarProvider>
   );
}

function SubPanelSidebar({
   activeSection,
}: {
   activeSection: "dashboards" | "insights" | null;
}) {
   const { open, setOpen } = useSidebar();
   const [searchQuery, setSearchQuery] = useState("");

   // Reset search when section changes
   useEffect(() => {
      setSearchQuery("");
   }, [activeSection]);

   // Close when no active section
   useEffect(() => {
      if (!activeSection && open) {
         setOpen(false);
      }
   }, [activeSection, open, setOpen]);

   if (!open || !activeSection) return null;

   return (
      <Sidebar className="border-r" collapsible="none" side="left">
         {/* Header */}
         <SidebarHeader className="px-3 pt-3 pb-2">
            <div className="flex items-center justify-between gap-2">
               <h2 className="text-sm font-semibold">
                  {SECTION_TITLES[activeSection]}
               </h2>
               <div className="flex items-center gap-0.5">
                  <SubSidebarNewMenu section={activeSection} />
                  <button
                     aria-label="Fechar painel"
                     className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                     onClick={() => setOpen(false)}
                     type="button"
                  >
                     <X className="size-4" />
                  </button>
               </div>
            </div>

            {/* Search */}
            <div className="relative">
               <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
               <Input
                  className="h-8 pl-8 text-sm"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  value={searchQuery}
               />
            </div>
         </SidebarHeader>

         {/* Item List */}
         <SidebarContent>
            <SubSidebarItemList
               searchQuery={searchQuery}
               section={activeSection}
            />
         </SidebarContent>
      </Sidebar>
   );
}
