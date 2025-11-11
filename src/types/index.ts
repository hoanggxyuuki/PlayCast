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
}

export interface Playlist {
  id: string;
  name: string;
  url: string;
  type: 'm3u' | 'json';
  channels: Channel[];
  createdAt: Date;
  updatedAt: Date;
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
}

export interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
  onError?: (error: string) => void;
}
