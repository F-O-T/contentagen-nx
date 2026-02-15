import { useEffect } from "react";
import {
   closeTab,
   focusTab,
   getNextTabId,
   getPreviousTabId,
   tabStore,
} from "@/hooks/use-tab-store";

/**
 * Global keyboard shortcuts for the tab system.
 *
 * - Ctrl+W: Close current tab
 * - Ctrl+Tab: Focus next tab
 * - Ctrl+Shift+Tab: Focus previous tab
 * - Ctrl+T: Open new tab (calls provided callback)
 */
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
   useEffect(() => {
      function handleKeyDown(e: KeyboardEvent) {
         const isCtrlOrCmd = e.ctrlKey || e.metaKey;

         // Ctrl+W: Close current tab
         if (isCtrlOrCmd && e.key === "w") {
            e.preventDefault();
            const { activeTabId } = tabStore.state;
            if (activeTabId) {
               const tab = tabStore.state.tabs.find(
                  (t) => t.id === activeTabId,
               );
               if (tab && !tab.isPinned) {
                  closeTab(activeTabId, homeRoute, homeParams);
                  // Navigate to new active tab
                  const newActiveId = tabStore.state.activeTabId;
                  if (newActiveId) {
                     onTabFocus(newActiveId);
                  }
               }
            }
         }

         // Ctrl+Tab: Next tab
         if (isCtrlOrCmd && e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            const nextId = getNextTabId();
            if (nextId) {
               focusTab(nextId);
               onTabFocus(nextId);
            }
         }

         // Ctrl+Shift+Tab: Previous tab
         if (isCtrlOrCmd && e.key === "Tab" && e.shiftKey) {
            e.preventDefault();
            const prevId = getPreviousTabId();
            if (prevId) {
               focusTab(prevId);
               onTabFocus(prevId);
            }
         }

         // Ctrl+T: New tab
         if (isCtrlOrCmd && e.key === "t") {
            e.preventDefault();
            onNewTab();
         }
      }

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [onNewTab, onTabFocus, homeRoute, homeParams]);
}
