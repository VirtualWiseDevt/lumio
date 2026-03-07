import { prisma } from "../config/database.js";

function isPrismaError(err: unknown, code: string): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as unknown as Record<string, unknown>).code === code
  );
}

/**
 * Get user profile by ID.
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      newsletter: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Update user profile (name and/or phone).
 * Throws on phone uniqueness conflict (P2002 -> 409).
 */
export async function updateUserProfile(
  userId: string,
  data: { name?: string; phone?: string },
) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        newsletter: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      const err = new Error("Phone number already in use") as Error & {
        statusCode: number;
      };
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }
}

/**
 * Update user preferences (newsletter).
 */
export async function updatePreferences(
  userId: string,
  data: { newsletter: boolean },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { newsletter: data.newsletter },
    select: {
      newsletter: true,
    },
  });

  return user;
}

/**
 * Get the user's active subscription with plan details.
 * Returns null if no active subscription exists.
 */
export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    orderBy: { expiresAt: "desc" },
    include: { plan: true },
  });

  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    planName: subscription.plan.name,
    status: subscription.status,
    expiresAt: subscription.expiresAt,
    autoRenew: subscription.autoRenew,
  };
}
