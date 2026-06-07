const express = require('express');
const { Resvg } = require('@resvg/resvg-js');
const app = express();
const PORT = process.env.PORT || 3000;
const LASTFM_API_KEY = "9c4d7efbc599f2d73e626e5908ff49e4";
const DEFAULT_LASTFM_USER = process.env.LASTFM_USER || 'sare-eras';
const LASTFM_PLACEHOLDER = '2a96c0b9f0f84df0a3f0f3b1c9a6c3d4.png';

function absoluteUrl(req, path) {
    return req.protocol + '://' + req.get('host') + path;
}

function parseColor(value, fallback) {
    if (!value) return fallback;
    const normalized = String(value).trim();
    if (normalized.toLowerCase() === 'transparent') return 'transparent';
    const hex = normalized.replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(hex) || /^[0-9a-fA-F]{6}$/.test(hex)) {
        return `#${hex}`;
    }
    return fallback;
}

function isLastfmPlaceholder(url) {
    return !url || !url.trim() || url.includes(LASTFM_PLACEHOLDER);
}

async function fetchImageAsBase64(url) {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        const b64 = Buffer.from(buffer).toString('base64');
        const mime = res.headers.get('content-type') || 'image/jpeg';
        return `data:${mime};base64,${b64}`;
    } catch (e) {
        return null;
    }
}

async function fetchNowPlaying(user) {
    if (!LASTFM_API_KEY) return null;
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const track = data?.recenttracks?.track?.[0];
        if (!track) return null;
        const now = track['@attr'] && track['@attr'].nowplaying === 'true';
        const image = (track.image && track.image.slice().reverse().find(i => i['#text'] && !isLastfmPlaceholder(i['#text'])))?.['#text'] || '';
        return {
            nowPlaying: now,
            title: track.name || '',
            artist: track.artist?.['#text'] || '',
            album: track.album?.['#text'] || '',
            url: track.url || '',
            image
        };
    } catch (e) {
        return null;
    }
}

app.get('/api/nowplaying/:user', async (req, res) => {
    const user = req.params.user;
    const data = await fetchNowPlaying(user);
    if (!data) return res.status(404).json({ error: 'not found or API key missing' });
    res.json(data);
});

app.get('/s/nowplaying.png', async (req, res) => {
    const user = DEFAULT_LASTFM_USER;
    const now = await fetchNowPlaying(user);
    const title = now?.title || 'Not Playing';
    const artist = now?.artist || `@${user}`;
    const album = now?.album || '';

    const backColor = parseColor(req.query.back, '#07101d');
    const pillColor = parseColor(req.query.pill_background, '#0a1526');
    const textColor = parseColor(req.query.text_color, '#ffffff');
    const subTextColor = parseColor(req.query.subtext_color, '#bbc7e0');

    const imageData = now?.image ? await fetchImageAsBase64(now.image) : null;
    const imageSvg = imageData
        ? `<image href="${imageData}" x="34" y="34" width="192" height="192" preserveAspectRatio="xMidYMid slice" clip-path="url(#albumClip)" />`
        : `<rect x="34" y="34" width="192" height="192" rx="24" fill="#0f172e" />`;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="260" viewBox="0 0 1200 260">
  <defs>
    <clipPath id="albumClip">
      <rect x="34" y="34" width="192" height="192" rx="24" />
    </clipPath>
  </defs>

  <rect width="1200" height="260" rx="24" fill="${backColor}" />
  <rect x="30" y="30" width="1140" height="200" rx="24" fill="${pillColor}" />
  ${imageSvg}

  <g transform="translate(270,70)">
    <text x="0" y="0" font-family="Inter, Roboto, Arial, sans-serif" font-size="34" fill="${textColor}" font-weight="700">${escapeSvg(title)}</text>
    <text x="0" y="46" font-family="Inter, Roboto, Arial, sans-serif" font-size="20" fill="${subTextColor}">${escapeSvg(artist)}</text>
    <text x="0" y="74" font-family="Inter, Roboto, Arial, sans-serif" font-size="16" fill="${subTextColor}">${album ? escapeSvg(album) : 'Last.fm'}</text>
    <text x="0" y="102" font-family="Inter, Roboto, Arial, sans-serif" font-size="14" fill="${subTextColor}">${now?.nowPlaying ? '▶ Now Playing' : 'Last Played'}</text>
  </g>
</svg>`;
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render();
    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(png.asPng()));
});

// OpenGraph page used by Discord/Twitter/Notion
app.get('/s/:user', async (req, res) => {
    const user = req.params.user;
    const now = await fetchNowPlaying(user);
    const title = now ? `${now.title} — ${now.artist}` : `${user} on Last.fm`;
    const desc = now ? `Now ${now.nowPlaying ? 'playing' : 'listening'}: ${now.title} — ${now.artist}` : `See what ${user} is listening to on Last.fm`;
    const image = absoluteUrl(req, `/card/${encodeURIComponent(user)}`);
    const page = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:image" content="${image}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${image}" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(desc)}</p>
  <img src="${image}" alt="card" style="max-width:100%;height:auto">
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(page);
});

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function escapeSvg(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"'\\]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
        '\\': '&#92;'
    })[c]);
}

// SVG card generator (1200x628) — returns image/svg+xml
app.get('/card/:user', async (req, res) => {
    const user = req.params.user;
    const now = await fetchNowPlaying(user);
    const title = now?.title || '—';
    const artist = now?.artist || user;
    const album = now?.album || '';
    const imageUrl = now?.image || 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96c0b9f0f84df0a3f0f3b1c9a6c3d4.png';
    const playingBadge = now?.nowPlaying ? 'Now Playing' : 'Last Played';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628" viewBox="0 0 1200 628">
  <defs>
  </defs>
  <rect width="1200" height="628" fill="#111827" />
  <filter id="f" x="0" y="0" width="1" height="1">
    <feDropShadow dx="0" dy="6" stdDeviation="18" flood-color="#000" flood-opacity="0.6"/>
  </filter>

  <image href="${imageUrl}" x="64" y="64" width="500" height="500" preserveAspectRatio="xMidYMid slice" style="filter:url(#f)" />

  <g transform="translate(600,140)">
    <rect x="-40" y="-40" width="640" height="360" rx="18" fill="rgba(255,255,255,0.02)" />
    <text x="0" y="0" font-family="Inter, Roboto, Arial, sans-serif" font-size="40" fill="#ffffff" font-weight="700">${escapeSvg(title)}</text>
    <text x="0" y="62" font-family="Inter, Roboto, Arial, sans-serif" font-size="28" fill="#94a3b8">${escapeSvg(artist)}</text>
    <text x="0" y="112" font-family="Inter, Roboto, Arial, sans-serif" font-size="20" fill="#9ca3af">${escapeSvg(album)}</text>

    <rect x="0" y="150" width="180" height="44" rx="8" fill="#ef4444" />
    <text x="26" y="182" font-family="Inter, Roboto, Arial, sans-serif" font-size="18" fill="#fff">▶ Play</text>

    <text x="0" y="240" font-family="Inter, Roboto, Arial, sans-serif" font-size="16" fill="#94a3b8">${escapeSvg(playingBadge)}</text>
  </g>

  <text x="64" y="592" font-family="Inter, Roboto, Arial, sans-serif" font-size="14" fill="#94a3b8">Generated for ${escapeSvg(user)}</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
});

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    if (!LASTFM_API_KEY) console.warn('Warning: LASTFM_API_KEY not set — card will show fallback text.');
});
