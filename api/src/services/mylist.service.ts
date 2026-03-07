import { prisma } from "../config/database.js";

/**
 * Get all My List entries for a user.
 * Returns content objects ordered by most recently added.
 */
export async function getMyList(userId: string) {
  const entries = await prisma.watchlist.findMany({
    where: { userId },
    include: { content: true },
    orderBy: { createdAt: "desc" },
  });

  return entries.map((entry) => entry.content);
}

/**
 * Check if a content item is in the user's My List.
 */
export async function isInMyList(
  userId: string,
  contentId: string,
): Promise<boolean> {
  const entry = await prisma.watchlist.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });

  return entry !== null;
}

/**
 * Add a content item to the user's My List (idempotent).
 */
export async function addToMyList(userId: string, contentId: string) {
  return prisma.watchlist.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: { userId, contentId },
    update: {},
  });
}

/**
 * Remove a content item from the user's My List.
 * Uses deleteMany so it doesn't throw if not found.
 */
export async function removeFromMyList(
  userId: string,
  contentId: string,
): Promise<void> {
  await prisma.watchlist.deleteMany({
    where: { userId, contentId },
  });
}
