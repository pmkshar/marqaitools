// POST /api/marqai/whatsapp/send-broadcast
// Body: { campaignId: string } OR { templateId, contactIds, variableOverrides? }
// Returns: { ok, stats, logs }
//
// Sends a WhatsApp template message to multiple recipients at once.
// In production this calls the Meta WhatsApp Cloud API (or Twilio /
// MessageBird etc). In this demo it SIMULATES the send: validates
// inputs, generates provider message IDs, and returns realistic
// per-recipient logs that the client stores in the in-memory store.
//
// Required env vars for production:
//   WHATSAPP_API_KEY          — Bearer token clients use to call THIS endpoint
//   META_ACCESS_TOKEN         — Meta Cloud API permanent access token
//   META_PHONE_NUMBER_ID      — Phone number ID from Meta Business Manager
//
// Auth: Bearer WHATSAPP_API_KEY (skipped in demo for in-app use).
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SendBody {
  campaignId?: string;
  templateId?: string;
  contactIds?: string[];
  variableOverrides?: Record<string, Record<string, string>>;
}

// In-memory contact/template lookup — in production these would come
// from the database. Here we reconstruct the demo seed so the API can
// run stateless on Vercel.
import { seedWhatsAppTemplates, seedWhatsAppContacts } from "@/lib/marqai/mock-data";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SendBody;

    // Resolve template + contacts from seed (or override)
    let template = body.templateId
      ? seedWhatsAppTemplates.find((t) => t.id === body.templateId)
      : seedWhatsAppTemplates[0];
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    if (template.status !== "approved") {
      return NextResponse.json(
        { error: `Template '${template.name}' is ${template.status}. Meta will reject sends.` },
        { status: 400 },
      );
    }

    let contacts = body.contactIds
      ? seedWhatsAppContacts.filter((c) => body.contactIds!.includes(c.id))
      : seedWhatsAppContacts;

    // Filter to opted-in only
    contacts = contacts.filter((c) => c.optedIn);
    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No opted-in recipients. Cannot send to contacts who have opted out." },
        { status: 400 },
      );
    }

    // SIMULATE the send — generate provider message IDs and per-recipient logs.
    // In production, this loop would POST to:
    //   https://graph.facebook.com/v18.0/{phone_number_id}/messages
    // with the template + components, and accumulate real delivery receipts.
    const logs = contacts.map((c) => {
      const overrides = body.variableOverrides?.[c.id] ?? {};
      const renderedBody = renderTemplate(template.body, c, overrides);
      return {
        id: `wa-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        contactId: c.id,
        contactName: c.name,
        phone: c.phone,
        renderedBody,
        providerMessageId: generateWamid(),
        status: "queued" as const,
      };
    });

    // Simulate Meta accepting all messages (in production some may fail
    // with 429 rate-limit or invalid-number errors).
    const stats = {
      sent: logs.length,
      delivered: 0, // updated via webhook callbacks in production
      read: 0,
      failed: 0,
      clicked: 0,
      replied: 0,
      optedOut: 0,
    };

    return NextResponse.json({
      ok: true,
      stats,
      logs,
      note:
        "Demo mode: messages were simulated. In production, the Meta Cloud API is called and delivery / read receipts arrive via the /webhook endpoint.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function renderTemplate(
  body: string,
  contact: { name: string; phone: string; email?: string; customFields?: Record<string, string> },
  overrides: Record<string, string>,
): string {
  let out = body;
  const samples = [
    contact.name,
    contact.customFields?.lastOrder ?? "20",
    contact.customFields?.city ?? "your city",
    "PROMO10",
    "https://shop.example.com",
    contact.email ?? "",
  ];
  const matches = body.match(/\{\{(\d+)\}\}/g) ?? [];
  matches.forEach((m, i) => {
    const v = overrides[m] ?? samples[i] ?? m;
    out = out.replace(new RegExp(m.replace(/[{}]/g, "\\$&"), "g"), v);
  });
  return out;
}

function generateWamid(): string {
  return `wamid.HBgL${Math.random().toString(36).slice(2, 14).toUpperCase()}${Math.random().toString(36).slice(2, 14).toUpperCase()}`;
}
