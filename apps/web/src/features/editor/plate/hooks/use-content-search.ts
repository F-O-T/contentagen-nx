"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export interface ContentSearchResult {
   id: string;
   title: string;
   slug: string;
   url: string;
   status: string;
}

/**
 * Debounced search for content within the active team.
 * Only activates when query starts with "/" (for internal link search).
 */
export function useContentSearch(query: string): {
   results: ContentSearchResult[];
   isLoading: boolean;
} {
   const trimmed = query.trim();
   const enabled = trimmed.startsWith("/") && trimmed.length > 1;

   const { data, isLoading } = useQuery(
      orpc.content.listAllContent.queryOptions({
         input: {
            limit: 10,
            status: ["draft", "published"] as Array<
               "draft" | "published" | "archived" | undefined
            >,
         },
         enabled,
         staleTime: 30_000,
      }),
   );

   if (!enabled) {
      return { results: [], isLoading: false };
   }

   const fragment = trimmed.slice(1).toLowerCase();
   const results: ContentSearchResult[] = (data?.items ?? [])
      .filter(
         (c) =>
            c.meta?.slug?.toLowerCase().includes(fragment) ||
            c.meta?.title?.toLowerCase().includes(fragment),
      )
      .map((c) => ({
         id: c.id,
         title: c.meta?.title ?? "Untitled",
         slug: c.meta?.slug ?? "",
         url: `/conteudo/${c.meta?.slug ?? c.id}`,
         status: c.status,
      }));

   return { results, isLoading };
}
