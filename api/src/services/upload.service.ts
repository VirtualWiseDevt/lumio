import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { unlink } from "node:fs/promises";
import {
  UPLOAD_DIR,
  IMAGE_SIZES,
  WEBP_QUALITY,
  ensureUploadDirs,
} from "../config/upload.js";

/** Ensure directories exist on first import. */
ensureUploadDirs();

type ImageType = keyof typeof IMAGE_SIZES;

interface ImagePaths {
  [size: string]: string;
}

/**
 * Process an uploaded image buffer into multiple WebP size variants.
 *
 * @param buffer  Raw image buffer from Multer memory storage
 * @param type    "poster" or "backdrop"
 * @returns Object with relative paths (no leading slash, no "uploads/" prefix)
 *          for each size variant, e.g. { original: "posters/original/uuid-original.webp", ... }
 */
export async function processImage(
  buffer: Buffer,
  type: ImageType,
): Promise<ImagePaths> {
  const uuid = randomUUID();
  const typeDir = `${type}s`; // "posters" or "backdrops"
  const sizes = IMAGE_SIZES[type];
  const paths: ImagePaths = {};

  // Save original as WebP
  const origFilename = `${uuid}-original.webp`;
  const origPath = join(UPLOAD_DIR, typeDir, "original", origFilename);
  await sharp(buffer)
    .webp({ quality: WEBP_QUALITY.original })
    .toFile(origPath);
  paths.original = `${typeDir}/original/${origFilename}`;

  // Generate each size variant
  const sizeEntries = Object.entries(sizes) as Array<
    [string, { width: number; height?: number; suffix: string }]
  >;

  await Promise.all(
    sizeEntries.map(async ([key, preset]) => {
      const filename = `${uuid}-${preset.suffix}.webp`;
      const outputPath = join(
        UPLOAD_DIR,
        typeDir,
        preset.suffix,
        filename,
      );
      const resizeOptions = preset.height
        ? { width: preset.width, height: preset.height, fit: "cover" as const }
        : { width: preset.width, fit: "inside" as const, withoutEnlargement: true };
      await sharp(buffer)
        .resize(resizeOptions)
        .webp({ quality: WEBP_QUALITY.resized })
        .toFile(outputPath);
      paths[key] = `${typeDir}/${preset.suffix}/${filename}`;
    }),
  );

  return paths;
}

/**
 * Delete all files in an image set.
 * Silently ignores missing files (already deleted or never created).
 *
 * @param paths  Object with relative paths as returned by processImage
 */
export async function deleteImageSet(
  paths: Record<string, string>,
): Promise<void> {
  await Promise.all(
    Object.values(paths).map((relativePath) =>
      unlink(join(UPLOAD_DIR, relativePath)).catch(() => {}),
    ),
  );
}
