// POST /api/marqai/sales/intro-email
// Stage 2 of the AI Sales Workflow.
//
// Body: {
//   companyName: string,
//   contactName: string,
//   contactTitle?: string,
//   productName: string,
//   productContext: string,
//   tone?: string,
//   agentName?: string,
//   senderName?: string  // who the email is "from"
// }
//
// Returns: {
//   ok: true,
//   subject: string,
//   body: string,
//   source: "ai" | "fallback",
//   warning?: string
// }
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
import { extractChatContent } from "@/lib/zai-response";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  companyName: string;
  contactName: string;
  contactTitle?: string;
  productName: string;
  productContext: string;
  tone?: string;
  agentName?: string;
  senderName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.companyName?.trim() || !body.contactName?.trim() || !body.productContext?.trim()) {
      return NextResponse.json(
        { error: "Missing companyName, contactName, or productContext" },
        { status: 400 },
      );
    }

    const tone = body.tone?.trim() || "Direct, specific, no fluff";
    const sender = body.senderName?.trim() || body.agentName?.trim() || "your account executive";

    const sys = `You are a top-performing account executive who writes cold intro emails that get replies. You open with a specific observation (never "I hope this finds you well"), tie it to a concrete business pain, and close with a soft CTA (15-min call next week?).

Rules:
1. Subject line: 4-7 words, lowercase or sentence case, no emojis, no ALL CAPS, no clickbait.
2. Body: 90-130 words. 3 short paragraphs maximum. No bullet lists. No attachments mentioned.
3. First line references something specific about the company or the contact's role — never generic.
4. Second line ties that observation to a concrete pain the product solves.
5. Third line is a single soft CTA — a 15-minute call, not a demo or a "quick sync".
6. Sign off as ${sender}.
7. NEVER use merge tags in the output — substitute real values for {{first_name}}, {{company}}, {{sender}}.
8. NEVER mention that this email was AI-generated or automated.

Return STRICT JSON only — no prose, no markdown fences:
{
  "subject": "<subject line>",
  "body": "<full email body, plain text, with line breaks>"
}

JSON only.`;

    const user = `Product: ${body.productName}
Product context: ${body.productContext}
Tone: ${tone}

Prospect:
- Company: ${body.companyName}
- Name: ${body.contactName}
${body.contactTitle ? `- Title: ${body.contactTitle}` : ""}

Write the intro email as JSON.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.75,
      max_tokens: 900,
    });

    const extracted = extractChatContent(completion);
    const raw = extracted.content ?? "";
    const parsed = extractJson(raw);

    const isValid =
      parsed?.subject && typeof parsed.subject === "string" &&
      parsed?.body && typeof parsed.body === "string" && parsed.body.length > 50;

    if (!isValid) {
      return NextResponse.json({
        ok: true,
        subject: `quick question about ${body.companyName.toLowerCase()}'s marketing stack`,
        body: `Hi ${body.contactName.split(" ")[0]},

Noticed ${body.companyName} has been scaling your content output lately — congrats on the launch. Most teams your size hit a wall where the brief-to-publish pipeline gets brittle and content ROI gets hard to defend.

${body.productName} was built to fix exactly that — without ripping out your existing stack.

Worth a 15-min call next week? I'll bring two specific ideas for ${body.companyName}.

— ${sender}`,
        source: "fallback",
        warning:
          extracted.error ??
          "AI returned an unparseable email. Showing a proven fallback template — review and personalize before sending.",
      });
    }

    return NextResponse.json({
      ok: true,
      subject: String(parsed.subject),
      body: String(parsed.body),
      source: "ai",
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
