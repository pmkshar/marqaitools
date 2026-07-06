// Shared ZAI SDK bootstrap.
//
// The `z-ai-web-dev-sdk` ships a file-based config loader (`ZAI.create()`)
// that searches for `.z-ai-config` in: process.cwd(), os.homedir(), /etc/.
// This works in the local sandbox (where /etc/.z-ai-config is provisioned)
// but FAILS on Vercel because none of those paths contain the file.
//
// Resolution strategy:
//   1. Try the file-based loader first (preserves local-dev behaviour).
//   2. If that throws, instantiate ZAI directly from env vars:
//        - ZAI_API_KEY   (required when running on Vercel)
//        - ZAI_BASE_URL  (optional, defaults to public Z.AI API)
//
// On Vercel, set `ZAI_API_KEY` under Project → Settings → Environment Variables.
// Get a key from https://z.ai.

import ZAI from "z-ai-web-dev-sdk";

// Default to the public Z.AI GLM API endpoint. The SDK appends
// `/chat/completions`, `/images/generations`, etc. to this base.
const DEFAULT_BASE_URL = "https://api.z.ai/api/paas/v4";

// The ZAI class declares its constructor as `private` (TypeScript-only
// visibility — JS does not enforce it at runtime). We use an `any` cast
// to construct it directly from env vars, bypassing the file-based
// config loader which expects `.z-ai-config` on disk.
type ZaiInstance = any;
const ZAICtor = ZAI as any;

let cached: ZaiInstance | null = null;
let cachedKey = "";

/**
 * Returns a shared ZAI client. Uses the file-based config when available
 * (local dev), otherwise falls back to env-var-based instantiation
 * (Vercel production).
 */
export async function getZai(): Promise<ZaiInstance> {
  const envKey = process.env.ZAI_API_KEY ?? "";
  const envBaseUrl = process.env.ZAI_BASE_URL ?? DEFAULT_BASE_URL;

  // Cache key: only env-var path is cacheable (file-based path may be
  // mutated between calls in tests). For env-var path, reusing the same
  // instance is safe and avoids re-reading env vars on every request.
  const cacheKey = envKey ? `env:${envBaseUrl}:${envKey.slice(0, 8)}` : "file";
  if (cached && cacheKey === cachedKey) return cached;

  // Strategy 1: file-based loader (works in local sandbox via /etc/.z-ai-config).
  if (!envKey) {
    try {
      cached = await ZAI.create();
      cachedKey = "file";
      return cached;
    } catch (err) {
      // Fall through to env-var strategy — and surface a clear error there.
    }
  }

  // Strategy 2: direct instantiation from env vars.
  if (!envKey) {
    throw new Error(
      "ZAI_API_KEY environment variable is not set. " +
        "Add it in Vercel → Project Settings → Environment Variables. " +
        "Get a key from https://z.ai. " +
        "Local dev: create a .z-ai-config file in the project root."
    );
  }

  cached = new ZAICtor({
    baseUrl: envBaseUrl,
    apiKey: envKey,
  });
  cachedKey = cacheKey;
  return cached;
}

/**
 * Reset the cached client. Useful for tests or when env vars change
 * mid-process (rare in serverless, common in long-running dev).
 */
export function resetZaiCache(): void {
  cached = null;
  cachedKey = "";
}
