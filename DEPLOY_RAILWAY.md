# Deploy to Railway

Two simple ways to deploy this app to Railway:

1) Recommended: Connect GitHub repo in Railway dashboard

- Open https://railway.app and sign in.
- Create a new project → "Deploy from GitHub" and pick `fearsex/lastfm-embed-server` and the `main` branch.
- Configure Environment Variables in the Railway dashboard for the service:
  - `LASTFM_API_KEY` = your Last.fm API key

Railway will build and deploy automatically whenever you push to `main`.

2) Optional: Use Railway CLI in CI to deploy from GitHub Actions

Add `RAILWAY_API_KEY` as a GitHub secret (create a token in Railway account settings). Below is a sample GitHub Actions job you can add to your workflows to deploy using the Railway CLI.

Example action snippet (copy into a workflow file):

```yaml
name: Deploy to Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Login to Railway
        env:
          RAILWAY_API_KEY: ${{ secrets.RAILWAY_API_KEY }}
        run: railway login --apiKey $RAILWAY_API_KEY
      - name: Deploy to Railway
        run: railway up --environment production --yes
```

Notes:
- Using the Railway web GitHub integration is easiest — it handles deploys automatically without CI config. The CLI option is useful if you want to run custom build steps or control deployments from Actions.
- Store `LASTFM_API_KEY` either in Railway's environment variables or in GitHub secrets and pass it during the deploy step.
