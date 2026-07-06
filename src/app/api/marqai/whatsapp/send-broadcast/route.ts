// POST /api/marqai/whatsapp/send-broadcast
// Body: { campaignId?: string, templateId?: string, contactIds?: string[],
//         variableOverrides?: Record<contactId, Record<placeholder, value>>,
//         text?: string }
// Returns: { ok, stats, logs, mode }
//
// Sends a WhatsApp message to multiple recipients at once.
// Uses Meta Cloud API when env vars are present; otherwise simulates the send.
//
// Required env vars for live mode:
//   WHATSAPP_ACCESS_TOKEN      — Meta permanent access token
//   WHATSAPP_PHONE_NUMBER_ID   — Phone number ID from WhatsApp → API Setup
//
// Auth: Bearer WHATSAPP_API_KEY (skipped for in-app use, enforced for /external/* endpoints).
import { NextRequest, NextResponse } from "next/server";
import { seedWhatsAppTemplates, seedWhatsAppContacts } from "@/lib/marqai/mock-data";
import {
  readWhatsAppEnv,
  isWhatsAppConfigured,
  normalizePhone,
  renderTemplateBody,
  extractPlaceholders,
  buildTemplateMessage,
  buildTextMessage,
  sendMetaMessage,
  generateDemoWamid,
} from "@/lib/marqai/whatsapp-client";

export const runtime = "nodejs";
export const maxDuration = 60; // broadcast may iterate many recipients

interface SendBody {
  campaignId?: string;
  templateId?: string;
  contactIds?: string[];
  variableOverrides?: Record<string, Record<string, string>>;
  text?: string;
}

interface BroadcastLog {
  id: string;
  campaignId: string;
  templateId: string;
  templateName: string;
  contactId: string;
  contactName: string;
  phone: string;
  renderedBody: string;
  providerMessageId: string;
  status: "queued" | "failed";
  error?: string;
  sentAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SendBody;

    // Resolve template + contacts
    let template = body.templateId
      ? seedWhatsAppTemplates.find((t) => t.id === body.templateId)
      : seedWhatsAppTemplates[0];

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

    const env = readWhatsAppEnv();
    const configured = isWhatsAppConfigured(env);

    // Plain-text broadcast (requires 24h session window for each recipient)
    if (body.text && !template) {
      const logs: BroadcastLog[] = [];
      const stats = { sent: 0, delivered: 0, read: 0, failed: 0, clicked: 0, replied: 0, optedOut: 0 };

      for (const c of contacts) {
        const phone = normalizePhone(c.phone);
        if (!phone) {
          logs.push(makeLog(c, body.text, "failed", "", "Invalid phone number"));
          stats.failed++;
          continue;
        }

        if (!configured) {
          logs.push(makeLog(c, body.text, "queued", generateDemoWamid()));
          stats.sent++;
          continue;
        }

        const payload = buildTextMessage(phone, body.text, true);
        const result = await sendMetaMessage(env.phoneNumberId!, env.accessToken!, payload);
        if (result.status === "failed") {
          logs.push(makeLog(c, body.text, "failed", "", result.error));
          stats.failed++;
        } else {
          logs.push(makeLog(c, body.text, "queued", result.messageId));
          stats.sent++;
        }
      }

      return NextResponse.json({
        ok: true,
        stats,
        logs,
        mode: configured ? "live" : "demo",
        campaignId: body.campaignId,
        note: configured
          ? undefined
          : "Demo mode: messages simulated. Configure WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Vercel to send real messages.",
      });
    }

    // Template broadcast
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    if (template.status !== "approved") {
      return NextResponse.json(
        { error: `Template '${template.name}' is ${template.status}. Meta will reject sends.` },
        { status: 400 },
      );
    }

    const placeholders = extractPlaceholders(template.body);

    const logs: BroadcastLog[] = [];
    const stats = { sent: 0, delivered: 0, read: 0, failed: 0, clicked: 0, replied: 0, optedOut: 0 };

    for (const c of contacts) {
      const overrides = body.variableOverrides?.[c.id] ?? {};
      const phone = normalizePhone(c.phone);
      if (!phone) {
        logs.push(makeLog(c, template.body, "failed", "", "Invalid phone number", template.id, template.name, body.campaignId));
        stats.failed++;
        continue;
      }

      const bodyParams = placeholders.map((p, i) => {
        if (overrides[p]) return overrides[p];
        const samples = [
          c.name,
          c.customFields?.lastOrder ?? "20",
          c.customFields?.city ?? "your city",
          "PROMO10",
          "https://shop.example.com",
          c.email ?? "",
        ];
        return samples[i] ?? p;
      });
      const renderedBody = renderTemplateBody(template.body, overrides);

      if (!configured) {
        logs.push(makeLog(c, renderedBody, "queued", generateDemoWamid(), undefined, template.id, template.name, body.campaignId));
        stats.sent++;
        continue;
      }

      const payload = buildTemplateMessage(
        phone,
        template.elementName,
        template.language,
        bodyParams,
        [],
        {},
      );
      const result = await sendMetaMessage(env.phoneNumberId!, env.accessToken!, payload);

      if (result.status === "failed") {
        logs.push(makeLog(c, renderedBody, "failed", "", result.error, template.id, template.name, body.campaignId));
        stats.failed++;
      } else {
        logs.push(makeLog(c, renderedBody, "queued", result.messageId, undefined, template.id, template.name, body.campaignId));
        stats.sent++;
      }
    }

    return NextResponse.json({
      ok: true,
      stats,
      logs,
      mode: configured ? "live" : "demo",
      campaignId: body.campaignId,
      templateId: template.id,
      templateName: template.name,
      note: configured
        ? undefined
        : "Demo mode: messages simulated. Configure WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Vercel to send real messages.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function makeLog(
  contact: { id: string; name: string; phone: string },
  renderedBody: string,
  status: "queued" | "failed",
  providerMessageId: string,
  error?: string,
  templateId?: string,
  templateName?: string,
  campaignId?: string,
): BroadcastLog {
  return {
    id: `wa-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    campaignId: campaignId ?? `wa-camp-${Date.now()}`,
    templateId: templateId ?? "",
    templateName: templateName ?? "",
    contactId: contact.id,
    contactName: contact.name,
    phone: contact.phone,
    renderedBody,
    providerMessageId,
    status,
    error,
    sentAt: new Date().toISOString(),
  };
}
