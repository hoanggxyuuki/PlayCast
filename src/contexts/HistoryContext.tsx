// History Context for Watch History Management
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { UserStats, WatchHistory } from '../types';

interface HistoryContextType {
  history: WatchHistory[];
  stats: UserStats;
  addToHistory: (item: WatchHistory) => Promise<void>;
  getHistoryForChannel: (channelId: string) => WatchHistory | null;
  updateProgress: (channelId: string, currentTime: number, duration: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  removeFromHistory: (channelId: string) => Promise<void>;
  getRecentlyWatched: (limit?: number) => WatchHistory[];
  getContinueWatching: () => WatchHistory[];
  refreshHistory: () => Promise<void>;
  isLoading: boolean;
}

const defaultStats: UserStats = {
  totalWatchTime: 0,
  videosWatched: 0,
  favoriteCategories: [],
  weeklyWatchTime: [0, 0, 0, 0, 0, 0, 0],
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<WatchHistory[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  // Load history and stats on mount
  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const savedHistory = await StorageService.loadWatchHistory();
      setHistory(savedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const savedStats = await StorageService.loadUserStats();
      setStats(savedStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(defaultStats);
    }
  };

  const addToHistory = async (item: WatchHistory) => {
    try {
      await StorageService.addToWatchHistory(item);

      // Update local state
      const existingIndex = history.findIndex((h) => h.channelId === item.channelId);
      let newHistory: WatchHistory[];
      const isNewEntry = existingIndex === -1;

      if (existingIndex !== -1) {
        // Update existing entry
        newHistory = [...history];
        newHistory[existingIndex] = item;
      } else {
        // Add new entry at the beginning
        newHistory = [item, ...history];
      }

      setHistory(newHistory);

      // Update stats - only increment count for NEW entries, not updates
      if (isNewEntry) {
        await StorageService.incrementVideosWatched();
        await loadStats();
      }

      console.log(isNewEntry ? 'Added to history:' : 'Updated history:', item.channelName);
    } catch (error) {
      console.error('Error adding to history:', error);
      throw error;
    }
  };

  const getHistoryForChannel = (channelId: string): WatchHistory | null => {
    return history.find((h) => h.channelId === channelId) || null;
  };

  const updateProgress = async (channelId: string, currentTime: number, duration: number) => {
    try {
      const existingHistory = getHistoryForChannel(channelId);

      if (!existingHistory) {
        console.warn('No history found for channel:', channelId);
        return;
      }

      const progress = duration > 0 ? currentTime / duration : 0;

      const updatedItem: WatchHistory = {
        ...existingHistory,
        currentTime,
        duration,
        progress,
        lastWatchedAt: new Date(),
      };

      await addToHistory(updatedItem);
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  };

  const clearHistory = async () => {
    try {
      await StorageService.clearWatchHistory();
      setHistory([]);
      console.log('History cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  };

  const removeFromHistory = async (channelId: string) => {
    try {
      await StorageService.removeFromWatchHistory(channelId);
      setHistory(history.filter((h) => h.channelId !== channelId));
      console.log('Removed from history:', channelId);
    } catch (error) {
      console.error('Error removing from history:', error);
      throw error;
    }
  };

  const getRecentlyWatched = (limit: number = 10): WatchHistory[] => {
    return [...history]
      .sort((a, b) => {
        const dateA = a.lastWatchedAt instanceof Date ? a.lastWatchedAt : new Date(a.lastWatchedAt);
        const dateB = b.lastWatchedAt instanceof Date ? b.lastWatchedAt : new Date(b.lastWatchedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  };

  const getContinueWatching = (): WatchHistory[] => {
    // Return videos that are partially watched (between 5% and 95% progress)
    return [...history]
      .filter((h) => h.progress > 0.05 && h.progress < 0.95)
      .sort((a, b) => {
        const dateA = a.lastWatchedAt instanceof Date ? a.lastWatchedAt : new Date(a.lastWatchedAt);
        const dateB = b.lastWatchedAt instanceof Date ? b.lastWatchedAt : new Date(b.lastWatchedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);
  };

  const refreshHistory = async () => {
    await loadHistory();
    await loadStats();
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        stats,
        addToHistory,
        getHistoryForChannel,
        updateProgress,
        clearHistory,
        removeFromHistory,
        getRecentlyWatched,
        getContinueWatching,
        refreshHistory,
        isLoading,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

// Custom hook to use history
export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

// Helper hook for continue watching feature
export const useContinueWatching = () => {
  const { getContinueWatching, getHistoryForChannel } = useHistory();
  return {
    continueWatching: getContinueWatching(),
    getResumeTime: (channelId: string) => {
      const item = getHistoryForChannel(channelId);
      return item?.currentTime || 0;
    },
  };
};

// Helper hook for statistics
export const useWatchStats = () => {
  const { stats } = useHistory();
  return {
    totalWatchTime: stats.totalWatchTime,
    videosWatched: stats.videosWatched,
    favoriteCategories: stats.favoriteCategories,
    mostWatchedChannel: stats.mostWatchedChannel,
    weeklyWatchTime: stats.weeklyWatchTime,
    averageWatchTime: stats.videosWatched > 0 ? stats.totalWatchTime / stats.videosWatched : 0,
  };
};
