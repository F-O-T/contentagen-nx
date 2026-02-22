import { useIsomorphicLayoutEffect } from "@dnd-kit/utilities";
import { useSafeMediaQuery } from "@packages/ui/hooks/use-media-query";
import { useState } from "react";

export function useIsStandalone() {
   const isStandaloneMedia = useSafeMediaQuery("(display-mode: standalone)");
   const isWindowControlsOverlay = useSafeMediaQuery(
      "(display-mode: window-controls-overlay)",
   );
   const [isIOSStandalone, setIsIOSStandalone] = useState(false);

   useIsomorphicLayoutEffect(() => {
      setIsIOSStandalone(
         (navigator as unknown as { standalone?: boolean }).standalone === true,
      );
   }, []);

   return isIOSStandalone || isStandaloneMedia || isWindowControlsOverlay;
}
