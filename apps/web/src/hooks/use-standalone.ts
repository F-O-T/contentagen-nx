import { useIsClient, useMediaQuery } from "@uidotdev/usehooks";

export function useIsStandalone() {
   const isClient = useIsClient();
   const isStandaloneMedia = useMediaQuery("(display-mode: standalone)");
   const isWindowControlsOverlay = useMediaQuery(
      "(display-mode: window-controls-overlay)",
   );
   const isIOSStandalone =
      isClient &&
      (typeof navigator !== "undefined" &&
         (navigator as unknown as { standalone?: boolean }).standalone === true);
   return isIOSStandalone || isStandaloneMedia || isWindowControlsOverlay;
}
