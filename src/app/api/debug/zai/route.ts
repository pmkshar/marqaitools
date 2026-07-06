// GET /api/debug/zai
// Diagnostic endpoint — checks ZAI configuration and runs a tiny
// echo chat completion to verify the API key + base URL work end-to-end.
// Safe to expose: only returns masked key info, never the full key.
//
// Also returns the FULL raw response object from the Z.AI API so you
// can see exactly what shape it returns — useful for diagnosing cases
// where the call succeeds but content extraction fails.
import { NextResponse } from "next/server";
import { getZai, getZaiDiagnostics, resetZaiCache } from "@/lib/zai";
import { extractChatContent } from "@/lib/zai-response";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const diag = getZaiDiagnostics();
  const result: any = {
    ok: false,
    timestamp: new Date().toISOString(),
    config: diag,
    connectivity: null as any,
    error: null as any,
  };

  // Don't attempt the call if there's no key.
  if (!diag.hasKey) {
    result.error = {
      kind: "missing-key",
      message:
        "ZAI_API_KEY is not set in this environment. On Vercel: Project → " +
        "Settings → Environment Variables → add ZAI_API_KEY, enable for " +
        "Production, then Redeploy (env vars don't apply to existing builds).",
    };
    return NextResponse.json(result, { status: 200 });
  }

  // Attempt a tiny chat completion to verify the key + endpoint.
  resetZaiCache();
  try {
    const zai = await getZai();
    const raw = await zai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a connectivity-test bot. Reply with exactly: PONG" },
        { role: "user", content: "ping" },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    // Defensive extraction — shows which path worked.
    const extracted = extractChatContent(raw);

    result.connectivity = {
      status: extracted.error ? "error" : "ok",
      httpOk: true,
      replyPreview: extracted.content.slice(0, 100),
      contentShape: extracted.shape,
      contentLength: extracted.content.length,
      extractionError: extracted.error,
      rawResponsePreview: extracted.rawPreview,
      rawResponseKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      rawResponseFirstChoice: raw?.choices?.[0] ?? raw?.data?.choices?.[0] ?? null,
    };
    result.ok = !extracted.error && extracted.content.trim().length > 0;
    if (!result.ok) {
      result.error = {
        kind: "extraction-failed",
        message: extracted.error ?? "Content extracted but empty",
        hint:
          "The API call succeeded (HTTP 200) but the response shape isn't recognized. " +
          "Check rawResponsePreview and rawResponseKeys to see what the API actually returned. " +
          "If the shape is new, update src/lib/zai-response.ts to handle it.",
      };
    }
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    result.connectivity = { status: "error", httpOk: false };
    result.error = {
      kind: "request-failed",
      message: msg,
      hint: classifyError(msg),
    };
  }

  return NextResponse.json(result, { status: 200 });
}

function classifyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("401") || m.includes("unauthorized")) {
    return "API key is invalid, expired, or wrong for this base URL. " +
      "Double-check the key at https://z.ai → API Keys. " +
      "If using a non-default ZAI_BASE_URL, ensure the key matches that deployment.";
  }
  if (m.includes("403") || m.includes("forbidden")) {
    return "API key is valid but lacks permission for this model. " +
      "Check your Z.ai plan includes chat-completions access.";
  }
  if (m.includes("404")) {
    return "Base URL is wrong — endpoint not found. " +
      "Check ZAI_BASE_URL. Default is https://api.z.ai/api/paas/v4. " +
      "If you're in China, try https://open.bigmodel.cn/api/paas/v4.";
  }
  if (m.includes("fetch") || m.includes("network") || m.includes("timeout")) {
    return "Network error reaching the Z.AI API. " +
      "Could be a DNS / egress issue from the Vercel region. " +
      "Try a different ZAI_BASE_URL or contact Z.AI support.";
  }
  if (m.includes("rate limit") || m.includes("429")) {
    return "Rate limited. Wait a minute and retry, or upgrade your Z.AI plan.";
  }
  return "Unexpected error. See the full message above.";
}
