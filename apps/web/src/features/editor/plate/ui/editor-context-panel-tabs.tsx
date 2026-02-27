"use client";

import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { Link2 } from "lucide-react";
import { useEffect } from "react";
import {
   registerTab,
   unregisterTab,
} from "@/features/context-panel/use-context-panel";
import { InternalLinksSidebar } from "./internal-links-sidebar";

interface EditorContextPanelTabsProps {
   contentId: string;
}

export function EditorContextPanelTabs({
   contentId,
}: EditorContextPanelTabsProps) {
   // Links tab: registers once per contentId
   useEffect(() => {
      registerTab({
         id: "links",
         icon: Link2,
         label: "Links do Cluster",
         content: (
            <ContextPanel>
               <ContextPanelHeader>
                  <ContextPanelTitle>Links do Cluster</ContextPanelTitle>
               </ContextPanelHeader>
               <ContextPanelContent>
                  <InternalLinksSidebar contentId={contentId} />
               </ContextPanelContent>
            </ContextPanel>
         ),
         order: 2,
      });
      return () => {
         unregisterTab("links");
      };
   }, [contentId]);

   return null;
}
