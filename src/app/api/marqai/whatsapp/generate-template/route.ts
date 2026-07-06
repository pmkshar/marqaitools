// POST /api/marqai/whatsapp/generate-template
// Body: { intent: string, language?, category? }
// Returns: { ok, template }
//
// Uses Z.AI to draft a Meta-compliant WhatsApp template message from a
// natural-language intent. The returned template is in 'draft' status —
// the user reviews and submits it to Meta for approval.
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractChatContent } from "@/lib/zai-response";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  intent: string;
  language?: string;
  category?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.intent?.trim()) {
      return NextResponse.json({ error: "intent is required" }, { status: 400 });
    }

    const language = body.language ?? "en_US";
    const category = body.category ?? "marketing";

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: systemPrompt() },
        {
          role: "user",
          content: `Intent: ${body.intent}
Language: ${language}
Category: ${category}

Return STRICT JSON ONLY with this shape:
{
  "name": string (short human-friendly name, max 50 chars),
  "elementName": string (lowercase_with_underscores, max 50 chars, no spaces),
  "category": "${category}",
  "language": "${language}",
  "header": string (optional, max 60 chars, plain text),
  "body": string (the WhatsApp message body, use {{1}}, {{2}} etc for variables, max 1024 chars),
  "footer": string (optional, max 60 chars),
  "preview": string (the body with sample values filled in)
}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const raw = extractChatContent(completion).content ?? "";
    const parsed = parseJsonLoose(raw);
    if (!parsed) {
      return NextResponse.json(
        { error: "AI returned malformed JSON", raw },
        { status: 502 },
      );
    }

    // Normalize + validate
    const template = {
      name: String(parsed.name ?? "AI Template").slice(0, 50),
      elementName: String(parsed.elementName ?? "ai_template")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 50),
      category,
      language,
      header: parsed.header ? String(parsed.header).slice(0, 60) : undefined,
      body: String(parsed.body ?? "").slice(0, 1024),
      footer: parsed.footer ? String(parsed.footer).slice(0, 60) : undefined,
      preview: parsed.preview ? String(parsed.preview) : undefined,
      status: "draft" as const,
    };

    return NextResponse.json({ ok: true, template });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function systemPrompt(): string {
  return `You are Marqai's WhatsApp marketing copywriter. You draft Meta-compliant WhatsApp Business template messages.

Rules:
1. Templates MUST follow Meta's Commerce & Business Messaging Policy.
2. NO prohibited content: no adult, alcohol, gambling, tobacco, weapons, drugs.
3. NO deceptive content: no misleading discounts, no fake urgency, no bait-and-switch.
4. Variables use the {{1}}, {{2}}, {{3}} format (numbered, double curly braces).
5. Body max 1024 chars. Header (if any) max 60 chars plain text. Footer (if any) max 60 chars.
6. Always include an opt-out instruction in the footer (e.g. "Reply STOP to opt out") for marketing templates.
7. Marketing templates should have a clear CTA in the body (e.g. "Shop now: <url>").
8. Personalize with the recipient's name as {{1}} where appropriate.
9. Be concise — WhatsApp is a chat channel, not email.
10. The 'preview' field should show the body with realistic sample values substituted.

Return STRICT JSON ONLY — no prose, no code fences.`;
}

function parseJsonLoose(text: string): any | null {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') inStr = !inStr;
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        const slice = t.slice(start, i + 1);
        try { return JSON.parse(slice); } catch { return null; }
      }
    }
  }
  return null;
}
