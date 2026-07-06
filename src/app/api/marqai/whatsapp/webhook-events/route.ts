// GET /api/marqai/whatsapp/webhook-events
// Returns: { ok, events: Array<{ receivedAt, raw, events: ParsedWebhookEvent[] }> }
//
// Returns the recent webhook events buffered in memory. Used by the
// WhatsApp module's Settings → Webhook Log viewer to show live
// delivery / read / failed / inbound events in real time.
import { NextResponse } from "next/server";
import { _getEventBuffer } from "../webhook/route";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET() {
  try {
    return NextResponse.json({ ok: true, events: _getEventBuffer() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
