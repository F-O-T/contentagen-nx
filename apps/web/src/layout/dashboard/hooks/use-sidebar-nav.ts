import { Store, useStore } from "@tanstack/react-store";
import { useEffect } from "react";

export type SubSidebarSection = "dashboards" | "insights" | "data-management";

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
   searchQuery: string;
   pinnedItems: string[];
}

const initialState: SidebarNavState = {
   activeSection: null,
   searchQuery: "",
   pinnedItems: loadPinnedItems(),
};

const sidebarNavStore = new Store<SidebarNavState>(initialState);

export function setActiveSection(section: SubSidebarSection | null) {
   sidebarNavStore.setState((state) => ({
      ...state,
      activeSection: section,
      searchQuery: "",
   }));
}

export function setSearchQuery(query: string) {
   sidebarNavStore.setState((state) => ({
      ...state,
      searchQuery: query,
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
      searchQuery: state.searchQuery,
      pinnedItems: state.pinnedItems,
      setSearchQuery,
   };
}

export function useSidebarSection(section: SubSidebarSection) {
   useEffect(() => {
      setActiveSection(section);
      return () => {
         sidebarNavStore.setState((state) => ({
            ...state,
            activeSection:
               state.activeSection === section ? null : state.activeSection,
            searchQuery:
               state.activeSection === section ? "" : state.searchQuery,
         }));
      };
   }, [section]);
}
