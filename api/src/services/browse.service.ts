import { prisma } from "../config/database.js";
import type { ContentType } from "../generated/prisma/client.js";

/**
 * Fields to select for browse content items.
 * Excludes videoUrl and streamUrl (reserved for player phase).
 */
const browseContentSelect = {
  id: true,
  type: true,
  title: true,
  description: true,
  releaseYear: true,
  duration: true,
  ageRating: true,
  quality: true,
  categories: true,
  cast: true,
  director: true,
  posterPortrait: true,
  posterLandscape: true,
  trailerUrl: true,
  matchScore: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Returns home page data: featured content and admin-configured rows.
 */
export async function getHomePageData() {
  const [featured, browseRows] = await Promise.all([
    prisma.content.findMany({
      where: { isPublished: true, isFeatured: true },
      select: browseContentSelect,
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.browseRow.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
    }),
  ]);

  // Resolve content IDs for each browse row
  const rows = await Promise.all(
    browseRows.map(async (row) => {
      if (row.contentIds.length === 0) {
        return { title: row.title, slug: row.slug, items: [] };
      }

      const items = await prisma.content.findMany({
        where: {
          id: { in: row.contentIds },
          isPublished: true,
        },
        select: browseContentSelect,
      });

      // Preserve the order from contentIds
      const itemMap = new Map(items.map((item) => [item.id, item]));
      const orderedItems = row.contentIds
        .map((id) => itemMap.get(id))
        .filter((item): item is NonNullable<typeof item> => item != null);

      return { title: row.title, slug: row.slug, items: orderedItems };
    }),
  );

  return { featured, rows };
}

/**
 * Returns browse page data for a specific content type.
 * Featured items + category-based rows + "Recently Added" row.
 */
export async function getBrowsePageData(type: ContentType) {
  const [featured, allContent] = await Promise.all([
    prisma.content.findMany({
      where: { isPublished: true, isFeatured: true, type },
      select: browseContentSelect,
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.content.findMany({
      where: { isPublished: true, type },
      select: browseContentSelect,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // "Recently Added" row
  const recentlyAdded = allContent.slice(0, 20);

  // Group by category
  const categoryMap = new Map<string, typeof allContent>();
  for (const item of allContent) {
    for (const cat of item.categories) {
      const existing = categoryMap.get(cat);
      if (existing) {
        if (existing.length < 20) {
          existing.push(item);
        }
      } else {
        categoryMap.set(cat, [item]);
      }
    }
  }

  const rows: { title: string; slug: string; items: typeof allContent }[] = [];

  // Add "Recently Added" first
  if (recentlyAdded.length > 0) {
    rows.push({
      title: "Recently Added",
      slug: "recently-added",
      items: recentlyAdded,
    });
  }

  // Add category rows
  for (const [category, items] of categoryMap) {
    rows.push({
      title: category,
      slug: category.toLowerCase().replace(/\s+/g, "-"),
      items,
    });
  }

  return { featured, rows };
}

/**
 * Returns live TV data: channels grouped by category.
 */
export async function getLiveTvData() {
  const channels = await prisma.content.findMany({
    where: { isPublished: true, type: "CHANNEL" },
    select: browseContentSelect,
  });

  const categoryMap = new Map<string, typeof channels>();
  for (const channel of channels) {
    for (const cat of channel.categories) {
      const existing = categoryMap.get(cat);
      if (existing) {
        existing.push(channel);
      } else {
        categoryMap.set(cat, [channel]);
      }
    }
  }

  const categories = Array.from(categoryMap.entries()).map(
    ([name, items]) => ({
      name,
      channels: items,
    }),
  );

  return { categories };
}

/**
 * Returns full content detail. For SERIES, includes seasons and episodes.
 * Returns null if not found or not published.
 */
export async function getTitleDetail(id: string) {
  const content = await prisma.content.findUnique({
    where: { id, isPublished: true },
    include:
      {
        seasons: {
          orderBy: { number: "asc" },
          include: {
            episodes: {
              orderBy: { number: "asc" },
            },
          },
        },
      },
  });

  if (!content) {
    return null;
  }

  // Strip seasons for non-SERIES content
  if (content.type !== "SERIES") {
    const { seasons: _seasons, videoUrl: _videoUrl, streamUrl: _streamUrl, ...rest } = content;
    return rest;
  }

  // For SERIES, strip videoUrl/streamUrl from top level but keep episodes
  const { videoUrl: _videoUrl, streamUrl: _streamUrl, ...rest } = content;
  return rest;
}

/**
 * Returns up to 6 similar published titles of the same type,
 * ranked by number of shared categories.
 */
export async function getSimilarTitles(id: string) {
  const target = await prisma.content.findUnique({
    where: { id, isPublished: true },
    select: { type: true, categories: true },
  });

  if (!target) {
    return [];
  }

  const candidates = await prisma.content.findMany({
    where: {
      isPublished: true,
      type: target.type,
      id: { not: id },
    },
    select: browseContentSelect,
    orderBy: { createdAt: "desc" },
  });

  if (target.categories.length === 0) {
    // No categories to match, just return recent content
    return candidates.slice(0, 6);
  }

  // Score by shared categories
  const targetCats = new Set(target.categories);
  const scored = candidates.map((c) => ({
    content: c,
    score: c.categories.filter((cat) => targetCats.has(cat)).length,
  }));

  // Sort by score desc, then by createdAt desc (already ordered)
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 6).map((s) => s.content);
}

/**
 * Searches published content by title (case-insensitive).
 * Returns results grouped by content type, limited to 10 per type.
 */
export async function searchContent(query: string) {
  const results = await prisma.content.findMany({
    where: {
      isPublished: true,
      title: { contains: query, mode: "insensitive" },
    },
    select: browseContentSelect,
    orderBy: { title: "asc" },
  });

  const movies: typeof results = [];
  const series: typeof results = [];
  const documentaries: typeof results = [];
  const channels: typeof results = [];

  for (const item of results) {
    switch (item.type) {
      case "MOVIE":
        if (movies.length < 10) movies.push(item);
        break;
      case "SERIES":
        if (series.length < 10) series.push(item);
        break;
      case "DOCUMENTARY":
        if (documentaries.length < 10) documentaries.push(item);
        break;
      case "CHANNEL":
        if (channels.length < 10) channels.push(item);
        break;
    }
  }

  return { movies, series, documentaries, channels };
}
