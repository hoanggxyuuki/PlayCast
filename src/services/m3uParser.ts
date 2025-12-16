
import { Channel } from '../types';

export class M3UParser {

  static isDirectMediaUrl(url: string): boolean {
    const mediaExtensions = [
      '.mp4', '.m3u8', '.ts', '.mov', '.avi', '.mkv', '.webm',
      '.mp3', '.aac', '.wav', '.flac', '.ogg', '.m4a',
      '.mpd', '.f4m', '.f4v'
    ];

    const lowerUrl = url.toLowerCase();
    return mediaExtensions.some(ext => lowerUrl.includes(ext));
  }


  static createChannelFromUrl(url: string, customName?: string): Channel {

    let defaultName = 'Media';
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'Media';
      defaultName = filename.split('.')[0] || 'Media';

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


  static async parseM3U(content: string): Promise<Channel[]> {
    const channels: Channel[] = [];
    const lines = content.split('\n').map(line => line.trim());

    let currentChannel: Partial<Channel> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];


      if (!line || (line.startsWith('#') && !line.startsWith('#EXTINF'))) {
        continue;
      }


      if (line.startsWith('#EXTINF')) {
        currentChannel = this.parseExtInfLine(line);
      }

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


  static async parseM3UFromUrl(url: string, customName?: string): Promise<Channel[]> {
    try {

      if (this.isDirectMediaUrl(url)) {
        console.log('Detected direct media URL');
        return [this.createChannelFromUrl(url, customName)];
      }


      const response = await fetch(url);
      const content = await response.text();


      if (content.includes('#EXTM3U') || content.includes('#EXTINF')) {
        return this.parseM3U(content);
      }


      console.log('Not M3U format, treating as direct URL');
      return [this.createChannelFromUrl(url, customName)];
    } catch (error) {
      console.error('Error fetching from URL:', error);


      if (this.isDirectMediaUrl(url)) {
        console.log('Fetch failed but URL looks like media, creating direct channel');
        return [this.createChannelFromUrl(url, customName)];
      }
      throw new Error('Failed to fetch playlist or media');
    }
  }


  private static parseExtInfLine(line: string): Partial<Channel> {
    const channel: Partial<Channel> = {};





    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    if (tvgIdMatch) {
      channel.tvgId = tvgIdMatch[1];
    }


    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
    if (tvgNameMatch) {
      channel.tvgName = tvgNameMatch[1];
    }


    const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
    if (tvgLogoMatch) {
      channel.tvgLogo = tvgLogoMatch[1];
      channel.logo = tvgLogoMatch[1];
    }


    const groupTitleMatch = line.match(/group-title="([^"]*)"/);
    if (groupTitleMatch) {
      channel.groupTitle = groupTitleMatch[1];
      channel.group = groupTitleMatch[1];
    }


    const commaIndex = line.lastIndexOf(',');
    if (commaIndex !== -1) {
      channel.name = line.substring(commaIndex + 1).trim();
    }

    return channel;
  }


  static async parseJSON(content: string): Promise<Channel[]> {
    try {
      const data = JSON.parse(content);


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


  static async parseJSONFromUrl(url: string, customName?: string): Promise<Channel[]> {
    try {

      if (this.isDirectMediaUrl(url)) {
        console.log('Detected direct media URL');
        return [this.createChannelFromUrl(url, customName)];
      }

      const response = await fetch(url);
      const content = await response.text();
      return this.parseJSON(content);
    } catch (error) {
      console.error('Error fetching JSON from URL:', error);

      if (this.isDirectMediaUrl(url)) {
        console.log('Fetch failed but URL looks like media, creating direct channel');
        return [this.createChannelFromUrl(url, customName)];
      }
      throw new Error('Failed to fetch JSON playlist');
    }
  }


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
