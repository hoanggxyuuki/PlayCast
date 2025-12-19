
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { M3UParser } from '../services/m3uParser';
import { StorageService } from '../services/storageService';
import { Channel, Playlist } from '../types';

interface PlaylistContextType {
  playlists: Playlist[];
  favorites: string[];
  isLoading: boolean;
  error: string | null;


  addPlaylist: (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addPlaylistFromUrl: (url: string, name: string, type: 'm3u' | 'json') => Promise<void>;
  createEmptyPlaylist: (name: string) => Promise<string>;
  addChannelToPlaylist: (playlistId: string, channel: Channel) => Promise<void>;
  removeChannelFromPlaylist: (playlistId: string, channelId: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  refreshPlaylist: (id: string) => Promise<void>;


  toggleFavorite: (channelId: string) => Promise<void>;
  isFavorite: (channelId: string) => boolean;


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

  const addPlaylist = async (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      setError(null);

      const newPlaylist = await StorageService.addPlaylist(playlist);
      setPlaylists(prev => [...prev, newPlaylist]);
    } catch (err: any) {
      setError(err.message || 'Failed to add playlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createEmptyPlaylist = async (name: string): Promise<string> => {
    try {
      setError(null);
      const newPlaylist = await StorageService.addPlaylist({
        name,
        url: '',
        type: 'local' as any,
        channels: [],
      });
      setPlaylists(prev => [...prev, newPlaylist]);
      return newPlaylist.id;
    } catch (err: any) {
      setError(err.message || 'Failed to create playlist');
      throw err;
    }
  };

  const addChannelToPlaylist = async (playlistId: string, channel: Channel) => {
    try {
      // Try to find in current state first
      let playlist = playlists.find(p => p.id === playlistId);

      // If not found in state, try fetching fresh from storage (handles race condition)
      if (!playlist) {
        const freshPlaylists = await StorageService.loadPlaylists();
        playlist = freshPlaylists.find(p => p.id === playlistId);
      }

      if (!playlist) throw new Error('Playlist not found');

      // Check if channel already exists in playlist
      if (playlist.channels.some(c => c.id === channel.id)) {
        throw new Error('Track already in playlist');
      }

      const updatedChannels = [...playlist.channels, channel];
      await StorageService.updatePlaylist(playlistId, { channels: updatedChannels });

      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlistId ? { ...p, channels: updatedChannels, updatedAt: new Date() } : p
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to add to playlist');
      throw err;
    }
  };

  const removeChannelFromPlaylist = async (playlistId: string, channelId: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) throw new Error('Playlist not found');

      const updatedChannels = playlist.channels.filter(c => c.id !== channelId);
      await StorageService.updatePlaylist(playlistId, { channels: updatedChannels });

      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlistId ? { ...p, channels: updatedChannels, updatedAt: new Date() } : p
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to remove from playlist');
      throw err;
    }
  };

  const addPlaylistFromUrl = async (url: string, name: string, type: 'm3u' | 'json') => {
    try {
      setIsLoading(true);
      setError(null);

      let channels: Channel[];


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
    addPlaylist,
    addPlaylistFromUrl,
    createEmptyPlaylist,
    addChannelToPlaylist,
    removeChannelFromPlaylist,
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
