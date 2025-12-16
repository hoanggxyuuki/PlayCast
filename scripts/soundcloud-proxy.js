/**
 * SoundCloud Proxy Server for PlayCast
 * Deploy on Singapore VPS to bypass Vietnam IP block
 * 
 * Run with: node soundcloud-proxy.js
 * Or with PM2: pm2 start soundcloud-proxy.js --name soundcloud-proxy
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3000;

// CORS headers for app access
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
};

// SoundCloud config
const SOUNDCLOUD_API_V2 = 'https://api-v2.soundcloud.com';
const SOUNDCLOUD_MAIN = 'https://soundcloud.com';
const SOUNDCLOUD_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CLIENT_ID_REGEX = /client_id\s*:\s*["']([a-zA-Z0-9]+)["']/g;
const DEFAULT_CLIENT_ID = 'iZIs9mchVcX5lhVRyQGGAYlNPVldzAoX';

let cachedClientId = null;
let clientIdCacheTime = 0;
const CLIENT_ID_CACHE_DURATION = 3600000; // 1 hour

// Helper: Make HTTPS request
function httpsRequest(requestUrl, options = {}) {
    return new Promise((resolve, reject) => {
        const parsed = url.parse(requestUrl);
        const reqOptions = {
            hostname: parsed.hostname,
            path: parsed.path,
            method: options.method || 'GET',
            headers: {
                'User-Agent': SOUNDCLOUD_USER_AGENT,
                ...options.headers,
            },
            timeout: 15000,
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data,
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

// Extract client_id from SoundCloud
async function getClientId() {
    // Use cache if valid
    if (cachedClientId && (Date.now() - clientIdCacheTime) < CLIENT_ID_CACHE_DURATION) {
        return cachedClientId;
    }

    try {
        console.log('[SoundCloud] Extracting fresh client_id...');

        // Get main page
        const mainRes = await httpsRequest(SOUNDCLOUD_MAIN);
        if (mainRes.status !== 200) {
            throw new Error(`Main page returned ${mainRes.status}`);
        }

        // Find script URLs
        const scriptRegex = /<script[^>]+src="([^"]+)"/g;
        const scripts = [];
        let match;
        while ((match = scriptRegex.exec(mainRes.body)) !== null) {
            if (match[1].startsWith('https://')) {
                scripts.push(match[1]);
            }
        }

        // Search scripts for client_id (reverse order - newer scripts first)
        for (let i = scripts.length - 1; i >= 0; i--) {
            try {
                const scriptRes = await httpsRequest(scripts[i]);
                if (scriptRes.status !== 200) continue;

                const clientIdMatch = scriptRes.body.match(/client_id\s*[=:]\s*["']([a-zA-Z0-9]{32})["']/);
                if (clientIdMatch) {
                    cachedClientId = clientIdMatch[1];
                    clientIdCacheTime = Date.now();
                    console.log(`[SoundCloud] Got client_id: ${cachedClientId.substring(0, 8)}...`);
                    return cachedClientId;
                }
            } catch (e) {
                continue;
            }
        }

        throw new Error('client_id not found in scripts');
    } catch (error) {
        console.warn(`[SoundCloud] client_id extraction failed: ${error.message}, using default`);
        return DEFAULT_CLIENT_ID;
    }
}

// Available genres for charts
const GENRES = [
    'all-music',
    'all-audio',
    'alternativerock',
    'ambient',
    'classical',
    'country',
    'danceedm',
    'dancehall',
    'deephouse',
    'disco',
    'drumbass',
    'dubstep',
    'electronic',
    'folksingersongwriter',
    'hiphoprap',
    'house',
    'indie',
    'jazzblues',
    'latin',
    'metal',
    'piano',
    'pop',
    'rbsoul',
    'reggae',
    'reggaeton',
    'rock',
    'soundtrack',
    'techno',
    'trance',
    'trap',
    'triphop',
    'world',
];

// Helper: Map tracks from SoundCloud response
function mapTracks(tracks) {
    return (tracks || []).map(track => ({
        id: String(track.id),
        title: track.title || 'Unknown',
        artist: track.user?.username || 'Unknown',
        thumbnail: (track.artwork_url || '').replace('-large', '-t500x500'),
        duration: track.duration || 0,
        playbackCount: track.playback_count || 0,
        permalinkUrl: track.permalink_url || '',
        genre: track.genre || '',
    }));
}

// API handlers
const handlers = {
    // Health check
    '/health': async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        endpoints: Object.keys(handlers),
    }),

    // List available genres
    '/genres': async () => ({ genres: GENRES }),

    // Search tracks
    '/search': async (query) => {
        const q = query.q || '';
        const limit = query.limit || 20;

        if (!q) {
            return { error: 'Missing query parameter: q' };
        }

        const clientId = await getClientId();
        const searchUrl = `${SOUNDCLOUD_API_V2}/search/tracks?q=${encodeURIComponent(q)}&client_id=${clientId}&limit=${limit}`;

        const res = await httpsRequest(searchUrl);
        if (res.status !== 200) {
            throw new Error(`SoundCloud API returned ${res.status}`);
        }

        const data = JSON.parse(res.body);
        return { results: mapTracks(data.collection), count: data.collection?.length || 0 };
    },

    // Get charts/trending tracks
    // kind: 'top' or 'trending'
    // genre: see GENRES list (default: 'all-music')
    // region: country code like 'VN', 'US', 'SG' (optional)
    '/charts': async (query) => {
        const kind = query.kind || 'trending'; // 'top' or 'trending'
        const genre = query.genre || 'all-music';
        const region = query.region || ''; // e.g., 'VN' for Vietnam
        const limit = query.limit || 50;

        const clientId = await getClientId();

        let chartsUrl = `${SOUNDCLOUD_API_V2}/charts?kind=${kind}&genre=soundcloud%3Agenres%3A${genre}&client_id=${clientId}&limit=${limit}`;

        // Add region filter if specified
        if (region) {
            chartsUrl += `&region=soundcloud%3Aregions%3A${region.toUpperCase()}`;
        }

        console.log(`[Charts] Fetching: ${kind} / ${genre} / ${region || 'global'}`);

        const res = await httpsRequest(chartsUrl);
        if (res.status !== 200) {
            throw new Error(`Charts API returned ${res.status}`);
        }

        const data = JSON.parse(res.body);
        const tracks = (data.collection || []).map(item => {
            const track = item.track || item;
            return {
                id: String(track.id),
                title: track.title || 'Unknown',
                artist: track.user?.username || 'Unknown',
                thumbnail: (track.artwork_url || '').replace('-large', '-t500x500'),
                duration: track.duration || 0,
                playbackCount: track.playback_count || 0,
                permalinkUrl: track.permalink_url || '',
                score: item.score || 0,
            };
        });

        return {
            results: tracks,
            count: tracks.length,
            kind,
            genre,
            region: region || 'global',
        };
    },

    // Get related/recommended tracks for a track
    '/related': async (query) => {
        const trackId = query.id;
        const limit = query.limit || 20;

        if (!trackId) {
            return { error: 'Missing query parameter: id' };
        }

        const clientId = await getClientId();
        const relatedUrl = `${SOUNDCLOUD_API_V2}/tracks/${trackId}/related?client_id=${clientId}&limit=${limit}`;

        const res = await httpsRequest(relatedUrl);
        if (res.status !== 200) {
            throw new Error(`Related API returned ${res.status}`);
        }

        const data = JSON.parse(res.body);
        return { results: mapTracks(data.collection), count: data.collection?.length || 0 };
    },

    // Get user's tracks
    '/user/tracks': async (query) => {
        const userId = query.id;
        const limit = query.limit || 20;

        if (!userId) {
            return { error: 'Missing query parameter: id' };
        }

        const clientId = await getClientId();
        const tracksUrl = `${SOUNDCLOUD_API_V2}/users/${userId}/tracks?client_id=${clientId}&limit=${limit}`;

        const res = await httpsRequest(tracksUrl);
        if (res.status !== 200) {
            throw new Error(`User tracks API returned ${res.status}`);
        }

        const data = JSON.parse(res.body);
        return { results: mapTracks(data.collection), count: data.collection?.length || 0 };
    },

    // Discover/explore new music (mixed selection)
    '/discover': async (query) => {
        const clientId = await getClientId();
        const limit = query.limit || 20;

        // Get a mix of trending from different genres
        const genres = ['hiphoprap', 'pop', 'electronic', 'rbsoul'];
        const allTracks = [];

        for (const genre of genres) {
            try {
                const chartsUrl = `${SOUNDCLOUD_API_V2}/charts?kind=trending&genre=soundcloud%3Agenres%3A${genre}&client_id=${clientId}&limit=10`;
                const res = await httpsRequest(chartsUrl);

                if (res.status === 200) {
                    const data = JSON.parse(res.body);
                    const tracks = (data.collection || []).map(item => ({
                        ...(item.track || item),
                        _genre: genre,
                    }));
                    allTracks.push(...tracks);
                }
            } catch (e) {
                console.log(`[Discover] Failed to fetch ${genre}: ${e.message}`);
            }
        }

        // Shuffle and limit
        const shuffled = allTracks.sort(() => Math.random() - 0.5).slice(0, limit);

        return {
            results: shuffled.map(track => ({
                id: String(track.id),
                title: track.title || 'Unknown',
                artist: track.user?.username || 'Unknown',
                thumbnail: (track.artwork_url || '').replace('-large', '-t500x500'),
                duration: track.duration || 0,
                playbackCount: track.playback_count || 0,
                genre: track._genre || track.genre || '',
            })),
            count: shuffled.length,
        };
    },

    // Get stream URL
    '/stream': async (query) => {
        const trackId = query.id;

        if (!trackId) {
            return { error: 'Missing query parameter: id' };
        }

        const clientId = await getClientId();

        // Get track info
        const trackUrl = `${SOUNDCLOUD_API_V2}/tracks/${trackId}?client_id=${clientId}`;
        const trackRes = await httpsRequest(trackUrl);

        if (trackRes.status !== 200) {
            throw new Error(`Track API returned ${trackRes.status}`);
        }

        const track = JSON.parse(trackRes.body);
        const media = track.media?.transcodings || [];

        // Find progressive (direct) stream
        let streamInfo = media.find(m => m.format?.protocol === 'progressive');
        if (!streamInfo) {
            streamInfo = media.find(m => m.format?.protocol === 'hls');
        }

        if (!streamInfo?.url) {
            throw new Error('No stream URL found');
        }

        // Resolve stream URL
        const resolveUrl = `${streamInfo.url}?client_id=${clientId}`;
        const resolveRes = await httpsRequest(resolveUrl);

        if (resolveRes.status !== 200) {
            throw new Error(`Stream resolve returned ${resolveRes.status}`);
        }

        const streamData = JSON.parse(resolveRes.body);

        return {
            streamUrl: streamData.url,
            title: track.title,
            artist: track.user?.username,
            thumbnail: (track.artwork_url || '').replace('-large', '-t500x500'),
            duration: track.duration,
        };
    },
};

// HTTP Server
const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
    }

    const parsed = url.parse(req.url, true);
    const path = parsed.pathname;
    const query = parsed.query;

    console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);

    try {
        const handler = handlers[path];

        if (!handler) {
            res.writeHead(404, CORS_HEADERS);
            res.end(JSON.stringify({ error: 'Not found', availableEndpoints: Object.keys(handlers) }));
            return;
        }

        const result = await handler(query);
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify(result));
    } catch (error) {
        console.error(`[Error] ${error.message}`);
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ error: error.message }));
    }
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║      SoundCloud Proxy Server for PlayCast            ║
╠══════════════════════════════════════════════════════╣
║   Running on port: ${PORT}                               ║
║                                                      ║
║   Endpoints:                                         ║
║   GET /health              - Health check            ║
║   GET /genres              - List available genres   ║
║   GET /search?q=...        - Search tracks           ║
║   GET /charts?kind=...     - Charts (top/trending)   ║
║       &genre=...           - Genre filter            ║
║       &region=VN           - Region (e.g. VN, US)    ║
║   GET /related?id=...      - Related tracks          ║
║   GET /user/tracks?id=...  - User's tracks           ║
║   GET /discover            - Mixed trending tracks   ║
║   GET /stream?id=...       - Get stream URL          ║
╚══════════════════════════════════════════════════════╝
    `);
});
