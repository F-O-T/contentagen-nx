"use client";

import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useStore } from "@tanstack/react-store";
import { MessageSquare, X } from "lucide-react";
import { contextPanelStore, type ContextPanelTab } from "./context-panel-store";
import { closeContextPanel, setActiveTab } from "./use-context-panel";

function ChatPlaceholder() {
   return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
         <MessageSquare className="size-8 text-muted-foreground/30" />
         <p className="text-sm text-muted-foreground/60 leading-relaxed">
            Chat IA contextual em breve.
         </p>
      </div>
   );
}

const CHAT_TAB: ContextPanelTab = {
   id: "chat",
   icon: MessageSquare,
   label: "Chat IA",
   content: <ChatPlaceholder />,
   order: 0,
};

export function GlobalContextPanel() {
   const { isOpen, activeTabId, dynamicTabs } = useStore(contextPanelStore);

   const allTabs: ContextPanelTab[] = [
      CHAT_TAB,
      ...dynamicTabs.sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
   ];

   const activeTab = allTabs.find((t) => t.id === activeTabId) ?? allTabs[0];

   if (!isOpen) return null;

   return (
      <TooltipProvider>
         <div className="flex w-80 shrink-0 flex-col border-l bg-background">
            {/* Icon tab row */}
            <div className="flex h-10 shrink-0 items-center gap-0.5 border-b px-2">
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
                     <TooltipContent side="bottom">{tab.label}</TooltipContent>
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
            </div>

            {/* Active tab content */}
            <ScrollArea className="flex-1">
               {activeTab?.content}
            </ScrollArea>
         </div>
      </TooltipProvider>
   );
}
