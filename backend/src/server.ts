import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import { listOptimAIModels } from "./providers/optimai.js";
import { generateOptimAICompletion } from "./providers/optimai-generation.js";

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
  modelId: z.string().trim().min(1).max(200).optional(),
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
    version: "0.3.0",
    textGenerationConfigured: Boolean(process.env.OPTIMAI_ROUTER_API_KEY && process.env.OPTIMAI_DEFAULT_MODEL),
    optimaiRouterConfigured: Boolean(process.env.OPTIMAI_ROUTER_API_KEY),
    optimaiModelDiscoveryEnabled: Boolean(process.env.OPTIMAI_ROUTER_API_KEY),
    optimaiPaidGenerationEnabled: process.env.OPTIMAI_PAID_GENERATION_ENABLED === "true",
  });
});

// Read-only Router model discovery. This endpoint does not submit paid inference requests.
app.get("/api/optimai/models", async (_req, res) => {
  if (!process.env.OPTIMAI_ROUTER_API_KEY) {
    return res.status(503).json({
      error: "OptimAI Router model discovery is not configured. Add the Router API key to the backend host environment.",
      code: "OPTIMAI_ROUTER_NOT_CONFIGURED",
    });
  }

  try {
    const models = await listOptimAIModels();
    return res.json({ ok: true, provider: "optimai-router", models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const timedOut = message === "OPTIMAI_ROUTER_TIMEOUT";
    const rejected = message === "OPTIMAI_ROUTER_AUTH_ERROR";
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? "OptimAI Router model discovery timed out. Please try again later."
        : rejected
          ? "OptimAI Router rejected the server credentials. Check the backend configuration."
          : "OptimAI Router model discovery is temporarily unavailable.",
      code: timedOut ? "OPTIMAI_ROUTER_TIMEOUT" : rejected ? "OPTIMAI_ROUTER_AUTH_ERROR" : "OPTIMAI_ROUTER_UNAVAILABLE",
    });
  }
});

// Validate a selected model against the live read-only catalogue.
// This endpoint never submits inference and never spends Router credits.
app.post("/api/optimai/validate-model", async (req, res) => {
  const parsed = z.object({
    modelId: z.string().trim().min(1).max(200),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "A valid modelId is required.",
      code: "OPTIMAI_MODEL_ID_INVALID",
    });
  }

  if (!process.env.OPTIMAI_ROUTER_API_KEY) {
    return res.status(503).json({
      error: "OptimAI Router model discovery is not configured.",
      code: "OPTIMAI_ROUTER_NOT_CONFIGURED",
    });
  }

  try {
    const models = await listOptimAIModels();
    const selected = models.find((model) => model.id === parsed.data.modelId);
    if (!selected) {
      return res.status(404).json({
        error: "The selected model is not present in the current OptimAI Router catalogue. Refresh the list and choose again.",
        code: "OPTIMAI_MODEL_NOT_FOUND",
      });
    }

    return res.json({
      ok: true,
      provider: "optimai-router",
      selectedModel: selected,
      inferenceEnabled: false,
      billingTriggered: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const timedOut = message === "OPTIMAI_ROUTER_TIMEOUT";
    const rejected = message === "OPTIMAI_ROUTER_AUTH_ERROR";
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? "OptimAI Router model validation timed out. Please try again."
        : rejected
          ? "OptimAI Router rejected the server credentials. Check the backend configuration."
          : "OptimAI Router model validation is temporarily unavailable.",
      code: timedOut ? "OPTIMAI_ROUTER_TIMEOUT" : rejected ? "OPTIMAI_ROUTER_AUTH_ERROR" : "OPTIMAI_ROUTER_UNAVAILABLE",
    });
  }
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

// Free preflight: validates request and selected model without submitting inference or spending credits.
app.post("/api/generate/preflight", async (req, res) => {
  const parsed = briefSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid preflight input",
      code: "OPTIMAI_PREFLIGHT_INPUT_INVALID",
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      billingTriggered: false,
    });
  }

  if (!process.env.OPTIMAI_ROUTER_API_KEY) {
    return res.status(503).json({
      error: "OptimAI Router is not configured for read-only model validation.",
      code: "OPTIMAI_ROUTER_NOT_CONFIGURED",
      billingTriggered: false,
    });
  }

  const modelId = parsed.data.modelId || process.env.OPTIMAI_DEFAULT_MODEL;
  if (!modelId) {
    return res.status(503).json({
      error: "Choose a model or configure OPTIMAI_DEFAULT_MODEL before running the free setup test.",
      code: "OPTIMAI_MODEL_NOT_SELECTED",
      billingTriggered: false,
    });
  }

  try {
    const models = await listOptimAIModels();
    const selectedModel = models.find((model) => model.id === modelId);
    if (!selectedModel) {
      return res.status(404).json({
        error: "The selected model is not in the current OptimAI Router catalogue. Refresh the catalogue and choose another model.",
        code: "OPTIMAI_MODEL_NOT_FOUND",
        billingTriggered: false,
      });
    }

    return res.json({
      ok: true,
      provider: "optimai-router",
      selectedModel,
      requestValidated: true,
      modelAvailable: true,
      inferenceEnabled: false,
      billingTriggered: false,
      message: "Free setup test passed. No AI inference was submitted and no credits were spent.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const timedOut = message === "OPTIMAI_ROUTER_TIMEOUT";
    const rejected = message === "OPTIMAI_ROUTER_AUTH_ERROR";
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? "OptimAI Router model validation timed out. Please try again."
        : rejected
          ? "OptimAI Router rejected the server credentials. Check the backend configuration."
          : "OptimAI Router model validation is temporarily unavailable.",
      code: timedOut ? "OPTIMAI_ROUTER_TIMEOUT" : rejected ? "OPTIMAI_ROUTER_AUTH_ERROR" : "OPTIMAI_ROUTER_UNAVAILABLE",
      billingTriggered: false,
    });
  }
});

