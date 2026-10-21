# Sandy Creative Studio

Sandy Creative Studio is a responsive, light-theme workspace for turning creator ideas into structured briefs and AI-assisted creative drafts.

## Live links

- **Website:** https://sandeep0181.github.io/Sandy-Creative-Studio/
- **Backend health:** https://sandy-creative-studio-api.onrender.com/health
- **Repository:** https://github.com/SANDEEP0181/Sandy-Creative-Studio

## Current features

- Responsive light interface with mint/green and soft lavender accents (no black theme)
- Content/social, video concepts, image prompts, and brand/campaign modes
- Configurable platform, language, tone, format, and requested sections
- Copy brief and download as a text file
- Backend API with input validation, request-size limit, rate limiting, security headers, and CORS allowlisting
- Structured local brief endpoint and server-side AI text-generation endpoint
- Frontend backend URL in `config.js`; provider credentials stay on the backend
- Local fallback when the API is unavailable
- GitHub Pages deployment workflow
- Backend build and smoke tests run through GitHub Actions

## Backend setup

The Render service is configured at:

`https://sandy-creative-studio-api.onrender.com`

The health endpoint reports service readiness and whether optional provider settings are present. A healthy endpoint alone does not prove a real generation request succeeded; test generation from the website as part of release verification.

To run locally, use Node.js 20 or newer:

```powershell
cd backend
npm install
npm run dev
```

For a production build and automated tests:

```powershell
cd backend
npm install --include=dev
npm test
```

## API endpoints

- `GET /health` — service status and provider-configuration flags.
- `POST /api/brief` — validates input and returns a structured brief without calling an AI model.
- `POST /api/generate` — calls the configured text-generation provider from the server.

Example generation request:

```json
{
  "idea": "Five helpful technology reel ideas",
  "mode": "video",
  "platform": "Instagram Reels",
  "language": "Hindi",
  "tone": "Cinematic and emotional",
  "format": "15–30 seconds",
  "sections": ["hook", "outline", "visuals", "cta", "seo"]
}
```

## Secrets and safety

- Set `OPENAI_API_KEY` and `OPENAI_MODEL` only in the Render service's environment/secret settings.
- Never commit API keys, `.env` files, wallet keys, or access tokens.
- Keep `ALLOWED_ORIGINS` restricted to the exact deployed frontend origin.
- Review model usage costs and provider limits before sharing the service widely.
- The current `OPTIMAI_API_KEY` flag only detects whether a value exists. **OptimAI Search is not integrated yet**, and the app must not claim that it is.
- The OptimAI x402 workflow may involve paid on-chain requests. Do not enable payment-enabled calls until the official API contract, cost, authentication, and payer security have been reviewed.

## Roadmap and release checklist

- [x] Publish the frontend on GitHub Pages.
- [x] Deploy the Node.js API on Render.
- [x] Configure server-side text generation credentials.
- [x] Add automated backend smoke tests and a CI workflow.
- [ ] Confirm a real `POST /api/generate` succeeds from the live website.
- [ ] Integrate OptimAI Search only after confirming the current official API and authentication contract.
- [ ] Add usage budgets, abuse monitoring, privacy review, and broader automated tests.
- [ ] Select a separate image/video provider if actual media generation is needed; a text brief or image prompt is not itself a rendered image/video.

## Official OptimAI references

- [OptimAI developer getting started](https://docs.optimai.network/docs/builders/get-started/)
- [OptimAI Search quickstart](https://search.optimai.network/docs/quickstart)
- [OptimAI Search security guidance](https://search.optimai.network/docs/security)
- [OptimAI Network GitHub organization](https://github.com/OptimaiNetwork)

Treat prompts and retrieved web content as untrusted input. Review generated content before publishing.
