import type { Request, Response } from "express";

/**
 * 404 handler for unmatched routes.
 * Must be mounted AFTER all route handlers and BEFORE the error handler.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
