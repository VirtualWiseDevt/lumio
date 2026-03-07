import { api } from "./client";
import type { ProgressData, ContinueWatchingItem } from "@/types/player";

export async function saveProgress(data: ProgressData): Promise<void> {
  await api.post("/progress", data);
}

export async function getProgress(
  contentId: string,
  episodeId?: string
): Promise<{ timestamp: number; duration: number; completed: boolean } | null> {
  const { data } = await api.get(`/progress/${contentId}`, {
    params: episodeId ? { episodeId } : undefined,
  });
  return data;
}

export async function getContinueWatching(
  months?: number
): Promise<ContinueWatchingItem[]> {
  const { data } = await api.get<ContinueWatchingItem[]>(
    "/progress/continue-watching",
    {
      params: months ? { months } : undefined,
    }
  );
  return data;
}
