# Sandy Creative Studio API

A minimal TypeScript/Express API foundation for the studio.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

From this directory:

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

On macOS/Linux, use `cp .env.example .env` instead of `Copy-Item`.

The development server defaults to `http://localhost:8787`.

## Endpoints

### `GET /health`

Returns service status, whether the optional text-generation provider is configured, and whether an OptimAI key is present. The OptimAI key is only detected; OptimAI Search is not yet connected.

### `POST /api/brief`

Validates input and returns a structured brief without calling an AI model.

### `POST /api/generate`

Calls the OpenAI Responses API from the server, only when both `OPENAI_API_KEY` and `OPENAI_MODEL` are configured. The API key stays server-side.

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

If provider configuration is missing, `/api/generate` returns HTTP 503 and does not pretend to generate content.

## Production build

```bash
npm run typecheck
npm run build
npm start
```

## Configuration and security

- Set `ALLOWED_ORIGINS` to exact allowed frontend origins, separated by commas.
- Configure `OPENAI_API_KEY` and `OPENAI_MODEL` only in the backend host's environment/secret settings.
- Never commit real keys, wallet keys, or access tokens. Never put provider keys in frontend JavaScript.
- The current `OPTIMAI_API_KEY` setting is reserved and is not used by an OptimAI adapter yet.
- Add authentication, per-user quotas, usage/cost limits, request logging with sensitive-data redaction, and automated tests before exposing paid AI features publicly.
- The static GitHub Pages frontend does not yet call this backend automatically. Deploy the API and wire its base URL into the frontend before using it from the live website.
