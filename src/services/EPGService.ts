
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
const EPG_CACHE_DURATION = 3600000; 

class EPGService {
  private cache: Map<string, { data: EPGChannel; timestamp: number }> = new Map();


  async fetchEPG(url: string): Promise<EPGChannel[]> {
    try {
      const response = await fetch(url);
      const xmlText = await response.text();


      const channels = this.parseXMLTV(xmlText);


      await this.cacheEPGData(channels);

      return channels;
    } catch (error) {
      console.error('EPG fetch error:', error);

      return this.getCachedEPG();
    }
  }


  private parseXMLTV(xmlText: string): EPGChannel[] {


    const channels: EPGChannel[] = [];


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


    channels.forEach(channel => {
      channel.programs.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });

    return channels;
  }


  private parseXMLTVTime(timeStr: string): Date {
    const year = parseInt(timeStr.substring(0, 4));
    const month = parseInt(timeStr.substring(4, 6)) - 1;
    const day = parseInt(timeStr.substring(6, 8));
    const hour = parseInt(timeStr.substring(8, 10));
    const minute = parseInt(timeStr.substring(10, 12));
    const second = parseInt(timeStr.substring(12, 14));

    return new Date(year, month, day, hour, minute, second);
  }


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


  getNextPrograms(channelId: string, count: number = 5): EPGProgram[] {
    const now = new Date();
    const channel = this.getCachedChannel(channelId);

    if (!channel) return [];

    return channel.programs
      .filter(p => p.startTime > now)
      .slice(0, count);
  }


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


  private getCachedChannel(channelId: string): EPGChannel | null {
    const cached = this.cache.get(channelId);

    if (!cached) return null;


    if (Date.now() - cached.timestamp > EPG_CACHE_DURATION) {
      this.cache.delete(channelId);
      return null;
    }

    return cached.data;
  }


  private async getCachedEPG(): Promise<EPGChannel[]> {
    try {
      const data = await AsyncStorage.getItem(EPG_STORAGE_KEY);
      if (!data) return [];

      const { channels, timestamp } = JSON.parse(data);


      if (Date.now() - timestamp > EPG_CACHE_DURATION) {
        return [];
      }

      return channels;
    } catch (error) {
      console.error('EPG cache retrieval error:', error);
      return [];
    }
  }


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
