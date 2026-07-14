// POST /api/marqai/sales/followup-schedule
// Stage 3 of the AI Sales Workflow.
//
// Body: {
//   companyName: string,
//   contactName: string,
//   contactTitle?: string,
//   productName: string,
//   productContext: string,
//   introEmailSubject: string,    // the subject of the intro email sent in stage 2
//   tone?: string,
//   mode: "online" | "offline",   // online = video call, offline = in-person
//   timezone?: string,            // e.g. "Asia/Kolkata"
//   senderName?: string
// }
//
// Returns: {
//   ok: true,
//   followupSubject: string,
//   followupBody: string,
//   proposedSlots: MeetingSlot[],   // 3 slots
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
  introEmailSubject: string;
  tone?: string;
  mode: "online" | "offline";
  timezone?: string;
  senderName?: string;
}

function nextWeekdaySlots(mode: "online" | "offline", tz: string): { id: string; label: string; mode: "online" | "offline"; meetingLink?: string; location?: string }[] {
  // Generate 3 placeholder slots across the next 7 days, between 10am-4pm.
  const now = new Date();
  const slots: { id: string; label: string; mode: "online" | "offline"; meetingLink?: string; location?: string }[] = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let added = 0;
  let offset = 1;
  while (added < 3 && offset < 14) {
    const d = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) {
      const hour = 10 + added * 2;
      slots.push({
        id: `slot-${added + 1}`,
        label: `${days[dow]} ${d.getDate()} ${months[d.getMonth()]} · ${hour}:00 ${mode === "online" ? "Online" : "Onsite"} (${tz})`,
        mode,
        ...(mode === "online"
          ? { meetingLink: "https://meet.example.com/marqai-" + (added + 1) }
          : { location: `${added === 0 ? "Lobby" : added === 1 ? "Conference Rm A" : "Conference Rm B"} — ${added + 1}th floor` }),
      });
      added++;
    }
    offset++;
  }
  return slots;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.companyName?.trim() || !body.contactName?.trim() || !body.productContext?.trim() || !body.introEmailSubject?.trim()) {
      return NextResponse.json(
        { error: "Missing companyName, contactName, productContext, or introEmailSubject" },
        { status: 400 },
      );
    }
    const mode = body.mode === "offline" ? "offline" : "online";
    const tz = body.timezone?.trim() || "Asia/Kolkata";
    const tone = body.tone?.trim() || "Direct, specific, no fluff";
    const sender = body.senderName?.trim() || "your account executive";

    const sys = `You are a top-performing account executive writing a follow-up email 3 business days after sending a cold intro email that did not get a reply.

Rules for the follow-up email:
1. Subject: reply on the same thread — i.e. "Re: <intro subject>". Always prefix with "Re: ".
2. Body: 50-90 words. Two short paragraphs max.
3. NEVER re-pitch the product. Reference the intro email briefly, add ONE new piece of value (an insight, a customer story, a relevant data point), and propose a meeting.
4. End with a single CTA: pick one of three specific meeting slots you propose. State the slots inline as text (the UI will render them as buttons separately).
5. Sign off as ${sender}.
6. NEVER use merge tags — substitute real values.
7. NEVER mention this is automated.

ALSO produce 3 specific meeting slots — 30 minutes each, on weekdays, between 10am-4pm in the prospect's timezone (${tz}). For ${mode} meetings, ${mode === "online" ? "include a video-call link placeholder" : "include an onsite location placeholder"}.

Return STRICT JSON only — no prose, no markdown fences:
{
  "followupSubject": "Re: <intro subject>",
  "followupBody": "<email body, plain text, with line breaks>",
  "proposedSlots": [
    {
      "label": "<e.g. 'Tue 22 Jul · 11:00 AM Online (Asia/Kolkata)'>",
      "mode": "${mode}",
      ${mode === "online" ? '"meetingLink": "<https://meet.example.com/...>"' : '"location": "<e.g. Lobby — 4th floor>"'}
    },
    { ... },
    { ... }
  ]
}

JSON only.`;

    const user = `Product: ${body.productName}
Product context: ${body.productContext}
Tone: ${tone}

Prospect:
- Company: ${body.companyName}
- Name: ${body.contactName}
${body.contactTitle ? `- Title: ${body.contactTitle}` : ""}

Intro email subject (sent 3 days ago, no reply yet): "${body.introEmailSubject}"

Meeting mode: ${mode === "online" ? "Online video call" : "Offline in-person"}
Timezone: ${tz}

Write the follow-up email + 3 proposed meeting slots as JSON.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.75,
      max_tokens: 1500,
    });

    const extracted = extractChatContent(completion);
    const raw = extracted.content ?? "";
    const parsed = extractJson(raw);

    const validSlots =
      parsed?.proposedSlots && Array.isArray(parsed.proposedSlots) && parsed.proposedSlots.length >= 1;

    if (!parsed?.followupSubject || !parsed?.followupBody || !validSlots) {
      const fbSlots = nextWeekdaySlots(mode, tz);
      return NextResponse.json({
        ok: true,
        followupSubject: `Re: ${body.introEmailSubject}`,
        followupBody: `Hi ${body.contactName.split(" ")[0]},

Following up on my note below — wanted to add one thing: ${body.companyName} fits the profile of teams that see the biggest lift from ${body.productName} (small marketing team, scaling content, no dedicated ops).

Pick any of the slots below and I'll send a calendar invite. If none work, reply with a window that does.

— ${sender}`,
        proposedSlots: fbSlots,
        source: "fallback",
        warning:
          extracted.error ??
          "AI returned an unparseable follow-up. Showing a proven fallback template + auto-generated meeting slots.",
      });
    }

    const proposedSlots = parsed.proposedSlots.slice(0, 3).map((s: any, i: number) => ({
      id: `slot-${i + 1}`,
      label: String(s.label ?? `Slot ${i + 1}`),
      mode,
      ...(mode === "online"
        ? { meetingLink: s.meetingLink ? String(s.meetingLink) : `https://meet.example.com/marqai-${i + 1}` }
        : { location: s.location ? String(s.location) : `Location ${i + 1}` }),
    }));

    return NextResponse.json({
      ok: true,
      followupSubject: String(parsed.followupSubject),
      followupBody: String(parsed.followupBody),
      proposedSlots,
      source: "ai",
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
