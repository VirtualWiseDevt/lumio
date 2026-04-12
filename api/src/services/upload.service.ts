import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "../config/r2.js";
import { IMAGE_SIZES, WEBP_QUALITY } from "../config/upload.js";

type ImageType = keyof typeof IMAGE_SIZES;

interface ImagePaths {
  [size: string]: string;
}

/**
 * Upload a buffer to R2 at the given key with WebP content type.
 */
async function uploadToR2(key: string, body: Buffer): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

/**
 * Process an uploaded image buffer into multiple WebP size variants
 * and upload each variant to R2.
 *
 * @param buffer  Raw image buffer from Multer memory storage
 * @param type    "poster", "backdrop", or "thumbnail"
 * @returns Object with R2 keys for each size variant,
 *          e.g. { original: "posters/original/uuid-original.webp", ... }
 */
export async function processImage(
  buffer: Buffer,
  type: ImageType,
): Promise<ImagePaths> {
  const uuid = randomUUID();
  const typeDir = `${type}s`; // "posters", "backdrops", "thumbnails"
  const sizes = IMAGE_SIZES[type];
  const paths: ImagePaths = {};

  // Process and upload original
  const origFilename = `${uuid}-original.webp`;
  const origKey = `${typeDir}/original/${origFilename}`;
  const origBuffer = await sharp(buffer)
    .webp({ quality: WEBP_QUALITY.original })
    .toBuffer();
  await uploadToR2(origKey, origBuffer);
  paths.original = origKey;

  // Process and upload each size variant in parallel
  const sizeEntries = Object.entries(sizes) as Array
    [string, { width: number; height?: number; suffix: string }]
  >;
  await Promise.all(
    sizeEntries.map(async ([key, preset]) => {
      const filename = `${uuid}-${preset.suffix}.webp`;
      const r2Key = `${typeDir}/${preset.suffix}/${filename}`;
      const resizeOptions = preset.height
        ? { width: preset.width, height: preset.height, fit: "cover" as const }
        : {
            width: preset.width,
            fit: "inside" as const,
            withoutEnlargement: true,
          };
      const variantBuffer = await sharp(buffer)
        .resize(resizeOptions)
        .webp({ quality: WEBP_QUALITY.resized })
        .toBuffer();
      await uploadToR2(r2Key, variantBuffer);
      paths[key] = r2Key;
    }),
  );

  return paths;
}

/**
 * Delete all files in an image set from R2.
 * Silently ignores missing files.
 *
 * @param paths  Object with R2 keys as returned by processImage
 */
export async function deleteImageSet(
  paths: Record<string, string>,
): Promise<void> {
  await Promise.all(
    Object.values(paths).map((key) =>
      r2Client
        .send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
        .catch(() => {}),
    ),
  );
}
