// Online Search Service - Search YouTube, SoundCloud, Spotify
// Uses free APIs and proxies to avoid needing API keys

import { Channel } from '../types';

// Types for online search
export type SearchPlatform = 'youtube' | 'soundcloud' | 'spotify';

export interface YouTubeResult {
    videoId: string;
    title: string;
    author: string;
    authorId: string;
    thumbnail: string;
    duration: number; // seconds
    viewCount: number;
    publishedText: string;
    description?: string;
}

export interface SoundCloudResult {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number; // milliseconds
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
    duration: number; // milliseconds
    previewUrl?: string; // 30s preview
    externalUrl: string;
}

export interface OnlineSearchResult {
    platform: SearchPlatform;
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number; // seconds
    streamUrl?: string;
    viewCount?: number;
    description?: string;
}

// Invidious API instances (fallback list) - Updated Dec 2024
const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.private.coffee',
    'https://invidious.protokolla.fi',
    'https://inv.tux.pizza',
    'https://invidious.fdn.fr',
    'https://invidious.perennialte.ch',
    'https://yewtu.be',
    'https://invidious.reallyaweso.me',
    'https://iv.datura.network',
];

// Piped API instances (alternative YouTube frontend)
const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://api.piped.yt',
    'https://pipedapi.r4fo.com',
    'https://pipedapi.drgns.space',
    'https://pipedapi.darkness.services',
];

class OnlineSearchServiceClass {
    private currentInvidiousInstance = 0;
    private currentPipedInstance = 0;

    // Get working Invidious instance
    private getInvidiousInstance(): string {
        return INVIDIOUS_INSTANCES[this.currentInvidiousInstance % INVIDIOUS_INSTANCES.length];
    }

    // Get working Piped instance
    private getPipedInstance(): string {
        return PIPED_INSTANCES[this.currentPipedInstance % PIPED_INSTANCES.length];
    }

    // Rotate to next instance on failure
    private rotateInvidiousInstance(): void {
        this.currentInvidiousInstance++;
    }

    private rotatePipedInstance(): void {
        this.currentPipedInstance++;
    }

