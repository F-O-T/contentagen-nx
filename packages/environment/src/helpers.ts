import { validateInput } from "@packages/errors/helpers";
import type { Static, TSchema } from "@sinclair/typebox";

export const isProduction = process.env.NODE_ENV === "production";

export function parseEnv<T extends TSchema>(
   env: NodeJS.ProcessEnv,
   schema: T,
): Static<T> {
   // Check for empty strings on required fields
   const required = schema.required as string[] | undefined;
   if (required) {
      for (const key of required) {
         if (env[key] === "") {
            throw new Error(
               `Missing or empty required environment variable: ${key}`,
            );
         }
      }
   }
   // Validate and cast
   const validated = validateInput(schema, env);
   // Only return schema keys
   const result: Partial<Static<T>> = {};
   for (const key of Object.keys(schema.properties)) {
      result[key as keyof Static<T>] = validated[key as keyof Static<T>];
   }
   return result as Static<T>;
}
