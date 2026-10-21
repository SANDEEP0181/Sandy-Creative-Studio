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
      OPTIMAI_API_KEY: "",
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

test("health endpoint reports the service and disabled optional providers", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "sandy-creative-studio-api");
  assert.equal(body.textGenerationConfigured, false);
  assert.equal(body.optimaiSearchConfigured, false);
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

test("generation fails safely when provider secrets are not configured", async () => {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idea: "Write a helpful technology reel", language: "Hindi" }),
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.code, "AI_PROVIDER_NOT_CONFIGURED");
});

test("unknown routes return JSON 404", async () => {
  const response = await fetch(`${baseUrl}/not-a-real-route`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error, "Route not found");
});
