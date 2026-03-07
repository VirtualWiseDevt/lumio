import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "../config/r2.js";
import { generatePresignedDownloadUrl } from "./r2.service.js";

/**
 * Determine the HLS prefix in R2 for a given content/episode.
 */
function hlsPrefix(contentId: string, episodeId?: string): string {
  if (episodeId) {
    return `videos/${contentId}/episodes/${episodeId}/hls/`;
  }
  return `videos/${contentId}/hls/`;
}

/**
 * Download a file from R2 and return its contents as a UTF-8 string.
 */
async function downloadR2Text(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error(`Empty response body for key: ${key}`);
  }

  return response.Body.transformToString("utf-8");
}

/**
 * Get the master playlist for a content item, rewriting quality playlist
 * references to API URLs (so the client never sees raw R2 keys).
 */
export async function getStreamPlaylist(
  contentId: string,
  episodeId?: string,
): Promise<string> {
  const prefix = hlsPrefix(contentId, episodeId);
  const masterKey = `${prefix}master.m3u8`;
  const masterContent = await downloadR2Text(masterKey);

  const episodeParam = episodeId ? `?episode=${episodeId}` : "";

  // Rewrite quality playlist paths to API URLs
  const lines = masterContent.split("\n");
  const rewritten = lines.map((line) => {
    const trimmed = line.trim();
    // Lines referencing quality playlists (e.g., "360p/playlist.m3u8")
    if (trimmed && !trimmed.startsWith("#") && trimmed.endsWith(".m3u8")) {
      // Extract quality from path like "360p/playlist.m3u8"
      const quality = trimmed.split("/")[0];
      return `/api/stream/${contentId}/${quality}${episodeParam}`;
    }
    return line;
  });

  return rewritten.join("\n");
}

/**
 * Get a quality-specific playlist, rewriting .ts segment filenames
 * to presigned R2 URLs (4-hour TTL) for direct client access.
 */
export async function getQualityPlaylist(
  contentId: string,
  quality: string,
  episodeId?: string,
): Promise<string> {
  const prefix = hlsPrefix(contentId, episodeId);
  const playlistKey = `${prefix}${quality}/playlist.m3u8`;
  const playlistContent = await downloadR2Text(playlistKey);

  const lines = playlistContent.split("\n");
  const rewritten: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Lines referencing .ts segments (e.g., "segment001.ts")
    if (trimmed && !trimmed.startsWith("#") && trimmed.endsWith(".ts")) {
      const segmentKey = `${prefix}${quality}/${trimmed}`;
      const presignedUrl = await generatePresignedDownloadUrl(segmentKey);
      rewritten.push(presignedUrl);
    } else {
      rewritten.push(line);
    }
  }

  return rewritten.join("\n");
}
