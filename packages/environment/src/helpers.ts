import { validateInput } from "@packages/errors/helpers";
import type { AnyZodObject, z } from "zod";

export const isProduction = process.env.NODE_ENV === "production";

export function parseEnv<T extends AnyZodObject>(
  env: NodeJS.ProcessEnv,
  schema: T,
): z.infer<T> {
  return validateInput(schema, env);
}
