// POST /api/marqai/whatsapp/webhook
// GET  /api/marqai/whatsapp/webhook
//
// Webhook receiver for WhatsApp Cloud API callbacks.
// - GET: Meta webhook verification (hub.challenge echo).
// - POST: Inbound messages + status updates.
//
// Configure this URL in your WhatsApp Business Manager:
//   Webhook URL: https://your-domain.com/api/marqai/whatsapp/webhook
//   Verify token: marqai_verify_2026
//   Subscribed fields: messages, message_status, message_template_status_update
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 15;

const VERIFY_TOKEN = "marqai_verify_2026";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // In production, this is where you would:
    // 1. Verify the X-Hub-Signature-256 header against your app secret.
    // 2. Parse the entry[].changes[].value to extract:
    //    - messages[] (inbound)
    //    - statuses[] (sent, delivered, read, failed)
    //    - message_template_status_update (template approved/rejected)
    // 3. Update the message_logs table for the corresponding wamid.
    // 4. Trigger downstream automations (e.g. auto-reply, opt-out handling).

    // For this demo, we just acknowledge receipt. The actual log update
    // happens client-side via the in-memory store when the user clicks
    // "Send now" in the UI.

    return NextResponse.json({ ok: true, received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
