import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET_NAME } from "../config/r2.js";

/**
 * Generate a presigned PUT URL for direct browser-to-R2 upload.
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a presigned GET URL for downloading/streaming from R2.
 * Default TTL: 4 hours.
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn = 14400,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Upload a buffer or readable stream to R2 (used for transcoded segments).
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Readable,
  contentType: string,
  cacheControl?: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    ...(cacheControl ? { CacheControl: cacheControl } : {}),
  });
  await r2Client.send(command);
}

/**
 * Delete a single object from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  await r2Client.send(command);
}

/**
 * Delete all objects matching a prefix (with pagination).
 */
export async function deleteR2Prefix(prefix: string): Promise<void> {
  let continuationToken: string | undefined;

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });
    const response = await r2Client.send(listCommand);

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key) {
          await deleteFromR2(object.Key);
        }
      }
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);
}

/**
 * List all object keys matching a prefix (with pagination).
 */
export async function listR2Objects(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });
    const response = await r2Client.send(command);

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key) {
          keys.push(object.Key);
        }
      }
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
}

/**
 * Get object metadata (content length, content type) or null if not found.
 */
export async function headR2Object(
  key: string,
): Promise<{ contentLength: number; contentType: string } | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    const response = await r2Client.send(command);
    return {
      contentLength: response.ContentLength ?? 0,
      contentType: response.ContentType ?? "application/octet-stream",
    };
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === "NotFound" || err.name === "NoSuchKey") {
      return null;
    }
    throw error;
  }
}

/**
 * Stream an R2 object to a local file path.
 * Used by ffprobe validation and transcode jobs.
 */
export async function streamR2ToFile(
  key: string,
  destPath: string,
): Promise<void> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error(`Empty response body for key: ${key}`);
  }

  const readable = response.Body as Readable;
  const writable = createWriteStream(destPath);
  await pipeline(readable, writable);
}
