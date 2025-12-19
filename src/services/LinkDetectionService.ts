import { OnlineSearchService } from './OnlineSearchService';

export type LinkType = 'youtube' | 'youtube_playlist' | 'soundcloud' | 'soundcloud_playlist' | 'iptv_playlist' | 'direct_video' | 'direct_audio' | 'hls_stream' | 'webview' | 'unknown';

export interface DetectedLink {
    type: LinkType;
    url: string;
    title?: string;
    videoId?: string;
    playlistId?: string;  // For YouTube playlists
    setUser?: string;     // For SoundCloud sets
    setSlug?: string;     // For SoundCloud sets
    platformName?: string;
    isPlayable: boolean;
    requiresProcessing: boolean;
}

export interface LinkHandleResult {
    success: boolean;
    type: LinkType;
    streamUrl?: string;
    title?: string;
    thumbnail?: string;
    error?: string;
}

// YouTube Playlist patterns - check BEFORE single video patterns
const YOUTUBE_PLAYLIST_PATTERNS = [
    /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/watch\?.*[&?]list=([a-zA-Z0-9_-]+)/,
];

const YOUTUBE_PATTERNS = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

// SoundCloud Set/Playlist pattern - check BEFORE single track pattern
const SOUNDCLOUD_SET_PATTERN = /soundcloud\.com\/([^\/]+)\/sets\/([^\/\?\#]+)/;

const SOUNDCLOUD_PATTERN = /soundcloud\.com\/([^\/]+)\/([^\/\?]+)/;

const IPTV_PATTERNS = [
    /\.m3u$/i,
    /\.m3u8$/i,
    /\/playlist\.m3u/i,
    /iptv/i,
    /tvg-/i,
];

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.wmv'];
const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a'];
const HLS_PATTERNS = [/\.m3u8$/i, /\/master\.m3u8/i, /\/playlist\.m3u8/i];

const WEBVIEW_PLATFORMS: { pattern: RegExp; name: string }[] = [
    { pattern: /zingmp3\.vn/i, name: 'ZingMP3' },
    { pattern: /nhaccuatui\.com/i, name: 'NhacCuaTui' },
    { pattern: /facebook\.com|fb\.watch/i, name: 'Facebook' },
    { pattern: /tiktok\.com/i, name: 'TikTok' },
    { pattern: /instagram\.com/i, name: 'Instagram' },
    { pattern: /twitter\.com|x\.com/i, name: 'Twitter/X' },
    { pattern: /vimeo\.com/i, name: 'Vimeo' },
    { pattern: /dailymotion\.com/i, name: 'Dailymotion' },
    { pattern: /bilibili\.com/i, name: 'Bilibili' },
    { pattern: /twitch\.tv/i, name: 'Twitch' },
];

export class LinkDetectionService {
    static detectLinkType(url: string): DetectedLink {
        const trimmedUrl = url.trim();

        if (!trimmedUrl) {
            return { type: 'unknown', url: trimmedUrl, isPlayable: false, requiresProcessing: false };
        }

        // Check YouTube PLAYLIST first (before single video)
        for (const pattern of YOUTUBE_PLAYLIST_PATTERNS) {
            const match = trimmedUrl.match(pattern);
            if (match) {
                return {
                    type: 'youtube_playlist',
                    url: trimmedUrl,
                    playlistId: match[1],
                    isPlayable: false,  // Not directly playable, needs import
                    requiresProcessing: true,
                };
            }
        }

        // Check single YouTube video
        for (const pattern of YOUTUBE_PATTERNS) {
            const match = trimmedUrl.match(pattern);
            if (match) {
                return {
                    type: 'youtube',
                    url: trimmedUrl,
                    videoId: match[1],
                    isPlayable: true,
                    requiresProcessing: true,
                };
            }
        }

        // Check SoundCloud SET/PLAYLIST first (before single track)
        const setMatch = trimmedUrl.match(SOUNDCLOUD_SET_PATTERN);
        if (setMatch) {
            return {
                type: 'soundcloud_playlist',
                url: trimmedUrl,
                setUser: setMatch[1],
                setSlug: setMatch[2],
                isPlayable: false,  // Not directly playable, needs import
                requiresProcessing: true,
            };
        }

        // Check single SoundCloud track
        if (SOUNDCLOUD_PATTERN.test(trimmedUrl)) {
            return {
                type: 'soundcloud',
                url: trimmedUrl,
                isPlayable: true,
                requiresProcessing: true,
            };
        }

        const lowerUrl = trimmedUrl.toLowerCase();

        const isHlsStream = HLS_PATTERNS.some(p => p.test(lowerUrl)) && !IPTV_PATTERNS.some(p => p.test(lowerUrl));
        if (isHlsStream) {
            return {
                type: 'hls_stream',
                url: trimmedUrl,
                isPlayable: true,
                requiresProcessing: false,
            };
        }

        const isIptvPlaylist = IPTV_PATTERNS.some(p => p.test(lowerUrl));
        if (isIptvPlaylist) {
            return {
                type: 'iptv_playlist',
                url: trimmedUrl,
                isPlayable: false,
                requiresProcessing: true,
            };
        }

        const isVideo = VIDEO_EXTENSIONS.some(ext => lowerUrl.endsWith(ext));
        if (isVideo) {
            return {
                type: 'direct_video',
                url: trimmedUrl,
                isPlayable: true,
                requiresProcessing: false,
            };
        }

        const isAudio = AUDIO_EXTENSIONS.some(ext => lowerUrl.endsWith(ext));
        if (isAudio) {
            return {
                type: 'direct_audio',
                url: trimmedUrl,
                isPlayable: true,
                requiresProcessing: false,
            };
        }

        for (const platform of WEBVIEW_PLATFORMS) {
            if (platform.pattern.test(trimmedUrl)) {
                return {
                    type: 'webview',
                    url: trimmedUrl,
                    platformName: platform.name,
                    isPlayable: true,
                    requiresProcessing: false,
                };
            }
        }

        try {
            const urlObj = new URL(trimmedUrl);
            if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                return {
                    type: 'webview',
                    url: trimmedUrl,
                    platformName: urlObj.hostname,
                    isPlayable: true,
                    requiresProcessing: false,
                };
            }
            return {
                type: 'unknown',
                url: trimmedUrl,
                isPlayable: false,
                requiresProcessing: false,
            };
        } catch {
            return {
                type: 'unknown',
                url: trimmedUrl,
                isPlayable: false,
                requiresProcessing: false,
            };
        }
    }

    static async handlePlayableLink(detected: DetectedLink): Promise<LinkHandleResult> {
        try {
            if (detected.type === 'youtube' && detected.videoId) {
                const details = await OnlineSearchService.getYouTubeVideoDetails(detected.videoId);
                const streamUrl = await OnlineSearchService.getYouTubeStreamUrl(detected.videoId);

                return {
                    success: true,
                    type: 'youtube',
                    streamUrl,
                    title: details.title,
                    thumbnail: details.thumbnail,
                };
            }

            if (detected.type === 'soundcloud') {
                const scData = await OnlineSearchService.getSoundCloudStreamUrl(detected.url);
                return {
                    success: true,
                    type: 'soundcloud',
                    streamUrl: scData.streamUrl,
                    title: scData.title,
                    thumbnail: scData.thumbnail,
                };
            }

            if (detected.type === 'direct_video' || detected.type === 'direct_audio' || detected.type === 'hls_stream') {
                const filename = detected.url.split('/').pop()?.split('?')[0] || 'Media';
                return {
                    success: true,
                    type: detected.type,
                    streamUrl: detected.url,
                    title: filename.replace(/\.[^/.]+$/, ''),
                };
            }

            return {
                success: false,
                type: detected.type,
                error: 'This link type cannot be played directly',
            };
        } catch (error: any) {
            return {
                success: false,
                type: detected.type,
                error: error.message || 'Failed to process link',
            };
        }
    }

    static getLinkTypeLabel(type: LinkType): string {
        switch (type) {
            case 'youtube': return 'YouTube Video';
            case 'youtube_playlist': return 'YouTube Playlist';
            case 'soundcloud': return 'SoundCloud Track';
            case 'soundcloud_playlist': return 'SoundCloud Playlist';
            case 'iptv_playlist': return 'IPTV Playlist (M3U)';
            case 'direct_video': return 'Direct Video';
            case 'direct_audio': return 'Audio File';
            case 'hls_stream': return 'HLS Stream';
            case 'webview': return 'Web Content';
            default: return 'Unknown';
        }
    }

    static getLinkTypeIcon(type: LinkType): string {
        switch (type) {
            case 'youtube': return 'logo-youtube';
            case 'youtube_playlist': return 'list';
            case 'soundcloud': return 'cloudy';
            case 'soundcloud_playlist': return 'list';
            case 'iptv_playlist': return 'tv-outline';
            case 'direct_video': return 'videocam';
            case 'direct_audio': return 'musical-notes';
            case 'hls_stream': return 'play-circle';
            case 'webview': return 'globe-outline';
            default: return 'link';
        }
    }

    static getLinkTypeColor(type: LinkType): string {
        switch (type) {
            case 'youtube': return '#FF0000';
            case 'youtube_playlist': return '#FF0000';
            case 'soundcloud': return '#FF5500';
            case 'soundcloud_playlist': return '#FF5500';
            case 'iptv_playlist': return '#764ba2';
            case 'direct_video': return '#4facfe';
            case 'direct_audio': return '#43e97b';
            case 'hls_stream': return '#f093fb';
            case 'webview': return '#00BCD4';
            default: return '#888888';
        }
    }

    static getPlatformIcon(url: string): string {
        if (url.includes('facebook.com') || url.includes('fb.watch')) return 'logo-facebook';
        if (url.includes('tiktok.com')) return 'logo-tiktok';
        if (url.includes('instagram.com')) return 'logo-instagram';
        if (url.includes('twitter.com') || url.includes('x.com')) return 'logo-twitter';
        if (url.includes('zingmp3.vn') || url.includes('nhaccuatui.com')) return 'musical-notes';
        if (url.includes('vimeo.com')) return 'logo-vimeo';
        if (url.includes('twitch.tv')) return 'logo-twitch';
        return 'globe-outline';
    }
}
