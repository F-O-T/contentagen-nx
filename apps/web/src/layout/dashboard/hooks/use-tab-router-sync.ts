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
   const params = useParams({ strict: false }) as Record<string, string>;
   const navigate = useNavigate();
   const { activeTab } = useTabStore();

   // Ref to prevent sync loops: when we programmatically navigate, skip the
   // location-change handler since we already updated the store.
   const isTabNavigatingRef = useRef(false);

   // Track the last pathname we synced to avoid re-processing
   const lastSyncedPathnameRef = useRef<string | null>(null);

   // ── Initialize tabs on mount / scope change ─────────────────────────────

   useEffect(() => {
      const homeRoute = `/${orgSlug}/${teamId}/home`;
      const homeParams = { slug: orgSlug, teamId };
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
   }, [pathname, params]);

   // ── Direction 2: Tab focus → navigate router ────────────────────────────

   const navigateToTab = useCallback(
      (tabId: string) => {
         const tab = tabStore.state.tabs.find((t) => t.id === tabId);
         if (!tab) return;

         // Build the resolved path from the tab's route + params
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
         navigate({ to: resolvedPath });
      },
      [navigate, pathname],
   );

   // ── Tab close → navigate to new active tab ──────────────────────────────

   const handleCloseTab = useCallback(
      (tabId: string) => {
         const homeRoute = `/${orgSlug}/${teamId}/home`;
         const homeParams = { slug: orgSlug, teamId };

         closeTab(tabId, homeRoute, homeParams);

         // After closing, navigate to whatever is now active
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
                  navigate({ to: resolvedPath });
               }
            }
         }
      },
      [navigate, pathname, orgSlug, teamId],
   );

   // ── Open search as new tab ──────────────────────────────────────────────

   const openNewSearchTab = useCallback(() => {
      const searchRoute = `/$slug/$teamId/search`;
      const searchParams = { slug: orgSlug, teamId };
      const searchPath = `/${orgSlug}/${teamId}/search`;

      openTab({
         route: searchRoute,
         params: searchParams,
         label: "Pesquisar",
         icon: "Search",
         type: "search",
      });

      isTabNavigatingRef.current = true;
      navigate({ to: searchPath });
   }, [navigate, orgSlug, teamId]);

   // ── Replace current tab with search ─────────────────────────────────────

   const replaceWithSearch = useCallback(() => {
      const searchRoute = `/$slug/$teamId/search`;
      const searchParams = { slug: orgSlug, teamId };
      const searchPath = `/${orgSlug}/${teamId}/search`;

      replaceCurrentTab({
         route: searchRoute,
         params: searchParams,
         label: "Pesquisar",
         icon: "Search",
         type: "search",
      });

      isTabNavigatingRef.current = true;
      navigate({ to: searchPath });
   }, [navigate, orgSlug, teamId]);

   return {
      navigateToTab,
      handleCloseTab,
      openNewSearchTab,
      replaceWithSearch,
      activeTab,
   };
}
