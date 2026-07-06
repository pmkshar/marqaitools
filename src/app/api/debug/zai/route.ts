// GET /api/debug/zai
// Diagnostic endpoint — checks ZAI configuration and runs a tiny
// echo chat completion to verify the API key + base URL work end-to-end.
// Safe to expose: only returns masked key info, never the full key.
//
// Also returns the FULL raw response object from the Z.AI API so you
// can see exactly what shape it returns — useful for diagnosing cases
// where the call succeeds but content extraction fails.
//
// If the primary endpoint returns code 1211 "Unknown Model", this
// endpoint ALSO tries the BigModel China deployment
// (https://open.bigmodel.cn/api/paas/v4) with the same key — because
// Z.AI international and BigModel China use SEPARATE API keys, and a
// 1211 on api.z.ai often means the key was issued by BigModel China.
import { NextResponse } from "next/server";
import { getZai, getZaiDiagnostics, resetZaiCache, getDefaultModel } from "@/lib/zai";
import { extractChatContent } from "@/lib/zai-response";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const BIGMODEL_CN_BASE = "https://open.bigmodel.cn/api/paas/v4";
const INTERNATIONAL_BASE = "https://api.z.ai/api/paas/v4";

export async function GET() {
  const diag = getZaiDiagnostics();
  const result: any = {
    ok: false,
    timestamp: new Date().toISOString(),
    config: diag,
    connectivity: null as any,
    error: null as any,
    internationalProbe: null as any,
    fallbackTest: null as any,
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
      model: getDefaultModel(),
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
      const errMsg = extracted.error ?? "Content extracted but empty";
      const isSparse500 =
        extracted.shape === "error-envelope" &&
        (errMsg.includes('"code":"500"') || errMsg.includes("'code':'500'") || /code.*500/i.test(errMsg));
      result.error = {
        kind: isSparse500 ? "sparse-500-envelope" : "extraction-failed",
        message: errMsg,
        hint: isSparse500
          ? "Z.AI returned {\"error\":{\"code\":\"500\"}}. This is Z.AI's way of saying " +
            "the request body was malformed — most commonly a MISSING or INVALID 'model' " +
            "parameter. Set ZAI_MODEL to a valid value (glm-4, glm-4-flash, glm-4-air, " +
            "glm-4-plus). If the key has no access to the requested model, try glm-4-flash " +
            "first (free tier)."
          : "The API call succeeded (HTTP 200) but the response shape isn't recognized. " +
            "Check rawResponsePreview and rawResponseKeys to see what the API actually returned. " +
            "If the shape is new, update src/lib/zai-response.ts to handle it.",
      };

      // If we got a sparse 500 or 1211, probe BOTH the international
      // endpoint with multiple models AND the BigModel China deployment
      // so we can definitively identify which deployment the key belongs
      // to and which model is actually available.
      if (isSparse500 || errMsg.includes('"code":"1211"') || /unknown model/i.test(errMsg)) {
        result.internationalProbe = await probeMultipleModels(INTERNATIONAL_BASE, "international");
        result.fallbackTest = await tryBigModelFallback();
      }
    }
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    result.connectivity = { status: "error", httpOk: false };
    result.error = {
      kind: "request-failed",
      message: msg,
      hint: classifyError(msg),
    };

    // If the request failed with 1211 (Unknown Model), probe BOTH
    // endpoints to definitively identify which deployment the key
    // belongs to.
    if (msg.includes('"code":"1211"') || /unknown model/i.test(msg)) {
      result.internationalProbe = await probeMultipleModels(INTERNATIONAL_BASE, "international");
      result.fallbackTest = await tryBigModelFallback();
    }
  }

  return NextResponse.json(result, { status: 200 });
}

/**
 * Probe a single endpoint with multiple models. Returns per-model results
 * plus an overall classification: which models were recognized (vs 1211),
 * which had zero balance (vs 1113), and which actually worked.
 *
 * This is the definitive way to identify which deployment a key belongs
 * to AND which model to use with it.
 */
async function probeMultipleModels(baseUrl: string, label: string): Promise<any> {
  const apiKey = process.env.ZAI_API_KEY ?? "";
  if (!apiKey) return null;

  const modelsToTry = [
    "glm-4-flash",
    "glm-4-flashx",
    "glm-4-air",
    "glm-4-airx",
    "glm-4",
    "glm-4-long",
    "glm-4-plus",
    "glm-4.5",
    "glm-4.6",
  ];

  const ZAICtor = ZAI as any;
  const probeResults: any[] = [];

  for (const model of modelsToTry) {
    try {
      const client = new ZAICtor({ baseUrl, apiKey });
      const raw = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "Reply with exactly: PONG" },
          { role: "user", content: "ping" },
        ],
        max_tokens: 10,
        temperature: 0,
      });
      const extracted = extractChatContent(raw);
      const worked = !extracted.error && extracted.content.trim().length > 0;
      probeResults.push({
        model,
        ok: worked,
        reply: extracted.content.slice(0, 50),
        error: extracted.error,
      });
      if (worked) break;
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      probeResults.push({
        model,
        ok: false,
        error: msg.slice(0, 200),
      });
    }
  }

  const firstOk = probeResults.find((r) => r.ok);
  const recognizedButNoBalance = probeResults.filter(
    (r) => !r.ok && r.error && (r.error.includes('"code":"1113"') || r.error.includes("余额不足") || r.error.includes("insufficient balance")),
  );
  const allUnknownModel = probeResults.every(
    (r) => !r.ok && r.error && (r.error.includes('"code":"1211"') || r.error.includes("Unknown Model") || r.error.includes("模型不存在")),
  );

  return {
    endpoint: baseUrl,
    label,
    probedModels: probeResults,
    workingModel: firstOk?.model ?? null,
    recognizedModels: recognizedButNoBalance.map((r) => r.model),
    allModelsUnknown: allUnknownModel,
  };
}

