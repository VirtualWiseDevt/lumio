import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/token.service.js";
import { prisma } from "../config/database.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: { message: "Authentication required", code: "AUTH_REQUIRED" },
      });
      return;
    }

    const token = authHeader.slice(7);

    let payload: { sub: string; sid: string; iat: number; exp: number };
    try {
      payload = await verifyToken(token);
    } catch {
      res.status(401).json({
        error: { message: "Invalid token", code: "INVALID_TOKEN" },
      });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({
        error: { message: "Session expired", code: "SESSION_EXPIRED" },
      });
      return;
    }

    // Fire-and-forget lastActiveAt update
    prisma.session
      .update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      })
      .catch(() => {});

    req.user = session.user;
    req.sessionId = session.id;

    next();
  } catch (error) {
    next(error);
  }
}
