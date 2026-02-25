import { Store } from "@tanstack/react-store";
import type React from "react";

export interface ContextPanelTab {
   id: string;
   icon: React.ElementType;
   label: string;
   content: React.ReactNode;
   order?: number;
}

interface ContextPanelState {
   isOpen: boolean;
   activeTabId: string;
   dynamicTabs: ContextPanelTab[];
   infoContent: React.ReactNode;
}

export const contextPanelStore = new Store<ContextPanelState>({
   isOpen: false,
   activeTabId: "info",
   dynamicTabs: [],
   infoContent: null,
});
