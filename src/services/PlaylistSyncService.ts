
import AsyncStorage from '@react-native-async-storage/async-storage';
import { M3UParser } from './M3UParser';
import { Playlist } from '../types';

interface SyncConfig {
  playlistId: string;
  url: string;
  interval: number; 
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


  async initialize(onUpdate: (playlistId: string, playlist: Playlist) => void) {
    this.onPlaylistUpdate = onUpdate;
    await this.loadConfigs();
    this.startAllSyncs();
  }


  async enableSync(
    playlistId: string,
    url: string,
    intervalHours: number = 24
  ): Promise<void> {
    const config: SyncConfig = {
      playlistId,
      url,
      interval: intervalHours * 3600000, 
      lastSync: 0,
      enabled: true,
    };

    this.syncConfigs.set(playlistId, config);
    await this.saveConfigs();
    this.startSync(playlistId);
  }


  async disableSync(playlistId: string): Promise<void> {
    const config = this.syncConfigs.get(playlistId);
    if (config) {
      config.enabled = false;
      await this.saveConfigs();
      this.stopSync(playlistId);
    }
  }


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


      config.lastSync = Date.now();
      this.syncConfigs.set(playlistId, config);
      await this.saveConfigs();


      if (this.onPlaylistUpdate) {
        this.onPlaylistUpdate(playlistId, playlist);
      }

      return playlist;
    } catch (error) {
      console.error(`Failed to sync playlist ${playlistId}:`, error);
      return null;
    }
  }


  private startSync(playlistId: string): void {
    const config = this.syncConfigs.get(playlistId);
    if (!config || !config.enabled) return;


    this.stopSync(playlistId);


    const timeSinceLastSync = Date.now() - config.lastSync;
    const timeUntilNextSync = Math.max(0, config.interval - timeSinceLastSync);


    const timer = setTimeout(async () => {
      await this.syncPlaylist(playlistId);
      this.startSync(playlistId); 
    }, timeUntilNextSync);

    this.syncTimers.set(playlistId, timer);
  }


  private stopSync(playlistId: string): void {
    const timer = this.syncTimers.get(playlistId);
    if (timer) {
      clearTimeout(timer);
      this.syncTimers.delete(playlistId);
    }
  }


  private startAllSyncs(): void {
    this.syncConfigs.forEach((config, playlistId) => {
      if (config.enabled) {
        this.startSync(playlistId);
      }
    });
  }


  stopAllSyncs(): void {
    this.syncTimers.forEach(timer => clearTimeout(timer));
    this.syncTimers.clear();
  }


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


  private async saveConfigs(): Promise<void> {
    try {
      const configs = Array.from(this.syncConfigs.values());
      await AsyncStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to save sync configs:', error);
    }
  }


  getAllConfigs(): SyncConfig[] {
    return Array.from(this.syncConfigs.values());
  }


  async updateSyncInterval(
    playlistId: string,
    intervalHours: number
  ): Promise<void> {
    const config = this.syncConfigs.get(playlistId);
    if (config) {
      config.interval = intervalHours * 3600000;
      await this.saveConfigs();


      if (config.enabled) {
        this.stopSync(playlistId);
        this.startSync(playlistId);
      }
    }
  }
}

export const playlistSyncService = new PlaylistSyncService();
