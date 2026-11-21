# Sandy Creative Studio API

A TypeScript/Express API for Sandy Creative Studio.

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

Returns service status and safe boolean flags showing whether OpenAI and OptimAI Router model discovery are configured. It never returns credentials.

### `GET /api/optimai/models`

Performs read-only model discovery through the OptimAI Router `GET /v1/models` endpoint. Requires `OPTIMAI_ROUTER_API_KEY` on the backend host. Returns a filtered list of model IDs and optional public metadata.

This route does not submit inference requests and does not spend OptimAI credits. If the key is missing, it returns HTTP 503. Provider errors are sanitized before being returned to the frontend.

### `POST /api/brief`

Validates input and returns a structured brief without calling an AI model.

### `POST /api/generate`

Continues to use the existing OpenAI Responses API integration, only when both `OPENAI_API_KEY` and `OPENAI_MODEL` are configured. The API key stays server-side.

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

## OptimAI Router configuration

Set these only in the backend host's secret environment:

- `OPTIMAI_ROUTER_BASE_URL=https://api-router.optimai.network/v1`
- `OPTIMAI_ROUTER_API_KEY=<your server-side Router key>`

Do not paste keys into chat, frontend code, GitHub files, or public issue reports. The key is used only for model discovery in this phase.

**Paid OptimAI inference is intentionally not implemented or enabled in this phase.** Any later paid integration needs an adult account holder to review pricing, account eligibility, spending limits, and explicit paid-request permissions before activation. Router credits should not be treated as cash or withdrawable token rewards.

## Production build

```bash
npm run typecheck
npm run build
npm test
npm start
```

## Security

- Set `ALLOWED_ORIGINS` to exact allowed frontend origins, separated by commas.
- Configure provider keys only in the backend host's environment/secret settings.
- Never commit real keys, wallet keys, or access tokens. Never put provider keys in frontend JavaScript.
- Keep the global API rate limit in place. Add user authentication, per-user quotas, usage/cost controls, and redacted request logging before exposing additional AI features publicly.
- OptimAI Core Node provider onboarding is a separate desktop setup; it is not performed by this backend API.
- The frontend reads the backend origin from `config.js` (`window.SANDY_API_BASE_URL`). Keep this as an origin only, without a trailing slash. If it is empty or the backend is unavailable, the UI falls back to the local brief builder.
