// Mini Player Context - Manages floating mini player state
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Channel } from '../types';

interface MiniPlayerState {
  isVisible: boolean;
  channel: Channel | null;
  position: number; // Current playback position
  isPlaying: boolean;
}

interface MiniPlayerContextType {
  miniPlayer: MiniPlayerState;
  showMiniPlayer: (channel: Channel, position?: number) => void;
  hideMiniPlayer: () => void;
  updatePosition: (position: number) => void;
  togglePlayback: () => void;
  expandPlayer: () => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextType | undefined>(undefined);

export const MiniPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [miniPlayer, setMiniPlayer] = useState<MiniPlayerState>({
    isVisible: false,
    channel: null,
    position: 0,
    isPlaying: false,
  });

  const [onExpand, setOnExpand] = useState<((channel: Channel, position: number) => void) | null>(null);

  const showMiniPlayer = (channel: Channel, position: number = 0) => {
    setMiniPlayer({
      isVisible: true,
      channel,
      position,
      isPlaying: true,
    });
  };

  const hideMiniPlayer = () => {
    setMiniPlayer({
      isVisible: false,
      channel: null,
      position: 0,
      isPlaying: false,
    });
  };

  const updatePosition = (position: number) => {
    setMiniPlayer(prev => ({ ...prev, position }));
  };

  const togglePlayback = () => {
    setMiniPlayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const expandPlayer = () => {
    if (miniPlayer.channel && onExpand) {
      onExpand(miniPlayer.channel, miniPlayer.position);
    }
  };

  // Register expand callback
  const registerExpandCallback = (callback: (channel: Channel, position: number) => void) => {
    setOnExpand(() => callback);
  };

  return (
    <MiniPlayerContext.Provider
      value={{
        miniPlayer,
        showMiniPlayer,
        hideMiniPlayer,
        updatePosition,
        togglePlayback,
        expandPlayer,
      }}
    >
      {children}
    </MiniPlayerContext.Provider>
  );
};

export const useMiniPlayer = () => {
  const context = useContext(MiniPlayerContext);
  if (!context) {
    throw new Error('useMiniPlayer must be used within MiniPlayerProvider');
  }
  return context;
};
