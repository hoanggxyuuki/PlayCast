// Playlist Context for managing app state
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Playlist, Channel } from '../types';
import { StorageService } from '../services/storageService';
import { M3UParser } from '../services/m3uParser';

interface PlaylistContextType {
  playlists: Playlist[];
  favorites: string[];
  isLoading: boolean;
  error: string | null;

  // Playlist operations
  addPlaylistFromUrl: (url: string, name: string, type: 'm3u' | 'json') => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  refreshPlaylist: (id: string) => Promise<void>;

  // Favorite operations
  toggleFavorite: (channelId: string) => Promise<void>;
  isFavorite: (channelId: string) => boolean;

  // Utility
  getAllChannels: () => Channel[];
  getFavoriteChannels: () => Channel[];
  refreshData: () => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

interface PlaylistProviderProps {
  children: ReactNode;
}

export const PlaylistProvider: React.FC<PlaylistProviderProps> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [loadedPlaylists, loadedFavorites] = await Promise.all([
        StorageService.loadPlaylists(),
        StorageService.loadFavorites(),
      ]);
      setPlaylists(loadedPlaylists);
      setFavorites(loadedFavorites);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addPlaylistFromUrl = async (url: string, name: string, type: 'm3u' | 'json') => {
    try {
      setIsLoading(true);
      setError(null);

      let channels: Channel[];

      // Pass custom name to parser for direct media URLs
      if (type === 'm3u') {
        channels = await M3UParser.parseM3UFromUrl(url, name);
      } else {
        channels = await M3UParser.parseJSONFromUrl(url, name);
      }

      if (channels.length === 0) {
        throw new Error('No media found at URL');
      }

      const newPlaylist = await StorageService.addPlaylist({
        name,
        url,
        type,
        channels,
      });

      setPlaylists(prev => [...prev, newPlaylist]);
    } catch (err: any) {
      setError(err.message || 'Failed to add media');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlaylist = async (id: string) => {
    try {
      await StorageService.deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete playlist');
      throw err;
    }
  };

  const refreshPlaylist = async (id: string) => {
    try {
      setIsLoading(true);
      const playlist = playlists.find(p => p.id === id);
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      let channels: Channel[];

      if (playlist.type === 'm3u') {
        channels = await M3UParser.parseM3UFromUrl(playlist.url);
      } else {
        channels = await M3UParser.parseJSONFromUrl(playlist.url);
      }

      await StorageService.updatePlaylist(id, { channels });

      setPlaylists(prev =>
        prev.map(p =>
          p.id === id ? { ...p, channels, updatedAt: new Date() } : p
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to refresh playlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (channelId: string) => {
    try {
      if (favorites.includes(channelId)) {
        await StorageService.removeFavorite(channelId);
        setFavorites(prev => prev.filter(id => id !== channelId));
      } else {
        await StorageService.addFavorite(channelId);
        setFavorites(prev => [...prev, channelId]);
      }
    } catch (err) {
      setError('Failed to update favorites');
      throw err;
    }
  };

  const isFavorite = (channelId: string): boolean => {
    return favorites.includes(channelId);
  };

  const getAllChannels = (): Channel[] => {
    return playlists.flatMap(playlist => playlist.channels);
  };

  const getFavoriteChannels = (): Channel[] => {
    const allChannels = getAllChannels();
    return allChannels.filter(channel => favorites.includes(channel.id));
  };

  const refreshData = async () => {
    await loadData();
  };

  const value: PlaylistContextType = {
    playlists,
    favorites,
    isLoading,
    error,
    addPlaylistFromUrl,
    deletePlaylist,
    refreshPlaylist,
    toggleFavorite,
    isFavorite,
    getAllChannels,
    getFavoriteChannels,
    refreshData,
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};
