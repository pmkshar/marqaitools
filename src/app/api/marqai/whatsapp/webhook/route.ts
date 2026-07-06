// POST /api/marqai/whatsapp/webhook
// GET  /api/marqai/whatsapp/webhook
//
// Webhook receiver for WhatsApp Cloud API callbacks.
//   GET  — Meta webhook verification (echoes hub.challenge if verify_token matches).
//   POST — Inbound messages + delivery/read/failed status updates + template status.
//
// Configure this URL in your WhatsApp Business Manager:
//   Webhook URL: https://your-domain.com/api/marqai/whatsapp/webhook
//   Verify token: value of WHATSAPP_WEBHOOK_VERIFY_TOKEN env var (default: marqai_verify_2026)
//   Subscribed fields: messages, message_status, message_template_status_update
//
// Required env vars for production:
//   WHATSAPP_APP_SECRET           — used to verify X-Hub-Signature-256
//   WHATSAPP_WEBHOOK_VERIFY_TOKEN — any string you set in Meta dashboard
//
// NOTE: This route stores events in a module-internal in-memory ring buffer
// (cleared on every cold start). In production you'd persist these to a DB
// and update message_logs / campaign stats from here.
import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  type ParsedWebhookEvent,
} from "@/lib/marqai/whatsapp-client";

export const runtime = "nodejs";
export const maxDuration = 15;

const DEFAULT_VERIFY_TOKEN = "marqai_verify_2026";

// In-memory event buffer (last 200 events). Lost on cold start.
// For production durability, replace with DB-backed queue/storage.
const EVENT_BUFFER: Array<{ receivedAt: string; raw: unknown; events: ParsedWebhookEvent[] }> = [];
const BUFFER_MAX = 200;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? DEFAULT_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // If app secret is configured, verify the signature. If verification
    // fails, reject the request. If not configured, accept but log a warning.
    if (appSecret) {
      const valid = await verifyWebhookSignature(rawBody, signature, appSecret);
      if (!valid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const events = parseWebhookPayload(payload);

    // Buffer the event for display in the UI's webhook log viewer
    const entry = { receivedAt: new Date().toISOString(), raw: payload, events };
    EVENT_BUFFER.unshift(entry);
    if (EVENT_BUFFER.length > BUFFER_MAX) EVENT_BUFFER.length = BUFFER_MAX;

    // In production, here you would:
    // 1. Look up each event's wamid in your message_logs table
    // 2. For status events → update the log row's status + deliveredAt/readAt
    // 3. For message events → trigger auto-reply, opt-out handling, or webhook to external systems
    // 4. For template_status events → update template.status in DB
    // 5. Update campaign.stats rollups

    return NextResponse.json({ ok: true, received: true, eventsProcessed: events.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Export the buffer for the webhook-events GET endpoint to read
export function _getEventBuffer() {
  return EVENT_BUFFER;
}
