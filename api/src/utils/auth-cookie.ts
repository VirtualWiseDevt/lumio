import type { Response } from "express";
import { env } from "../config/env.js";

const COOKIE_NAME = "lumio_token";
const ONE_DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY;

const isProduction = env.NODE_ENV === "production";

/**
 * Set the auth token as an HTTP-only cookie.
 * In production, the cookie is scoped to .lumiostudio.app so both
 * lumiostudio.app and api.lumiostudio.app can read it.
 */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: isProduction ? ".lumiostudio.app" : undefined,
    maxAge: THIRTY_DAYS_MS,
    path: "/",
  });
}

/**
 * Clear the auth cookie. Must use the same options as set, except maxAge.
 */
export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: isProduction ? ".lumiostudio.app" : undefined,
    path: "/",
  });
}
