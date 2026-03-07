import { api } from "./client";
import type {
  BrowsePageData,
  LiveTvData,
  ContentDetail,
  Content,
  SearchResults,
} from "@/types/content";

/**
 * Build the stream URL for HLS playback of transcoded content.
 * Returns the full URL to the stream endpoint which provides m3u8 playlists.
 */
export function getStreamUrl(contentId: string, episodeId?: string): string {
  const base = `/api/stream/${contentId}`;
  return episodeId ? `${base}?episode=${episodeId}` : base;
}

export async function fetchHomePageData(): Promise<BrowsePageData> {
  const { data } = await api.get<BrowsePageData>("/browse");
  return data;
}

export async function fetchBrowsePageData(
  type: "movies" | "series" | "documentaries"
): Promise<BrowsePageData> {
  const { data } = await api.get<BrowsePageData>(`/browse/${type}`);
  return data;
}

export async function fetchLiveTvData(): Promise<LiveTvData> {
  const { data } = await api.get<LiveTvData>("/browse/live-tv");
  return data;
}

export async function fetchTitleDetail(id: string): Promise<ContentDetail> {
  const { data } = await api.get<ContentDetail>(`/browse/title/${id}`);
  return data;
}

export async function fetchSimilarTitles(id: string): Promise<Content[]> {
  const { data } = await api.get<Content[]>(`/browse/title/${id}/similar`);
  return data;
}

export async function searchContent(query: string): Promise<SearchResults> {
  const { data } = await api.get<SearchResults>("/browse/search", {
    params: { q: query },
  });
  return data;
}
