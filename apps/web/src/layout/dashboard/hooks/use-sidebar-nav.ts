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
   activeSection: SubSidebarSection | null;
   pinnedItems: string[];
}

const initialState: SidebarNavState = {
   activeSection: null,
   pinnedItems: loadPinnedItems(),
};

const sidebarNavStore = new Store<SidebarNavState>(initialState);

export function setActiveSection(section: SubSidebarSection | null) {
   sidebarNavStore.setState((state) => ({
      ...state,
      activeSection: section,
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
      activeSection: state.activeSection,
      pinnedItems: state.pinnedItems,
   };
}
