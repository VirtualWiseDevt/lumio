import { api } from "./client";
import type { MyListItem } from "@/types/player";

export async function getMyList(): Promise<MyListItem[]> {
  const { data } = await api.get<MyListItem[]>("/my-list");
  return data;
}

export async function isInMyList(contentId: string): Promise<boolean> {
  const { data } = await api.get<{ inList: boolean }>(
    `/my-list/${contentId}`
  );
  return data.inList;
}

export async function addToMyList(contentId: string): Promise<void> {
  await api.post(`/my-list/${contentId}`);
}

export async function removeFromMyList(contentId: string): Promise<void> {
  await api.delete(`/my-list/${contentId}`);
}
