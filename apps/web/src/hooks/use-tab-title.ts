import { useEffect } from "react";
import { tabStore, updateTab } from "./use-tab-store";

/**
 * Update the current active tab's label when page data loads.
 *
 * Usage in page components:
 * ```tsx
 * useTabTitle(dashboard.name);
 * ```
 *
 * This is needed because when a tab is first created from a route,
 * the label is a placeholder (e.g. "Dashboard"). Once the page data
 * loads, this hook updates the tab label to the actual title.
 */
export function useTabTitle(title: string | undefined | null) {
   useEffect(() => {
      if (!title) return;

      const { activeTabId } = tabStore.state;
      if (!activeTabId) return;

      const activeTab = tabStore.state.tabs.find((t) => t.id === activeTabId);
      if (!activeTab) return;

      // Only update if the title is different from the current label
      if (activeTab.label !== title) {
         updateTab(activeTabId, { label: title });
      }
   }, [title]);
}
