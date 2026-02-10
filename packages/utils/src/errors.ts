import type { ZodObject } from "zod";
import { ZodError, type z } from "zod";

export const ErrorCodes = {
   BAD_REQUEST: "BAD_REQUEST",
   CONFLICT: "CONFLICT",
   FORBIDDEN: "FORBIDDEN",
   INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
   METHOD_NOT_SUPPORTED: "METHOD_NOT_SUPPORTED",
   NOT_FOUND: "NOT_FOUND",
   PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
   PRECONDITION_FAILED: "PRECONDITION_FAILED",
   TIMEOUT: "TIMEOUT",
   TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
   UNAUTHORIZED: "UNAUTHORIZED",
   UNPROCESSABLE_CONTENT: "UNPROCESSABLE_CONTENT",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
   public status: number;
   public data?: unknown;

   constructor(
      message: string,
      status: number = 500,
      options?: {
         cause?: unknown;
         data?: unknown;
      },
   ) {
      super(message);
      this.name = "AppError";
      this.status = status;
      this.cause = options?.cause;
      this.data = options?.data;

      Error.captureStackTrace?.(this, AppError);
   }

   static database(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 500, options);
   }

   static validation(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 400, options);
   }

   static notFound(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 404, options);
   }

   static unauthorized(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 401, options);
   }

   static forbidden(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 403, options);
   }

   static conflict(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 409, options);
   }

   static tooManyRequests(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 429, options);
   }

   static internal(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 500, options);
   }
}

export function propagateError(err: unknown) {
   if (err instanceof AppError) {
      throw err;
   }
   return;
}

export function validateInput<T extends ZodObject>(
   schema: T,
   value: unknown,
): z.infer<T> {
   try {
      return schema.parse(value);
   } catch (e) {
      if (e instanceof ZodError) {
         const errors = e.issues
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join("; ");
         throw AppError.validation(`Input validation failed`, {
            cause: errors,
         });
      }
      throw e;
   }
}
