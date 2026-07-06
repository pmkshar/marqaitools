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
// Mark as "Sensitive" is fine — sensitive vars ARE exposed to Production and
// Preview deployments, only blocked from local `vercel dev` pulls.
// After adding the env var, you MUST trigger a Redeploy for it to take effect.

import ZAI from "z-ai-web-dev-sdk";

// Default to the public Z.AI GLM-4 API endpoint. The SDK appends
// `/chat/completions`, `/images/generations`, etc. to this base.
// Override with ZAI_BASE_URL env var if you use a different deployment.
const DEFAULT_BASE_URL = "https://api.z.ai/api/paas/v4";

// The ZAI class declares its constructor as `private` (TypeScript-only
// visibility — JS does not enforce it at runtime). We use an `any` cast
// to construct it directly from env vars, bypassing the file-based
// config loader which expects `.z-ai-config` on disk.
type ZaiInstance = any;
const ZAICtor = ZAI as any;

let cached: ZaiInstance | null = null;
let cachedKey = "";

function maskKey(k: string): string {
  if (!k) return "<empty>";
  if (k.length <= 8) return `${k.slice(0, 2)}***`;
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}

/**
 * Returns a shared ZAI client. Uses the file-based config when available
 * (local dev), otherwise falls back to env-var-based instantiation
 * (Vercel production).
 *
 * On failure, throws an Error with a diagnostic message including:
 *   - which strategy was attempted
 *   - the masked API key prefix (first 4 / last 4 chars)
 *   - the base URL
 *   - actionable next steps
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
  // Only attempt when no env var is set, so production never accidentally
  // reads a stale file.
  if (!envKey) {
    try {
      cached = await ZAI.create();
      cachedKey = "file";
      return cached;
    } catch (err) {
      // Fall through to env-var strategy.
    }
  }

  // Strategy 2: direct instantiation from env vars.
  if (!envKey) {
    throw new Error(
      "[ZAI] No API key configured. Set ZAI_API_KEY in Vercel → " +
        "Project Settings → Environment Variables (enable for Production). " +
        "After saving, trigger a Redeploy — env var changes do NOT apply " +
        "to already-built deployments. Get a key from https://z.ai."
    );
  }

  // Sanity-check the key format. Z.AI keys are typically 30+ char alphanumeric.
  // If user pasted something obviously wrong (like the literal string "Z.ai"
  // which is the sandbox placeholder), surface it now.
  if (envKey.length < 20 && envKey.toLowerCase().includes("z.ai")) {
    throw new Error(
      `[ZAI] The ZAI_API_KEY value looks like the sandbox placeholder ` +
        `("${envKey}"), not a real API key. Get a real key from ` +
        `https://z.ai → API Keys. Masked: ${maskKey(envKey)}`
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
 * Returns a diagnostic snapshot of the ZAI config — useful for the
 * /api/debug/zai endpoint. Never exposes the full API key.
 */
export function getZaiDiagnostics() {
  const envKey = process.env.ZAI_API_KEY ?? "";
  const envBaseUrl = process.env.ZAI_BASE_URL ?? DEFAULT_BASE_URL;
  return {
    source: envKey ? "env-var" : "file-loader",
    baseUrl: envBaseUrl,
    keyMasked: maskKey(envKey),
    keyLength: envKey.length,
    hasKey: Boolean(envKey),
    defaultBaseUrl: DEFAULT_BASE_URL,
    usingCustomBaseUrl: envBaseUrl !== DEFAULT_BASE_URL,
    note:
      "If hasKey=false on Vercel Production, the env var is missing or " +
      "not enabled for the Production environment. If hasKey=true but " +
      "requests fail with 401, the key value is wrong or expired.",
  };
}

/**
 * Reset the cached client. Useful for tests or when env vars change
 * mid-process (rare in serverless, common in long-running dev).
 */
export function resetZaiCache(): void {
  cached = null;
  cachedKey = "";
}
