import { z } from "zod";

const DEFAULT_ROUTER_BASE_URL = "https://api-router.optimai.network/v1";

const modelListSchema = z.object({
  data: z.array(z.object({
    id: z.string().min(1),
    object: z.string().optional(),
    owned_by: z.string().optional(),
  }).passthrough()),
}).passthrough();

export type OptimAIModel = {
  id: string;
  object?: string;
  ownedBy?: string;
};

/**
 * Read-only access to the OptimAI Router model catalog.
 * This adapter intentionally does not submit inference requests or spend credits.
 */
export async function listOptimAIModels(): Promise<OptimAIModel[]> {
  const apiKey = process.env.OPTIMAI_ROUTER_API_KEY;
  if (!apiKey) throw new Error("OPTIMAI_ROUTER_NOT_CONFIGURED");

  const baseUrl = (process.env.OPTIMAI_ROUTER_BASE_URL || DEFAULT_ROUTER_BASE_URL).replace(/\/+$/, "");

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error("OPTIMAI_ROUTER_TIMEOUT");
    }
    throw new Error("OPTIMAI_ROUTER_UNAVAILABLE");
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("OPTIMAI_ROUTER_AUTH_ERROR");
  }
  if (!response.ok) throw new Error("OPTIMAI_ROUTER_UNAVAILABLE");

  const payload: unknown = await response.json().catch(() => null);
  const parsed = modelListSchema.safeParse(payload);
  if (!parsed.success) throw new Error("OPTIMAI_ROUTER_UNAVAILABLE");

  return parsed.data.data.map((model) => ({
    id: model.id,
    ...(model.object ? { object: model.object } : {}),
    ...(model.owned_by ? { ownedBy: model.owned_by } : {}),
  }));
}
