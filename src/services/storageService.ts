// Storage Service using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Playlist } from '../types';

const STORAGE_KEYS = {
  PLAYLISTS: '@iptv_playlists',
  FAVORITES: '@iptv_favorites',
  RECENT_CHANNELS: '@iptv_recent_channels',
};

export class StorageService {
  /**
   * Save playlists to storage
   */
  static async savePlaylists(playlists: Playlist[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(playlists);
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, jsonValue);
    } catch (error) {
      console.error('Error saving playlists:', error);
      throw new Error('Failed to save playlists');
    }
  }

  /**
   * Load playlists from storage
   */
  static async loadPlaylists(): Promise<Playlist[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (jsonValue != null) {
        const playlists = JSON.parse(jsonValue);
        // Convert date strings back to Date objects
        return playlists.map((playlist: any) => ({
          ...playlist,
          createdAt: new Date(playlist.createdAt),
          updatedAt: new Date(playlist.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading playlists:', error);
      return [];
    }
  }

  /**
   * Add a new playlist
   */
  static async addPlaylist(playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playlist> {
    try {
      const playlists = await this.loadPlaylists();

      const newPlaylist: Playlist = {
        ...playlist,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      playlists.push(newPlaylist);
      await this.savePlaylists(playlists);

      return newPlaylist;
    } catch (error) {
      console.error('Error adding playlist:', error);
      throw new Error('Failed to add playlist');
    }
  }

  /**
   * Update an existing playlist
   */
  static async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<void> {
    try {
      const playlists = await this.loadPlaylists();
      const index = playlists.findIndex(p => p.id === id);

      if (index !== -1) {
        playlists[index] = {
          ...playlists[index],
          ...updates,
          updatedAt: new Date(),
        };
        await this.savePlaylists(playlists);
      }
    } catch (error) {
      console.error('Error updating playlist:', error);
      throw new Error('Failed to update playlist');
    }
  }

  /**
   * Delete a playlist
   */
  static async deletePlaylist(id: string): Promise<void> {
    try {
      const playlists = await this.loadPlaylists();
      const filteredPlaylists = playlists.filter(p => p.id !== id);
      await this.savePlaylists(filteredPlaylists);
    } catch (error) {
      console.error('Error deleting playlist:', error);
      throw new Error('Failed to delete playlist');
    }
  }

  /**
   * Save favorite channels
   */
  static async saveFavorites(channelIds: string[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(channelIds);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, jsonValue);
    } catch (error) {
      console.error('Error saving favorites:', error);
      throw new Error('Failed to save favorites');
    }
  }

  /**
   * Load favorite channels
   */
  static async loadFavorites(): Promise<string[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  /**
   * Add channel to favorites
   */
  static async addFavorite(channelId: string): Promise<void> {
    try {
      const favorites = await this.loadFavorites();
      if (!favorites.includes(channelId)) {
        favorites.push(channelId);
        await this.saveFavorites(favorites);
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw new Error('Failed to add favorite');
    }
  }

  /**
   * Remove channel from favorites
   */
  static async removeFavorite(channelId: string): Promise<void> {
    try {
      const favorites = await this.loadFavorites();
      const filteredFavorites = favorites.filter(id => id !== channelId);
      await this.saveFavorites(filteredFavorites);
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw new Error('Failed to remove favorite');
    }
  }

  /**
   * Clear all data
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PLAYLISTS,
        STORAGE_KEYS.FAVORITES,
        STORAGE_KEYS.RECENT_CHANNELS,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
