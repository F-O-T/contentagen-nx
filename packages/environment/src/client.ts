import { Type } from "@sinclair/typebox";
import { parseEnv } from "./helpers";
import type { Static } from "@sinclair/typebox";

const EnvSchema = Type.Object({
   VITE_SERVER_URL: Type.String(),
});
export type ClientEnv = Static<typeof EnvSchema>;
export const clientEnv: ClientEnv = parseEnv(import.meta.env, EnvSchema);
