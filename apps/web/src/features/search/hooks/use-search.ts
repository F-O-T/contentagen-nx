import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export type SearchResultItem = {
   id: string;
   title: string;
   description?: string;
   type: SearchResultType;
   icon: string;
   /** The route path with $param placeholders */
   route: string;
   /** Params to fill in the route */
   params: Record<string, string>;
};

export type SearchResultType = "content" | "dashboard" | "insight" | "form";

export type SearchResultGroup = {
   type: SearchResultType;
   label: string;
   items: SearchResultItem[];
};

// ── Fuzzy match ──────────────────────────────────────────────────────────────

function fuzzyMatch(query: string, text: string): boolean {
   const normalizedQuery = query.toLowerCase().trim();
   const normalizedText = text.toLowerCase();

   // Simple substring match — good enough for MVP
   if (normalizedText.includes(normalizedQuery)) return true;

   // Token-based: all query words must appear somewhere in the text
   const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
   return queryTokens.every((token) => normalizedText.includes(token));
}

// ── Cache extraction helpers ─────────────────────────────────────────────────

function extractFromCache<T>(
   queryClient: ReturnType<typeof useQueryClient>,
   keyPrefix: string[],
): T[] {
   const cache = queryClient.getQueryCache().getAll();
   const results: T[] = [];

   for (const query of cache) {
      const key = query.queryKey;
      if (!Array.isArray(key) || key.length < 1) continue;

      // oRPC keys have shape: [ ['router', 'procedure'], { type, input } ]
      const pathPart = key[0];
      if (!Array.isArray(pathPart)) continue;
      if (
         pathPart.length !== keyPrefix.length ||
         !pathPart.every((seg, i) => seg === keyPrefix[i])
      )
         continue;

      const data = query.state.data;
      if (!data) continue;

      // Handle paginated responses (content has { items: [...] })
      if (
         typeof data === "object" &&
         data !== null &&
         "items" in data &&
         Array.isArray((data as { items: unknown[] }).items)
      ) {
         results.push(...((data as { items: T[] }).items as T[]));
      } else if (Array.isArray(data)) {
         results.push(...(data as T[]));
      }
   }

   return results;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSearch(
   orgSlug: string,
   teamId: string,
   options?: { hiddenTypes?: Set<SearchResultType> },
) {
   const queryClient = useQueryClient();
   const [query, setQuery] = useState("");

   const search = useCallback(
      (searchQuery: string): SearchResultGroup[] => {
         if (!searchQuery.trim()) return [];

         const groups: SearchResultGroup[] = [];

         // ── Content ──────────────────────────────────────────────────────
         type ContentItem = {
            id: string;
            meta?: { title?: string; description?: string };
            status?: string;
         };

         const contentItems = extractFromCache<ContentItem>(queryClient, [
            "content",
            "listAllContent",
         ]);

         const contentResults: SearchResultItem[] = contentItems
            .filter((item) => {
               const title = item.meta?.title ?? "";
               const desc = item.meta?.description ?? "";
               return fuzzyMatch(searchQuery, `${title} ${desc}`);
            })
            .map((item) => ({
               id: item.id,
               title: item.meta?.title || "Sem titulo",
               description: item.meta?.description,
               type: "content" as const,
               icon: "FileText",
               route: "/$slug/$teamSlug/content/$contentId",
               params: { slug: orgSlug, teamSlug: teamId, contentId: item.id },
            }));

         if (contentResults.length > 0) {
            groups.push({
               type: "content",
               label: "Conteudos",
               items: contentResults.slice(0, 5),
            });
         }

         // ── Dashboards ───────────────────────────────────────────────────
         type DashboardItem = {
            id: string;
            name: string;
            description?: string | null;
         };

         const dashboardItems = extractFromCache<DashboardItem>(queryClient, [
            "dashboards",
            "list",
         ]);

         const dashboardResults: SearchResultItem[] = dashboardItems
            .filter((item) => {
               const text = `${item.name} ${item.description ?? ""}`;
               return fuzzyMatch(searchQuery, text);
            })
            .map((item) => ({
               id: item.id,
               title: item.name,
               description: item.description ?? undefined,
               type: "dashboard" as const,
               icon: "LayoutDashboard",
               route: "/$slug/$teamSlug/analytics/dashboards/$dashboardId",
               params: {
                  slug: orgSlug,
                  teamSlug: teamId,
                  dashboardId: item.id,
               },
            }));

         if (dashboardResults.length > 0) {
            groups.push({
               type: "dashboard",
               label: "Dashboards",
               items: dashboardResults.slice(0, 5),
            });
         }

         // ── Insights ─────────────────────────────────────────────────────
         type InsightItem = {
            id: string;
            name: string;
            description?: string | null;
            type: string;
         };

         const insightItems = extractFromCache<InsightItem>(queryClient, [
            "insights",
            "list",
         ]);

         const insightResults: SearchResultItem[] = insightItems
            .filter((item) => {
               const text = `${item.name} ${item.description ?? ""}`;
               return fuzzyMatch(searchQuery, text);
            })
            .map((item) => ({
               id: item.id,
               title: item.name,
               description: item.description ?? undefined,
               type: "insight" as const,
               icon: "Lightbulb",
               route: "/$slug/$teamSlug/analytics/insights/$insightId",
               params: { slug: orgSlug, teamSlug: teamId, insightId: item.id },
            }));

         if (insightResults.length > 0) {
            groups.push({
               type: "insight",
               label: "Insights",
               items: insightResults.slice(0, 5),
            });
         }

         // ── Forms ────────────────────────────────────────────────────────
         type FormItem = {
            id: string;
            name: string;
            description?: string | null;
         };

         const formItems = extractFromCache<FormItem>(queryClient, [
            "forms",
            "list",
         ]);

         const formResults: SearchResultItem[] = formItems
            .filter((item) => {
               const text = `${item.name} ${item.description ?? ""}`;
               return fuzzyMatch(searchQuery, text);
            })
            .map((item) => ({
               id: item.id,
               title: item.name,
               description: item.description ?? undefined,
               type: "form" as const,
               icon: "ClipboardList",
               route: "/$slug/$teamSlug/forms/$formId",
               params: { slug: orgSlug, teamSlug: teamId, formId: item.id },
            }));

         if (formResults.length > 0) {
            groups.push({
               type: "form",
               label: "Formularios",
               items: formResults.slice(0, 5),
            });
         }

         if (options?.hiddenTypes && options.hiddenTypes.size > 0) {
            return groups.filter((g) => !options.hiddenTypes?.has(g.type));
         }

         return groups;
      },
      [queryClient, orgSlug, teamId, options?.hiddenTypes],
   );

   const results = useMemo(() => search(query), [search, query]);

   const totalResults = useMemo(
      () => results.reduce((sum, group) => sum + group.items.length, 0),
      [results],
   );

   return {
      query,
      setQuery,
      results,
      totalResults,
      hasResults: totalResults > 0,
      hasQuery: query.trim().length > 0,
   };
}
