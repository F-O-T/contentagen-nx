"use client";

import type { ContentMeta } from "@packages/database/schemas/content";
import { Link2, Settings2 } from "lucide-react";
import { useEffect } from "react";
import {
   registerTab,
   unregisterTab,
} from "@/features/context-panel/use-context-panel";
import {
	ContextPanel,
	ContextPanelContent,
	ContextPanelHeader,
	ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { FrontmatterSection } from "../../ui/frontmatter-section";
import { InternalLinksSidebar } from "./internal-links-sidebar";

interface EditorContextPanelTabsProps {
   contentId: string;
   meta: ContentMeta;
   onChange: (meta: ContentMeta) => void;
   readOnly: boolean;
}

export function EditorContextPanelTabs({
   contentId,
   meta,
   onChange,
   readOnly,
}: EditorContextPanelTabsProps) {
   // Settings tab: re-registers when meta/onChange/readOnly change so panel always has fresh data
   useEffect(() => {
      registerTab({
         id: "settings",
         icon: Settings2,
         label: "Metadados",
         content: (
            <ContextPanel>
               <ContextPanelHeader>
                  <ContextPanelTitle>Metadados</ContextPanelTitle>
               </ContextPanelHeader>
               <ContextPanelContent>
                  <FrontmatterSection
                     meta={meta}
                     onChange={onChange}
                     readOnly={readOnly}
                  />
               </ContextPanelContent>
            </ContextPanel>
         ),
         order: 1,
      });
   }, [meta, onChange, readOnly]);

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

   // Clean up settings tab on unmount
   useEffect(() => {
      return () => {
         unregisterTab("settings");
      };
   }, []);

   return null;
}
