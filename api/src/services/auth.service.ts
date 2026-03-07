import * as argon2 from "argon2";
import crypto from "node:crypto";
import { UAParser } from "ua-parser-js";
import { prisma } from "../config/database.js";
import {
  signToken,
  generateResetToken,
  hashResetToken,
} from "./token.service.js";
import {
  createSession,
  enforceDeviceLimit,
  deleteOtherSessions,
} from "./session.service.js";

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function register(
  data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    referralCode: string;
  },
  meta: { userAgent: string; ipAddress: string },
) {
  // Validate referral code
  const referrer = await prisma.user.findUnique({
    where: { referralCode: data.referralCode },
  });
  if (!referrer) {
    throw new AuthError("INVALID_REFERRAL_CODE", "Invalid referral code", 400);
  }

  // Check for existing user by email OR phone
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });
  if (existingUser) {
    throw new AuthError("ACCOUNT_EXISTS", "Account already exists", 409);
  }

  // Hash password
  const passwordHash = await argon2.hash(data.password);

  // Generate referral code for new user
  const generatedCode = crypto.randomBytes(4).toString("hex");

  // Atomic transaction: create user + referral + session
  const { user, session } = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        referralCode: generatedCode,
      },
    });

    await tx.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: newUser.id,
      },
    });

    // Create session inside transaction for atomicity
    const parser = new UAParser(meta.userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newSession = await tx.session.create({
      data: {
        userId: newUser.id,
        deviceName: `${browser.name || "Unknown"} on ${os.name || "Unknown"}`,
        deviceType: device.type || "desktop",
        ipAddress: meta.ipAddress,
        token: crypto.randomUUID(),
        expiresAt,
      },
    });

    return { user: newUser, session: newSession };
  });

  const token = await signToken({ sub: user.id, sid: session.id });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      referralCode: user.referralCode,
    },
    token,
  };
}

export async function login(
  data: { email: string; password: string },
  meta: { userAgent: string; ipAddress: string },
) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Invalid email or password",
      401,
    );
  }

  // Check account lock before password verification
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthError(
      "ACCOUNT_LOCKED",
      "Account is temporarily locked. Try again later.",
      423,
    );
  }

  // Verify password
  const isValid = await argon2.verify(user.passwordHash, data.password);
  if (!isValid) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: { increment: 1 } },
    });

    if (updated.failedLoginAttempts >= 5) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
          failedLoginAttempts: 0,
        },
      });
    }

    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Invalid email or password",
      401,
    );
  }

  // Reset failed attempts on success
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  // Check device limit
  const deviceCheck = await enforceDeviceLimit(user.id);
  if (!deviceCheck.allowed) {
    return { deviceLimitReached: true as const, devices: deviceCheck.devices };
  }

  // Create session and sign JWT
  const session = await createSession({
    userId: user.id,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  const token = await signToken({ sub: user.id, sid: session.id });

  return {
    deviceLimitReached: false as const,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      referralCode: user.referralCode,
    },
    token,
  };
}

export async function logout(
  sessionId: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.session.delete({
      where: { id: sessionId, userId },
    });
  } catch {
    // Silently succeed if session not found (idempotent)
  }
}

export async function changePassword(
  userId: string,
  currentSessionId: string,
  data: { currentPassword: string; newPassword: string },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AuthError("USER_NOT_FOUND", "User not found", 404);
  }

  const isValid = await argon2.verify(user.passwordHash, data.currentPassword);
  if (!isValid) {
    throw new AuthError(
      "INVALID_PASSWORD",
      "Current password is incorrect",
      400,
    );
  }

  const newHash = await argon2.hash(data.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Invalidate all other sessions
  await deleteOtherSessions(currentSessionId, userId);

  return { message: "Password changed successfully" };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Return same message whether user exists or not (prevent enumeration)
    return { message: "If an account exists, a reset link has been sent" };
  }

  const token = generateResetToken();
  const hashedToken = hashResetToken(token);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  // DEV: Log token for development (real email service added in Phase 9)
  console.log(`[DEV] Password reset token for ${email}: ${token}`);

  return { message: "If an account exists, a reset link has been sent" };
}

export async function resetPassword(token: string, newPassword: string) {
  const hashedToken = hashResetToken(token);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AuthError(
      "INVALID_RESET_TOKEN",
      "Invalid or expired reset token",
      400,
    );
  }

  const newHash = await argon2.hash(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // Delete all user sessions (force re-login)
  await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  return { message: "Password has been reset. Please log in." };
}
