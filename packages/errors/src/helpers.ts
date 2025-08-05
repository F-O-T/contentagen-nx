import { AppError, InvalidInputError } from ".";
import { type z, ZodError } from "zod";
import type { AnyZodObject } from "zod";

export function propagateError(err: unknown): never {
   if (err instanceof AppError) {
      throw err;
   }
   if (err instanceof Error) {
      throw new AppError(err.message);
   }
   throw new AppError("Unknown error occurred");
}

export function validateInput<T extends AnyZodObject>(
   schema: T,
   value: unknown,
): z.infer<T> {
   try {
      return schema.parse(value);
   } catch (e) {
      if (e instanceof ZodError) {
         const errors = e.errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join("; ");
         throw new InvalidInputError(`Input validation failed: ${errors}`);
      }
      throw e;
   }
}
