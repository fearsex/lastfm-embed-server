# Last.fm Embed Server

This small Node.js app serves Open Graph pages and dynamic SVG card images for Last.fm now-playing data. When you share `https://yourhost/s/USERNAME` on Discord, Twitter, or Notion, those services will request the page and display a rich preview using the SVG card at `/card/USERNAME`.

Setup

1. Install dependencies:

```bash
npm install
```

2. Set your Last.fm API key as an environment variable:

```bash
export LASTFM_API_KEY=your_key_here
```

3. Run the server:

```bash
npm start
```

4. Expose the server to the internet for previews (Discord/Twitter/Notion) using a tunnel like `ngrok` or deploy to a host.

Usage

- OpenGraph page (used by embed crawlers): `https://yourhost/s/sare-eras`
- SVG card image: `https://yourhost/card/sare-eras`
- JSON API: `https://yourhost/api/nowplaying/sare-eras`

Notes

- The Last.fm API requires an API key: https://www.last.fm/api
- Many preview services cache cards. After changes you may need to re-scrape (e.g., Twitter Card Validator, Discord may take some time).
