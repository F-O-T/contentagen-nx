import { useCallback } from "react";

const STORAGE_KEY = "contentta:last-organization-slug";

export function useLastOrganization() {
   const getLastSlug = useCallback((): string | null => {
      if (typeof window === "undefined") return null;
      try {
         return localStorage.getItem(STORAGE_KEY);
      } catch {
         return null;
      }
   }, []);

   const setLastSlug = useCallback((slug: string) => {
      if (typeof window === "undefined") return;
      try {
         localStorage.setItem(STORAGE_KEY, slug);
      } catch {
         // localStorage not available
      }
   }, []);

   return { getLastSlug, setLastSlug };
}
