import { Input } from "@packages/ui/components/input";
import { cn } from "@packages/ui/lib/utils";
import { Search, X } from "lucide-react";
import { useState } from "react";
import {
   closeSubSidebar,
   setManualClose,
   useSidebarNav,
} from "@/hooks/use-sidebar-nav";
import { SubSidebarItemList } from "./sub-sidebar-item-list";
import { SubSidebarNewMenu } from "./sub-sidebar-new-menu";

const SECTION_TITLES: Record<string, string> = {
   dashboards: "Dashboards",
   insights: "Insights",
};

export function SubSidebar() {
   const { activeSubSidebar } = useSidebarNav();
   const [searchQuery, setSearchQuery] = useState("");
   const isOpen = activeSubSidebar !== null;

   const handleClose = () => {
      closeSubSidebar();
      setManualClose();
      setSearchQuery("");
   };

   return (
      <aside
         className={cn(
            "flex h-screen flex-col border-r bg-background transition-all duration-200 ease-in-out overflow-hidden",
            isOpen ? "w-[280px]" : "w-0",
         )}
      >
         {activeSubSidebar ? (
            <>
               {/* Header */}
               <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
                  <h2 className="text-sm font-semibold">
                     {SECTION_TITLES[activeSubSidebar]}
                  </h2>
                  <div className="flex items-center gap-0.5">
                     <SubSidebarNewMenu section={activeSubSidebar} />
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

               {/* Item List */}
               <SubSidebarItemList
                  searchQuery={searchQuery}
                  section={activeSubSidebar}
               />
            </>
         ) : null}
      </aside>
   );
}
