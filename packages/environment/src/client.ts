import { z } from "zod";
import { parseEnv } from "./helpers";

const EnvSchema = z.object({
  VITE_SERVER_URL: z.string(),
});
export type ClientEnv = z.infer<typeof EnvSchema>;
export const clientEnv: ClientEnv = parseEnv(import.meta.env, EnvSchema);
