import { randomUUID } from "node:crypto";
import { z } from "zod";

const DEFAULT_ROUTER_BASE_URL = "https://api-router.optimai.network/v1";

const completionSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string(),
    }).passthrough(),
  }).passthrough()).min(1),
}).passthrough();

/**
 * Paid OptimAI Router text generation.
 * The caller must enforce an explicit enable flag and approved credit ceiling.
 * This function never retries: uncertain requests must be reconciled by idempotency ID.
 */
export async function generateOptimAICompletion(input: {
  model: string;
  prompt: string;
  maxChargeCredits: string;
}): Promise<string> {
  const apiKey = process.env.OPTIMAI_ROUTER_API_KEY;
  if (!apiKey) throw new Error("OPTIMAI_ROUTER_NOT_CONFIGURED");

  if (!/^\d+\.\d{6}$/.test(input.maxChargeCredits)) {
    throw new Error("OPTIMAI_CREDIT_CEILING_INVALID");
  }
  const ceiling = Number(input.maxChargeCredits);
  if (!Number.isFinite(ceiling) || ceiling <= 0 || ceiling > 5) {
    throw new Error("OPTIMAI_CREDIT_CEILING_INVALID");
  }

  const baseUrl = (process.env.OPTIMAI_ROUTER_BASE_URL || DEFAULT_ROUTER_BASE_URL).replace(/\/+$/, "");
  const requestId = randomUUID();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": requestId,
        "X-Max-Charge-Credits": input.maxChargeCredits,
      },
      body: JSON.stringify({
        model: input.model,
        messages: [{ role: "user", content: input.prompt }],
        max_tokens: 512,
        stream: false,
      }),
      signal: AbortSignal.timeout(100_000),
    });
  } catch {
    // Do not retry with a new UUID: the Router may have accepted the original request.
    throw new Error("OPTIMAI_ROUTER_UNAVAILABLE");
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const errorSchema = z.object({
      error: z.object({
        code: z.string().optional(),
      }).passthrough(),
    }).passthrough();
    const parsed = errorSchema.safeParse(payload);
    const code = parsed.success ? parsed.data.error.code || "unknown" : "unknown";
    throw new Error(`OPTIMAI_ROUTER_HTTP_${response.status}_${code}`);
  }

  const payload: unknown = await response.json().catch(() => null);
  const parsed = completionSchema.safeParse(payload);
  if (!parsed.success) throw new Error("OPTIMAI_ROUTER_INVALID_RESPONSE");

  const output = parsed.data.choices[0]?.message.content;
  if (!output.trim()) throw new Error("OPTIMAI_ROUTER_EMPTY_RESPONSE");
  return output.trim();
}
