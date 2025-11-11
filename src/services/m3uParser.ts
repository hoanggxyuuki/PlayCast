// M3U Parser Service
import { Channel } from '../types';

export class M3UParser {
  /**
   * Detect if URL is a direct video/audio URL
   */
  static isDirectMediaUrl(url: string): boolean {
    const mediaExtensions = [
      '.mp4', '.m3u8', '.ts', '.mov', '.avi', '.mkv', '.webm',
      '.mp3', '.aac', '.wav', '.flac', '.ogg', '.m4a',
      '.mpd', '.f4m', '.f4v'
    ];

    const lowerUrl = url.toLowerCase();
    return mediaExtensions.some(ext => lowerUrl.includes(ext));
  }

  /**
   * Create a channel from direct media URL
   */
  static createChannelFromUrl(url: string, customName?: string): Channel {
    // Extract filename from URL as default name
    let defaultName = 'Media';
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'Media';
      defaultName = filename.split('.')[0] || 'Media';
      // Decode URI and clean up
      defaultName = decodeURIComponent(defaultName).replace(/[_-]/g, ' ');
    } catch (err) {
      console.log('Could not parse URL for name');
    }

    const channelName = customName || defaultName;

    return {
      id: this.generateChannelId(channelName, url),
      name: channelName,
      url: url,
      group: 'Direct URL',
    };
  }

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
   * Parse M3U from URL or create single channel for direct media
   */
  static async parseM3UFromUrl(url: string, customName?: string): Promise<Channel[]> {
    try {
      // Check if it's a direct media URL
      if (this.isDirectMediaUrl(url)) {
        console.log('Detected direct media URL');
        return [this.createChannelFromUrl(url, customName)];
      }

      // Try to fetch and parse as playlist
      const response = await fetch(url);
      const content = await response.text();

      // Check if content is actually M3U
      if (content.includes('#EXTM3U') || content.includes('#EXTINF')) {
        return this.parseM3U(content);
      }

      // If not M3U but got content, treat as direct URL
      console.log('Not M3U format, treating as direct URL');
      return [this.createChannelFromUrl(url, customName)];
    } catch (error) {
      console.error('Error fetching from URL:', error);
      // If fetch fails, still try to create a direct channel
      // (might be CORS issue or network problem)
      if (this.isDirectMediaUrl(url)) {
        console.log('Fetch failed but URL looks like media, creating direct channel');
        return [this.createChannelFromUrl(url, customName)];
      }
      throw new Error('Failed to fetch playlist or media');
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
   * Parse JSON from URL or create single channel for direct media
   */
  static async parseJSONFromUrl(url: string, customName?: string): Promise<Channel[]> {
    try {
      // Check if it's a direct media URL
      if (this.isDirectMediaUrl(url)) {
        console.log('Detected direct media URL');
        return [this.createChannelFromUrl(url, customName)];
      }

      const response = await fetch(url);
      const content = await response.text();
      return this.parseJSON(content);
    } catch (error) {
      console.error('Error fetching JSON from URL:', error);
      // If fetch fails but URL looks like media, create direct channel
      if (this.isDirectMediaUrl(url)) {
        console.log('Fetch failed but URL looks like media, creating direct channel');
        return [this.createChannelFromUrl(url, customName)];
      }
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
