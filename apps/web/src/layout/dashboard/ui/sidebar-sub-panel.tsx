import { Input } from "@packages/ui/components/input";
import {
   SidebarManager,
   SidebarProvider,
   useSidebar,
   useSidebarManager,
} from "@packages/ui/components/sidebar";
import { cn } from "@packages/ui/lib/utils";
import { Search, X } from "lucide-react";
import { useCallback } from "react";
import {
   type SubSidebarSection,
   setActiveSection,
   useSidebarNav,
} from "../hooks/use-sidebar-nav";
import { SubSidebarItemList } from "./sub-sidebar-item-list";
import { SubSidebarNewMenu } from "./sub-sidebar-new-menu";

const SECTION_TITLES: Record<string, string> = {
   dashboards: "Dashboards",
   insights: "Insights",
   "data-management": "Dados",
};

export function SidebarSubPanel() {
   const { activeSection } = useSidebarNav();

   const handleOpenChange = useCallback((open: boolean) => {
      if (!open) setActiveSection(null);
   }, []);

   return (
      <SidebarProvider
         className="min-h-0"
         onOpenChange={handleOpenChange}
         open={activeSection !== null}
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
   activeSection: SubSidebarSection | null;
}) {
   const { open } = useSidebar();
   const { searchQuery, setSearchQuery } = useSidebarNav();
   const manager = useSidebarManager();
   const mainSidebar = manager.use("main");
   const panelLeft =
      mainSidebar?.state === "collapsed"
         ? "calc(var(--sidebar-width-icon) + 1rem)"
         : "calc(var(--sidebar-width) - 1px)";

   const handleItemClick = useCallback(() => {
      setActiveSection(null);
   }, []);

   if (!open || !activeSection) return null;

   return (
      <>
         <button
            aria-label="Fechar painel"
            className="fixed inset-y-0 right-0 z-[900] bg-background/35 backdrop-blur-md backdrop-saturate-150"
            onClick={() => setActiveSection(null)}
            style={{ left: `calc(${panelLeft} + 280px)` }}
            type="button"
         />
         <div
            className={cn(
               "fixed inset-y-0 z-[1000] w-[280px]",
               "border-l border-white/10 bg-sidebar shadow-xl",
               "rounded-none",
               "flex flex-col overflow-hidden",
            )}
            style={{ left: panelLeft }}
         >
            {/* Header */}
            <div className="px-3 pt-3 pb-2">
               <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">
                     {SECTION_TITLES[activeSection]}
                  </h2>
                  <div className="flex items-center gap-0.5">
                     {activeSection !== "data-management" && (
                        <SubSidebarNewMenu
                           onAction={handleItemClick}
                           section={activeSection}
                        />
                     )}
                     <button
                        aria-label="Fechar painel"
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setActiveSection(null)}
                        type="button"
                     >
                        <X className="size-4" />
                     </button>
                  </div>
               </div>

               {/* Search */}
               <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                     className="h-8 pl-8 text-sm"
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Buscar..."
                     value={searchQuery}
                  />
               </div>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto">
               <SubSidebarItemList
                  onItemClick={handleItemClick}
                  searchQuery={searchQuery}
                  section={activeSection}
               />
            </div>
         </div>
      </>
   );
}
