// EPG (Electronic Program Guide) Service
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  category?: string;
  icon?: string;
}

export interface EPGChannel {
  id: string;
  name: string;
  programs: EPGProgram[];
}

const EPG_STORAGE_KEY = '@playcast_epg';
const EPG_CACHE_DURATION = 3600000; // 1 hour

class EPGService {
  private cache: Map<string, { data: EPGChannel; timestamp: number }> = new Map();

  /**
   * Fetch EPG data from XML/XMLTV source
   */
  async fetchEPG(url: string): Promise<EPGChannel[]> {
    try {
      const response = await fetch(url);
      const xmlText = await response.text();

      // Parse XMLTV format
      const channels = this.parseXMLTV(xmlText);

      // Cache the data
      await this.cacheEPGData(channels);

      return channels;
    } catch (error) {
      console.error('EPG fetch error:', error);
      // Return cached data if available
      return this.getCachedEPG();
    }
  }

  /**
   * Parse XMLTV format
   */
  private parseXMLTV(xmlText: string): EPGChannel[] {
    // Basic XMLTV parsing
    // In a real implementation, use a proper XML parser
    const channels: EPGChannel[] = [];

    // This is a simplified parser - in production use xml2js or similar
    const channelMatches = xmlText.matchAll(/<channel id="([^"]+)">([\s\S]*?)<\/channel>/g);

    for (const match of channelMatches) {
      const channelId = match[1];
      const channelContent = match[2];

      const nameMatch = channelContent.match(/<display-name>([^<]+)<\/display-name>/);
      const name = nameMatch ? nameMatch[1] : channelId;

      channels.push({
        id: channelId,
        name,
        programs: [],
      });
    }

    // Parse programmes
    const programMatches = xmlText.matchAll(
      /<programme start="([^"]+)" stop="([^"]+)" channel="([^"]+)">([\s\S]*?)<\/programme>/g
    );

    for (const match of programMatches) {
      const startTime = this.parseXMLTVTime(match[1]);
      const stopTime = this.parseXMLTVTime(match[2]);
      const channelId = match[3];
      const programContent = match[4];

      const titleMatch = programContent.match(/<title[^>]*>([^<]+)<\/title>/);
      const descMatch = programContent.match(/<desc[^>]*>([^<]+)<\/desc>/);
      const categoryMatch = programContent.match(/<category[^>]*>([^<]+)<\/category>/);

      const program: EPGProgram = {
        id: `${channelId}-${startTime.getTime()}`,
        channelId,
        title: titleMatch ? titleMatch[1] : 'Unknown',
        description: descMatch ? descMatch[1] : '',
        startTime,
        endTime: stopTime,
        category: categoryMatch ? categoryMatch[1] : undefined,
      };

      const channel = channels.find(c => c.id === channelId);
      if (channel) {
        channel.programs.push(program);
      }
    }

    // Sort programs by start time
    channels.forEach(channel => {
      channel.programs.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });

    return channels;
  }

  /**
   * Parse XMLTV timestamp (format: YYYYMMDDHHmmss +offset)
   */
  private parseXMLTVTime(timeStr: string): Date {
    const year = parseInt(timeStr.substring(0, 4));
    const month = parseInt(timeStr.substring(4, 6)) - 1;
    const day = parseInt(timeStr.substring(6, 8));
    const hour = parseInt(timeStr.substring(8, 10));
    const minute = parseInt(timeStr.substring(10, 12));
    const second = parseInt(timeStr.substring(12, 14));

    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * Get current program for a channel
   */
  getCurrentProgram(channelId: string): EPGProgram | null {
    const now = new Date();
    const channel = this.getCachedChannel(channelId);

    if (!channel) return null;

    return (
      channel.programs.find(
        p => p.startTime <= now && p.endTime > now
      ) || null
    );
  }

  /**
   * Get next programs for a channel
   */
  getNextPrograms(channelId: string, count: number = 5): EPGProgram[] {
    const now = new Date();
    const channel = this.getCachedChannel(channelId);

    if (!channel) return [];

    return channel.programs
      .filter(p => p.startTime > now)
      .slice(0, count);
  }

  /**
   * Get programs for a specific time range
   */
  getProgramsInRange(
    channelId: string,
    startTime: Date,
    endTime: Date
  ): EPGProgram[] {
    const channel = this.getCachedChannel(channelId);

    if (!channel) return [];

    return channel.programs.filter(
      p => p.startTime < endTime && p.endTime > startTime
    );
  }

  /**
   * Cache EPG data
   */
  private async cacheEPGData(channels: EPGChannel[]): Promise<void> {
    const timestamp = Date.now();

    channels.forEach(channel => {
      this.cache.set(channel.id, { data: channel, timestamp });
    });

    try {
      await AsyncStorage.setItem(
        EPG_STORAGE_KEY,
        JSON.stringify({
          channels,
          timestamp,
        })
      );
    } catch (error) {
      console.error('EPG cache error:', error);
    }
  }

  /**
   * Get cached channel
   */
  private getCachedChannel(channelId: string): EPGChannel | null {
    const cached = this.cache.get(channelId);

    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > EPG_CACHE_DURATION) {
      this.cache.delete(channelId);
      return null;
    }

    return cached.data;
  }

  /**
   * Get all cached EPG data
   */
  private async getCachedEPG(): Promise<EPGChannel[]> {
    try {
      const data = await AsyncStorage.getItem(EPG_STORAGE_KEY);
      if (!data) return [];

      const { channels, timestamp } = JSON.parse(data);

      // Check if cache is still valid
      if (Date.now() - timestamp > EPG_CACHE_DURATION) {
        return [];
      }

      return channels;
    } catch (error) {
      console.error('EPG cache retrieval error:', error);
      return [];
    }
  }

  /**
   * Clear EPG cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    try {
      await AsyncStorage.removeItem(EPG_STORAGE_KEY);
    } catch (error) {
      console.error('EPG cache clear error:', error);
    }
  }
}

export const epgService = new EPGService();
