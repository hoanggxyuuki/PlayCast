// Playlist Auto-Update/Sync Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { M3UParser } from './M3UParser';
import { Playlist } from '../types';

interface SyncConfig {
  playlistId: string;
  url: string;
  interval: number; // in milliseconds
  lastSync: number;
  enabled: boolean;
}

const SYNC_CONFIG_KEY = '@playcast_sync_config';

class PlaylistSyncService {
  private syncConfigs: Map<string, SyncConfig> = new Map();
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();
  private onPlaylistUpdate?: (playlistId: string, playlist: Playlist) => void;

  constructor() {
    this.loadConfigs();
  }

  /**
   * Initialize sync service
   */
  async initialize(onUpdate: (playlistId: string, playlist: Playlist) => void) {
    this.onPlaylistUpdate = onUpdate;
    await this.loadConfigs();
    this.startAllSyncs();
  }

  /**
   * Enable auto-sync for a playlist
   */
  async enableSync(
    playlistId: string,
    url: string,
    intervalHours: number = 24
  ): Promise<void> {
    const config: SyncConfig = {
      playlistId,
      url,
      interval: intervalHours * 3600000, // Convert to milliseconds
      lastSync: 0,
      enabled: true,
    };

    this.syncConfigs.set(playlistId, config);
    await this.saveConfigs();
    this.startSync(playlistId);
  }

  /**
   * Disable auto-sync for a playlist
   */
  async disableSync(playlistId: string): Promise<void> {
    const config = this.syncConfigs.get(playlistId);
    if (config) {
      config.enabled = false;
      await this.saveConfigs();
      this.stopSync(playlistId);
    }
  }

  /**
   * Manually sync a playlist
   */
  async syncPlaylist(playlistId: string): Promise<Playlist | null> {
    const config = this.syncConfigs.get(playlistId);
    if (!config) {
      throw new Error('Playlist sync not configured');
    }

    try {
      console.log(`Syncing playlist ${playlistId} from ${config.url}`);

      const response = await fetch(config.url);
      const m3uContent = await response.text();

      const parser = new M3UParser();
      const channels = parser.parse(m3uContent);

      const playlist: Playlist = {
        id: playlistId,
        name: `Playlist ${playlistId}`,
        url: config.url,
        channels,
        createdAt: Date.now(),
        type: 'm3u',
      };

      // Update last sync time
      config.lastSync = Date.now();
      this.syncConfigs.set(playlistId, config);
      await this.saveConfigs();

      // Notify update
      if (this.onPlaylistUpdate) {
        this.onPlaylistUpdate(playlistId, playlist);
      }

      return playlist;
    } catch (error) {
      console.error(`Failed to sync playlist ${playlistId}:`, error);
      return null;
    }
  }

  /**
   * Start sync timer for a playlist
   */
  private startSync(playlistId: string): void {
    const config = this.syncConfigs.get(playlistId);
    if (!config || !config.enabled) return;

    // Clear existing timer
    this.stopSync(playlistId);

    // Calculate next sync time
    const timeSinceLastSync = Date.now() - config.lastSync;
    const timeUntilNextSync = Math.max(0, config.interval - timeSinceLastSync);

    // Set up timer
    const timer = setTimeout(async () => {
      await this.syncPlaylist(playlistId);
      this.startSync(playlistId); // Schedule next sync
    }, timeUntilNextSync);

    this.syncTimers.set(playlistId, timer);
  }

  /**
   * Stop sync timer for a playlist
   */
  private stopSync(playlistId: string): void {
    const timer = this.syncTimers.get(playlistId);
    if (timer) {
      clearTimeout(timer);
      this.syncTimers.delete(playlistId);
    }
  }

  /**
   * Start all enabled syncs
   */
  private startAllSyncs(): void {
    this.syncConfigs.forEach((config, playlistId) => {
      if (config.enabled) {
        this.startSync(playlistId);
      }
    });
  }

  /**
   * Stop all syncs
   */
  stopAllSyncs(): void {
    this.syncTimers.forEach(timer => clearTimeout(timer));
    this.syncTimers.clear();
  }

  /**
   * Get sync status for a playlist
   */
  getSyncStatus(playlistId: string): {
    enabled: boolean;
    lastSync: number | null;
    nextSync: number | null;
  } | null {
    const config = this.syncConfigs.get(playlistId);
    if (!config) return null;

    const nextSync = config.enabled
      ? config.lastSync + config.interval
      : null;

    return {
      enabled: config.enabled,
      lastSync: config.lastSync || null,
      nextSync,
    };
  }

  /**
   * Load sync configs from storage
   */
  private async loadConfigs(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(SYNC_CONFIG_KEY);
      if (data) {
        const configs: SyncConfig[] = JSON.parse(data);
        configs.forEach(config => {
          this.syncConfigs.set(config.playlistId, config);
        });
      }
    } catch (error) {
      console.error('Failed to load sync configs:', error);
    }
  }

  /**
   * Save sync configs to storage
   */
  private async saveConfigs(): Promise<void> {
    try {
      const configs = Array.from(this.syncConfigs.values());
      await AsyncStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to save sync configs:', error);
    }
  }

  /**
   * Get all sync configs
   */
  getAllConfigs(): SyncConfig[] {
    return Array.from(this.syncConfigs.values());
  }

  /**
   * Update sync interval
   */
  async updateSyncInterval(
    playlistId: string,
    intervalHours: number
  ): Promise<void> {
    const config = this.syncConfigs.get(playlistId);
    if (config) {
      config.interval = intervalHours * 3600000;
      await this.saveConfigs();

      // Restart sync with new interval
      if (config.enabled) {
        this.stopSync(playlistId);
        this.startSync(playlistId);
      }
    }
  }
}

export const playlistSyncService = new PlaylistSyncService();
