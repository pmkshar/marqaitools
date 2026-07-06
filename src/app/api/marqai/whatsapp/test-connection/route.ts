// GET /api/marqai/whatsapp/test-connection
// Returns: { ok, connected, qualityRating, provider, phoneNumberId? }
//
// Tests the WhatsApp Business connection by making a tiny API call to
// Meta's Graph API (in production). In demo mode, returns the seed
// connection status.
import { NextResponse } from "next/server";
import { seedWhatsAppConnection } from "@/lib/marqai/mock-data";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET() {
  try {
    // In production, this would call:
    //   GET https://graph.facebook.com/v18.0/{phone_number_id}
    //   Authorization: Bearer {access_token}
    // and check the response for quality_rating + current_status.
    return NextResponse.json({
      ok: true,
      connected: seedWhatsAppConnection.connected,
      provider: seedWhatsAppConnection.provider,
      qualityRating: seedWhatsAppConnection.qualityRating,
      messagingTier: seedWhatsAppConnection.messagingTier,
      phoneNumberId: seedWhatsAppConnection.phoneNumberId,
      displayName: seedWhatsAppConnection.displayName,
      phoneNumber: seedWhatsAppConnection.phoneNumber,
      note: "Demo mode: returning seed connection status. In production, this pings Meta's Graph API.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
