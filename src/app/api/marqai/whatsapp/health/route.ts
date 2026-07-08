// GET /api/marqai/whatsapp/health
// Returns: { ok, configured, mode, provider, hasToken, hasPhoneNumberId, hasAppSecret, hasApiKey }
//
// Lightweight health check that doesn't require auth. Used by the UI
// to show whether the WhatsApp module is in demo or live mode, and which
// env vars are missing. Token values are NEVER returned — only booleans.
import { NextResponse } from "next/server";
import { readWhatsAppEnv, isWhatsAppConfigured } from "@/lib/marqai/whatsapp-client";

export const runtime = "nodejs";
export const maxDuration = 5;

export async function GET() {
  try {
    const env = readWhatsAppEnv();
    return NextResponse.json({
      ok: true,
      configured: isWhatsAppConfigured(env),
      mode: isWhatsAppConfigured(env) ? "live" : "demo",
      provider: "meta-cloud-api",
      hasToken: Boolean(env.accessToken),
      hasPhoneNumberId: Boolean(env.phoneNumberId),
      hasBusinessAccountId: Boolean(env.businessAccountId),
      hasAppSecret: Boolean(env.appSecret),
      hasApiKey: Boolean(env.apiKey),
      missing: [
        !env.accessToken && "WHATSAPP_ACCESS_TOKEN",
        !env.phoneNumberId && "WHATSAPP_PHONE_NUMBER_ID",
        !env.appSecret && "WHATSAPP_APP_SECRET",
        !env.apiKey && "WHATSAPP_API_KEY",
        !env.businessAccountId && "WHATSAPP_BUSINESS_ACCOUNT_ID",
      ].filter(Boolean),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
