// POST /api/marqai/whatsapp/send-single
// Body: { templateId, phone, variables }
// Returns: { ok, messageId, status }
//
// Sends a single transactional WhatsApp message to one recipient.
// Used by external systems for order confirmations, appointment reminders,
// OTP, etc. The template must be approved by Meta before this will work.
import { NextRequest, NextResponse } from "next/server";
import { seedWhatsAppTemplates } from "@/lib/marqai/mock-data";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  templateId: string;
  phone: string;
  variables?: Record<string, string>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    if (!body.templateId || !body.phone) {
      return NextResponse.json(
        { error: "templateId and phone are required" },
        { status: 400 },
      );
    }

    if (!/^\+?\d{8,15}$/.test(body.phone)) {
      return NextResponse.json(
        { error: "phone must be in E.164 format, e.g. +14155551234" },
        { status: 400 },
      );
    }

    const template = seedWhatsAppTemplates.find((t) => t.id === body.templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    if (template.status !== "approved") {
      return NextResponse.json(
        { error: `Template '${template.name}' is ${template.status}. Cannot send.` },
        { status: 400 },
      );
    }

    // Render the template body with provided variables
    let renderedBody = template.body;
    const matches = template.body.match(/\{\{(\d+)\}\}/g) ?? [];
    matches.forEach((m) => {
      const v = body.variables?.[m] ?? m;
      renderedBody = renderedBody.replace(new RegExp(m.replace(/[{}]/g, "\\$&"), "g"), v);
    });

    // Simulate the send to Meta Cloud API
    const messageId = `wamid.HBgL${Math.random().toString(36).slice(2, 14).toUpperCase()}${Math.random().toString(36).slice(2, 14).toUpperCase()}`;

    return NextResponse.json({
      ok: true,
      messageId,
      status: "queued",
      renderedBody,
      note: "Demo mode: message was simulated. In production, the Meta Cloud API is called.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
