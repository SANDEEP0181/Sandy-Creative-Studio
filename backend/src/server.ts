import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.ALLOWED_ORIGINS ??
  "http://localhost:8787,http://127.0.0.1:5500,https://sandeep0181.github.io")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "20kb", strict: true }));
app.use(rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute and try again." },
}));

const briefSchema = z.object({
  idea: z.string().trim().min(3).max(2_000),
  mode: z.enum(["content", "video", "image", "brand"]).default("content"),
  platform: z.string().trim().min(1).max(80).default("Multi-platform"),
  language: z.string().trim().min(1).max(60).default("English"),
  tone: z.string().trim().min(1).max(80).default("Professional"),
  format: z.string().trim().min(1).max(100).default("Short-form"),
  sections: z.array(z.enum(["hook", "outline", "visuals", "cta", "seo"])).max(5).default(["hook", "outline", "visuals"]),
});

const modeGoals = {
  content: "Create useful, engaging content suited to the intended audience.",
  video: "Develop a video concept with a clear opening, coherent pacing, and a satisfying ending.",
  image: "Write a detailed image-generation prompt describing subject, composition, lighting, palette, and style. Do not claim to render an image.",
  brand: "Define a consistent campaign direction, audience, message, and brand voice.",
} as const;

const sectionInstructions = {
  hook: "Suggest 3 distinct opening options that earn attention without misleading clickbait.",
  outline: "Provide a logical outline with the main message, supporting points, and a clear ending.",
  visuals: "Suggest visual direction, framing, pacing, on-screen text, and a consistent style.",
  cta: "Suggest one natural, platform-appropriate next step for the audience.",
  seo: "Suggest a relevant title, short description, keywords, and hashtags where appropriate.",
} as const;

function buildPrompt(input: z.infer<typeof briefSchema>): string {
  const requested = input.sections.map((key) => `- ${key.toUpperCase()}: ${sectionInstructions[key]}`).join("\n");
  return [
    "You are the creative assistant inside Sandy Creative Studio.",
    "Create an original, useful output. Do not invent factual claims; flag claims that need checking.",
    "Follow the user's language and platform. Avoid deceptive engagement bait.",
    "",
    `MODE: ${input.mode}`,
    `GOAL: ${modeGoals[input.mode]}`,
    `PLATFORM: ${input.platform}`,
    `LANGUAGE: ${input.language}`,
    `TONE: ${input.tone}`,
    `FORMAT: ${input.format}`,
    "",
    "USER IDEA:",
    input.idea,
    "",
    "INCLUDE THESE SECTIONS:",
    requested || "- Use the most useful sections for the request.",
  ].join("\n");
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sandy-creative-studio-api",
    version: "0.2.0",
    textGenerationConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL),
    optimaiSearchConfigured: Boolean(process.env.OPTIMAI_API_KEY),
  });
});

// Structured fallback: this endpoint does not call a model.
app.post("/api/brief", (req, res) => {
  const parsed = briefSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid brief input",
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const input = parsed.data;
  const requestedSections = input.sections.map((key) => `- ${key.toUpperCase()}: ${sectionInstructions[key]}`);
  const brief = [
    "SANDY CREATIVE STUDIO — CREATIVE BRIEF",
    "",
    "PROJECT IDEA",
    input.idea,
    "",
    "CREATIVE DIRECTION",
    `- Mode: ${input.mode}`,
    `- Goal: ${modeGoals[input.mode]}`,
    `- Platform: ${input.platform}`,
    `- Language: ${input.language}`,
    `- Tone: ${input.tone}`,
    `- Format: ${input.format}`,
    "",
    "REQUESTED SECTIONS",
    ...(requestedSections.length ? requestedSections : ["- No optional sections selected."]),
    "",
    "QUALITY CHECK",
    "- Keep the result original, relevant, and appropriate for the selected platform.",
    "- Do not invent facts; identify assumptions and verify factual claims.",
    "- Review the output before publishing.",
    "",
    "STATUS",
    "This brief was structured locally. To generate AI content, configure the server-side text provider.",
  ].join("\n");

  return res.json({ ok: true, mode: input.mode, generatedBy: "local-brief-builder", aiGenerationEnabled: false, brief });
});

