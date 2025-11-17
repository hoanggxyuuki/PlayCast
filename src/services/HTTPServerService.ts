// HTTP Server Service for Android/iOS
// Requires native module - see SETUP_HTTP_SERVER.md
import { Platform, NativeModules } from 'react-native';

const { HTTPServer } = NativeModules;

export class HTTPServerService {
  private static serverPort = 8080;
  private static isRunning = false;
  private static serverURL = '';

  /**
   * Check if native module is available
   */
  static isNativeModuleAvailable(): boolean {
    return HTTPServer !== null && HTTPServer !== undefined;
  }

  /**
   * Start HTTP server on device
   * Requires native module (see SETUP_HTTP_SERVER.md)
   */
  static async startServer(port: number = 8080): Promise<{ success: boolean; url: string; message: string }> {
    try {
      this.serverPort = port;

      // Check if native module is available
      if (!this.isNativeModuleAvailable()) {
        return {
          success: false,
          url: '',
          message: 'HTTP Server chưa được cài đặt. Xem file SETUP_HTTP_SERVER.md để cài đặt native module.',
        };
      }

      // Start server using native module
      const result = await HTTPServer.startServer(port);

      if (result.success) {
        this.isRunning = true;
        this.serverURL = result.url;
      }

      return result;
    } catch (error: any) {
      console.error('Error starting server:', error);
      return {
        success: false,
        url: '',
        message: error.message || 'Không thể khởi động server',
      };
    }
  }

  /**
   * Stop HTTP server
   */
  static async stopServer(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isNativeModuleAvailable()) {
        return {
          success: false,
          message: 'Native module not available',
        };
      }

      if (!this.isRunning) {
        return {
          success: false,
          message: 'Server không chạy',
        };
      }

      const result = await HTTPServer.stopServer();

      if (result.success) {
        this.isRunning = false;
        this.serverURL = '';
      }

      return result;
    } catch (error: any) {
      console.error('Error stopping server:', error);
      return {
        success: false,
        message: error.message || 'Không thể dừng server',
      };
    }
  }

  /**
   * Get server status
   */
  static async getStatus(): Promise<{ isRunning: boolean; port: number; url: string }> {
    try {
      if (!this.isNativeModuleAvailable()) {
        return {
          isRunning: false,
          port: 0,
          url: '',
        };
      }

      const status = await HTTPServer.getStatus();
      return {
        isRunning: status.isRunning,
        port: status.port,
        url: this.serverURL,
      };
    } catch (error) {
      return {
        isRunning: this.isRunning,
        port: this.serverPort,
        url: this.serverURL,
      };
    }
  }

  /**
   * Get current server info
   */
  static getCurrentInfo(): { isRunning: boolean; port: number; url: string } {
    return {
      isRunning: this.isRunning,
      port: this.serverPort,
      url: this.serverURL,
    };
  }
}
