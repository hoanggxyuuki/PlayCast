/**
 * Online Search Service for YouTube & SoundCloud
 * 
 * Based on yt-dlp (https://github.com/yt-dlp/yt-dlp) extraction patterns:
 * - YouTube: Uses innertube API (youtubei/v1/search and youtubei/v1/player)
 * - SoundCloud: Uses api-v2.soundcloud.com with client_id extraction
 */

import { Platform } from 'react-native';
import { Channel } from '../types';

export type SearchPlatform = 'youtube' | 'soundcloud' | 'spotify';

export interface YouTubeResult {
    videoId: string;
    title: string;
    author: string;
    authorId: string;
    thumbnail: string;
    duration: number;
    viewCount: number;
    publishedText: string;
}

export interface SoundCloudResult {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
    playbackCount: number;
    permalinkUrl: string;
    streamUrl?: string;
}

export interface SpotifyResult {
    id: string;
    title: string;
    artist: string;
    album: string;
    thumbnail: string;
    duration: number;
    previewUrl?: string;
    externalUrl: string;
}

export interface OnlineSearchResult {
    platform: SearchPlatform;
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
    streamUrl?: string;
    viewCount?: number;
}

// ============= YOUTUBE INNERTUBE CONFIG (from yt-dlp _base.py) =============

// Innertube clients (from yt-dlp INNERTUBE_CLIENTS)
const INNERTUBE_CLIENTS = {
    // Web client (line 98-109)
    web: {
        clientName: 'WEB',
        clientVersion: '2.20250925.01.00',
    },
    // Android client (line 194-206) - often has direct URLs without signature
    android: {
        clientName: 'ANDROID',
        clientVersion: '20.10.38',
        androidSdkVersion: 30,
        userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip',
        osName: 'Android',
        osVersion: '11',
    },
    // iOS client (line 259-287)
    ios: {
        clientName: 'IOS',
        clientVersion: '20.10.4',
        deviceMake: 'Apple',
        deviceModel: 'iPhone16,2',
        userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
        osName: 'iPhone',
        osVersion: '18.3.2.22D82',
    },
    // TV HTML5 client (line 321-332) - sometimes bypasses restrictions
    tv: {
        clientName: 'TVHTML5',
        clientVersion: '7.20250923.13.00',
        userAgent: 'Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version',
    },
};

// Search params for videos only (from yt-dlp _search.py line 12)
const YOUTUBE_SEARCH_PARAMS = 'EgIQAfABAQ==';

// ============= SOUNDCLOUD CONFIG (from yt-dlp soundcloud.py) =============

const SOUNDCLOUD_API_V2_BASE = 'https://api-v2.soundcloud.com/';
const SOUNDCLOUD_DEFAULT_CLIENT_ID = 'a3e059563d7fd3372b49b37f00a00bcf';
const SOUNDCLOUD_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36';
const SOUNDCLOUD_CLIENT_ID_REGEX = /client_id\s*:\s*"([0-9a-zA-Z]{32})"/;

class OnlineSearchServiceClass {
    private soundCloudClientId: string | null = null;
    private isWeb = Platform.OS === 'web';

    // ============= UTILITY METHODS =============

    private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    private proxyUrl(url: string): string {
        if (!this.isWeb) return url;
        return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    }

    // Build innertube context (from yt-dlp _extract_context)
    private buildInnertubeContext(clientKey: keyof typeof INNERTUBE_CLIENTS) {
        const client = INNERTUBE_CLIENTS[clientKey];
        return {
            client: {
                ...client,
                hl: 'en',
                gl: 'US',
                timeZone: 'UTC',
                utcOffsetMinutes: 0,
            },
        };
    }

    // ============= YOUTUBE INNERTUBE SEARCH (yt-dlp method) =============

