// GET /api/marqai/whatsapp/test-connection
// Returns: { ok, connected, mode, qualityRating?, provider, phoneNumberId?, displayName?, phoneNumber?, messagingTier? }
//
// Tests the WhatsApp Business connection. When env vars are configured,
// makes a real call to Meta's Graph API to fetch the phone number's
// current status + quality rating. Otherwise returns the seed connection.
import { NextResponse } from "next/server";
import { seedWhatsAppConnection } from "@/lib/marqai/mock-data";
import {
  readWhatsAppEnv,
  isWhatsAppConfigured,
  fetchPhoneNumberInfo,
} from "@/lib/marqai/whatsapp-client";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET() {
  try {
    const env = readWhatsAppEnv();
    const configured = isWhatsAppConfigured(env);

    if (!configured) {
      return NextResponse.json({
        ok: true,
        mode: "demo",
        connected: seedWhatsAppConnection.connected,
        provider: seedWhatsAppConnection.provider,
        qualityRating: seedWhatsAppConnection.qualityRating,
        messagingTier: seedWhatsAppConnection.messagingTier,
        phoneNumberId: seedWhatsAppConnection.phoneNumberId,
        displayName: seedWhatsAppConnection.displayName,
        phoneNumber: seedWhatsAppConnection.phoneNumber,
        note: "Demo mode: returning seed connection status. Add WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Vercel env vars to enable live mode.",
      });
    }

    // Live mode — ping Meta Graph API for phone number info
    const result = await fetchPhoneNumberInfo(env.phoneNumberId!, env.accessToken!);

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        mode: "live",
        connected: false,
        provider: "meta-cloud-api",
        phoneNumberId: env.phoneNumberId,
        error: result.error ?? "Failed to fetch phone number info from Meta",
      }, { status: 502 });
    }

    const info = result.info!;
    const connected = info.current_status === "CONNECTED";

    return NextResponse.json({
      ok: true,
      mode: "live",
      connected,
      provider: "meta-cloud-api",
      qualityRating: info.quality_rating?.toLowerCase() ?? "unknown",
      messagingTier: info.messaging_limit_tier ?? "unknown",
      phoneNumberId: env.phoneNumberId,
      displayName: info.verified_name,
      phoneNumber: info.display_phone_number,
      currentStatus: info.current_status,
      throughputs: info.throughputs,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
