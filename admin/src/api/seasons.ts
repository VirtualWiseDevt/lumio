import { apiClient } from "./client";

// Types
export interface Season {
  id: string;
  contentId: string;
  number: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { episodes: number };
}

export interface Episode {
  id: string;
  seasonId: string;
  number: number;
  title: string;
  description: string | null;
  duration: number | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  sourceVideoKey: string | null;
  transcodingStatus: string | null;
  transcodingError: string | null;
  hlsKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSeasonData {
  number: number;
  title?: string | null;
}

export interface UpdateSeasonData {
  number?: number;
  title?: string | null;
}

export interface CreateEpisodeData {
  number: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
}

export interface UpdateEpisodeData {
  number?: number;
  title?: string;
  description?: string | null;
  duration?: number | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
}

// Season CRUD
export async function listSeasons(contentId: string): Promise<Season[]> {
  const { data } = await apiClient.get<Season[]>(
    `/admin/content/${contentId}/seasons`,
  );
  return data;
}

export async function createSeason(
  contentId: string,
  body: CreateSeasonData,
): Promise<Season> {
  const { data } = await apiClient.post<Season>(
    `/admin/content/${contentId}/seasons`,
    body,
  );
  return data;
}

export async function updateSeason(
  contentId: string,
  seasonId: string,
  body: UpdateSeasonData,
): Promise<Season> {
  const { data } = await apiClient.put<Season>(
    `/admin/content/${contentId}/seasons/${seasonId}`,
    body,
  );
  return data;
}

export async function deleteSeason(
  contentId: string,
  seasonId: string,
): Promise<void> {
  await apiClient.delete(
    `/admin/content/${contentId}/seasons/${seasonId}`,
  );
}

// Episode CRUD
export async function listEpisodes(
  contentId: string,
  seasonId: string,
): Promise<Episode[]> {
  const { data } = await apiClient.get<Episode[]>(
    `/admin/content/${contentId}/seasons/${seasonId}/episodes`,
  );
  return data;
}

export async function createEpisode(
  contentId: string,
  seasonId: string,
  body: CreateEpisodeData,
): Promise<Episode> {
  const { data } = await apiClient.post<Episode>(
    `/admin/content/${contentId}/seasons/${seasonId}/episodes`,
    body,
  );
  return data;
}

export async function updateEpisode(
  contentId: string,
  seasonId: string,
  episodeId: string,
  body: UpdateEpisodeData,
): Promise<Episode> {
  const { data } = await apiClient.put<Episode>(
    `/admin/content/${contentId}/seasons/${seasonId}/episodes/${episodeId}`,
    body,
  );
  return data;
}

export async function deleteEpisode(
  contentId: string,
  seasonId: string,
  episodeId: string,
): Promise<void> {
  await apiClient.delete(
    `/admin/content/${contentId}/seasons/${seasonId}/episodes/${episodeId}`,
  );
}
