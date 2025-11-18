import { NativeModules, Platform } from 'react-native';

const { PictureInPictureModule } = NativeModules;

export class PictureInPicture {
  /**
   * Enter Picture-in-Picture mode
   * @returns Promise that resolves to true if successful
   */
  static async enterPiP(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('Picture-in-Picture is only supported on Android');
      return false;
    }

    if (!PictureInPictureModule) {
      console.error('PictureInPictureModule is not available');
      return false;
    }

    try {
      await PictureInPictureModule.enterPictureInPicture();
      return true;
    } catch (error) {
      console.error('Failed to enter PiP mode:', error);
      return false;
    }
  }

  /**
   * Check if Picture-in-Picture is supported on this device
   * @returns Promise that resolves to true if supported
   */
  static async isSupported(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!PictureInPictureModule) {
      return false;
    }

    try {
      return await PictureInPictureModule.isPictureInPictureSupported();
    } catch (error) {
      console.error('Error checking PiP support:', error);
      return false;
    }
  }
}
