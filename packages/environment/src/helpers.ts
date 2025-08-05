import { validateInput } from "@packages/errors/helpers";
import type { ZodObject, z } from "zod";

export const isProduction = process.env.NODE_ENV === "production";

export function parseEnv<T extends ZodObject>(
   env: NodeJS.ProcessEnv,
   schema: T,
): z.infer<T> {
   return validateInput(schema, env);
}