/**
 * Try the same API key against the BigModel China deployment. If it
 * works, the user's key was issued by BigModel China and they should
 * set ZAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4 on Vercel.
 *
 * Also tries multiple model names so we can identify which one the
 * key actually supports (in case the default glm-4-flash has been
 * renamed or is not activated on the user's account).
 */
async function tryBigModelFallback(): Promise<any> {
  const probe = await probeMultipleModels(BIGMODEL_CN_BASE, "bigmodel-china");
  if (!probe) return null;

  const probeResults = probe.probedModels;
  const firstOk = probeResults.find((r) => r.ok);
  // Detect the "key is BigModel China + account has zero balance" pattern:
  // some models return 1211 (not recognized) and others return 1113
  // (insufficient balance). This means the key IS valid for BigModel
  // China, the paid models ARE recognized, but the account has no credit.
  const recognizedButNoBalance = probeResults.filter(
    (r) => !r.ok && r.error && (r.error.includes('"code":"1113"') || r.error.includes("余额不足") || r.error.includes("insufficient balance")),
  );
  const anyRecognized = recognizedButNoBalance.length > 0;

  let recommendation: string;
  if (firstOk) {
    recommendation = `WORKS on BigModel China with model '${firstOk.model}'! ` +
      "Fix: in Vercel env vars set BOTH:\n" +
      `  ZAI_BASE_URL=${BIGMODEL_CN_BASE}\n` +
      `  ZAI_MODEL=${firstOk.model}\n` +
      "Then trigger a Redeploy.";
  } else if (anyRecognized) {
    const recognizedModelNames = recognizedButNoBalance.map((r) => r.model).join(", ");
    recommendation =
      "ROOT CAUSE FOUND: Your API key was issued by BigModel China " +
      "(open.bigmodel.cn), NOT by Z.AI international (api.z.ai). The " +
      "key is valid, but your BigModel China account has ZERO BALANCE — " +
      "error code 1113 '余额不足或无可用资源包,请充值' (insufficient balance, " +
      "please recharge). The free-tier models (glm-4-flash etc.) return " +
      "1211 'model does not exist' on your account, likely because they " +
      "were disabled or you're on a paid-only tier.\n\n" +
      "To fix, do BOTH:\n" +
      "1. Recharge your BigModel China account at https://open.bigmodel.cn " +
      "   (login → console → billing → add credit). At least ¥1 is enough " +
      "   for thousands of glm-4.5 calls.\n" +
      "2. In Vercel → Project → Settings → Environment Variables, set:\n" +
      `     ZAI_BASE_URL=${BIGMODEL_CN_BASE}\n` +
      `     ZAI_MODEL=glm-4.5   (or one of: ${recognizedModelNames})\n` +
      "   Then trigger a Redeploy.\n\n" +
      "Alternative: get a fresh key from https://z.ai (international) " +
      "instead, which gives you free-tier access to glm-4-flash with no " +
      "recharge needed. Just paste the new key into ZAI_API_KEY on Vercel.";
  } else {
    recommendation = "All model probes failed on BigModel China. The key is likely:\n" +
      "  (a) Invalid/expired — get a fresh key from https://open.bigmodel.cn → API Keys\n" +
      "  (b) A free-tier key with NO models activated — log into the Z.AI / BigModel\n" +
      "      dashboard and check 'Model Garden' / 'API Keys' to confirm chat-completions\n" +
      "      is enabled for at least one model.\n" +
      "  (c) A key from a completely different deployment (custom enterprise endpoint).";
  }

  return {
    ...probe,
    recommendation,
  };
}

function classifyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('"code":"1211"') || m.includes("unknown model")) {
    return "Z.AI returned code 1211 'Unknown Model'. This usually means ONE of:\n" +
      "  (a) The model name is not available on your Z.AI plan — but the default\n" +
      "      glm-4-flash is free and available on every account, so this is unlikely\n" +
      "      if you're using the default.\n" +
      "  (b) Your API key was issued by a DIFFERENT Z.AI deployment (most commonly\n" +
      "      open.bigmodel.cn / BigModel China) and is being used against api.z.ai.\n" +
      "      Keys are NOT shared between deployments. Check the 'fallbackTest' field\n" +
      "      in this response — if it works on BigModel China, set\n" +
      "      ZAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4 on Vercel and Redeploy.\n" +
      "  (c) The key is invalid / expired. Get a fresh one from https://z.ai → API Keys.";
  }
  if (m.includes('"code":"500"') || m.includes("'code':'500'")) {
    return "Z.AI returned a sparse {\"error\":{\"code\":\"500\"}} envelope. " +
      "This is Z.AI's way of saying the request body was malformed — most " +
      "commonly a MISSING 'model' parameter. The app now sends model=" +
      "glm-4-flash by default. If you overrode ZAI_MODEL to an invalid " +
      "value, clear it or set it to a valid model name.";
  }
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
