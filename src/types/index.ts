

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
  duration?: number;
  rating?: number;
  viewCount?: number;
  // For online sources - store original URL to refresh expired streams
  sourceUrl?: string; // Original SoundCloud/YouTube URL
  sourceType?: 'youtube' | 'soundcloud' | 'local' | 'iptv';
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
  playbackSpeed: number;
  brightness: number;
}

export interface VideoPlayerProps {
  channel: Channel;
  playlist?: Channel[];
  onClose: () => void;
  onError?: (error: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  startPosition?: number;
  loopMode?: 'none' | 'one' | 'all';
  shuffleMode?: boolean;
  onLoopModeChange?: (mode: 'none' | 'one' | 'all') => void;
  onShuffleModeChange?: (enabled: boolean) => void;
  playlistInfo?: { current: number; total: number };
}


export interface WatchHistory {
  channelId: string;
  channelName: string;
  channelUrl: string;
  logo?: string;
  lastWatchedAt: Date;
  progress: number;
  duration: number;
  currentTime: number;
}


export interface Download {
  id: string;
  channelId: string;
  channelName: string;
  url: string;
  localUri?: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  size: number;
  downloadedSize: number;
  createdAt: Date;
  completedAt?: Date;
}


export interface SleepTimer {
  isActive: boolean;
  duration: number;
  startTime: Date;
  endTime: Date;
}


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
  doubleTapSeek: number;
  volumeGesture: boolean;
  brightnessGesture: boolean;
}


export interface Recommendation {
  channelId: string;
  score: number;
  reason: 'similar' | 'popular' | 'category' | 'history';
}


export interface UserStats {
  totalWatchTime: number;
  videosWatched: number;
  favoriteCategories: string[];
  mostWatchedChannel?: string;
  weeklyWatchTime: number[];
}


export interface QueueItem {
  channel: Channel;
  addedAt: Date;
  position: number;
}


export interface ShareData {
  channelId: string;
  channelName: string;
  url: string;
  thumbnail?: string;
  message?: string;
}


export interface SubtitleTrack {
  id: string;
  language: string;
  url: string;
  label: string;
  isDefault: boolean;
}
