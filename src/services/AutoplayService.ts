import { SoundCloudResult, YouTubeResult } from './OnlineSearchService';

export async function getYouTubeRelatedVideos(videoId: string): Promise<YouTubeResult[]> {
    try {
        console.log(`[YouTube] Fetching related videos for: ${videoId}`);

        const requestBody = {
            context: {
                client: {
                    clientName: 'WEB',
                    clientVersion: '2.20250925.01.00',
                    hl: 'en',
                    gl: 'US',
                },
            },
            videoId: videoId,
        };

        const apiUrl = 'https://www.youtube.com/youtubei/v1/next?prettyPrint=false';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const data = await response.json();
        const results: YouTubeResult[] = [];

        const secondaryResults = data?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results || [];

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

        for (const item of secondaryResults) {
            const renderer = item?.compactVideoRenderer;
            if (!renderer?.videoId) continue;

            results.push({
                videoId: renderer.videoId,
                title: getText(renderer.title),
                author: getText(renderer.shortBylineText),
                authorId: renderer.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
                thumbnail: renderer.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${renderer.videoId}/hqdefault.jpg`,
                duration: parseDuration(getText(renderer.lengthText)),
                viewCount: 0,
                publishedText: getText(renderer.publishedTimeText),
            });

            if (results.length >= 10) break;
        }

        console.log(`[YouTube] Found ${results.length} related videos`);
        return results;
    } catch (error: any) {
        console.error(`[YouTube] Related videos failed: ${error.message}`);
        return [];
    }
}

export async function getSoundCloudRelatedTracks(trackId: string): Promise<SoundCloudResult[]> {
    try {
        console.log(`[SoundCloud] Fetching related tracks for: ${trackId}`);

        const clientId = 'a3e059563d7fd3372b49b37f00a00bcf';
        const relatedUrl = `https://api-v2.soundcloud.com/tracks/${trackId}/related?client_id=${clientId}&limit=10`;

        const response = await fetch(relatedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const data = await response.json();
        const tracks = data.collection || [];

        const results: SoundCloudResult[] = tracks.map((track: any) => ({
            id: String(track.id),
            title: track.title || 'Unknown',
            artist: track.user?.username || 'Unknown',
            thumbnail: track.artwork_url?.replace('-large', '-t500x500') || '',
            duration: track.duration || 0,
            playbackCount: track.playback_count || 0,
            permalinkUrl: track.permalink_url || '',
        }));

        console.log(`[SoundCloud] Found ${results.length} related tracks`);
        return results;
    } catch (error: any) {
        console.error(`[SoundCloud] Related tracks failed: ${error.message}`);
        return [];
    }
}

export interface VideoQuality {
    label: string;
    url: string;
    bitrate: number;
}

export async function getYouTubeQualities(videoId: string): Promise<VideoQuality[]> {
    try {
        console.log(`[YouTube] Fetching qualities for: ${videoId}`);

        const clients = [
            { clientName: 'WEB', clientVersion: '2.20250925.01.00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            { clientName: 'ANDROID', clientVersion: '20.10.38', userAgent: 'com.google.android.youtube/20.10.38' },
        ];

        for (const client of clients) {
            const requestBody = {
                context: {
                    client: {
                        clientName: client.clientName,
                        clientVersion: client.clientVersion,
                        hl: 'en',
                        gl: 'US',
                    },
                },
                videoId: videoId,
                contentCheckOk: true,
                racyCheckOk: true,
            };

            const response = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': client.userAgent,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) continue;

            const data = await response.json();
            if (data?.playabilityStatus?.status !== 'OK') continue;

            const formats = data?.streamingData?.formats || [];
            const qualities: VideoQuality[] = [];

            for (const f of formats) {
                if (!f.url || f.signatureCipher) continue;

                qualities.push({
                    label: f.qualityLabel || f.quality || 'auto',
                    url: f.url,
                    bitrate: f.bitrate || 0,
                });
            }

            if (qualities.length > 0) {
                qualities.sort((a, b) => b.bitrate - a.bitrate);
                console.log(`[YouTube] Found ${qualities.length} quality options from ${client.clientName}`);
                return qualities;
            }
        }

        return [];
    } catch (error: any) {
        console.error(`[YouTube] Qualities fetch failed: ${error.message}`);
        return [];
    }
}
