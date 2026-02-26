"use client";

import { Button } from "@packages/ui/components/button";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarManager,
} from "@packages/ui/components/sidebar";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useStore } from "@tanstack/react-store";
import { Info, MessageSquare, X } from "lucide-react";
import type React from "react";
import { type ContextPanelTab, contextPanelStore } from "./context-panel-store";
import { TecoChatTab } from "./ui/teco-chat-tab";
import {
   closeContextPanel,
   openContextPanel,
   setActiveTab,
} from "./use-context-panel";

const CHAT_TAB: ContextPanelTab = {
   id: "chat",
   icon: MessageSquare,
   label: "Chat IA",
   content: <TecoChatTab />,
   order: 1,
};

function InfoContent() {
   const { infoContent } = useStore(contextPanelStore);
   return <>{infoContent}</>;
}

const INFO_TAB: ContextPanelTab = {
   id: "info",
   icon: Info,
   label: "Informações",
   content: <InfoContent />,
   order: 0,
};

function ContextPanelInner() {
   const { activeTabId, dynamicTabs } = useStore(contextPanelStore);

   const allTabs: ContextPanelTab[] = [
      INFO_TAB,
      CHAT_TAB,
      ...dynamicTabs.sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
   ];

   const activeTab = allTabs.find((t) => t.id === activeTabId) ?? allTabs[0];

   return (
      <Sidebar
         className="px-0"
         collapsible="offcanvas"
         side="right"
         variant="inset"
      >
         <SidebarHeader className="bg-background rounded-t-xl">
            <div className="flex-row flex  items-center gap-2 ">
               <TooltipProvider>
                  {allTabs.map((tab) => (
                     <Tooltip key={tab.id}>
                        <TooltipTrigger asChild>
                           <Button
                              className={cn(
                                 "size-7 rounded",
                                 activeTabId === tab.id &&
                                    "bg-accent text-accent-foreground",
                              )}
                              onClick={() => setActiveTab(tab.id)}
                              size="icon"
                              type="button"
                              variant="ghost"
                           >
                              <tab.icon className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                           {tab.label}
                        </TooltipContent>
                     </Tooltip>
                  ))}
                  <div className="flex-1" />
                  <Button
                     className="size-7 rounded text-muted-foreground"
                     onClick={closeContextPanel}
                     size="icon"
                     type="button"
                     variant="ghost"
                  >
                     <X className="size-3.5" />
                  </Button>
               </TooltipProvider>
            </div>
         </SidebarHeader>

         {/* Active tab content — inset rounded card on bg-muted */}
         <SidebarContent className=" overflow-hidden h-full">
            <div className="h-full rounded-b-xl bg-muted ">
               {activeTab?.content}
            </div>
         </SidebarContent>
      </Sidebar>
   );
}

export function GlobalContextPanel() {
   const { isOpen } = useStore(contextPanelStore);

   return (
      <SidebarManager
         name="context-panel"
         onOpenChange={(open) =>
            open ? openContextPanel() : closeContextPanel()
         }
         open={isOpen}
         style={{ "--sidebar-width": "28rem" } as React.CSSProperties}
      >
         <ContextPanelInner />
      </SidebarManager>
   );
}
