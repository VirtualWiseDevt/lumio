export interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  buffered: number; // 0-1 percentage
  volume: number; // 0-1
  showControls: boolean;
  showNextEpisode: boolean;
  bufferingStartTime: number | null; // for slow-connection hint after 5s
}

export interface WatchPageParams {
  id: string; // contentId
}

export interface WatchPageSearchParams {
  episode?: string; // episodeId for series
}

export interface ProgressData {
  contentId: string;
  episodeId: string | null;
  timestamp: number;
  duration: number;
}

export interface ContinueWatchingItem {
  id: string;
  content: import("./content").Content;
  episodeId: string | null;
  episodeTitle: string | null;
  episodeThumbnail: string | null;
  timestamp: number;
  duration: number;
  progressPercent: number;
  updatedAt: string;
}

export interface MyListItem {
  id: string;
  content: import("./content").Content;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: string;
  createdAt: string;
}

export type UserSubscription = {
  id: string;
  planName: string;
  status: string;
  endDate: string;
  autoRenew: boolean;
} | null;

export interface DeviceSession {
  id: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
}
