// Local Network Service for sharing and importing media
import * as Network from 'expo-network';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export class LocalNetworkService {
  /**
   * Get device local IP address
   */
  static async getLocalIP(): Promise<string | null> {
    try {
      const ip = await Network.getIpAddressAsync();
      return ip;
    } catch (error) {
      console.error('Error getting IP address:', error);
      return null;
    }
  }

  /**
   * Get network state
   */
  static async getNetworkState() {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return {
        type: networkState.type,
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
      };
    } catch (error) {
      console.error('Error getting network state:', error);
      return null;
    }
  }

  /**
   * Pick M3U file from device
   */
  static async pickM3UFile(): Promise<{ uri: string; name: string; content: string } | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'audio/x-mpegurl', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const file = result.assets[0];

      // Read file content
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return {
        uri: file.uri,
        name: file.name,
        content,
      };
    } catch (error) {
      console.error('Error picking file:', error);
      throw error;
    }
  }

  /**
   * Fetch M3U from local network URL
   */
  static async fetchFromURL(url: string): Promise<{ content: string; name: string }> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();

      // Extract filename from URL
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1] || 'playlist.m3u';

      return {
        content,
        name: filename,
      };
    } catch (error) {
      console.error('Error fetching from URL:', error);
      throw error;
    }
  }

  /**
   * Validate if string is valid M3U content
   */
  static isValidM3U(content: string): boolean {
    // Check if content starts with #EXTM3U
    const lines = content.split('\n');
    return lines.length > 0 && lines[0].trim().startsWith('#EXTM3U');
  }

  /**
   * Generate instructions for setting up HTTP server
   */
  static getServerInstructions(): string[] {
    return [
      'Option 1: Python HTTP Server',
      'python -m http.server 8080',
      '',
      'Option 2: Node.js HTTP Server',
      'npx http-server -p 8080',
      '',
      'Option 3: Use VLC or other media server',
      '',
      'Then access: http://YOUR_DEVICE_IP:8080/playlist.m3u',
    ];
  }

  /**
   * Check if URL is valid local network address
   */
  static isLocalNetworkURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Check for localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }

      // Check for private IP ranges
      const privateRanges = [
        /^10\./,                    // 10.0.0.0 - 10.255.255.255
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0 - 172.31.255.255
        /^192\.168\./,              // 192.168.0.0 - 192.168.255.255
      ];

      return privateRanges.some(range => range.test(hostname));
    } catch {
      return false;
    }
  }
}
