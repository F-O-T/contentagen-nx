import { validateInput } from "@packages/utils/errors";
import type { ZodObject, z } from "zod";

export const isProduction = process.env.NODE_ENV === "production";
export const isClientProduction = import.meta.env.PROD;
export const getDomain = () => {
   if (isProduction) {
      return "https://app.contentagen.com";
   }
   return "http://localhost:3000";
};

export function parseEnv<T extends ZodObject>(
   env: NodeJS.ProcessEnv,
   schema: T,
): z.infer<T> {
   return validateInput(schema, env);
}