// Text generation uses a server-side API key. The key is never sent to the browser.
app.post("/api/generate", async (req, res, next) => {
  const parsed = briefSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid generation input",
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    return res.status(503).json({
      error: "AI generation is not configured yet. Set OPENAI_API_KEY and OPENAI_MODEL in the backend host environment.",
      code: "AI_PROVIDER_NOT_CONFIGURED",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: buildPrompt(parsed.data),
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      // Read only the provider's structured error code. Never return its raw body or secrets.
      if (response.status === 429) {
        const providerPayload: unknown = await response.json().catch(() => null);
        const providerErrorSchema = z.object({
          error: z.object({
            code: z.union([z.string(), z.null()]).optional(),
            type: z.union([z.string(), z.null()]).optional(),
          }).passthrough(),
        }).passthrough();
        const parsedProviderError = providerErrorSchema.safeParse(providerPayload);
        const providerCode = parsedProviderError.success
          ? String(parsedProviderError.data.error.code ?? parsedProviderError.data.error.type ?? "").toLowerCase()
          : "";
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfterHeader && /^\d+$/.test(retryAfterHeader.trim())
          ? Number(retryAfterHeader.trim())
          : undefined;

        if (["rate_limit_exceeded", "slow_down", "rate_limit_error"].includes(providerCode)) {
          return res.status(429).json({
            error: "The AI request rate limit was reached. Wait before trying again.",
            code: "AI_RATE_LIMITED",
            ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
          });
        }
        if (["insufficient_quota", "credit_balance_exhausted"].includes(providerCode)) {
          return res.status(429).json({
            error: "The AI provider reports that this API organization or project has no available quota or credits. Check the selected organization and project billing.",
            code: "AI_QUOTA_OR_CREDITS_EXHAUSTED",
          });
        }
        if ([
          "organization_usage_limit_exceeded",
          "organization_spend_limit_exceeded",
          "project_spend_limit_exceeded",
          "usage_limit_exceeded",
        ].includes(providerCode)) {
          return res.status(429).json({
            error: "The AI provider reports that an organization or project usage limit was reached. Check the limits for the organization and project used by this API key.",
            code: "AI_USAGE_LIMIT_REACHED",
          });
        }
        return res.status(429).json({
          error: "The AI provider returned a quota or rate-limit error. Check the backend's API organization, project, model access, and Limits page.",
          code: "AI_PROVIDER_429",
          ...(providerCode ? { providerCode } : {}),
          ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
        });
      }
      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({ error: "The server-side AI provider credentials were rejected. Check the backend configuration." });
      }
      return res.status(502).json({ error: "The AI provider could not complete this request." });
    }

    const payload: unknown = await response.json();
    const outputText = z.object({
      output_text: z.string().optional(),
    }).passthrough().parse(payload).output_text;

    if (!outputText?.trim()) {
      return res.status(502).json({ error: "The AI provider returned no text output." });
    }

    return res.json({
      ok: true,
      mode: parsed.data.mode,
      generatedBy: "configured-text-provider",
      aiGenerationEnabled: true,
      output: outputText.trim(),
    });
  } catch (error) {
    return next(error);
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

const errorHandler: ErrorRequestHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof SyntaxError) {
    return res.status(400).json({ error: "Invalid JSON request body" });
  }
  if (!res.headersSent) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return res.status(timedOut ? 504 : 500).json({
      error: timedOut ? "The AI request timed out. Please try again." : (isProduction ? "Internal server error" : String(error.message ?? error)),
    });
  }
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Sandy Creative Studio API listening on port ${port}`);
});
