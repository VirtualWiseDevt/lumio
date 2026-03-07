import { prisma } from "../config/database.js";
import type {
  CreateSeasonInput,
  UpdateSeasonInput,
  CreateEpisodeInput,
  UpdateEpisodeInput,
} from "../validators/season.validators.js";

class ServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isPrismaError(err: unknown, code: string): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as unknown as Record<string, unknown>).code === code
  );
}

// ─── Seasons ──────────────────────────────────────────────────────────────────

export async function listSeasons(contentId: string) {
  return prisma.season.findMany({
    where: { contentId },
    orderBy: { number: "asc" },
    include: { _count: { select: { episodes: true } } },
  });
}

export async function createSeason(contentId: string, data: CreateSeasonInput) {
  // Verify content exists and is a SERIES
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { type: true },
  });

  if (!content) {
    throw new ServiceError("Content not found", 404);
  }

  if (content.type !== "SERIES") {
    throw new ServiceError("Seasons can only be added to SERIES content", 400);
  }

  try {
    return await prisma.season.create({
      data: { contentId, ...data },
      include: { _count: { select: { episodes: true } } },
    });
  } catch (err) {
    if (isPrismaError(err, "P2002")) {
      throw new ServiceError(
        `Season ${data.number} already exists for this series`,
        409
      );
    }
    throw err;
  }
}

export async function updateSeason(id: string, data: UpdateSeasonInput) {
  try {
    return await prisma.season.update({
      where: { id },
      data,
      include: { _count: { select: { episodes: true } } },
    });
  } catch (err) {
    if (isPrismaError(err, "P2025")) {
      throw new ServiceError("Season not found", 404);
    }
    if (isPrismaError(err, "P2002")) {
      throw new ServiceError(
        `Season ${data.number} already exists for this series`,
        409
      );
    }
    throw err;
  }
}

export async function deleteSeason(id: string) {
  try {
    return await prisma.season.delete({ where: { id } });
  } catch (err) {
    if (isPrismaError(err, "P2025")) {
      throw new ServiceError("Season not found", 404);
    }
    throw err;
  }
}

// ─── Episodes ─────────────────────────────────────────────────────────────────

export async function listEpisodes(seasonId: string) {
  return prisma.episode.findMany({
    where: { seasonId },
    orderBy: { number: "asc" },
  });
}

export async function createEpisode(
  seasonId: string,
  data: CreateEpisodeInput
) {
  // Verify season exists
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { id: true },
  });

  if (!season) {
    throw new ServiceError("Season not found", 404);
  }

  try {
    return await prisma.episode.create({
      data: { seasonId, ...data },
    });
  } catch (err) {
    if (isPrismaError(err, "P2002")) {
      throw new ServiceError(
        `Episode ${data.number} already exists in this season`,
        409
      );
    }
    throw err;
  }
}

export async function updateEpisode(id: string, data: UpdateEpisodeInput) {
  try {
    return await prisma.episode.update({
      where: { id },
      data,
    });
  } catch (err) {
    if (isPrismaError(err, "P2025")) {
      throw new ServiceError("Episode not found", 404);
    }
    if (isPrismaError(err, "P2002")) {
      throw new ServiceError(
        `Episode ${data.number} already exists in this season`,
        409
      );
    }
    throw err;
  }
}

export async function deleteEpisode(id: string) {
  try {
    return await prisma.episode.delete({ where: { id } });
  } catch (err) {
    if (isPrismaError(err, "P2025")) {
      throw new ServiceError("Episode not found", 404);
    }
    throw err;
  }
}

export { ServiceError };
