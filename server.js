const express = require('express');
const { Resvg } = require('@resvg/resvg-js');
const app = express();
const PORT = process.env.PORT || 3000;
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || '';
const DEFAULT_LASTFM_USER = process.env.LASTFM_USER || 'sare-eras';

function absoluteUrl(req, path) {
    return req.protocol + '://' + req.get('host') + path;
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
        const image = (track.image && track.image.slice().reverse().find(i => i['#text']))?.['#text'] || '';
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
    const imageUrl = now?.image || 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96c0b9f0f84df0a3f0f3b1c9a6c3d4.png';
    const progress = now?.nowPlaying ? 0.62 : 0.28;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="260" viewBox="0 0 1200 260">
  <defs>
    <linearGradient id="bg" x1="0" x2="1">
      <stop offset="0%" stop-color="#0f1118" />
      <stop offset="100%" stop-color="#07090f" />
    </linearGradient>
    <linearGradient id="prog" x1="0" x2="1">
      <stop offset="0%" stop-color="#7dd3fc" />
      <stop offset="100%" stop-color="#60a5fa" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#000" flood-opacity="0.5" />
    </filter>
    <clipPath id="albumClip"><rect x="34" y="34" width="192" height="192" rx="24" /></clipPath>
  </defs>
  <rect width="1200" height="260" rx="24" fill="url(#bg)" />
  <rect x="30" y="30" width="1140" height="200" rx="24" fill="rgba(255,255,255,0.02)" />
  <rect x="34" y="34" width="192" height="192" rx="28" fill="#111827" filter="url(#shadow)" />
  <image href="${imageUrl}" x="34" y="34" width="192" height="192" preserveAspectRatio="xMidYMid slice" clip-path="url(#albumClip)" />

  <g transform="translate(260,52)">
    <text x="0" y="0" font-family="Inter, Roboto, Arial, sans-serif" font-size="46" fill="#ffffff" font-weight="700">${escapeSvg(title)}</text>
    <text x="0" y="64" font-family="Inter, Roboto, Arial, sans-serif" font-size="24" fill="#c3cddf">${escapeSvg(artist)}${album ? ' — ' + escapeSvg(album) : ''}</text>
    <rect x="0" y="120" width="700" height="14" rx="7" fill="#111a30" />
    <rect x="0" y="120" width="${Math.round(700 * progress)}" height="14" rx="7" fill="url(#prog)" />
    <circle cx="${Math.round(700 * progress)}" cy="127" r="10" fill="#ffffff" opacity="0.95" />
    <text x="0" y="170" font-family="Inter, Roboto, Arial, sans-serif" font-size="18" fill="#94a3b8">${now?.nowPlaying ? 'Now Playing' : 'Last Played'}</text>
  </g>

  <g transform="translate(260,18)" fill="#9aa4c1" opacity="0.9">
    <polygon points="0,30 18,18 0,6" />
    <path d="M27 6 H49 L45 10" stroke="#9aa4c1" stroke-width="2" fill="none" />
    <path d="M27 30 H49 L45 26" stroke="#9aa4c1" stroke-width="2" fill="none" />
    <rect x="62" y="10" width="10" height="28" rx="2" />
    <rect x="78" y="10" width="10" height="28" rx="2" />
    <polygon points="104,18 124,6 124,30" />
    <polygon points="134,18 154,6 154,30" />
    <path d="M182 22 A8 8 0 0 1 194 14" stroke="#9aa4c1" stroke-width="2" fill="none" />
    <path d="M182 22 A8 8 0 0 0 194 30" stroke="#9aa4c1" stroke-width="2" fill="none" />
  </g>

  <g transform="translate(820,18)" fill="#9aa4c1" opacity="0.9">
    <rect x="0" y="0" width="28" height="4" rx="2" />
    <rect x="0" y="10" width="28" height="4" rx="2" />
    <rect x="0" y="20" width="18" height="4" rx="2" />
  </g>

  <g transform="translate(880,18)" fill="none" stroke="#9aa4c1" stroke-width="2" opacity="0.9">
    <path d="M0 24 Q10 4 20 24 T40 24" />
    <path d="M0 28 Q10 8 20 28 T40 28" opacity="0.6" />
  </g>

  <g transform="translate(980,18)" fill="none" stroke="#9aa4c1" stroke-width="2" opacity="0.9">
    <path d="M10 0 L20 14 L10 28" />
    <line x1="20" y1="14" x2="34" y2="14" />
    <line x1="34" y1="10" x2="34" y2="18" />
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
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <rect width="1200" height="628" fill="url(#g)" />
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