    async searchYouTube(query: string): Promise<YouTubeResult[]> {
        try {
            console.log(`[YouTube] Searching with Innertube API: "${query}"`);

            const requestBody = {
                context: this.buildInnertubeContext('web'),
                query: query,
                params: YOUTUBE_SEARCH_PARAMS,
            };

            const apiUrl = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';

            let response: Response;

            if (this.isWeb) {
                response = await this.fetchWithTimeout(this.proxyUrl(apiUrl), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                }, 15000);
            } else {
                response = await this.fetchWithTimeout(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    },
                    body: JSON.stringify(requestBody),
                }, 15000);
            }

            if (!response.ok) {
                throw new Error(`Innertube search API returned ${response.status}`);
            }

            const data = await response.json();
            const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
            const results: YouTubeResult[] = [];

            const getText = (obj: any): string => {
                if (!obj) return '';
                if (typeof obj === 'string') return obj;
                if (obj.simpleText) return obj.simpleText;
                if (obj.runs) return obj.runs.map((r: any) => r.text).join('');
                return '';
            };

            const parseDuration = (text: string): number => {
                if (!text) return 0;
                const parts = text.split(':').map(Number);
                if (parts.length === 2) return parts[0] * 60 + parts[1];
                if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                return 0;
            };

            const parseViewCount = (text: string): number => {
                if (!text) return 0;
                const match = text.replace(/,/g, '').match(/(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            };

            for (const section of contents) {
                const items = section?.itemSectionRenderer?.contents || [];
                for (const item of items) {
                    const videoRenderer = item?.videoRenderer;
                    if (!videoRenderer) continue;

                    const videoId = videoRenderer.videoId;
                    if (!videoId) continue;

                    results.push({
                        videoId,
                        title: getText(videoRenderer.title),
                        author: getText(videoRenderer.ownerText || videoRenderer.shortBylineText),
                        authorId: videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
                        thumbnail: videoRenderer.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                        duration: parseDuration(getText(videoRenderer.lengthText)),
                        viewCount: parseViewCount(getText(videoRenderer.viewCountText)),
                        publishedText: getText(videoRenderer.publishedTimeText),
                    });

                    if (results.length >= 20) break;
                }
                if (results.length >= 20) break;
            }

            console.log(`[YouTube] Found ${results.length} videos`);
            return results;
        } catch (error: any) {
            console.error(`[YouTube] Innertube search failed: ${error.message}`);
            throw new Error(`YouTube search failed: ${error.message}`);
        }
    }

    // ============= YOUTUBE INNERTUBE PLAYER (yt-dlp method) =============

    /**
     * Get YouTube stream URL using innertube player API
     * Based on yt-dlp _extract_player_response (line 2847) and format extraction (line 3140)
     * 
     * Tries multiple clients in order:
     * 1. Android - often has direct URLs without signature cipher
     * 2. iOS - fallback
     * 3. TV - another fallback
     * 4. Web - last resort
     */
    async getYouTubeStreamUrl(videoId: string): Promise<string> {
        const clientsToTry: (keyof typeof INNERTUBE_CLIENTS)[] = ['android', 'ios', 'tv', 'web'];

        for (const clientKey of clientsToTry) {
            try {
                console.log(`[YouTube] Trying ${clientKey} client for video: ${videoId}`);

                const streamUrl = await this._extractStreamFromClient(videoId, clientKey);
                if (streamUrl) {
                    console.log(`[YouTube] Got stream URL from ${clientKey} client`);
                    return streamUrl;
                }
            } catch (error: any) {
                console.log(`[YouTube] ${clientKey} client failed: ${error.message}`);
            }
        }

        throw new Error('Could not extract YouTube stream from any client');
    }

    private async _extractStreamFromClient(videoId: string, clientKey: keyof typeof INNERTUBE_CLIENTS): Promise<string | null> {
        const context = this.buildInnertubeContext(clientKey);

        // Build player request (from yt-dlp line 2863-2884)
        const requestBody = {
            context: context,
            videoId: videoId,
            // contentCheckOk and racyCheckOk can help bypass some restrictions
            contentCheckOk: true,
            racyCheckOk: true,
        };

        const apiUrl = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

        let response: Response;

        if (this.isWeb) {
            response = await this.fetchWithTimeout(this.proxyUrl(apiUrl), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            }, 15000);
        } else {
            const client = INNERTUBE_CLIENTS[clientKey];
            response = await this.fetchWithTimeout(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': (client as any).userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                body: JSON.stringify(requestBody),
            }, 15000);
        }

        if (!response.ok) {
            throw new Error(`Player API returned ${response.status}`);
        }

        const data = await response.json();

        // Check playability status (yt-dlp line 2832-2845)
        const playabilityStatus = data?.playabilityStatus;
        if (playabilityStatus?.status !== 'OK') {
            const reason = playabilityStatus?.reason || playabilityStatus?.status || 'Unknown error';
            console.log(`[YouTube] ${clientKey}: Not playable - ${reason}`);
            return null;
        }

        // Extract formats from streamingData (yt-dlp line 3056, 3212)
        const streamingData = data?.streamingData;
        if (!streamingData) {
            console.log(`[YouTube] ${clientKey}: No streaming data`);
            return null;
        }

        // Combine formats and adaptiveFormats
        const allFormats = [
            ...(streamingData.formats || []),
            ...(streamingData.adaptiveFormats || []),
        ];

        if (allFormats.length === 0) {
            console.log(`[YouTube] ${clientKey}: No formats available`);
            return null;
        }

        // PRIORITY 1: Try combined video+audio formats first (expo-video may not support audio-only)
        // These are the "formats" not "adaptiveFormats" - they have both video+audio
        // Only select formats that have BOTH video and audio codecs
        const combinedFormats = (streamingData.formats || []).filter((f: any) =>
            f.url &&
            !f.signatureCipher &&
            f.mimeType?.includes('video/') && // Must be video format
            f.audioQuality // Must have audio quality (means it has audio track)
        );

        if (combinedFormats.length > 0) {
            // Prefer medium quality (360p/480p - itag 18) for smooth playback
            combinedFormats.sort((a: any, b: any) => (a.bitrate || 0) - (b.bitrate || 0));
            const chosen = combinedFormats[0];
            console.log(`[YouTube] ${clientKey}: Found ${combinedFormats.length} combined video+audio formats`);
            console.log(`[YouTube] ${clientKey}: Using combined format - itag: ${chosen.itag}, mime: ${chosen.mimeType}, audioQuality: ${chosen.audioQuality}`);
            return chosen.url;
        }


        // PRIORITY 2: HLS manifest (supports both video and audio)
        if (streamingData.hlsManifestUrl) {
            console.log(`[YouTube] ${clientKey}: Using HLS manifest`);
            return streamingData.hlsManifestUrl;
        }

        // PRIORITY 3: Try mp4 audio formats (may not work with expo-video VideoView)
        const audioFormats = allFormats.filter((f: any) =>
            f.url && // Must have direct URL (no signatureCipher)
            f.mimeType?.includes('audio/') && // Audio only
            !f.signatureCipher // No cipher = direct playable URL
        );

        if (audioFormats.length > 0) {
            // Separate mp4 and webm formats
            const mp4Audio = audioFormats.filter((f: any) =>
                f.mimeType?.includes('audio/mp4') || f.mimeType?.includes('audio/m4a')
            );
            const webmAudio = audioFormats.filter((f: any) =>
                f.mimeType?.includes('audio/webm')
            );

            console.log(`[YouTube] ${clientKey}: Found ${mp4Audio.length} mp4 audio, ${webmAudio.length} webm audio formats`);

            // Prefer mp4 formats (better mobile compatibility)
            if (mp4Audio.length > 0) {
                mp4Audio.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
                console.log(`[YouTube] ${clientKey}: Using mp4 audio format (may not work with VideoView)`);
                return mp4Audio[0].url;
            }
        }

        // PRIORITY 4: Any video format with direct URL
        const videoFormats = allFormats.filter((f: any) =>
            f.url &&
            !f.signatureCipher
        );

        if (videoFormats.length > 0) {
            videoFormats.sort((a: any, b: any) => (a.bitrate || 0) - (b.bitrate || 0));
            console.log(`[YouTube] ${clientKey}: Using video format as last resort`);
            return videoFormats[0].url;
        }



        // If all formats require signatureCipher, we can't use them without JS runtime
        const cipherFormats = allFormats.filter((f: any) => f.signatureCipher);
        if (cipherFormats.length > 0) {
            console.log(`[YouTube] ${clientKey}: ${cipherFormats.length} formats require signature decryption (not supported)`);
        }

        // Try HLS manifest as last resort
        if (streamingData.hlsManifestUrl) {
            console.log(`[YouTube] ${clientKey}: Using HLS manifest`);
            return streamingData.hlsManifestUrl;
        }

        return null;
    }

    // ============= SOUNDCLOUD (yt-dlp method) =============

    private async getSoundCloudClientId(): Promise<string> {
        if (this.soundCloudClientId) {
            return this.soundCloudClientId;
        }

        try {
            console.log('[SoundCloud] Extracting client_id (yt-dlp method)...');

            const mainUrl = this.proxyUrl('https://soundcloud.com/');
            const mainRes = await this.fetchWithTimeout(mainUrl, {
                headers: { 'User-Agent': SOUNDCLOUD_USER_AGENT }
            }, 10000);

            if (!mainRes.ok) throw new Error(`Main page returned ${mainRes.status}`);

            const html = await mainRes.text();
            const scriptRegex = /<script[^>]+src="([^"]+)"/g;
            const scriptUrls: string[] = [];
            let match;

            while ((match = scriptRegex.exec(html)) !== null) {
                const src = match[1];
                if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
                    scriptUrls.push(src);
                }
            }

            console.log(`[SoundCloud] Found ${scriptUrls.length} script URLs`);

            for (let i = scriptUrls.length - 1; i >= 0; i--) {
                try {
                    const scriptUrl = this.proxyUrl(scriptUrls[i]);
                    const scriptRes = await this.fetchWithTimeout(scriptUrl, {}, 8000);
                    if (!scriptRes.ok) continue;

                    const scriptContent = await scriptRes.text();
                    const clientIdMatch = scriptContent.match(SOUNDCLOUD_CLIENT_ID_REGEX);

                    if (clientIdMatch && clientIdMatch[1]) {
                        this.soundCloudClientId = clientIdMatch[1];
                        console.log(`[SoundCloud] Extracted client_id: ${this.soundCloudClientId.substring(0, 10)}...`);
                        return this.soundCloudClientId;
                    }
                } catch {
                    continue;
                }
            }

            throw new Error('Could not find client_id in scripts');
        } catch (error: any) {
            console.warn(`[SoundCloud] Client ID extraction failed: ${error.message}`);
            console.log('[SoundCloud] Using default client_id');
            this.soundCloudClientId = SOUNDCLOUD_DEFAULT_CLIENT_ID;
            return this.soundCloudClientId;
        }
    }

    async searchSoundCloud(query: string): Promise<SoundCloudResult[]> {
        try {
            console.log(`[SoundCloud] Searching: "${query}"`);

            const clientId = await this.getSoundCloudClientId();
            const searchUrl = `${SOUNDCLOUD_API_V2_BASE}search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=20`;

            const response = await this.fetchWithTimeout(this.proxyUrl(searchUrl), {
                headers: { 'User-Agent': SOUNDCLOUD_USER_AGENT }
            }, 15000);

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    this.soundCloudClientId = null;
                }
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            const tracks = data.collection || [];

            console.log(`[SoundCloud] Found ${tracks.length} tracks`);

            return tracks.map((track: any) => ({
                id: String(track.id),
                title: track.title || 'Unknown',
                artist: track.user?.username || 'Unknown',
                thumbnail: track.artwork_url?.replace('-large', '-t500x500') || '',
                duration: track.duration || 0,
                playbackCount: track.playback_count || 0,
                permalinkUrl: track.permalink_url || '',
            }));
        } catch (error: any) {
            console.error(`[SoundCloud] Search error: ${error.message}`);
            throw new Error(`SoundCloud search failed: ${error.message}`);
        }
    }

    async getSoundCloudStreamUrl(trackIdOrUrl: string): Promise<string> {
        try {
            const clientId = await this.getSoundCloudClientId();
            let trackData: any;

            if (trackIdOrUrl.startsWith('http') || trackIdOrUrl.startsWith('/')) {
                const trackUrl = trackIdOrUrl.startsWith('http')
                    ? trackIdOrUrl
                    : `https://soundcloud.com${trackIdOrUrl}`;

                const resolveUrl = `${SOUNDCLOUD_API_V2_BASE}resolve?url=${encodeURIComponent(trackUrl)}&client_id=${clientId}`;
                const resolveRes = await this.fetchWithTimeout(this.proxyUrl(resolveUrl), {
                    headers: { 'User-Agent': SOUNDCLOUD_USER_AGENT }
                }, 15000);

                if (!resolveRes.ok) throw new Error(`Resolve failed: ${resolveRes.status}`);
                trackData = await resolveRes.json();
            } else {
                const trackUrl = `${SOUNDCLOUD_API_V2_BASE}tracks/${trackIdOrUrl}?client_id=${clientId}`;
                const trackRes = await this.fetchWithTimeout(this.proxyUrl(trackUrl), {
                    headers: { 'User-Agent': SOUNDCLOUD_USER_AGENT }
                }, 15000);

                if (!trackRes.ok) throw new Error(`Track fetch failed: ${trackRes.status}`);
                trackData = await trackRes.json();
            }

            const transcodings = trackData.media?.transcodings || [];
            const progressive = transcodings.find((t: any) => t.format?.protocol === 'progressive');
            const hls = transcodings.find((t: any) => t.format?.protocol === 'hls');
            const transcoding = progressive || hls;

            if (!transcoding) throw new Error('No stream transcoding found');

            const streamInfoUrl = `${transcoding.url}?client_id=${clientId}&track_authorization=${trackData.track_authorization}`;
            const streamRes = await this.fetchWithTimeout(this.proxyUrl(streamInfoUrl), {
                headers: { 'User-Agent': SOUNDCLOUD_USER_AGENT }
            }, 15000);

            if (!streamRes.ok) throw new Error(`Stream info failed: ${streamRes.status}`);

            const streamInfo = await streamRes.json();
            if (!streamInfo.url) throw new Error('No stream URL in response');

            console.log('[SoundCloud] Got stream URL');
            return streamInfo.url;
        } catch (error: any) {
            console.error(`[SoundCloud] Stream error: ${error.message}`);
            this.soundCloudClientId = null;
            throw new Error(`Could not get SoundCloud stream: ${error.message}`);
        }
    }

    // ============= SPOTIFY =============

    async searchSpotify(_query: string): Promise<SpotifyResult[]> {
        console.log('[Spotify] Not supported without API credentials');
        return [];
    }

    // ============= HELPERS =============

    convertToChannel(result: OnlineSearchResult): Channel {
        return {
            id: `${result.platform}-${result.id}`,
            name: result.title,
            url: result.streamUrl || '',
            logo: result.thumbnail,
            group: result.platform.charAt(0).toUpperCase() + result.platform.slice(1),
        };
    }

    formatDuration(seconds: number): string {
        if (!seconds || seconds <= 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatViewCount(count: number): string {
        if (!count) return '0';
        if (count >= 1000000000) return `${(count / 1000000000).toFixed(1)}B`;
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    }
}

export const OnlineSearchService = new OnlineSearchServiceClass();
