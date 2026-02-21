import {
   closeTab,
   focusTab,
   getNextTabId,
   getPreviousTabId,
   tabStore,
} from "@/hooks/use-tab-store";
import { useEventListener } from "@/hooks/use-event-listener";
import { useCallback } from "react";

export function useTabKeyboardShortcuts({
   onNewTab,
   onTabFocus,
   homeRoute,
   homeParams,
}: {
   onNewTab: () => void;
   onTabFocus: (tabId: string) => void;
   homeRoute: string;
   homeParams: Record<string, string>;
}) {
   const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
         const isCtrlOrCmd = e.ctrlKey || e.metaKey;

         if (isCtrlOrCmd && e.key === "w") {
            e.preventDefault();
            const { activeTabId } = tabStore.state;
            if (activeTabId) {
               const tab = tabStore.state.tabs.find(
                  (t) => t.id === activeTabId,
               );
               if (tab && !tab.isPinned) {
                  closeTab(activeTabId);
                  const newActiveId = tabStore.state.activeTabId;
                  if (newActiveId) {
                     onTabFocus(newActiveId);
                  }
               }
            }
         }

         if (isCtrlOrCmd && e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            const nextId = getNextTabId();
            if (nextId) {
               focusTab(nextId);
               onTabFocus(nextId);
            }
         }

         if (isCtrlOrCmd && e.key === "Tab" && e.shiftKey) {
            e.preventDefault();
            const prevId = getPreviousTabId();
            if (prevId) {
               focusTab(prevId);
               onTabFocus(prevId);
            }
         }

         if (isCtrlOrCmd && e.key === "t") {
            e.preventDefault();
            onNewTab();
         }
      },
      [onNewTab, onTabFocus, homeRoute, homeParams],
   );

   useEventListener("keydown", handleKeyDown);
}
