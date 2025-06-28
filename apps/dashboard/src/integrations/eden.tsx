import { createEdenAdapter } from "@packages/eden";
import { env } from "@/config/env";
export const getContext = () => {
   const edenAdapter = createEdenAdapter(env.VITE_SERVER_URL);
   return {
      eden: edenAdapter,
   };
};
