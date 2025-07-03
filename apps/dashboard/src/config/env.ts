import { z } from "zod";
export const env = z
   .object({
      VITE_SERVER_URL: z.string().url(),
      ARCJET_KEY: z.string(),
   })
   .parse(import.meta.env);
