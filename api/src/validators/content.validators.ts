import { z } from "zod";
import { ContentType } from "../generated/prisma/client.js";

export const contentQuerySchema = z.object({
  type: z.nativeEnum(ContentType),
  status: z.enum(["all", "published", "draft"]).default("all"),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["title", "releaseYear", "quality", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createContentSchema = z.object({
  type: z.nativeEnum(ContentType),
  title: z.string().min(1).max(255).trim(),
  description: z.string().nullable().optional(),
  releaseYear: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  duration: z.coerce.number().int().positive().nullable().optional(),
  ageRating: z.string().max(10).nullable().optional(),
  quality: z.string().nullable().optional(),
  categories: z.array(z.string()).default([]),
  cast: z.array(z.string()).default([]),
  director: z.string().nullable().optional(),
  trailerUrl: z.string().url().optional().or(z.literal("")).or(z.null()),
  videoUrl: z.string().nullable().optional(),
  streamUrl: z.string().nullable().optional(),
  posterPortrait: z.string().nullable().optional(),
  posterLandscape: z.string().nullable().optional(),
  totalSeasons: z.coerce.number().int().min(1).nullable().optional(),
  seriesStatus: z.string().nullable().optional(),
  isPublished: z.boolean().default(false),
});

export const updateContentSchema = createContentSchema
  .partial()
  .omit({ type: true });

export type ContentQuery = z.infer<typeof contentQuerySchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
