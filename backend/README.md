# Sandy Creative Studio API

A minimal TypeScript/Express API foundation for the studio.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

From this directory:

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

The development server defaults to `http://localhost:8787`.

## Endpoints

### `GET /health`

Returns service status and whether an AI provider is configured. Currently `aiProviderConfigured` is `false`.

### `POST /api/brief`

Validates input and returns a structured brief. This is not AI generation; it does not call OptimAI or another model provider.

Example request:

```json
{
  "idea": "A short Hindi video explaining useful AI tools for creators",
  "mode": "video",
  "platform": "YouTube",
  "language": "Hindi",
  "tone": "Educational",
  "format": "Short video · 30–60 sec",
  "sections": ["hook", "outline", "visuals", "seo"]
}
```

Valid modes: `content`, `video`, `image`, `brand`.

Valid sections: `hook`, `outline`, `visuals`, `cta`, `seo`.

## Production build

```bash
npm run typecheck
npm run build
npm start
```

## Configuration and security

- Set `ALLOWED_ORIGINS` to exact allowed frontend origins, separated by commas.
- Keep real credentials in the hosting provider's secret/environment settings. Never place them in frontend code or commit them.
- Configure provider-specific environment variables only after implementing and reviewing a real provider adapter.
- The example `OPTIMAI_API_KEY` variable is reserved and is not used by the current code.
- Add authentication, per-user quotas, request logging with sensitive-data redaction, and automated tests before exposing paid AI features publicly.
