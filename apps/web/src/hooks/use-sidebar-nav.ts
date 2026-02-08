import { Store, useStore } from "@tanstack/react-store";

export type SubSidebarSection = "dashboards" | "insights";

interface SidebarNavState {
   activeSubSidebar: SubSidebarSection | null;
   manualClose: boolean;
}

const initialState: SidebarNavState = {
   activeSubSidebar: null,
   manualClose: false,
};

const sidebarNavStore = new Store<SidebarNavState>(initialState);

export function openSubSidebar(section: SubSidebarSection) {
   sidebarNavStore.setState((state) => ({
      ...state,
      activeSubSidebar: section,
      manualClose: false,
   }));
}

export function closeSubSidebar() {
   sidebarNavStore.setState((state) => ({
      ...state,
      activeSubSidebar: null,
   }));
}

export function toggleSubSidebar(section: SubSidebarSection) {
   sidebarNavStore.setState((state) => {
      if (state.activeSubSidebar === section) {
         return { ...state, activeSubSidebar: null, manualClose: true };
      }
      return { ...state, activeSubSidebar: section, manualClose: false };
   });
}

export function setManualClose() {
   sidebarNavStore.setState((state) => ({
      ...state,
      manualClose: true,
   }));
}

export function useSidebarNav() {
   const state = useStore(sidebarNavStore);

   return {
      activeSubSidebar: state.activeSubSidebar,
      manualClose: state.manualClose,
      openSubSidebar,
      closeSubSidebar,
      toggleSubSidebar,
      setManualClose,
   };
}
