import { useSafeLocalStorage } from "@/hooks/use-local-storage";

const STORAGE_KEY = "contentta:last-organization-slug";

export function useLastOrganization() {
   const [lastSlug, setLastSlug] = useSafeLocalStorage<string | null>(
      STORAGE_KEY,
      null,
   );
   return {
      lastSlug,
      setLastSlug: (slug: string) => setLastSlug(slug),
   };
}
