
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  Channel,
  Playlist,
  QueueItem,
  UserStats,
  WatchHistory
} from '../types';

const STORAGE_KEYS = {
  PLAYLISTS: '@playcast_playlists',
  FAVORITES: '@playcast_favorites',
  RECENT_CHANNELS: '@playcast_recent_channels',
  WATCH_HISTORY: '@playcast_watch_history',
  DOWNLOADS: '@playcast_downloads',
  SETTINGS: '@playcast_settings',
  USER_STATS: '@playcast_user_stats',
  QUEUE: '@playcast_queue',
  CHANNEL_RATINGS: '@playcast_channel_ratings',
};


const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'en',
  autoPlayNext: true,
  defaultPlaybackSpeed: 1.0,
  defaultQuality: 'auto',
  continueWatching: true,
  pictureInPicture: true,
  backgroundPlayback: true,
  downloadQuality: 'high',
  gestureControls: true,
  doubleTapSeek: 10,
  volumeGesture: true,
  brightnessGesture: true,
};

export class StorageService {


  static async savePlaylists(playlists: Playlist[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(playlists);
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, jsonValue);
    } catch (error) {
      console.error('Error saving playlists:', error);
      throw new Error('Failed to save playlists');
    }
  }

  static async loadPlaylists(): Promise<Playlist[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (jsonValue != null) {
        const playlists = JSON.parse(jsonValue);
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



  static async saveFavorites(channelIds: string[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(channelIds);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, jsonValue);
    } catch (error) {
      console.error('Error saving favorites:', error);
      throw new Error('Failed to save favorites');
    }
  }

  static async loadFavorites(): Promise<string[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

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



  static async saveWatchHistory(history: WatchHistory[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(history);
      await AsyncStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, jsonValue);
    } catch (error) {
      console.error('Error saving watch history:', error);
    }
  }

  static async loadWatchHistory(): Promise<WatchHistory[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
      if (jsonValue != null) {
        const history = JSON.parse(jsonValue);
        return history.map((item: any) => ({
          ...item,
          lastWatchedAt: new Date(item.lastWatchedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading watch history:', error);
      return [];
    }
  }

  static async addToWatchHistory(item: WatchHistory): Promise<void> {
    try {
      const history = await this.loadWatchHistory();
      const existingIndex = history.findIndex(h => h.channelId === item.channelId);

      if (existingIndex !== -1) {

        history[existingIndex] = item;
      } else {

        history.unshift(item);
      }


      const limitedHistory = history.slice(0, 100);
      await this.saveWatchHistory(limitedHistory);
    } catch (error) {
      console.error('Error adding to watch history:', error);
    }
  }

  static async getWatchHistory(channelId: string): Promise<WatchHistory | null> {
    try {
      const history = await this.loadWatchHistory();
      return history.find(h => h.channelId === channelId) || null;
    } catch (error) {
      console.error('Error getting watch history:', error);
      return null;
    }
  }

  static async clearWatchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY);
    } catch (error) {
      console.error('Error clearing watch history:', error);
    }
  }

  static async removeFromWatchHistory(channelId: string): Promise<void> {
    try {
      const history = await this.loadWatchHistory();
      const filtered = history.filter(h => h.channelId !== channelId);
      await this.saveWatchHistory(filtered);
    } catch (error) {
      console.error('Error removing from watch history:', error);
    }
  }



  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, jsonValue);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  static async loadSettings(): Promise<AppSettings> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (jsonValue != null) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(jsonValue) };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    try {
      const settings = await this.loadSettings();
      settings[key] = value;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  }



  static async saveQueue(queue: QueueItem[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(queue);
      await AsyncStorage.setItem(STORAGE_KEYS.QUEUE, jsonValue);
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  static async loadQueue(): Promise<QueueItem[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.QUEUE);
      if (jsonValue != null) {
        const queue = JSON.parse(jsonValue);
        return queue.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading queue:', error);
      return [];
    }
  }

  static async addToQueue(channel: Channel): Promise<void> {
    try {
      const queue = await this.loadQueue();


      if (queue.some(item => item.channel.id === channel.id)) {
        return;
      }

      const newItem: QueueItem = {
        channel,
        addedAt: new Date(),
        position: queue.length,
      };
      queue.push(newItem);
      await this.saveQueue(queue);
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  }

  static async removeFromQueue(channelId: string): Promise<void> {
    try {
      const queue = await this.loadQueue();
      const filtered = queue
        .filter(item => item.channel.id !== channelId)
        .map((item, index) => ({ ...item, position: index }));
      await this.saveQueue(filtered);
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }

  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.QUEUE);
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }

  static async reorderQueue(from: number, to: number): Promise<void> {
    try {
      const queue = await this.loadQueue();
      const [movedItem] = queue.splice(from, 1);
      queue.splice(to, 0, movedItem);


      const reorderedQueue = queue.map((item, index) => ({
        ...item,
        position: index,
      }));

      await this.saveQueue(reorderedQueue);
    } catch (error) {
      console.error('Error reordering queue:', error);
    }
  }



  static async saveUserStats(stats: UserStats): Promise<void> {
    try {
      const jsonValue = JSON.stringify(stats);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, jsonValue);
    } catch (error) {
      console.error('Error saving user stats:', error);
    }
  }

  static async loadUserStats(): Promise<UserStats> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_STATS);
      if (jsonValue != null) {
        return JSON.parse(jsonValue);
      }
      return {
        totalWatchTime: 0,
        videosWatched: 0,
        favoriteCategories: [],
        weeklyWatchTime: [0, 0, 0, 0, 0, 0, 0],
      };
    } catch (error) {
      console.error('Error loading user stats:', error);
      return {
        totalWatchTime: 0,
        videosWatched: 0,
        favoriteCategories: [],
        weeklyWatchTime: [0, 0, 0, 0, 0, 0, 0],
      };
    }
  }

  static async incrementWatchTime(minutes: number): Promise<void> {
    try {
      const stats = await this.loadUserStats();
      stats.totalWatchTime += minutes;


      const dayOfWeek = new Date().getDay();
      stats.weeklyWatchTime[dayOfWeek] += minutes;

      await this.saveUserStats(stats);
    } catch (error) {
      console.error('Error incrementing watch time:', error);
    }
  }

  static async incrementVideosWatched(): Promise<void> {
    try {
      const stats = await this.loadUserStats();
      stats.videosWatched += 1;
      await this.saveUserStats(stats);
    } catch (error) {
      console.error('Error incrementing videos watched:', error);
    }
  }



  static async saveChannelRating(channelId: string, rating: number): Promise<void> {
    try {
      const ratingsJson = await AsyncStorage.getItem(STORAGE_KEYS.CHANNEL_RATINGS);
      const ratings = ratingsJson ? JSON.parse(ratingsJson) : {};
      ratings[channelId] = rating;
      await AsyncStorage.setItem(STORAGE_KEYS.CHANNEL_RATINGS, JSON.stringify(ratings));
    } catch (error) {
      console.error('Error saving channel rating:', error);
    }
  }

  static async getChannelRating(channelId: string): Promise<number | null> {
    try {
      const ratingsJson = await AsyncStorage.getItem(STORAGE_KEYS.CHANNEL_RATINGS);
      if (ratingsJson) {
        const ratings = JSON.parse(ratingsJson);
        return ratings[channelId] || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting channel rating:', error);
      return null;
    }
  }



  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PLAYLISTS,
        STORAGE_KEYS.FAVORITES,
        STORAGE_KEYS.RECENT_CHANNELS,
        STORAGE_KEYS.WATCH_HISTORY,
        STORAGE_KEYS.DOWNLOADS,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.USER_STATS,
        STORAGE_KEYS.QUEUE,
        STORAGE_KEYS.CHANNEL_RATINGS,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
