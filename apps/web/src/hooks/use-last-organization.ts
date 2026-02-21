import { useLocalStorage } from "@uidotdev/usehooks";

const STORAGE_KEY = "contentta:last-organization-slug";

export function useLastOrganization() {
   const [lastSlug, setLastSlug] = useLocalStorage<string | null>(
      STORAGE_KEY,
      null,
   );
   return {
      lastSlug,
      setLastSlug: (slug: string) => setLastSlug(slug),
   };
}
