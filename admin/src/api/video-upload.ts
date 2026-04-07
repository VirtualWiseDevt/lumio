import { apiClient } from "./client";
import type { AxiosProgressEvent } from "axios";

export interface PresignUploadData {
  contentId: string;
  episodeId?: string;
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  key: string;
}

export interface ConfirmUploadData {
  contentId: string;
  episodeId?: string;
  key: string;
}

export interface ConfirmUploadResponse {
  success: boolean;
  key: string;
}

export interface ProxyUploadResponse {
  success: boolean;
  key: string;
}

export async function getPresignedUploadUrl(
  data: PresignUploadData,
): Promise<PresignUploadResponse> {
  const { data: result } = await apiClient.post<PresignUploadResponse>(
    "/admin/video-upload/presign",
    data,
  );
  return result;
}

export async function confirmVideoUpload(
  data: ConfirmUploadData,
): Promise<ConfirmUploadResponse> {
  const { data: result } = await apiClient.post<ConfirmUploadResponse>(
    "/admin/video-upload/confirm",
    data,
  );
  return result;
}

export async function uploadVideo(
  file: File,
  contentId: string,
  episodeId: string | undefined,
  onProgress?: (percent: number) => void,
): Promise<ProxyUploadResponse> {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("contentId", contentId);
  if (episodeId) {
    formData.append("episodeId", episodeId);
  }

  const { data: result } = await apiClient.post<ProxyUploadResponse>(
    "/admin/video-upload/upload",
    formData,
    {
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    },
  );
  return result;
}
