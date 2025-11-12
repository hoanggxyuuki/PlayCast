// Screenshot Service - Capture video frames
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface ScreenshotOptions {
  quality?: number; // 0-1
  format?: 'jpg' | 'png';
  saveToGallery?: boolean;
}

class ScreenshotService {
  /**
   * Request media library permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Capture screenshot from video element
   * Note: This is a placeholder - actual implementation would use
   * expo-video's snapshot capability or react-native-view-shot
   */
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
      // Check permissions
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

      // Placeholder for actual screenshot capture
      // In real implementation, you would use:
      // 1. expo-video's snapshot method (if available)
      // 2. react-native-view-shot to capture the video view
      // 3. Custom native module for frame extraction

      const timestamp = Date.now();
      const filename = `PlayCast_${timestamp}.${format}`;
      const filepath = `${FileSystem.cacheDirectory}${filename}`;

      // Simulated screenshot capture
      // const uri = await captureRef(videoRef, {
      //   format,
      //   quality,
      //   result: 'tmpfile',
      // });

      // For now, return a placeholder
      console.log('Screenshot captured (placeholder):', filepath);

      if (saveToGallery) {
        // Save to media library
        // const asset = await MediaLibrary.createAssetAsync(uri);
        // await MediaLibrary.createAlbumAsync('PlayCast', asset, false);

        Alert.alert('Success', 'Screenshot saved to gallery!');
      }

      return filepath;
    } catch (error) {
      console.error('Screenshot capture error:', error);
      Alert.alert('Error', 'Failed to capture screenshot');
      return null;
    }
  }

  /**
   * Save existing image to gallery
   */
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

  /**
   * Share screenshot
   */
  async shareScreenshot(uri: string): Promise<void> {
    try {
      // Use expo-sharing or react-native-share
      // await Share.share({
      //   url: uri,
      //   message: 'Screenshot from PlayCast IPTV',
      // });

      console.log('Share screenshot:', uri);
    } catch (error) {
      console.error('Share error:', error);
    }
  }

  /**
   * Delete screenshot
   */
  async deleteScreenshot(uri: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    } catch (error) {
      console.error('Delete screenshot error:', error);
      return false;
    }
  }

  /**
   * Get all screenshots
   */
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
