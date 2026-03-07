import { apiClient } from "./client";

export interface ImagePaths {
  original: string;
  large: string;
  medium: string;
  thumbnail?: string;
}

export interface UploadResponse {
  paths: ImagePaths;
}

export async function uploadPoster(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await apiClient.post<UploadResponse>(
    "/admin/upload/poster",
    formData,
  );
  return data;
}

export async function uploadBackdrop(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await apiClient.post<UploadResponse>(
    "/admin/upload/backdrop",
    formData,
  );
  return data;
}
