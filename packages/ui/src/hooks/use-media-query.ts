import { useIsomorphicLayoutEffect } from "@dnd-kit/utilities";
import { useState } from "react";

/**
 * SSR-safe replacement for useMediaQuery.
 * Returns `false` on the server and during the first client render,
 * then updates synchronously on client mount via useIsomorphicLayoutEffect.
 */
export function useSafeMediaQuery(query: string): boolean {
   const [matches, setMatches] = useState(false);

   useIsomorphicLayoutEffect(() => {
      const media = window.matchMedia(query);
      setMatches(media.matches);

      const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
   }, [query]);

   return matches;
}
