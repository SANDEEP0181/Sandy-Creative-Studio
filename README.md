# Sandy Creative Studio

A responsive creator workspace for shaping ideas into structured creative briefs and reusable prompts.

## Current features

- Responsive dark interface for mobile and desktop
- Content/social, video, image-prompt, and brand-campaign modes
- Configurable platform, language, tone, format, and brief sections
- Copy-to-clipboard and `.txt` export
- No build step or API key required for the local prompt-builder experience

## Important scope note

This repository currently provides a **front-end starter and prompt builder**. It does not yet generate AI images, videos, or final copy by itself. Do not enter API keys into `index.html` or any browser-side JavaScript.

OptimAI's current public builder documentation describes Search MCP, Search API, and the x402 SDK as public integration paths. Those are not automatically a general-purpose image/video-generation SDK. Review the official docs before adding a provider adapter:

- [OptimAI developer getting started](https://docs.optimai.network/docs/builders/get-started/)
- [OptimAI Search quickstart](https://search.optimai.network/docs/quickstart)
- [Official OptimAI GitHub organization](https://github.com/OptimaiNetwork)

## Run locally

Open `index.html` in a modern browser. No package installation is required.

## Publish with GitHub Pages

This repository includes a GitHub Actions workflow that publishes the static site. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the build/deployment source if it is not already selected. Then open **Actions** and inspect the `Deploy static site to GitHub Pages` workflow.

After a successful deployment, the site should be available at:

`https://sandeep0181.github.io/Sandy-Creative-Studio/`

GitHub Pages availability depends on repository Pages settings and workflow permissions.

## Planned next steps

1. Add a server-side provider adapter for text generation.
2. Add an optional OptimAI Search MCP integration for source-backed research, keeping credentials on the server.
3. Add job status, error handling, rate limits, input validation, and tests.
4. Add image/video providers only after choosing an appropriate supported API and reviewing its terms.
5. Add persistence and user accounts only when there is a clear privacy and security design.

## Security

- Never commit `.env` files, API keys, private keys, or access tokens.
- Keep provider secrets in server environment variables.
- Treat generated text and retrieved web content as untrusted input.
- Review costs, usage limits, data handling, and provider terms before enabling live generation.
