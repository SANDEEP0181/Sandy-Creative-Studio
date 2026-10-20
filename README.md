# Sandy Creative Studio

A responsive creator workspace for turning ideas into structured creative briefs, with a secure API starter in `backend/`.

## Current features

- Responsive dark interface for mobile and desktop
- Content/social, video, image-prompt, and brand-campaign modes
- Configurable platform, language, tone, format, and brief sections
- Copy-to-clipboard and `.txt` export
- TypeScript API starter with request validation, rate limiting, security headers, and CORS allowlisting
- API health, structured-brief, and optional server-side AI text-generation endpoints
- Frontend API URL kept in `config.js`; provider secrets remain on the backend
- Local brief-builder fallback works without API configuration

## Live website

After a successful GitHub Pages deployment:

`https://sandeep0181.github.io/Sandy-Creative-Studio/`

## Backend deployment

A Render Blueprint is included in `render.yaml`.

1. Open [Render Blueprints](https://dashboard.render.com/blueprints) and create a Blueprint from this GitHub repository.
2. Review the proposed `sandy-creative-studio-api` web service and deploy it. The Blueprint does not create a database.
3. After deployment, open the service URL and confirm `/health` returns `"status":"ok"`.
4. In `config.js`, set `window.SANDY_API_BASE_URL` to the deployed service origin (for example, `https://your-service.onrender.com`, without a trailing slash), then commit the change. GitHub Pages will redeploy the frontend.
5. To enable AI text generation, add `OPENAI_API_KEY` and `OPENAI_MODEL` in the Render service environment settings. Never put those values in `config.js`.

See [backend/README.md](backend/README.md) for endpoint details and configuration.

The backend can call the OpenAI Responses API for text generation only when `OPENAI_API_KEY` and `OPENAI_MODEL` are configured in the backend host. Without those settings, the website continues to provide its local structured-brief fallback. OptimAI Search is not connected yet.

## OptimAI integration scope

The official OptimAI builder documentation currently describes OptimAI Search MCP, Search API, and the x402 SDK for source-backed search and agent workflows. These are not automatically a general-purpose image/video generation API. The planned integration is to use OptimAI Search for research-backed context and citations, while selecting a separate supported text/image/video provider if those generation capabilities are needed.

- [OptimAI developer getting started](https://docs.optimai.network/docs/builders/get-started/)
- [OptimAI Search quickstart](https://search.optimai.network/docs/quickstart)
- [OptimAI Search security guidance](https://search.optimai.network/docs/security)
- [Official OptimAI GitHub organization](https://github.com/OptimaiNetwork)

## Security notes

- Never commit `.env` files, API keys, wallet keys, or access tokens.
- Keep provider credentials in backend environment variables or a secret manager.
- The x402 SDK can involve paid on-chain requests and a payer wallet; do not enable it without reviewing costs and security requirements.
- Treat user prompts and retrieved web content as untrusted input.
- Review provider terms, data handling, and usage limits before enabling live generation.

## Roadmap

1. Deploy the backend to a server runtime and configure the frontend API URL.
2. Add an official OptimAI Search adapter after confirming the supported API contract and authentication flow.
3. Add a separate text-generation provider adapter, with quotas and clear user feedback.
4. Add image/video providers only after selecting suitable supported APIs.
5. Add automated tests, monitoring, and privacy review before production use.
