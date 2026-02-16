import { ADDON_IDS, type AddonId } from "@packages/stripe/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { orpc } from "@/integrations/orpc/client";

export function useHasAddon(addonId: AddonId): boolean {
   const { data } = useSuspenseQuery(
      orpc.organization.hasAddon.queryOptions({
         input: { addonId },
      }),
   );

   return data.hasAddon;
}

export function useAddons() {
   const { data: addons } = useSuspenseQuery(
      orpc.organization.getAddons.queryOptions({}),
   );

   const addonSet = useMemo(
      () => new Set(addons.map((a) => a.addonId)),
      [addons],
   );

   return {
      addons,
      hasAddon: (addonId: AddonId) => addonSet.has(addonId),
      hasBoost: addonSet.has(ADDON_IDS.BOOST),
      hasScale: addonSet.has(ADDON_IDS.SCALE),
      hasEnterprise: addonSet.has(ADDON_IDS.ENTERPRISE),
   };
}