    // Fetch with timeout
    private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // Format duration from seconds to MM:SS or HH:MM:SS
    formatDuration(seconds: number): string {
        if (!seconds || seconds <= 0) return '0:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Format view count
    formatViewCount(count: number): string {
        if (!count) return '0';
        if (count >= 1000000000) {
            return `${(count / 1000000000).toFixed(1)}B`;
        }
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }

    /**
     * Search YouTube using Invidious API
     */
    async searchYouTube(query: string, maxRetries = 3): Promise<YouTubeResult[]> {
        let lastError: Error | null = null;

        for (let retry = 0; retry < maxRetries; retry++) {
            try {
                const instance = this.getInvidiousInstance();
                const encodedQuery = encodeURIComponent(query);
                const url = `${instance}/api/v1/search?q=${encodedQuery}&type=video&sort_by=relevance`;

                console.log(`[YouTube] Searching: ${query} via ${instance}`);

                const response = await this.fetchWithTimeout(url, {
                    headers: {
                        'Accept': 'application/json',
                    },
                }, 8000);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error('Invalid response format');
                }

                const results: YouTubeResult[] = data
                    .filter((item: any) => item.type === 'video')
                    .slice(0, 20)
                    .map((item: any) => ({
                        videoId: item.videoId,
                        title: item.title,
                        author: item.author,
                        authorId: item.authorId,
                        thumbnail: item.videoThumbnails?.[0]?.url ||
                            `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
                        duration: item.lengthSeconds || 0,
                        viewCount: item.viewCount || 0,
                        publishedText: item.publishedText || '',
                        description: item.description || '',
                    }));

                console.log(`[YouTube] Found ${results.length} results`);
                return results;

            } catch (error: any) {
                console.error(`[YouTube] Error on instance ${this.getInvidiousInstance()}:`, error.message);
                lastError = error;
                this.rotateInvidiousInstance();
            }
        }

        // Try all Piped instances as fallback
        for (let i = 0; i < PIPED_INSTANCES.length; i++) {
            try {
                return await this.searchYouTubeViaPiped(query);
            } catch (_pipedError) {
                console.error(`[YouTube] Piped instance ${this.getPipedInstance()} failed`);
                this.rotatePipedInstance();
            }
        }

        console.error('[YouTube] All instances failed');
        throw lastError || new Error('All YouTube search attempts failed');
    }

    /**
     * Search YouTube using Piped API (fallback)
     */
    private async searchYouTubeViaPiped(query: string): Promise<YouTubeResult[]> {
        const instance = this.getPipedInstance();
        const encodedQuery = encodeURIComponent(query);
        const url = `${instance}/search?q=${encodedQuery}&filter=videos`;

        console.log(`[YouTube/Piped] Searching: ${query} via ${instance}`);

        const response = await this.fetchWithTimeout(url, {
            headers: {
                'Accept': 'application/json',
            },
        }, 8000);

        if (!response.ok) {
            this.rotatePipedInstance();
            throw new Error(`Piped HTTP ${response.status}`);
        }

        const data = await response.json();
        const items = data.items || [];

        const results: YouTubeResult[] = items
            .filter((item: any) => item.type === 'stream')
            .slice(0, 20)
            .map((item: any) => ({
                videoId: item.url?.replace('/watch?v=', '') || '',
                title: item.title,
                author: item.uploaderName || item.uploader,
                authorId: item.uploaderUrl?.replace('/channel/', '') || '',
                thumbnail: item.thumbnail || '',
                duration: item.duration || 0,
                viewCount: item.views || 0,
                publishedText: item.uploadedDate || '',
                description: item.shortDescription || '',
            }));

        console.log(`[YouTube/Piped] Found ${results.length} results`);
        return results;
    }

    /**
     * Get YouTube stream URL using Piped
     */
    async getYouTubeStreamUrl(videoId: string): Promise<string> {
        for (let retry = 0; retry < 3; retry++) {
            try {
                const instance = this.getPipedInstance();
                const url = `${instance}/streams/${videoId}`;

                console.log(`[YouTube] Getting stream URL for: ${videoId}`);

                const response = await this.fetchWithTimeout(url, {
                    headers: {
                        'Accept': 'application/json',
                    },
                }, 10000);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                // Prefer audio streams for music, video streams otherwise
                // Try to get HLS stream first
                if (data.hls) {
                    console.log('[YouTube] Using HLS stream');
                    return data.hls;
                }

                // Fall back to audio stream
                if (data.audioStreams && data.audioStreams.length > 0) {
                    const audioStream = data.audioStreams.reduce((best: any, current: any) => {
                        return (current.bitrate > best.bitrate) ? current : best;
                    });
                    console.log('[YouTube] Using audio stream:', audioStream.quality);
                    return audioStream.url;
                }

                // Fall back to video stream
                if (data.videoStreams && data.videoStreams.length > 0) {
                    const videoStream = data.videoStreams.find((s: any) => s.quality === '720p') ||
                        data.videoStreams.find((s: any) => s.quality === '480p') ||
                        data.videoStreams[0];
                    console.log('[YouTube] Using video stream:', videoStream.quality);
                    return videoStream.url;
                }

                throw new Error('No streams available');

            } catch (error: any) {
                console.error('[YouTube] Stream URL error:', error.message);
                this.rotatePipedInstance();
            }
        }

        throw new Error('Failed to get stream URL');
    }

    /**
     * Search SoundCloud (using public widgets/API)
     */
    async searchSoundCloud(query: string): Promise<SoundCloudResult[]> {
        // SoundCloud requires client_id which changes frequently
        // Using a simple scraping approach for search suggestions
        try {
            const encodedQuery = encodeURIComponent(query);

            // Try using SoundCloud's public API endpoint
            // Note: This may have rate limits
            const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodedQuery}&client_id=iZIs9mchVcX5lhVRyQGGAYlNPVldzAoX&limit=20`;

            console.log(`[SoundCloud] Searching: ${query}`);

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Origin': 'https://soundcloud.com',
                },
            });

            if (!response.ok) {
                // Try alternative client_id
                return this.searchSoundCloudFallback(query);
            }

            const data = await response.json();
            const collection = data.collection || [];

            const results: SoundCloudResult[] = collection
                .slice(0, 20)
                .map((track: any) => ({
                    id: track.id.toString(),
                    title: track.title,
                    artist: track.user?.username || 'Unknown Artist',
                    thumbnail: track.artwork_url?.replace('large', 't500x500') ||
                        track.user?.avatar_url || '',
                    duration: Math.floor((track.duration || 0) / 1000), // Convert to seconds
                    playbackCount: track.playback_count || 0,
                    permalinkUrl: track.permalink_url || '',
                    streamUrl: track.stream_url || undefined,
                }));

            console.log(`[SoundCloud] Found ${results.length} results`);
            return results;

        } catch (error: any) {
            console.error('[SoundCloud] Search error:', error.message);
            return this.searchSoundCloudFallback(query);
        }
    }

    /**
     * SoundCloud fallback search
     */
    private async searchSoundCloudFallback(query: string): Promise<SoundCloudResult[]> {
        // Return mock results with a message that SoundCloud API is limited
        console.log('[SoundCloud] Using fallback - API access limited');

        // Try with different client_id
        const clientIds = [
            'iZIs9mchVcX5lhVRyQGGAYlNPVldzAoX',
            'a3e059563d7fd3372b49b37f00a00bcf',
            '2t9loNQH90kzJcsFCODdigxfp325aq4z',
        ];

        for (const clientId of clientIds) {
            try {
                const encodedQuery = encodeURIComponent(query);
                const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodedQuery}&client_id=${clientId}&limit=20`;

                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    const collection = data.collection || [];

                    return collection.slice(0, 20).map((track: any) => ({
                        id: track.id.toString(),
                        title: track.title,
                        artist: track.user?.username || 'Unknown Artist',
                        thumbnail: track.artwork_url?.replace('large', 't500x500') || '',
                        duration: Math.floor((track.duration || 0) / 1000),
                        playbackCount: track.playback_count || 0,
                        permalinkUrl: track.permalink_url || '',
                    }));
                }
            } catch (_e) {
                continue;
            }
        }

        return [];
    }

    /**
     * Search Spotify (preview only - 30s)
     * Uses Spotify's public embed API which doesn't require authentication
     */
    async searchSpotify(query: string): Promise<SpotifyResult[]> {
        try {
            // Spotify Web API requires OAuth, so we use a workaround
            // This searches using Spotify's public search page data
            const encodedQuery = encodeURIComponent(query);

            // Try using Spotify's open access token endpoint
            const tokenResponse = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player');

            if (!tokenResponse.ok) {
                console.log('[Spotify] Cannot get access token, using mock results');
                return this.getSpotifyMockResults(query);
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.accessToken;

            if (!accessToken) {
                return this.getSpotifyMockResults(query);
            }

            // Search using the access token
            const searchUrl = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=20`;

            const response = await fetch(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                console.log('[Spotify] Search failed, using mock results');
                return this.getSpotifyMockResults(query);
            }

            const data = await response.json();
            const tracks = data.tracks?.items || [];

            const results: SpotifyResult[] = tracks.map((track: any) => ({
                id: track.id,
                title: track.name,
                artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
                album: track.album?.name || '',
                thumbnail: track.album?.images?.[0]?.url || '',
                duration: Math.floor((track.duration_ms || 0) / 1000),
                previewUrl: track.preview_url || undefined,
                externalUrl: track.external_urls?.spotify || '',
            }));

            console.log(`[Spotify] Found ${results.length} results`);
            return results;

        } catch (error: any) {
            console.error('[Spotify] Search error:', error.message);
            return this.getSpotifyMockResults(query);
        }
    }

    /**
     * Mock Spotify results when API is unavailable
     */
    private getSpotifyMockResults(_query: string): SpotifyResult[] {
        // Return empty with a note that Spotify requires authentication
        console.log('[Spotify] API unavailable - Spotify requires Premium for full playback');
        return [];
    }

    /**
     * Convert search result to Channel for playback
     */
    async convertToChannel(result: OnlineSearchResult): Promise<Channel> {
        let streamUrl = result.streamUrl;

        // Get stream URL if not available
        if (!streamUrl) {
            if (result.platform === 'youtube') {
                streamUrl = await this.getYouTubeStreamUrl(result.id);
            }
        }

        return {
            id: `${result.platform}-${result.id}`,
            name: result.title,
            url: streamUrl || '',
            logo: result.thumbnail,
            group: result.platform.charAt(0).toUpperCase() + result.platform.slice(1),
            duration: result.duration,
            viewCount: result.viewCount,
        };
    }

    /**
     * Unified search across all platforms
     */
    async searchAll(query: string): Promise<OnlineSearchResult[]> {
        const results: OnlineSearchResult[] = [];

        // Search all platforms in parallel
        const [youtubeResults, soundcloudResults, spotifyResults] = await Promise.allSettled([
            this.searchYouTube(query),
            this.searchSoundCloud(query),
            this.searchSpotify(query),
        ]);

        // Process YouTube results
        if (youtubeResults.status === 'fulfilled') {
            results.push(...youtubeResults.value.map(r => ({
                platform: 'youtube' as SearchPlatform,
                id: r.videoId,
                title: r.title,
                artist: r.author,
                thumbnail: r.thumbnail,
                duration: r.duration,
                viewCount: r.viewCount,
                description: r.description,
            })));
        }

        // Process SoundCloud results
        if (soundcloudResults.status === 'fulfilled') {
            results.push(...soundcloudResults.value.map(r => ({
                platform: 'soundcloud' as SearchPlatform,
                id: r.id,
                title: r.title,
                artist: r.artist,
                thumbnail: r.thumbnail,
                duration: r.duration,
                viewCount: r.playbackCount,
                streamUrl: r.streamUrl,
            })));
        }

        // Process Spotify results
        if (spotifyResults.status === 'fulfilled') {
            results.push(...spotifyResults.value.map(r => ({
                platform: 'spotify' as SearchPlatform,
                id: r.id,
                title: r.title,
                artist: r.artist,
                thumbnail: r.thumbnail,
                duration: r.duration,
                streamUrl: r.previewUrl,
            })));
        }

        return results;
    }
}

// Export singleton instance
export const OnlineSearchService = new OnlineSearchServiceClass();
