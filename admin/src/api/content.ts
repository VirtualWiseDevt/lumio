import { apiClient } from "./client";

// Types matching the Prisma Content model
export interface Content {
  id: string;
  type: "MOVIE" | "DOCUMENTARY" | "SERIES" | "CHANNEL";
  title: string;
  description: string | null;
  releaseYear: number | null;
  duration: number | null;
  ageRating: string | null;
  quality: string | null;
  categories: string[];
  cast: string[];
  director: string | null;
  posterPortrait: string | null;
  posterLandscape: string | null;
  trailerUrl: string | null;
  videoUrl: string | null;
  streamUrl: string | null;
  sourceVideoKey: string | null;
  transcodingStatus: string | null;
  transcodingError: string | null;
  hlsKey: string | null;
  totalSeasons: number | null;
  seriesStatus: string | null;
  matchScore: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { seasons: number };
}

export interface ContentListResponse {
  data: Content[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ContentFilters {
  type: string;
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listContent(
  params: ContentFilters,
): Promise<ContentListResponse> {
  const { data } = await apiClient.get<ContentListResponse>(
    "/admin/content",
    { params },
  );
  return data;
}

export async function getContent(id: string): Promise<Content> {
  const { data } = await apiClient.get<Content>(`/admin/content/${id}`);
  return data;
}

export async function createContent(
  body: Partial<Content>,
): Promise<Content> {
  const { data } = await apiClient.post<Content>("/admin/content", body);
  return data;
}

export async function updateContent(
  id: string,
  body: Partial<Content>,
): Promise<Content> {
  const { data } = await apiClient.put<Content>(
    `/admin/content/${id}`,
    body,
  );
  return data;
}

export async function deleteContent(id: string): Promise<void> {
  await apiClient.delete(`/admin/content/${id}`);
}

export async function publishContent(id: string): Promise<Content> {
  const { data } = await apiClient.patch<Content>(
    `/admin/content/${id}/publish`,
  );
  return data;
}

export async function unpublishContent(id: string): Promise<Content> {
  const { data } = await apiClient.patch<Content>(
    `/admin/content/${id}/unpublish`,
  );
  return data;
}
