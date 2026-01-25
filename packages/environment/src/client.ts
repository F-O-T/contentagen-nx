import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
   clientPrefix: "VITE_",
   client: {
      VITE_POSTHOG_HOST: z.string().url(),
      VITE_POSTHOG_KEY: z.string(),
   },

   runtimeEnv: import.meta.env,
   emptyStringAsUndefined: true,
});

export type ClientEnv = typeof env;
