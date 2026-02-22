import { useSafeMediaQuery } from "@packages/ui/hooks/use-media-query";

export function useIsMobile() {
   return useSafeMediaQuery("(max-width: 767px)");
}
