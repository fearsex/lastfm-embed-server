# Deploy to Render

Quick steps to deploy this app on Render.com (Web Service):

1. Push your repository to GitHub (or connect your Git provider).

2. On Render, create a new **Web Service** and connect the repo + branch (e.g., `main`).

3. Build & Start settings:
   - Environment: `Node` or choose `Docker` (this repo includes a `Dockerfile`).
   - If using Render's Node build: set **Build Command** to `npm install` and **Start Command** to `npm start`.
   - If using Docker, Render will use the `Dockerfile` to build the image.

4. Set Environment Variables in Render:
   - `LASTFM_API_KEY` = your Last.fm API key
   - (Optional) `PORT` = `3000` (Render provides `PORT` automatically)

5. Deploy. After deploy finishes, your service will have a public URL. Use `/s/sare-eras` for the OpenGraph page and `/card/sare-eras` for the SVG card.

Notes:
- Render will supply the `PORT` env var automatically; the server reads it from `process.env.PORT`.
- If you prefer a one-click infra file, create a `render.yaml` with the service spec and import it into Render.
