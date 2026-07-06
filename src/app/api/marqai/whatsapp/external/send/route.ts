// POST /api/marqai/whatsapp/external/send
// Headers: Authorization: Bearer <WHATSAPP_API_KEY>
//          Content-Type: application/json
// Body (one of):
//   { to: "+14155551234", templateName: "order_confirmation",
//     language: "en_US", bodyParams: ["Alice", "#1234"] }
//   { to: "+14155551234", text: "Hello from Acme Corp!" }
//
// Returns: { ok, messageId, status, mode }
// Errors:  401 if API key missing/invalid, 400 if body invalid, 502 if Meta rejects
//
// This is the integration endpoint for EXTERNAL tools — CRMs, e-commerce
// platforms, order management systems, etc. — that want to trigger WhatsApp
// sends from their own backend. Authenticates via WHATSAPP_API_KEY env var.
//
// Required env vars:
//   WHATSAPP_API_KEY             — set this to a strong random string (use `openssl rand -hex 32`)
//   WHATSAPP_ACCESS_TOKEN        — Meta Cloud API token
//   WHATSAPP_PHONE_NUMBER_ID     — Phone number ID from Meta dashboard
//
// Example curl:
//   curl -X POST https://marqaitools.vercel.app/api/marqai/whatsapp/external/send \
//     -H "Authorization: Bearer $WHATSAPP_API_KEY" \
//     -H "Content-Type: application/json" \
//     -d '{"to":"+14155551234","templateName":"order_confirmation","language":"en_US","bodyParams":["Alice","#1234"]}'
import { NextRequest, NextResponse } from "next/server";
import { seedWhatsAppTemplates } from "@/lib/marqai/mock-data";
import {
  readWhatsAppEnv,
  isWhatsAppConfigured,
  normalizePhone,
  buildTemplateMessage,
  buildTextMessage,
  sendMetaMessage,
  extractPlaceholders,
} from "@/lib/marqai/whatsapp-client";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ExternalSendBody {
  to: string;
  // Template mode
  templateName?: string; // elementName (lowercase_with_underscores)
  templateId?: string; // alternative: use Marqai internal template ID
  language?: string; // defaults to "en_US"
  bodyParams?: string[];
  headerParams?: string[];
  buttonParams?: Record<number, string>;
  // Text mode (no template)
  text?: string;
  // Metadata for client's own tracking
  campaignId?: string;
  externalId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const env = readWhatsAppEnv();

    // Auth check — API key is REQUIRED for external endpoints
    if (!env.apiKey) {
      return NextResponse.json(
        {
          error:
            "Server not configured for external integrations. Set WHATSAPP_API_KEY env var in Vercel.",
        },
        { status: 503 },
      );
    }

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token || token !== env.apiKey) {
      return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
    }

    if (!isWhatsAppConfigured(env)) {
      return NextResponse.json(
        {
          error:
            "WhatsApp not configured for live sending. Set WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Vercel env vars.",
        },
        { status: 503 },
      );
    }

    const body = (await req.json()) as ExternalSendBody;
    if (!body.to) {
      return NextResponse.json({ error: "to is required" }, { status: 400 });
    }

    const phone = normalizePhone(body.to);
    if (!phone) {
      return NextResponse.json(
        { error: "to must be a valid E.164 phone number, e.g. +14155551234" },
        { status: 400 },
      );
    }

    // Plain text path
    if (body.text) {
      const payload = buildTextMessage(phone, body.text, true);
      const result = await sendMetaMessage(env.phoneNumberId!, env.accessToken!, payload);
      if (result.status === "failed") {
        return NextResponse.json(
          { error: result.error ?? "Meta API send failed", mode: "live" },
          { status: 502 },
        );
      }
      return NextResponse.json({
        ok: true,
        messageId: result.messageId,
        status: result.status,
        mode: "live",
        campaignId: body.campaignId,
        externalId: body.externalId,
      });
    }

    // Template path
    let template;
    if (body.templateId) {
      template = seedWhatsAppTemplates.find((t) => t.id === body.templateId);
    } else if (body.templateName) {
      template = seedWhatsAppTemplates.find((t) => t.elementName === body.templateName);
    }

    if (!template) {
      return NextResponse.json(
        {
          error: `Template not found. Pass either templateId (Marqai internal ID) or templateName (Meta elementName).`,
          availableTemplates: seedWhatsAppTemplates
            .filter((t) => t.status === "approved")
            .map((t) => ({ id: t.id, elementName: t.elementName, name: t.name })),
        },
        { status: 404 },
      );
    }

    if (template.status !== "approved") {
      return NextResponse.json(
        { error: `Template '${template.name}' is ${template.status}. Cannot send.` },
        { status: 400 },
      );
    }

    // Validate body params count
    const placeholders = extractPlaceholders(template.body);
    if (body.bodyParams && body.bodyParams.length !== placeholders.length) {
      return NextResponse.json(
        {
          error: `Template requires ${placeholders.length} body params, got ${body.bodyParams.length}.`,
          expectedPlaceholders: placeholders,
        },
        { status: 400 },
      );
    }

    const payload = buildTemplateMessage(
      phone,
      template.elementName,
      body.language ?? template.language ?? "en_US",
      body.bodyParams ?? [],
      body.headerParams ?? [],
      body.buttonParams ?? {},
    );

    const result = await sendMetaMessage(env.phoneNumberId!, env.accessToken!, payload);

    if (result.status === "failed") {
      return NextResponse.json(
        { error: result.error ?? "Meta API send failed", mode: "live", raw: result.raw },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
      status: result.status,
      mode: "live",
      templateId: template.id,
      templateName: template.elementName,
      campaignId: body.campaignId,
      externalId: body.externalId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
