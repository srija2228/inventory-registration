export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class InsufficientStockError extends AppError {
  readonly available: number;
  readonly requested: number;

  constructor(available: number, requested: number) {
    super(
      `Insufficient stock: ${available} available, ${requested} requested`,
      409,
      "INSUFFICIENT_STOCK",
    );
    this.name = "InsufficientStockError";
    this.available = available;
    this.requested = requested;
  }
}

export class ReservationExpiredError extends AppError {
  constructor(message = "This reservation has expired") {
    super(message, 410, "RESERVATION_EXPIRED");
    this.name = "ReservationExpiredError";
  }
}

export class ReservationNotFoundError extends AppError {
  constructor(message = "Reservation not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "ReservationNotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 422, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