// OptimAI Router is the primary text-generation provider. Paid inference is OFF by default.
app.post("/api/generate", async (req, res) => {
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

  // This hard gate prevents accidental paid requests until an account owner has reviewed
  // the Router key, selected model, and per-request credit ceiling.
  if (process.env.OPTIMAI_PAID_GENERATION_ENABLED !== "true") {
    return res.status(503).json({
      error: "OptimAI Router is selected as the primary provider, but paid inference is currently disabled. The model catalogue and validation remain available without spending credits.",
      code: "OPTIMAI_INFERENCE_DISABLED",
      provider: "optimai-router",
      billingTriggered: false,
    });
  }

  const modelId = parsed.data.modelId || process.env.OPTIMAI_DEFAULT_MODEL;
  const maxChargeCredits = process.env.OPTIMAI_MAX_CHARGE_CREDITS;
  if (!process.env.OPTIMAI_ROUTER_API_KEY || !modelId || !maxChargeCredits) {
    return res.status(503).json({
      error: "OptimAI generation configuration is incomplete. The server requires its Router key, a selected default model, and an approved per-request credit ceiling.",
      code: "OPTIMAI_GENERATION_NOT_CONFIGURED",
    });
  }

  try {
    const models = await listOptimAIModels();
    if (!models.some((model) => model.id === modelId)) {
      return res.status(400).json({
        error: "The selected OptimAI model is not in the current live catalogue. Refresh the model list and choose an available model.",
        code: "OPTIMAI_MODEL_NOT_FOUND",
      });
    }

    const output = await generateOptimAICompletion({
      model: modelId,
      prompt: buildPrompt(parsed.data),
      maxChargeCredits,
    });

    return res.json({
      ok: true,
      mode: parsed.data.mode,
      provider: "optimai-router",
      model: modelId,
      generatedBy: "optimai-router",
      aiGenerationEnabled: true,
      output,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message.startsWith("OPTIMAI_ROUTER_HTTP_") ? 502 : 503;
    return res.status(status).json({
      error: message.startsWith("OPTIMAI_ROUTER_HTTP_")
        ? "OptimAI Router could not complete this generation request. Check the selected model, availability, and Router response details."
        : "OptimAI Router is temporarily unavailable. Please try again later.",
      code: message.startsWith("OPTIMAI_ROUTER_HTTP_") ? "OPTIMAI_GENERATION_FAILED" : "OPTIMAI_ROUTER_UNAVAILABLE",
    });
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
