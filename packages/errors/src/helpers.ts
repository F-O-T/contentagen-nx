import { AppError, InvalidInputError } from ".";
import type { Static, TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
export function propagateError(err: unknown): never {
  if (err instanceof AppError) {
    throw err;
  }
  if (err instanceof Error) {
    throw new AppError(err.message, "UNEXPECTED_ERROR");
  }
  throw new AppError("Unknown error occurred", "UNKNOWN_ERROR");
}

export function validateInput<T extends TSchema>(
  schema: T,
  value: unknown,
  errorCode = "INVALID_INPUT",
): asserts value is Static<T> {
  if (!Value.Check(schema, value)) {
    const errors = [...Value.Errors(schema, value)]
      .map((e) => `${e.path}: ${e.message}`)
      .join("; ");
    throw new InvalidInputError(
      `Input validation failed: ${errors}`,
      errorCode,
    );
  }
}
