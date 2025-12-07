// Types and Interfaces for IPTV Player App

export interface Channel {
  id: string;
  name: string;
  logo?: string;
  url: string;
  group?: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  duration?: number; // For tracking total duration
  rating?: number; // User rating 1-5
  viewCount?: number; // Track popularity
}

export interface Playlist {
  id: string;
  name: string;
  url: string;
  type: 'm3u' | 'json';
  channels: Channel[];
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  thumbnail?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackSpeed: number; // 0.25, 0.5, 1.0, 1.5, 2.0
  brightness: number; // 0-1
}

export interface VideoPlayerProps {
  channel: Channel;
  playlist?: Channel[]; // For queue/autoplay
  onClose: () => void;
  onError?: (error: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  startPosition?: number; // Continue watching
  loopMode?: 'none' | 'one' | 'all';
  shuffleMode?: boolean;
  onLoopModeChange?: (mode: 'none' | 'one' | 'all') => void;
  onShuffleModeChange?: (enabled: boolean) => void;
  playlistInfo?: { current: number; total: number };
}

// Watch History
export interface WatchHistory {
  channelId: string;
  channelName: string;
  channelUrl: string;
  logo?: string;
  lastWatchedAt: Date;
  progress: number; // 0-1 (percentage watched)
  duration: number;
  currentTime: number;
}

// Download
export interface Download {
  id: string;
  channelId: string;
  channelName: string;
  url: string;
  localUri?: string;
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  size: number; // bytes
  downloadedSize: number; // bytes
  createdAt: Date;
  completedAt?: Date;
}

// Sleep Timer
export interface SleepTimer {
  isActive: boolean;
  duration: number; // minutes
  startTime: Date;
  endTime: Date;
}

// App Settings
export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  language: 'en' | 'vi';
  autoPlayNext: boolean;
  defaultPlaybackSpeed: number;
  defaultQuality: 'auto' | '1080p' | '720p' | '480p' | '360p';
  continueWatching: boolean;
  pictureInPicture: boolean;
  backgroundPlayback: boolean;
  downloadQuality: 'high' | 'medium' | 'low';
  gestureControls: boolean;
  doubleTapSeek: number; // seconds (10, 15, 30)
  volumeGesture: boolean;
  brightnessGesture: boolean;
}

// Recommendations
export interface Recommendation {
  channelId: string;
  score: number; // 0-1
  reason: 'similar' | 'popular' | 'category' | 'history';
}

// User Statistics
export interface UserStats {
  totalWatchTime: number; // minutes
  videosWatched: number;
  favoriteCategories: string[];
  mostWatchedChannel?: string;
  weeklyWatchTime: number[];
}

// Queue Item
export interface QueueItem {
  channel: Channel;
  addedAt: Date;
  position: number;
}

// Share Data
export interface ShareData {
  channelId: string;
  channelName: string;
  url: string;
  thumbnail?: string;
  message?: string;
}

// Subtitle Track
export interface SubtitleTrack {
  id: string;
  language: string;
  url: string;
  label: string;
  isDefault: boolean;
}
