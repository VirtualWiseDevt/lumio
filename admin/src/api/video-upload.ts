import { apiClient } from "./client";

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
