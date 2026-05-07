export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFound(message = "Recurso no encontrado", code = "NOT_FOUND"): AppError {
  return new AppError(404, code, message);
}

export function validationError(message: string, details?: unknown): AppError {
  return new AppError(400, "VALIDATION_ERROR", message, details);
}

export function businessError(statusCode: number, code: string, message: string, details?: unknown): AppError {
  return new AppError(statusCode, code, message, details);
}

