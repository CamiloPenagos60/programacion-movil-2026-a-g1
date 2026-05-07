import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const traceId = randomUUID();

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? [],
        trace_id: traceId
      }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "La solicitud no cumple el contrato esperado.",
        details: err.issues,
        trace_id: traceId
      }
    });
    return;
  }

  console.error(`[${traceId}]`, err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Error interno del servidor.",
      details: [],
      trace_id: traceId
    }
  });
};

