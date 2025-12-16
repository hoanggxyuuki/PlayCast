
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Playlist } from '../types';

class SocialSharingService {

  async sharePlaylist(playlist: Playlist): Promise<void> {
    try {
      const playlistData = JSON.stringify(playlist, null, 2);
      const filename = `${playlist.name.replace(/[^a-z0-9]/gi, '_')}.playcast`;
      const filepath = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filepath, playlistData);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filepath, {
          mimeType: 'application/json',
          dialogTitle: `Share ${playlist.name}`,
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Share playlist error:', error);
      Alert.alert('Error', 'Failed to share playlist');
    }
  }


  async exportPlaylists(playlists: Playlist[]): Promise<void> {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        playlists,
      };

      const dataString = JSON.stringify(exportData, null, 2);
      const filename = `PlayCast_Export_${Date.now()}.json`;
      const filepath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filepath, dataString);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filepath, {
          mimeType: 'application/json',
          dialogTitle: 'Export PlayCast Data',
        });
      }

      Alert.alert('Success', 'Playlists exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export playlists');
    }
  }


  async importPlaylists(fileUri: string): Promise<Playlist[]> {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      if (data.version && data.playlists) {
        return data.playlists;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        throw new Error('Invalid import file format');
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import playlists');
      return [];
    }
  }


  async exportSettings(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      const settings: Record<string, any> = {};
      items.forEach(([key, value]) => {
        if (value) {
          try {
            settings[key] = JSON.parse(value);
          } catch {
            settings[key] = value;
          }
        }
      });

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        settings,
      };

      const dataString = JSON.stringify(exportData, null, 2);
      const filename = `PlayCast_Settings_${Date.now()}.json`;
      const filepath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filepath, dataString);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filepath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Settings',
        });
      }

      Alert.alert('Success', 'Settings exported successfully');
    } catch (error) {
      console.error('Export settings error:', error);
      Alert.alert('Error', 'Failed to export settings');
    }
  }


  async importSettings(fileUri: string): Promise<boolean> {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      if (!data.settings) {
        throw new Error('Invalid settings file');
      }

      const entries = Object.entries(data.settings);
      const storageData: [string, string][] = entries.map(([key, value]) => [
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      ]);

      await AsyncStorage.multiSet(storageData);

      Alert.alert('Success', 'Settings imported successfully. Please restart the app.');
      return true;
    } catch (error) {
      console.error('Import settings error:', error);
      Alert.alert('Error', 'Failed to import settings');
      return false;
    }
  }


  async shareChannel(channelName: string, streamUrl: string): Promise<void> {
    try {
      const message = `Check out ${channelName} on PlayCast IPTV!\n\n${streamUrl}`;

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {

        Alert.alert('Share', message);
      }
    } catch (error) {
      console.error('Share channel error:', error);
    }
  }


  generateShareableLink(playlist: Playlist): string {

    const encoded = encodeURIComponent(JSON.stringify({
      name: playlist.name,
      url: playlist.url,
      type: playlist.type,
    }));

    return `playcast://import?data=${encoded}`;
  }


  parseShareableLink(link: string): Partial<Playlist> | null {
    try {
      const url = new URL(link);
      if (url.protocol !== 'playcast:' || url.hostname !== 'import') {
        return null;
      }

      const data = url.searchParams.get('data');
      if (!data) return null;

      return JSON.parse(decodeURIComponent(data));
    } catch (error) {
      console.error('Parse link error:', error);
      return null;
    }
  }
}

export const socialSharingService = new SocialSharingService();
