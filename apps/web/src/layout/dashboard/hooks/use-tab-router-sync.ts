import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import {
   closeTab,
   findTabByRoute,
   focusTab,
   initializeTabs,
   openTab,
   replaceCurrentTab,
   tabStore,
   useTabStore,
} from "@/hooks/use-tab-store";
import { pathnameToRoutePath, resolveTabMetadata } from "../utils/route-to-tab";

/**
 * Bidirectional sync between TanStack Router and the tab store.
 *
 * - Route change → creates or focuses matching tab
 * - Tab focus → navigates to the tab's route
 * - Tab close → navigates to adjacent tab
 *
 * Must be used inside DashboardLayout (within router context).
 */
export function useTabRouterSync(orgSlug: string, teamId: string) {
   const { pathname } = useLocation();
   const params = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const navigate = useNavigate();
   const { activeTab } = useTabStore();

   // Ref to prevent sync loops: when we programmatically navigate, skip the
   // location-change handler since we already updated the store.
   const isTabNavigatingRef = useRef(false);

   // Track the last pathname we synced to avoid re-processing
   const lastSyncedPathnameRef = useRef<string | null>(null);

   // ── Initialize tabs on mount / scope change ─────────────────────────────

   useEffect(() => {
      const homeRoute = "/$slug/$teamSlug/home";
      const homeParams = { slug: orgSlug, teamSlug: teamId };
      initializeTabs(orgSlug, teamId, homeRoute, homeParams);
   }, [orgSlug, teamId]);

   // ── Direction 1: Route changed → sync tab store ─────────────────────────

   useEffect(() => {
      // Skip if this route change was triggered by a tab click
      if (isTabNavigatingRef.current) {
         isTabNavigatingRef.current = false;
         lastSyncedPathnameRef.current = pathname;
         return;
      }

      // Skip if we already synced this pathname
      if (pathname === lastSyncedPathnameRef.current) return;
      lastSyncedPathnameRef.current = pathname;

      const routePath = pathnameToRoutePath(pathname, params);
      const existing = findTabByRoute(routePath, params);

      if (existing) {
         // Tab already exists — just focus it
         if (existing.id !== tabStore.state.activeTabId) {
            focusTab(existing.id);
         }
      } else {
         // No matching tab — replace the current one (PostHog-style)
         const metadata = resolveTabMetadata(pathname, params);

         // If we have an active tab, replace it; otherwise open a new tab
         // Exception: if no tabs exist and we're on search, don't open a tab for search
         const searchPath = `/${orgSlug}/${teamId}/search`;
         const isSearchPage = pathname === searchPath;
         const hasNoTabs = tabStore.state.tabs.length === 0;

         if (isSearchPage && hasNoTabs) {
            // Don't create a tab for search when it's the fallback page
            return;
         }

         if (tabStore.state.activeTabId) {
            replaceCurrentTab({
               route: routePath,
               params: { ...params },
               label: metadata.label,
               icon: metadata.icon,
               type: metadata.type,
            });
         } else {
            openTab({
               route: routePath,
               params: { ...params },
               label: metadata.label,
               icon: metadata.icon,
               type: metadata.type,
            });
         }
      }
   }, [pathname, params, orgSlug, teamId]);

   // ── Direction 2: Tab focus → navigate router ────────────────────────────

   const navigateToTab = useCallback(
      (tabId: string) => {
         const tab = tabStore.state.tabs.find((t) => t.id === tabId);
         if (!tab) return;

         // Build resolved path for comparison with current pathname
         let resolvedPath = tab.route;
         for (const [key, value] of Object.entries(tab.params)) {
            resolvedPath = resolvedPath.replace(`$${key}`, value);
         }

         // If already on this path, just focus
         if (resolvedPath === pathname) {
            focusTab(tabId);
            return;
         }

         isTabNavigatingRef.current = true;
         focusTab(tabId);
         navigate({ to: tab.route, params: tab.params });
      },
      [navigate, pathname],
   );

   // ── Tab close → navigate to new active tab or search if no tabs remain ──

   const handleCloseTab = useCallback(
      (tabId: string) => {
         closeTab(tabId);

         // After closing, navigate to whatever is now active (or search if empty)
         const newActiveId = tabStore.state.activeTabId;
         if (newActiveId) {
            const newTab = tabStore.state.tabs.find(
               (t) => t.id === newActiveId,
            );
            if (newTab) {
               let resolvedPath = newTab.route;
               for (const [key, value] of Object.entries(newTab.params)) {
                  resolvedPath = resolvedPath.replace(`$${key}`, value);
               }

               if (resolvedPath !== pathname) {
                  isTabNavigatingRef.current = true;
                  navigate({ to: newTab.route, params: newTab.params });
               }
            }
         } else {
            // No tabs remain — navigate to search
            const searchPath = `/${orgSlug}/${teamId}/search`;
            if (searchPath !== pathname) {
               isTabNavigatingRef.current = true;
               navigate({
                  to: "/$slug/$teamSlug/search",
                  params: { slug: orgSlug, teamSlug: teamId },
               });
            }
         }
      },
      [navigate, pathname, orgSlug, teamId],
   );

   // ── Open search as new tab ──────────────────────────────────────────────

   const openNewSearchTab = useCallback(() => {
      const route = "/$slug/$teamSlug/search";
      const params = { slug: orgSlug, teamSlug: teamId };

      openTab({
         route,
         params,
         label: "Pesquisar",
         icon: "Search",
         type: "search",
      });

      isTabNavigatingRef.current = true;
      navigate({ to: route, params });
   }, [navigate, orgSlug, teamId]);

   // ── Replace current tab with search ─────────────────────────────────────

   const replaceWithSearch = useCallback(() => {
      const route = "/$slug/$teamSlug/search";
      const params = { slug: orgSlug, teamSlug: teamId };

      replaceCurrentTab({
         route,
         params,
         label: "Pesquisar",
         icon: "Search",
         type: "search",
      });

      isTabNavigatingRef.current = true;
      navigate({ to: route, params });
   }, [navigate, orgSlug, teamId]);

   return {
      navigateToTab,
      handleCloseTab,
      openNewSearchTab,
      replaceWithSearch,
      activeTab,
   };
}
