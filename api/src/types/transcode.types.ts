export type TranscodingStatus = "pending" | "processing" | "completed" | "failed";

export interface QualityPreset {
  name: string;
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
  maxRate: string;
  bufSize: string;
}

export interface TranscodeJobData {
  contentId: string;
  episodeId?: string;
  sourceKey: string;
  outputPrefix: string;
}

export interface TranscodeResult {
  qualities: string[];
  masterPlaylistKey: string;
  duration: number;
}

export const QUALITY_PRESETS: QualityPreset[] = [
  { name: "360p", width: 640, height: 360, videoBitrate: "800k", audioBitrate: "96k", maxRate: "856k", bufSize: "1200k" },
  { name: "480p", width: 854, height: 480, videoBitrate: "1400k", audioBitrate: "128k", maxRate: "1498k", bufSize: "2100k" },
  { name: "720p", width: 1280, height: 720, videoBitrate: "2800k", audioBitrate: "128k", maxRate: "2996k", bufSize: "4200k" },
  { name: "1080p", width: 1920, height: 1080, videoBitrate: "5000k", audioBitrate: "192k", maxRate: "5350k", bufSize: "7500k" },
];
