import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 18_700 + Math.floor(Math.random() * 500);
const baseUrl = `http://127.0.0.1:${port}`;
let child;

before(async () => {
  child = spawn(process.execPath, ["dist/server.js"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "test",
      OPENAI_API_KEY: "",
      OPENAI_MODEL: "",
      OPTIMAI_ROUTER_API_KEY: "",
      OPTIMAI_ROUTER_BASE_URL: "https://api-router.optimai.network/v1",
      ALLOWED_ORIGINS: baseUrl,
    },
    stdio: "ignore",
  });

  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`API exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("API did not become ready within 12 seconds");
});

after(() => {
  if (child && child.exitCode === null) child.kill("SIGTERM");
});

test("health endpoint reports service and provider configuration safely", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "sandy-creative-studio-api");
  assert.equal(body.textGenerationConfigured, false);
  assert.equal(body.optimaiRouterConfigured, false);
  assert.equal(body.optimaiModelDiscoveryEnabled, false);
  assert.equal(body.optimaiPaidGenerationEnabled, false);
});

test("OptimAI model discovery fails safely when no Router key is configured", async () => {
  const response = await fetch(`${baseUrl}/api/optimai/models`);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.code, "OPTIMAI_ROUTER_NOT_CONFIGURED");
});

test("brief endpoint validates and returns a structured local brief", async () => {
  const response = await fetch(`${baseUrl}/api/brief`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      idea: "Five helpful technology reel ideas",
      mode: "video",
      platform: "Instagram Reels",
      language: "Hindi",
      tone: "Cinematic and emotional",
      format: "15–30 seconds",
      sections: ["hook", "outline", "visuals", "cta", "seo"],
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.generatedBy, "local-brief-builder");
  assert.match(body.brief, /Five helpful technology reel ideas/);
});

test("invalid brief input returns HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/brief`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idea: "x", mode: "unknown" }),
  });
  assert.equal(response.status, 400);
});

test("free creator pack returns a local Reel script without calling a provider", async () => {
  const response = await fetch(`${baseUrl}/api/free/creator-pack`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      idea: "Simple digital safety tips",
      mode: "content",
      platform: "Instagram Reels",
      language: "Hindi",
      tone: "Friendly and simple",
      format: "Short-form · 15–30 sec",
      sections: ["hook", "outline", "visuals", "cta", "seo"],
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.generatedBy, "local-template-engine");
  assert.equal(body.aiGenerationEnabled, false);
  assert.equal(body.providerCalled, false);
  assert.equal(body.billingTriggered, false);
  assert.match(body.pack, /THREE HOOK OPTIONS/);
  assert.match(body.pack, /SHORT REEL SCRIPT/);
  assert.match(body.pack, /Scene 1/);
  assert.match(body.pack, /Hindi/);
});

test("free generation preflight never submits inference when Router credentials are absent", async () => {
  const response = await fetch(`${baseUrl}/api/generate/preflight`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idea: "Prepare a free setup check", language: "Hindi", modelId: "qwen3.5:9b" }),
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.code, "OPTIMAI_ROUTER_NOT_CONFIGURED");
  assert.equal(body.billingTriggered, false);
});

test("generation stays disabled safely until paid OptimAI inference is explicitly enabled", async () => {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idea: "Write a helpful technology reel", language: "Hindi" }),
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.code, "OPTIMAI_INFERENCE_DISABLED");
  assert.equal(body.provider, "optimai-router");
  assert.equal(body.billingTriggered, false);
});

test("unknown routes return JSON 404", async () => {
  const response = await fetch(`${baseUrl}/not-a-real-route`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error, "Route not found");
});
