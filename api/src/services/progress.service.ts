import { prisma } from "../config/database.js";

/**
 * Upsert playback progress for a user on a specific content/episode.
 * Marks as completed if timestamp/duration >= 90%.
 */
export async function saveProgress(
  userId: string,
  data: {
    contentId: string;
    episodeId: string | null;
    timestamp: number;
    duration: number;
  },
) {
  const completed =
    data.duration > 0 && data.timestamp / data.duration >= 0.9;

  // Prisma's compound unique type expects string for episodeId even though
  // the schema field is optional. Null values work at runtime for the DB unique constraint.
  const episodeId = (data.episodeId ?? null) as string;

  const progress = await prisma.watchProgress.upsert({
    where: {
      userId_contentId_episodeId: {
        userId,
        contentId: data.contentId,
        episodeId,
      },
    },
    update: {
      timestamp: data.timestamp,
      duration: data.duration,
      completed,
    },
    create: {
      userId,
      contentId: data.contentId,
      episodeId: data.episodeId ?? null,
      timestamp: data.timestamp,
      duration: data.duration,
      completed,
    },
  });

  return progress;
}

/**
 * Get progress for a specific content item (and optional episode).
 * Returns { timestamp, duration, completed } or null.
 */
export async function getProgress(
  userId: string,
  contentId: string,
  episodeId?: string | null,
) {
  const progress = await prisma.watchProgress.findUnique({
    where: {
      userId_contentId_episodeId: {
        userId,
        contentId,
        episodeId: (episodeId ?? null) as string,
      },
    },
    select: {
      timestamp: true,
      duration: true,
      completed: true,
    },
  });

  return progress;
}

/**
 * Get the user's "Continue Watching" list.
 *
 * Hybrid threshold logic:
 * - Only include if timestamp >= max(120, duration * 0.05)  (watched enough)
 * - Only include if duration >= 120  (content is at least 2 minutes)
 * - Exclude completed items (90%+ watched)
 * - Filter by updatedAt within N months (default 3, accepts 3/6/12)
 * - Order by most recently watched
 */
export async function getContinueWatching(userId: string, months = 3) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  const progressRecords = await prisma.watchProgress.findMany({
    where: {
      userId,
      completed: false,
      duration: { gte: 120 },
      updatedAt: { gte: cutoffDate },
    },
    include: {
      content: {
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          releaseYear: true,
          duration: true,
          ageRating: true,
          quality: true,
          categories: true,
          posterPortrait: true,
          posterLandscape: true,
          isPublished: true,
          seasons: {
            include: {
              episodes: {
                select: {
                  id: true,
                  title: true,
                  thumbnail: true,
                  number: true,
                  seasonId: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Apply hybrid threshold filter and resolve episode metadata
  const items = progressRecords
    .filter((record) => {
      // Only published content
      if (!record.content.isPublished) return false;
      // Hybrid threshold: watched enough to be meaningful
      const minThreshold = Math.max(120, record.duration * 0.05);
      return record.timestamp >= minThreshold;
    })
    .map((record) => {
      const percentage =
        record.duration > 0
          ? Math.round((record.timestamp / record.duration) * 100)
          : 0;

      // For series episodes, resolve episode metadata
      let episodeInfo: {
        episodeId: string;
        episodeTitle: string;
        episodeNumber: number;
        seasonNumber: number;
        thumbnail: string | null;
      } | null = null;

      if (record.episodeId && record.content.type === "SERIES") {
        for (const season of record.content.seasons) {
          const episode = season.episodes.find(
            (ep) => ep.id === record.episodeId,
          );
          if (episode) {
            episodeInfo = {
              episodeId: episode.id,
              episodeTitle: episode.title,
              episodeNumber: episode.number,
              seasonNumber: season.number,
              thumbnail: episode.thumbnail,
            };
            break;
          }
        }
      }

      // Strip seasons from response
      const { seasons: _seasons, ...contentData } = record.content;

      return {
        content: contentData,
        progress: {
          timestamp: record.timestamp,
          duration: record.duration,
          percentage,
        },
        episode: episodeInfo,
        updatedAt: record.updatedAt,
      };
    });

  return items;
}
