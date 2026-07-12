import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "../utils/app-error.js";
import { env } from "../config/env.config.js";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "An unexpected error occurred";

  // If it is a critical system crash (non-operational), log the stack trace to output logs
  if (!(err instanceof AppError) || !err.isOperational) {
    console.error("CRITICAL SYSTEM EXCEPTION:", err);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: message,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
