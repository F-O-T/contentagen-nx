import { createEdenAdapter } from "@packages/eden";
import { env } from "@/config/env";

const eden = createEdenAdapter(env.VITE_SERVER_URL);

export const useEden = () => {
   return {
      eden,
   };
};
export const getContext = () => {
   return {
      eden,
   };
};
