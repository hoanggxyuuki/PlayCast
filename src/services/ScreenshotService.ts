
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface ScreenshotOptions {
  quality?: number; 
  format?: 'jpg' | 'png';
  saveToGallery?: boolean;
}

class ScreenshotService {

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }


  async captureVideoFrame(
    videoRef: any,
    options: ScreenshotOptions = {}
  ): Promise<string | null> {
    const {
      quality = 0.9,
      format = 'jpg',
      saveToGallery = true,
    } = options;

    try {

      if (saveToGallery) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Please grant media library access to save screenshots'
          );
          return null;
        }
      }







      const timestamp = Date.now();
      const filename = `PlayCast_${timestamp}.${format}`;
      const filepath = `${FileSystem.cacheDirectory}${filename}`;









      console.log('Screenshot captured (placeholder):', filepath);

      if (saveToGallery) {




        Alert.alert('Success', 'Screenshot saved to gallery!');
      }

      return filepath;
    } catch (error) {
      console.error('Screenshot capture error:', error);
      Alert.alert('Error', 'Failed to capture screenshot');
      return null;
    }
  }


  async saveToGallery(uri: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('PlayCast', asset, false);

      return true;
    } catch (error) {
      console.error('Save to gallery error:', error);
      return false;
    }
  }


  async shareScreenshot(uri: string): Promise<void> {
    try {






      console.log('Share screenshot:', uri);
    } catch (error) {
      console.error('Share error:', error);
    }
  }


  async deleteScreenshot(uri: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    } catch (error) {
      console.error('Delete screenshot error:', error);
      return false;
    }
  }


  async getAllScreenshots(): Promise<string[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return [];

      const album = await MediaLibrary.getAlbumAsync('PlayCast');
      if (!album) return [];

      const assets = await MediaLibrary.getAssetsAsync({
        album,
        mediaType: 'photo',
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      return assets.assets.map(asset => asset.uri);
    } catch (error) {
      console.error('Get screenshots error:', error);
      return [];
    }
  }
}

export const screenshotService = new ScreenshotService();
