import { Router } from "express";
import type { ZodSchema } from "zod";
import { z } from "zod";
import {
  register,
  login,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  AuthError,
} from "../services/auth.service.js";
import { deleteSession } from "../services/session.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validators.js";
import { createSession } from "../services/session.service.js";
import { signToken } from "../services/token.service.js";
import { prisma } from "../config/database.js";
import * as argon2 from "argon2";

export const authRouter = Router();

function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AuthError(
      "VALIDATION_ERROR",
      result.error.errors[0].message,
      422,
    );
  }
  return result.data;
}

// POST /register (public)
authRouter.post("/register", async (req, res) => {
  try {
    const body = validate(registerSchema, req.body);
    const result = await register(body, {
      userAgent: req.headers["user-agent"] || "",
      ipAddress: req.ip || "unknown",
    });
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: error.code } });
      return;
    }
    throw error;
  }
});

// POST /login (public)
authRouter.post("/login", async (req, res) => {
  try {
    const body = validate(loginSchema, req.body);
    const result = await login(body, {
      userAgent: req.headers["user-agent"] || "",
      ipAddress: req.ip || "unknown",
    });

    if (result.deviceLimitReached) {
      res.status(409).json({
        error: {
          message: "Maximum devices reached. Remove a device to continue.",
          code: "DEVICE_LIMIT_REACHED",
        },
        devices: result.devices,
      });
      return;
    }

    res.status(200).json({ user: result.user, token: result.token });
  } catch (error) {
    if (error instanceof AuthError) {
      res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: error.code } });
      return;
    }
    throw error;
  }
});

// POST /login/force (public)
const forceLoginSchema = loginSchema.extend({
  removeSessionId: z.string().uuid(),
});

authRouter.post("/login/force", async (req, res) => {
  try {
    const body = validate(forceLoginSchema, req.body);

    // Verify credentials first
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        "Invalid email or password",
        401,
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthError(
        "ACCOUNT_LOCKED",
        "Account is temporarily locked. Try again later.",
        423,
      );
    }

    const isValid = await argon2.verify(user.passwordHash, body.password);
    if (!isValid) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        "Invalid email or password",
        401,
      );
    }

    // Remove specified session
    await deleteSession(body.removeSessionId, user.id);

    // Create new session
    const session = await createSession({
      userId: user.id,
      userAgent: req.headers["user-agent"] || "",
      ipAddress: req.ip || "unknown",
    });

    const token = await signToken({ sub: user.id, sid: session.id });

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
      },
      token,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: error.code } });
      return;
    }
    throw error;
  }
});

// POST /logout (protected)
authRouter.post("/logout", requireAuth, async (req, res) => {
  try {
    await logout(req.sessionId!, req.user!.id);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    if (error instanceof AuthError) {
      res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: error.code } });
      return;
    }
    throw error;
  }
});

// POST /change-password (protected)
authRouter.post("/change-password", requireAuth, async (req, res) => {
  try {
    const body = validate(changePasswordSchema, req.body);
    await changePassword(req.user!.id, req.sessionId!, body);
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof AuthError) {
      res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: error.code } });
      return;
    }
    throw error;
  }
});

// POST /forgot-password (public)
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const body = validate(forgotPasswordSchema, req.body);
    await forgotPassword(body.email);
    res
      .status(200)
      .json({ message: "If an account exists, a reset link has been sent" });
  } catch (error) {
    if (error instanceof AuthError) {
      res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: error.code } });
      return;
    }
    throw error;
  }
});

// POST /reset-password (public)
authRouter.post("/reset-password", async (req, res) => {
  try {
    const body = validate(resetPasswordSchema, req.body);
    await resetPassword(body.token, body.newPassword);
    res
      .status(200)
      .json({ message: "Password has been reset. Please log in." });
  } catch (error) {
    if (error instanceof AuthError) {
      res
        .status(error.statusCode)
        .json({ error: { message: error.message, code: error.code } });
      return;
    }
    throw error;
  }
});
