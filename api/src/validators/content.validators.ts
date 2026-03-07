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
  description: z.string().optional(),
  releaseYear: z.coerce.number().int().min(1900).max(2100).optional(),
  duration: z.coerce.number().int().positive().optional(),
  ageRating: z.string().max(10).optional(),
  quality: z.string().optional(),
  categories: z.array(z.string()).default([]),
  cast: z.array(z.string()).default([]),
  director: z.string().optional(),
  trailerUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().optional(),
  streamUrl: z.string().optional(),
  posterPortrait: z.string().optional(),
  posterLandscape: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const updateContentSchema = createContentSchema
  .partial()
  .omit({ type: true });

export type ContentQuery = z.infer<typeof contentQuerySchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
