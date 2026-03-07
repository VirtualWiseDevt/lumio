import * as argon2 from "argon2";
import { prisma } from "../config/database.js";
import { signToken } from "./token.service.js";
import { createSession } from "./session.service.js";
import { AuthError } from "./auth.service.js";

export async function adminLogin(
  data: { email: string; password: string },
  meta: { userAgent: string; ipAddress: string },
) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Invalid credentials",
      401,
    );
  }

  // Verify password
  const isValid = await argon2.verify(user.passwordHash, data.password);
  if (!isValid) {
    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Invalid credentials",
      401,
    );
  }

  // Reject non-admin users (don't reveal that user exists but isn't admin)
  if (user.role !== "ADMIN") {
    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Invalid credentials",
      401,
    );
  }

  // Create session (no device limit check for admin)
  const session = await createSession({
    userId: user.id,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  const token = await signToken({ sub: user.id, sid: session.id });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
}
