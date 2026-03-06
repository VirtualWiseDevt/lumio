import type { Request, Response, NextFunction } from "express";

/**
 * Global error handler middleware.
 * Express 5 requires the 4-arg signature to recognize this as error middleware.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    error: {
      message: err.message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}
