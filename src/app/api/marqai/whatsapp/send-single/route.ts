// POST /api/marqai/whatsapp/send-single
// Body: { templateId, phone, variables?, headerParams?, buttonParams? }
// Returns: { ok, messageId, status, renderedBody, mode }
//
// Sends a single WhatsApp message to one recipient.
// Uses Meta Cloud API when WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID
// env vars are present. Falls back to demo simulation when not configured.
import { NextRequest, NextResponse } from "next/server";
import { seedWhatsAppTemplates } from "@/lib/marqai/mock-data";
import {
  readWhatsAppEnv,
  isWhatsAppConfigured,
  normalizePhone,
  renderTemplateBody,
  extractPlaceholders,
  buildTemplateMessage,
  sendMetaMessage,
  buildTextMessage,
  generateDemoWamid,
} from "@/lib/marqai/whatsapp-client";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  templateId: string;
  phone: string;
  variables?: Record<string, string>;
  headerParams?: string[];
  buttonParams?: Record<number, string>;
  // Optional: send a plain text message instead of template (requires session window
  // or free-tier entry point). When text is provided, templateId is ignored.
  text?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    if (!body.phone) {
      return NextResponse.json(
        { error: "phone is required" },
        { status: 400 },
      );
    }

    const phone = normalizePhone(body.phone);
    if (!phone) {
      return NextResponse.json(
        { error: "phone must be in E.164 format, e.g. +14155551234" },
        { status: 400 },
      );
    }

    const env = readWhatsAppEnv();
    const configured = isWhatsAppConfigured(env);

    // Plain text message path (no template) — requires 24h session window
    if (body.text) {
      if (!configured) {
        return NextResponse.json({
          ok: true,
          messageId: generateDemoWamid(),
          status: "queued",
          renderedBody: body.text,
          mode: "demo",
          note: "Demo mode: text message simulated. Configure WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Vercel to send real messages.",
        });
      }
      const payload = buildTextMessage(phone, body.text, true);
      const result = await sendMetaMessage(env.phoneNumberId!, env.accessToken!, payload);
      if (result.status === "failed") {
        return NextResponse.json({ error: result.error, mode: "live" }, { status: 502 });
      }
      return NextResponse.json({
        ok: true,
        messageId: result.messageId,
        status: result.status,
        renderedBody: body.text,
        mode: "live",
      });
    }

    // Template message path
    if (!body.templateId) {
      return NextResponse.json(
        { error: "Either templateId or text is required" },
        { status: 400 },
      );
    }

    const template = seedWhatsAppTemplates.find((t) => t.id === body.templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    if (template.status !== "approved") {
      return NextResponse.json(
        { error: `Template '${template.name}' is ${template.status}. Meta will reject sends.` },
        { status: 400 },
      );
    }

    // Render body for preview/display
    const placeholders = extractPlaceholders(template.body);
    const bodyParamValues = placeholders.map((p) => body.variables?.[p] ?? p);
    const renderedBody = renderTemplateBody(template.body, body.variables ?? {});

    if (!configured) {
      return NextResponse.json({
        ok: true,
        messageId: generateDemoWamid(),
        status: "queued",
        renderedBody,
        mode: "demo",
        note: "Demo mode: message simulated. Configure WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Vercel to send real messages.",
      });
    }

    // Live send via Meta Cloud API
    const payload = buildTemplateMessage(
      phone,
      template.elementName,
      template.language,
      bodyParamValues,
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
      renderedBody,
      mode: "live",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
