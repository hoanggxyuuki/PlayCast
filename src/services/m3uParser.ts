// M3U Parser Service
import { Channel } from '../types';

export class M3UParser {
  /**
   * Parse M3U content and extract channels
   */
  static async parseM3U(content: string): Promise<Channel[]> {
    const channels: Channel[] = [];
    const lines = content.split('\n').map(line => line.trim());

    let currentChannel: Partial<Channel> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines and comments that are not EXTINF
      if (!line || (line.startsWith('#') && !line.startsWith('#EXTINF'))) {
        continue;
      }

      // Parse EXTINF line
      if (line.startsWith('#EXTINF')) {
        currentChannel = this.parseExtInfLine(line);
      }
      // Parse URL line
      else if (currentChannel && (line.startsWith('http') || line.startsWith('rtsp') || line.startsWith('rtp'))) {
        currentChannel.url = line;
        currentChannel.id = this.generateChannelId(currentChannel.name || '', line);

        if (currentChannel.name && currentChannel.url) {
          channels.push(currentChannel as Channel);
        }

        currentChannel = null;
      }
    }

    return channels;
  }

  /**
   * Parse M3U from URL
   */
  static async parseM3UFromUrl(url: string): Promise<Channel[]> {
    try {
      const response = await fetch(url);
      const content = await response.text();
      return this.parseM3U(content);
    } catch (error) {
      console.error('Error fetching M3U from URL:', error);
      throw new Error('Failed to fetch M3U playlist');
    }
  }

  /**
   * Parse EXTINF line to extract channel information
   */
  private static parseExtInfLine(line: string): Partial<Channel> {
    const channel: Partial<Channel> = {};

    // Extract attributes from EXTINF line
    // Format: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Channel Name

    // Extract tvg-id
    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    if (tvgIdMatch) {
      channel.tvgId = tvgIdMatch[1];
    }

    // Extract tvg-name
    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
    if (tvgNameMatch) {
      channel.tvgName = tvgNameMatch[1];
    }

    // Extract tvg-logo
    const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
    if (tvgLogoMatch) {
      channel.tvgLogo = tvgLogoMatch[1];
      channel.logo = tvgLogoMatch[1];
    }

    // Extract group-title
    const groupTitleMatch = line.match(/group-title="([^"]*)"/);
    if (groupTitleMatch) {
      channel.groupTitle = groupTitleMatch[1];
      channel.group = groupTitleMatch[1];
    }

    // Extract channel name (after the last comma)
    const commaIndex = line.lastIndexOf(',');
    if (commaIndex !== -1) {
      channel.name = line.substring(commaIndex + 1).trim();
    }

    return channel;
  }

  /**
   * Parse JSON playlist format
   */
  static async parseJSON(content: string): Promise<Channel[]> {
    try {
      const data = JSON.parse(content);

      // Handle different JSON formats
      if (Array.isArray(data)) {
        return data.map((item, index) => ({
          id: item.id || this.generateChannelId(item.name, item.url),
          name: item.name || `Channel ${index + 1}`,
          url: item.url,
          logo: item.logo || item.tvgLogo,
          group: item.group || item.groupTitle,
          tvgId: item.tvgId,
          tvgName: item.tvgName,
          tvgLogo: item.tvgLogo,
          groupTitle: item.groupTitle,
        }));
      } else if (data.channels && Array.isArray(data.channels)) {
        return data.channels.map((item: any, index: number) => ({
          id: item.id || this.generateChannelId(item.name, item.url),
          name: item.name || `Channel ${index + 1}`,
          url: item.url,
          logo: item.logo || item.tvgLogo,
          group: item.group || item.groupTitle,
          tvgId: item.tvgId,
          tvgName: item.tvgName,
          tvgLogo: item.tvgLogo,
          groupTitle: item.groupTitle,
        }));
      }

      throw new Error('Invalid JSON format');
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error('Failed to parse JSON playlist');
    }
  }

  /**
   * Parse JSON from URL
   */
  static async parseJSONFromUrl(url: string): Promise<Channel[]> {
    try {
      const response = await fetch(url);
      const content = await response.text();
      return this.parseJSON(content);
    } catch (error) {
      console.error('Error fetching JSON from URL:', error);
      throw new Error('Failed to fetch JSON playlist');
    }
  }

  /**
   * Generate unique channel ID
   */
  private static generateChannelId(name: string, url: string): string {
    const str = `${name}-${url}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Group channels by category
   */
  static groupChannels(channels: Channel[]): Map<string, Channel[]> {
    const grouped = new Map<string, Channel[]>();

    channels.forEach(channel => {
      const group = channel.group || 'Uncategorized';
      if (!grouped.has(group)) {
        grouped.set(group, []);
      }
      grouped.get(group)!.push(channel);
    });

    return grouped;
  }
}
