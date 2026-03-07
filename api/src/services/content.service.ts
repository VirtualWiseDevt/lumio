import { prisma } from "../config/database.js";
import type {
  ContentQuery,
  CreateContentInput,
  UpdateContentInput,
} from "../validators/content.validators.js";

export async function listContent(query: ContentQuery) {
  const { type, status, category, search, page, limit, sortBy, sortOrder } =
    query;

  const where: Record<string, unknown> = { type };

  if (status === "published") {
    where.isPublished = true;
  } else if (status === "draft") {
    where.isPublished = false;
  }

  if (category) {
    where.categories = { has: category };
  }

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const [data, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include:
        type === "SERIES"
          ? { _count: { select: { seasons: true } } }
          : undefined,
    }),
    prisma.content.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getContent(id: string) {
  return prisma.content.findUnique({
    where: { id },
    include: {
      _count: { select: { seasons: true } },
    },
  });
}

export async function createContent(data: CreateContentInput) {
  return prisma.content.create({ data });
}

export async function updateContent(id: string, data: UpdateContentInput) {
  return prisma.content.update({ where: { id }, data });
}

export async function deleteContent(id: string) {
  return prisma.content.delete({ where: { id } });
}

export async function publishContent(id: string) {
  return prisma.content.update({
    where: { id },
    data: { isPublished: true },
  });
}

export async function unpublishContent(id: string) {
  return prisma.content.update({
    where: { id },
    data: { isPublished: false },
  });
}
