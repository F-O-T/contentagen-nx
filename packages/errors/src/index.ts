export class AppError extends Error {
   public status: number;
   constructor(message: string) {
      super(message);
      this.name = "AppError";
      this.status = 500; // Default to Internal Server Error
      Error.captureStackTrace?.(this, AppError);
   }
}

export class DatabaseError extends AppError {
   constructor(message: string) {
      super(message);
      this.name = "DatabaseError";
      this.status = 500; // Internal Server Error
      Error.captureStackTrace?.(this, DatabaseError);
   }
}

export class InvalidInputError extends AppError {
   constructor(message: string) {
      super(message);
      this.name = "InvalidInputError";
      this.status = 400; // Bad Request
      Error.captureStackTrace?.(this, InvalidInputError);
   }
}

export class NotFoundError extends AppError {
   constructor(message: string) {
      super(message);
      this.name = "NotFoundError";
      this.status = 404; // Not Found
      Error.captureStackTrace?.(this, NotFoundError);
   }
}

export class UnauthorizedError extends AppError {
   constructor(message: string) {
      super(message);
      this.name = "UnauthorizedError";
      this.status = 401; // Unauthorized
      Error.captureStackTrace?.(this, UnauthorizedError);
   }
}
