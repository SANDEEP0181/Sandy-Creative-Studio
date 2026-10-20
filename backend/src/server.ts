import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
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
app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server and local command-line requests without an Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json({ limit: "20kb", strict: true }));
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait a minute and try again." },
  }),
);

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
  image: "Describe subject, composition, lighting, palette, and visual style for an image-generation prompt.",
  brand: "Define a consistent campaign direction, audience, message, and brand voice.",
} as const;

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sandy-creative-studio-api",
    version: "0.1.0",
    aiProviderConfigured: false,
  });
});

// This endpoint structures a brief only; it does not claim to call an AI model.
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
  const sections: Record<(typeof input.sections)[number], string> = {
    hook: "Suggest 3 distinct opening options that earn attention without misleading clickbait.",
    outline: "Provide a logical outline with the main message, supporting points, and a clear ending.",
    visuals: "Suggest visual direction, framing, pacing, on-screen text, and a consistent style.",
    cta: "Suggest one natural, platform-appropriate next step for the audience.",
    seo: "Suggest a relevant title, short description, keywords, and hashtags where appropriate.",
  };

  const requestedSections = input.sections.map((key) => `- ${key.toUpperCase()}: ${sections[key]}`);
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
    "This brief was structured by the API. AI generation and OptimAI Search are not connected yet.",
  ].join("\n");

  return res.json({
    ok: true,
    mode: input.mode,
    generatedBy: "local-brief-builder",
    aiGenerationEnabled: false,
    brief,
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError) {
    return res.status(400).json({ error: "Invalid JSON request body" });
  }
  if (!res.headersSent) {
    return res.status(500).json({
      error: isProduction ? "Internal server error" : String(error.message ?? error),
    });
  }
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Sandy Creative Studio API listening on port ${port}`);
});