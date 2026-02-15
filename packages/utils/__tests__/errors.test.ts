import { describe, expect, it } from "bun:test";
import { z } from "zod";
import {
   AppError,
   ErrorCodes,
   propagateError,
   validateInput,
} from "../src/errors";

describe("error utilities", () => {
   describe("AppError", () => {
      it("should create AppError with message and default status", () => {
         const error = new AppError("Test error");
         expect(error.message).toBe("Test error");
         expect(error.status).toBe(500);
         expect(error.name).toBe("AppError");
      });

      it("should create AppError with custom status", () => {
         const error = new AppError("Test error", 400);
         expect(error.status).toBe(400);
      });

      it("should create AppError with options", () => {
         const cause = new Error("Cause error");
         const error = new AppError("Test error", 500, {
            cause,
            data: { foo: "bar" },
         });
         expect(error.cause).toBe(cause);
         expect(error.data).toEqual({ foo: "bar" });
      });

      it("should create database error", () => {
         const error = AppError.database("DB error");
         expect(error.status).toBe(500);
         expect(error.message).toBe("DB error");
      });

      it("should create validation error", () => {
         const error = AppError.validation("Validation error");
         expect(error.status).toBe(400);
      });

      it("should create notFound error", () => {
         const error = AppError.notFound("Not found");
         expect(error.status).toBe(404);
      });

      it("should create unauthorized error", () => {
         const error = AppError.unauthorized("Unauthorized");
         expect(error.status).toBe(401);
      });

      it("should create forbidden error", () => {
         const error = AppError.forbidden("Forbidden");
         expect(error.status).toBe(403);
      });

      it("should create conflict error", () => {
         const error = AppError.conflict("Conflict");
         expect(error.status).toBe(409);
      });

      it("should create tooManyRequests error", () => {
         const error = AppError.tooManyRequests("Too many");
         expect(error.status).toBe(429);
      });

      it("should create internal error", () => {
         const error = AppError.internal("Internal error");
         expect(error.status).toBe(500);
      });

      it("should create errors with options", () => {
         const error = AppError.database("DB error", {
            cause: new Error("cause"),
            data: { key: "value" },
         });
         expect(error.data).toEqual({ key: "value" });
      });
   });

   describe("propagateError", () => {
      it("should throw AppError objects", () => {
         const error = new AppError("Test error");
         expect(() => propagateError(error)).toThrow("Test error");
      });

      it("should not throw for regular Error objects", () => {
         const error = new Error("Test error");
         expect(() => propagateError(error)).not.toThrow();
      });

      it("should not throw for string errors", () => {
         const error = "String error";
         expect(() => propagateError(error)).not.toThrow();
      });

      it("should not throw for unknown objects", () => {
         const error = { message: "Object error" };
         expect(() => propagateError(error)).not.toThrow();
      });

      it("should not throw for null", () => {
         expect(() => propagateError(null)).not.toThrow();
      });

      it("should not throw for undefined", () => {
         expect(() => propagateError(undefined)).not.toThrow();
      });
   });

   describe("validateInput", () => {
      it("should validate input against schema", () => {
         const schema = z.object({
            age: z.number(),
            name: z.string(),
         });

         const validInput = { age: 30, name: "John" };
         const result = validateInput(schema, validInput);
         expect(result).toEqual(validInput);
      });

      it("should throw AppError for invalid input", () => {
         const schema = z.object({
            age: z.number(),
            name: z.string(),
         });

         const invalidInput = { age: "not-a-number", name: "John" };
         expect(() => validateInput(schema, invalidInput)).toThrow();
      });

      it("should handle partial validation", () => {
         const schema = z.object({
            age: z.number().optional(),
            name: z.string(),
         });

         const partialInput = { name: "John" };
         const result = validateInput(schema, partialInput);
         expect(result).toEqual({ name: "John" });
      });

      it("should throw with formatted error message for ZodError", () => {
         const schema = z.object({
            age: z.number(),
            name: z.string(),
         });

         try {
            validateInput(schema, { age: "bad", name: 123 });
         } catch (e) {
            expect(e).toBeInstanceOf(AppError);
            expect((e as AppError).status).toBe(400);
         }
      });

      it("should rethrow non-ZodError exceptions", () => {
         const schema = {
            parse: () => {
               throw new Error("Custom error");
            },
         } as unknown as z.ZodObject<z.ZodRawShape>;

         expect(() => validateInput(schema, {})).toThrow("Custom error");
      });
   });

   describe("ErrorCodes", () => {
      it("should have all expected error codes", () => {
         expect(ErrorCodes.BAD_REQUEST).toBe("BAD_REQUEST");
         expect(ErrorCodes.CONFLICT).toBe("CONFLICT");
         expect(ErrorCodes.FORBIDDEN).toBe("FORBIDDEN");
         expect(ErrorCodes.INTERNAL_SERVER_ERROR).toBe("INTERNAL_SERVER_ERROR");
         expect(ErrorCodes.METHOD_NOT_SUPPORTED).toBe("METHOD_NOT_SUPPORTED");
         expect(ErrorCodes.NOT_FOUND).toBe("NOT_FOUND");
         expect(ErrorCodes.PAYLOAD_TOO_LARGE).toBe("PAYLOAD_TOO_LARGE");
         expect(ErrorCodes.PRECONDITION_FAILED).toBe("PRECONDITION_FAILED");
         expect(ErrorCodes.TIMEOUT).toBe("TIMEOUT");
         expect(ErrorCodes.TOO_MANY_REQUESTS).toBe("TOO_MANY_REQUESTS");
         expect(ErrorCodes.UNAUTHORIZED).toBe("UNAUTHORIZED");
         expect(ErrorCodes.UNPROCESSABLE_CONTENT).toBe("UNPROCESSABLE_CONTENT");
      });
   });
});
