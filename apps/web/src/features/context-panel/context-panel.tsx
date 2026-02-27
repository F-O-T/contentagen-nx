"use client";

import { Button } from "@packages/ui/components/button";
import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelHeaderActions,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
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
import { useNavigate, useParams } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { Info, MessageSquare, MoveDiagonalIcon, X } from "lucide-react";
import type React from "react";
import { type ContextPanelTab, contextPanelStore } from "./context-panel-store";
import { TecoChatTab } from "./ui/teco-chat-tab";
import {
   closeContextPanel,
   openContextPanel,
   setActiveTab,
} from "./use-context-panel";

function InfoContent() {
   const { infoContent } = useStore(contextPanelStore);
   if (!infoContent) {
      return (
         <ContextPanel>
            <ContextPanelContent className="flex items-center justify-center p-6">
               <p className="text-sm text-muted-foreground/50">
                  Sem informações
               </p>
            </ContextPanelContent>
         </ContextPanel>
      );
   }
   return <>{infoContent}</>;
}

function ChatContent() {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   return (
      <ContextPanel>
         <ContextPanelHeader>
            <ContextPanelTitle>Teco AI</ContextPanelTitle>
            <ContextPanelHeaderActions>
               <Button
                  className="size-6 rounded"
                  onClick={() =>
                     navigate({
                        to: "/$slug/$teamSlug/chat",
                        params: { slug, teamSlug },
                     })
                  }
                  size="icon"
                  type="button"
                  variant="ghost"
               >
                  <MoveDiagonalIcon className="size-4" />
               </Button>
            </ContextPanelHeaderActions>
         </ContextPanelHeader>
         <ContextPanelContent>
            <TecoChatTab />
         </ContextPanelContent>
      </ContextPanel>
   );
}

const CHAT_TAB: ContextPanelTab = {
   id: "chat",
   icon: MessageSquare,
   label: "Chat IA",
   content: <ChatContent />,
   order: 1,
};

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
         <SidebarContent className="h-full overflow-hidden rounded-b-xl bg-muted">
            {activeTab?.content}
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
