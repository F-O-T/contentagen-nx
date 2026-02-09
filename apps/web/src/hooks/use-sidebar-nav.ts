// apps/web/src/hooks/use-sidebar-nav.ts
import { Store, useStore } from "@tanstack/react-store";

export type SubSidebarSection = "dashboards" | "insights";

const PINNED_STORAGE_KEY = "contentta:sidebar-pinned";

function loadPinnedItems(): string[] {
   if (typeof window === "undefined") return [];
   try {
      const stored = localStorage.getItem(PINNED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
   } catch {
      return [];
   }
}

function savePinnedItems(items: string[]) {
   try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(items));
   } catch {
      // silently fail
   }
}

interface SidebarNavState {
   activeSubPanel: SubSidebarSection | null;
   manualClose: boolean;
   pinnedItems: string[];
}

const initialState: SidebarNavState = {
   activeSubPanel: null,
   manualClose: false,
   pinnedItems: loadPinnedItems(),
};

const sidebarNavStore = new Store<SidebarNavState>(initialState);

export function openSubPanel(section: SubSidebarSection) {
   sidebarNavStore.setState((state) => ({
      ...state,
      activeSubPanel: section,
      manualClose: false,
   }));
}

export function closeSubPanel() {
   sidebarNavStore.setState((state) => ({
      ...state,
      activeSubPanel: null,
   }));
}

export function toggleSubPanel(section: SubSidebarSection) {
   sidebarNavStore.setState((state) => {
      if (state.activeSubPanel === section) {
         return { ...state, activeSubPanel: null, manualClose: true };
      }
      return { ...state, activeSubPanel: section, manualClose: false };
   });
}

export function setManualClose() {
   sidebarNavStore.setState((state) => ({
      ...state,
      manualClose: true,
   }));
}

export function togglePinnedItem(itemId: string) {
   sidebarNavStore.setState((state) => {
      const pinned = state.pinnedItems.includes(itemId)
         ? state.pinnedItems.filter((id) => id !== itemId)
         : [...state.pinnedItems, itemId];
      savePinnedItems(pinned);
      return { ...state, pinnedItems: pinned };
   });
}

export function useSidebarNav() {
   const state = useStore(sidebarNavStore);

   return {
      activeSubPanel: state.activeSubPanel,
      manualClose: state.manualClose,
      pinnedItems: state.pinnedItems,
      openSubPanel,
      closeSubPanel,
      toggleSubPanel,
      setManualClose,
      togglePinnedItem,
   };
}

// Keep old names as aliases for backward compat during migration
export const openSubSidebar = openSubPanel;
export const closeSubSidebar = closeSubPanel;
