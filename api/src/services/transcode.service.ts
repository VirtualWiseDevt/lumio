import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import type { QualityPreset } from "../types/transcode.types.js";

interface ProbeResult {
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec: string;
}

function spawnAsync(
  command: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    proc.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    proc.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn ${command}: ${err.message}`));
    });

    proc.on("close", (code) => {
      const out = Buffer.concat(stdout).toString("utf-8");
      const err = Buffer.concat(stderr).toString("utf-8");
      if (code === 0) {
        resolve({ stdout: out, stderr: err });
      } else {
        reject(new Error(`${command} exited with code ${code}: ${err}`));
      }
    });
  });
}

export async function probeSource(filePath: string): Promise<ProbeResult> {
  const { stdout } = await spawnAsync("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);

  const data = JSON.parse(stdout) as {
    streams: Array<{
      codec_type: string;
      codec_name: string;
      width: number;
      height: number;
      r_frame_rate: string;
    }>;
    format: { duration: string };
  };

  const videoStream = data.streams.find((s) => s.codec_type === "video");
  if (!videoStream) {
    throw new Error("No video stream found in source file");
  }

  // Parse r_frame_rate (e.g., "24000/1001" -> 23.976 -> 24)
  const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
  const rawFps = den ? num / den : num;
  const fps = Math.round(rawFps);

  return {
    width: videoStream.width,
    height: videoStream.height,
    duration: parseFloat(data.format.duration),
    fps,
    codec: videoStream.codec_name,
  };
}

export async function transcodeToHls(
  sourcePath: string,
  outputDir: string,
  preset: QualityPreset,
  segmentDuration: number,
  fps: number
): Promise<void> {
  // Create output directory for this preset
  const presetDir = `${outputDir}/${preset.name}`;
  await mkdir(presetDir, { recursive: true });

  // GOP = segmentDuration * fps (keyframe interval aligned across all qualities)
  const gop = segmentDuration * fps;

  const args = [
    "-i",
    sourcePath,
    "-vf",
    `scale=${preset.width}:${preset.height}`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-profile:v",
    "main",
    "-level",
    "4.0",
    "-b:v",
    preset.videoBitrate,
    "-maxrate",
    preset.maxRate,
    "-bufsize",
    preset.bufSize,
    "-c:a",
    "aac",
    "-b:a",
    preset.audioBitrate,
    "-ar",
    "48000",
    "-ac",
    "2",
    "-g",
    String(gop),
    "-keyint_min",
    String(gop),
    "-sc_threshold",
    "0",
    "-hls_time",
    String(segmentDuration),
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    `${presetDir}/segment%03d.ts`,
    `${presetDir}/playlist.m3u8`,
  ];

  await spawnAsync("ffmpeg", args);
}

function parseBitrate(bitrate: string): number {
  const value = parseFloat(bitrate);
  if (bitrate.toLowerCase().endsWith("k")) {
    return value * 1000;
  }
  if (bitrate.toLowerCase().endsWith("m")) {
    return value * 1000000;
  }
  return value;
}

export function generateMasterPlaylist(
  qualities: Array<{ preset: QualityPreset; playlistPath: string }>
): string {
  let playlist = "#EXTM3U\n#EXT-X-VERSION:3\n";

  for (const { preset, playlistPath } of qualities) {
    const bandwidth =
      parseBitrate(preset.videoBitrate) + parseBitrate(preset.audioBitrate);
    playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${preset.width}x${preset.height},CODECS="avc1.4d401f,mp4a.40.2"\n`;
    playlist += `${playlistPath}\n`;
  }

  return playlist;
}
