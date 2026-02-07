import { z } from "zod";
import { AppError } from "@packages/utils/errors";

export const isClientProduction = import.meta.env.PROD;
export const isProduction = process.env.NODE_ENV === "production";

export function parseEnv<T extends z.ZodTypeAny>(
   env: NodeJS.ProcessEnv,
   schema: T,
): z.infer<T> {
   const result = schema.safeParse(env);
   if (!result.success) {
      throw AppError.validation("Invalid environment variables", {
         data: result.error.format(),
      });
   }
   return result.data;
}

export const getDomain = () => {
   if (process.env.APP_URL) {
      return process.env.APP_URL;
   }
   if (isProduction) {
      return "https://app.contentta.co";
   }

   return "http://localhost:3000";
};
