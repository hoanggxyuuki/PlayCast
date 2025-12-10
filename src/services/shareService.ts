
import { Share, Platform } from 'react-native';
import { ShareData, Channel } from '../types';
import * as Clipboard from 'expo-clipboard';

export class ShareService {

  static async shareChannel(channel: Channel): Promise<boolean> {
    try {
      const shareData: ShareData = {
        channelId: channel.id,
        channelName: channel.name,
        url: channel.url,
        thumbnail: channel.logo,
        message: this.generateShareMessage(channel),
      };

      const result = await Share.share({
        message: shareData.message,
        url: Platform.OS === 'ios' ? channel.url : undefined,
        title: `Watch ${channel.name}`,
      });

      if (result.action === Share.sharedAction) {
        console.log('Channel shared successfully');
        return true;
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error sharing channel:', error);
      return false;
    }
  }


  static async sharePlaylist(
    playlistName: string,
    channelCount: number,
    playlistUrl?: string
  ): Promise<boolean> {
    try {
      const message = `Check out "${playlistName}" playlist with ${channelCount} channels on PlayCast IPTV!${
        playlistUrl ? `\n\n${playlistUrl}` : ''
      }`;

      const result = await Share.share({
        message,
        title: `Share ${playlistName}`,
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Error sharing playlist:', error);
      return false;
    }
  }


  static async copyChannelUrl(channel: Channel): Promise<boolean> {
    try {
      await Clipboard.setStringAsync(channel.url);
      console.log('Channel URL copied to clipboard');
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }


  static async copyPlaylistUrl(url: string): Promise<boolean> {
    try {
      await Clipboard.setStringAsync(url);
      console.log('Playlist URL copied to clipboard');
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }


  static getWhatsAppShareUrl(channel: Channel): string {
    const message = this.generateShareMessage(channel);
    const encodedMessage = encodeURIComponent(message);
    return `whatsapp://send?text=${encodedMessage}`;
  }


  static getTelegramShareUrl(channel: Channel): string {
    const message = this.generateShareMessage(channel);
    const encodedMessage = encodeURIComponent(message);
    return `https://t.me/share/url?url=${encodeURIComponent(channel.url)}&text=${encodedMessage}`;
  }


  static getFacebookShareUrl(channel: Channel): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(channel.url)}`;
  }


  static getTwitterShareUrl(channel: Channel): string {
    const message = this.generateShareMessage(channel);
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(channel.url)}`;
  }


  static getEmailShareUrl(channel: Channel): string {
    const subject = `Check out ${channel.name}`;
    const body = this.generateShareMessage(channel);
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }


  static getSMSShareUrl(channel: Channel): string {
    const message = this.generateShareMessage(channel);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    return `sms:${separator}body=${encodeURIComponent(message)}`;
  }


  private static generateShareMessage(channel: Channel): string {
    let message = `🎬 Watch "${channel.name}"`;

    if (channel.group) {
      message += ` in ${channel.group}`;
    }

    message += ' on PlayCast IPTV!';
    message += `\n\n📺 ${channel.url}`;

    return message;
  }


  static getShareOptions() {
    return [
      {
        id: 'native',
        name: 'Share',
        icon: 'share-outline',
        description: 'Share via system dialog',
      },
      {
        id: 'copy',
        name: 'Copy Link',
        icon: 'copy-outline',
        description: 'Copy URL to clipboard',
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: 'logo-whatsapp',
        description: 'Share on WhatsApp',
      },
      {
        id: 'telegram',
        name: 'Telegram',
        icon: 'paper-plane-outline',
        description: 'Share on Telegram',
      },
      {
        id: 'facebook',
        name: 'Facebook',
        icon: 'logo-facebook',
        description: 'Share on Facebook',
      },
      {
        id: 'twitter',
        name: 'Twitter',
        icon: 'logo-twitter',
        description: 'Share on Twitter',
      },
      {
        id: 'email',
        name: 'Email',
        icon: 'mail-outline',
        description: 'Share via email',
      },
      {
        id: 'sms',
        name: 'SMS',
        icon: 'chatbubble-outline',
        description: 'Share via SMS',
      },
    ];
  }


  static async shareApp(): Promise<boolean> {
    try {
      const message = `🎬 Check out PlayCast IPTV - Professional IPTV Player!\n\nFeatures:\n✓ M3U & JSON playlist support\n✓ Direct media URLs\n✓ Advanced video player\n✓ Smart recommendations\n✓ And much more!\n\nDownload now and enjoy!`;

      const result = await Share.share({
        message,
        title: 'Share PlayCast IPTV',
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Error sharing app:', error);
      return false;
    }
  }


  static generateM3UFromChannels(channels: Channel[]): string {
    let m3u = '#EXTM3U\n\n';

    for (const channel of channels) {
      m3u += `#EXTINF:-1`;

      if (channel.tvgId) {
        m3u += ` tvg-id="${channel.tvgId}"`;
      }

      if (channel.tvgName) {
        m3u += ` tvg-name="${channel.tvgName}"`;
      }

      if (channel.logo) {
        m3u += ` tvg-logo="${channel.logo}"`;
      }

      if (channel.group) {
        m3u += ` group-title="${channel.group}"`;
      }

      m3u += `,${channel.name}\n`;
      m3u += `${channel.url}\n\n`;
    }

    return m3u;
  }


  static async shareFavoritesAsM3U(channels: Channel[]): Promise<boolean> {
    try {
      const m3uContent = this.generateM3UFromChannels(channels);

      const result = await Share.share({
        message: `My favorite channels from PlayCast IPTV (${channels.length} channels):\n\n${m3uContent}`,
        title: 'Share Favorites',
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Error sharing favorites:', error);
      return false;
    }
  }
}
