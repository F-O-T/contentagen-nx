import { Store, useStore } from "@tanstack/react-store";

// ── Types ────────────────────────────────────────────────────────────────────

export type TabType =
   | "home"
   | "content-list"
   | "content-editor"
   | "dashboard"
   | "insight"
   | "insight-new"
   | "form"
   | "form-submissions"
   | "settings"
   | "search"
   | "data-management"
   | "billing"
   | "plans"
   | "clusters"
   | "assets"
   | "experiments"
   | "generic";

export type Tab = {
   id: string;
   route: string;
   params: Record<string, string>;
   search?: Record<string, unknown>;
   label: string;
   icon?: string;
   type: TabType;
   isPinned?: boolean;
   isDirty?: boolean;
   openedAt: number;
};

type TabStoreState = {
   tabs: Tab[];
   activeTabId: string | null;
   isHydrated: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDeduplicationKey(route: string, params: Record<string, string>) {
   const sorted = Object.keys(params)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
         acc[key] = params[key];
         return acc;
      }, {});
   return `${route}::${JSON.stringify(sorted)}`;
}

function getStorageKey(orgSlug: string, teamId: string) {
   return `contentta:tabs:${orgSlug}:${teamId}`;
}

function loadFromStorage(
   orgSlug: string,
   teamId: string,
): TabStoreState | null {
   if (typeof window === "undefined") return null;
   try {
      const raw = sessionStorage.getItem(getStorageKey(orgSlug, teamId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as TabStoreState;
      if (!Array.isArray(parsed.tabs)) return null;
      return {
         tabs: parsed.tabs,
         activeTabId: parsed.activeTabId,
         isHydrated: true,
      };
   } catch {
      return null;
   }
}

function saveToStorage(orgSlug: string, teamId: string, state: TabStoreState) {
   if (typeof window === "undefined") return;
   try {
      sessionStorage.setItem(
         getStorageKey(orgSlug, teamId),
         JSON.stringify({ tabs: state.tabs, activeTabId: state.activeTabId }),
      );
   } catch {
      // sessionStorage full or unavailable — silently ignore
   }
}

// ── Store ────────────────────────────────────────────────────────────────────

const INITIAL_STATE: TabStoreState = {
   tabs: [],
   activeTabId: null,
   isHydrated: false,
};

export const tabStore = new Store<TabStoreState>(INITIAL_STATE);

// Track current scope for persistence
let currentScope: { orgSlug: string; teamId: string } | null = null;

function persist() {
   if (!currentScope) return;
   saveToStorage(currentScope.orgSlug, currentScope.teamId, tabStore.state);
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Initialize tabs for a given org+team scope. Loads from localStorage or creates defaults. */
export function initializeTabs(
   orgSlug: string,
   teamId: string,
   _homeRoute: string,
   _homeParams: Record<string, string>,
) {
   const previousScope = currentScope;
   currentScope = { orgSlug, teamId };

   // If switching to a different scope, save current state first
   if (
      previousScope &&
      (previousScope.orgSlug !== orgSlug || previousScope.teamId !== teamId)
   ) {
      saveToStorage(
         previousScope.orgSlug,
         previousScope.teamId,
         tabStore.state,
      );
   }

   const saved = loadFromStorage(orgSlug, teamId);
   if (saved && saved.tabs.length > 0) {
      tabStore.setState(() => ({ ...saved, isHydrated: true }));
      return;
   }

   const homeTab: Tab = {
      id: crypto.randomUUID(),
      route: _homeRoute,
      params: _homeParams,
      label: "Dashboard",
      icon: "LayoutDashboard",
      type: "dashboard",
      isPinned: false,
      openedAt: Date.now(),
   };

   tabStore.setState(() => ({
      tabs: [homeTab],
      activeTabId: homeTab.id,
      isHydrated: true,
   }));
   persist();
}

/** Find a tab matching the given route and params. */
export function findTabByRoute(
   route: string,
   params: Record<string, string>,
): Tab | undefined {
   const key = getDeduplicationKey(route, params);
   return tabStore.state.tabs.find(
      (tab) => getDeduplicationKey(tab.route, tab.params) === key,
   );
}

/** Open a new tab or focus an existing one with the same route+params. Returns the tab id. */
export function openTab(tabData: Omit<Tab, "id" | "openedAt">): string {
   const existing = findTabByRoute(tabData.route, tabData.params);
   if (existing) {
      focusTab(existing.id);
      return existing.id;
   }

   const newTab: Tab = {
      ...tabData,
      id: crypto.randomUUID(),
      openedAt: Date.now(),
   };

   tabStore.setState((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
   }));
   persist();
   return newTab.id;
}

/** Focus an existing tab by id. */
export function focusTab(tabId: string) {
   const tab = tabStore.state.tabs.find((t) => t.id === tabId);
   if (!tab) return;
   tabStore.setState((state) => ({
      ...state,
      activeTabId: tabId,
   }));
   persist();
}

/** Close a tab. Focuses an adjacent tab or returns null if no tabs remain. */
export function closeTab(tabId: string) {
   const { tabs, activeTabId } = tabStore.state;
   const tab = tabs.find((t) => t.id === tabId);
   if (!tab || tab.isPinned) return;

   const index = tabs.indexOf(tab);
   const newTabs = tabs.filter((t) => t.id !== tabId);

   let newActiveId = activeTabId;
   if (activeTabId === tabId) {
      // Focus the next tab, or previous, or null if no tabs remain
      if (newTabs.length > 0) {
         const nextIndex = Math.min(index, newTabs.length - 1);
         newActiveId = newTabs[nextIndex].id;
      } else {
         newActiveId = null;
      }
   }

   tabStore.setState(() => ({
      tabs: newTabs,
      activeTabId: newActiveId,
   }));
   persist();
}

/** Update a tab's properties. */
export function updateTab(tabId: string, updates: Partial<Tab>) {
   tabStore.setState((state) => ({
      ...state,
      tabs: state.tabs.map((tab) =>
         tab.id === tabId ? { ...tab, ...updates } : tab,
      ),
   }));
   persist();
}

/** Replace the current active tab's route and metadata (used for search → destination). */
export function replaceCurrentTab(updates: Partial<Tab>) {
   const { activeTabId } = tabStore.state;
   if (!activeTabId) return;
   updateTab(activeTabId, updates);
}

/** Reorder tabs by moving from one index to another. */
export function reorderTabs(fromIndex: number, toIndex: number) {
   tabStore.setState((state) => {
      const newTabs = [...state.tabs];
      const [moved] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, moved);
      return { ...state, tabs: newTabs };
   });
   persist();
}

/** Pin a tab — moves it to the end of the pinned section. */
export function pinTab(tabId: string) {
   tabStore.setState((state) => {
      const tab = state.tabs.find((t) => t.id === tabId);
      if (!tab) return state;

      const withoutTab = state.tabs.filter((t) => t.id !== tabId);
      const pinnedCount = withoutTab.filter((t) => t.isPinned).length;

      const updatedTab = { ...tab, isPinned: true };
      const newTabs = [
         ...withoutTab.slice(0, pinnedCount),
         updatedTab,
         ...withoutTab.slice(pinnedCount),
      ];

      return { ...state, tabs: newTabs };
   });
   persist();
}

/** Unpin a tab. */
export function unpinTab(tabId: string) {
   updateTab(tabId, { isPinned: false });
}

/** Close all tabs except the given one. Keeps pinned tabs. */
export function closeOtherTabs(keepTabId: string) {
   tabStore.setState((state) => ({
      tabs: state.tabs.filter((t) => t.id === keepTabId || t.isPinned),
      activeTabId: keepTabId,
   }));
   persist();
}

/** Close all unpinned tabs. */
export function closeAllTabs() {
   tabStore.setState((state) => {
      const pinned = state.tabs.filter((t) => t.isPinned);
      return {
         tabs: pinned,
         activeTabId: pinned.length > 0 ? pinned[0].id : null,
      };
   });
   persist();
}

/** Get the next tab id (for Ctrl+Tab). */
export function getNextTabId(): string | null {
   const { tabs, activeTabId } = tabStore.state;
   if (tabs.length <= 1) return null;
   const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
   const nextIndex = (currentIndex + 1) % tabs.length;
   return tabs[nextIndex].id;
}

/** Get the previous tab id (for Ctrl+Shift+Tab). */
export function getPreviousTabId(): string | null {
   const { tabs, activeTabId } = tabStore.state;
   if (tabs.length <= 1) return null;
   const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
   const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
   return tabs[prevIndex].id;
}

// ── React Hook ───────────────────────────────────────────────────────────────

export function useTabStore() {
   const state = useStore(tabStore);
   const activeTab = state.tabs.find((t) => t.id === state.activeTabId) ?? null;

   return {
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      activeTab,
      isHydrated: state.isHydrated,
   };
}
