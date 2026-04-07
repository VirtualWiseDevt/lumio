import { z } from "zod";

export const createSeasonSchema = z.object({
  number: z.coerce.number().int().positive(),
  title: z.string().max(255).nullable().optional(),
});

export const updateSeasonSchema = z.object({
  number: z.coerce.number().int().positive().optional(),
  title: z.string().max(255).nullable().optional(),
});

export const createEpisodeSchema = z.object({
  number: z.coerce.number().int().positive(),
  title: z.string().min(1).max(255).trim(),
  description: z.string().nullable().optional(),
  duration: z.coerce.number().int().positive().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
});

export const updateEpisodeSchema = createEpisodeSchema.partial();

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
export type CreateEpisodeInput = z.infer<typeof createEpisodeSchema>;
export type UpdateEpisodeInput = z.infer<typeof updateEpisodeSchema>;
