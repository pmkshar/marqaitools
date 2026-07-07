// POST /api/marqai/sales/outreach
// Body: {
//   productName: string, targetPersona: string, tone?: string,
//   prospectCompany?: string, prospectContact?: string,
//   prospectTitle?: string, prospectContext?: string,  // specific research about the prospect
//   stepCount?: number (4-6, default 5),
//   channels?: ("email"|"linkedin"|"call"|"task")[],
//   methodology?: "Consultative"|"Challenger"|"SPIN"
// }
// Returns: {
//   ok, sequence: { name, cadence, steps: OutreachStep[] },
//   source: "ai"|"fallback"
// }
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
import { extractChatContent } from "@/lib/zai-response";
import type { OutreachStep, OutreachChannel } from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  productName: string;
  targetPersona: string;
  tone?: string;
  prospectCompany?: string;
  prospectContact?: string;
  prospectTitle?: string;
  prospectContext?: string;
  stepCount?: number;
  channels?: OutreachChannel[];
  methodology?: string;
}

const CHANNEL_LABELS: Record<OutreachChannel, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  call: "Phone call",
  task: "Manual task (reminder / prep)",
};

const FALLBACK_SEQUENCE_STEPS: OutreachStep[] = [
  {
    index: 1,
    channel: "email",
    delayDays: 0,
    subject: "Quick question about {{company}}",
    body:
      "Hi {{first_name}} — saw {{observation}}. Most {{persona}} in {{industry}} tell me {{pain}}. Worth a 15-min call this week? — {{sender}}",
    goal: "Open with a specific observation. Soft CTA.",
  },
  {
    index: 2,
    channel: "linkedin",
    delayDays: 3,
    body:
      "Saw your recent post on {{topic}} — really useful. Quick question: is {{pain}} on your radar this quarter? Curious because we just helped two similar teams solve it.",
    goal: "Warm the LinkedIn channel with a real question.",
  },
  {
    index: 3,
    channel: "email",
    delayDays: 5,
    subject: "Re: Quick question about {{company}}",
    body:
      "Following up — happy to share what {{similar_customer}} saw when they tackled this. Short version: {{quantified_outcome}}. Worth 15 min this week? — {{sender}}",
    goal: "Add social proof + quantify value. Sharper CTA.",
  },
  {
    index: 4,
    channel: "call",
    delayDays: 7,
    body:
      "Cold call script: 'Hi {{first_name}}, it's {{sender}} from {{company}}. I sent you a note about {{pain}} — is now an OK time for a 2-minute pitch, or should I call back?' If yes: 'Most {{persona}} tell me {{pain}}. We help with that. Worth a real conversation?'",
    goal: "Live conversation. Leave a 10-sec voicemail if no pickup.",
  },
  {
    index: 5,
    channel: "email",
    delayDays: 8,
    subject: "Closing the loop",
    body:
      "Last note from me, {{first_name}}. If this isn't a priority this quarter, no worries — I'll stop reaching out. If it is, reply 'yes' and I'll send a calendar link. Either way, good luck with {{recent_event}}. — {{sender}}",
    goal: "Breakup email. Trigger replies from prospects who were procrastinating.",
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.productName || !body.targetPersona) {
      return NextResponse.json(
        { error: "Missing productName or targetPersona" },
        { status: 400 },
      );
    }

    const stepCount = Math.min(Math.max(body.stepCount ?? 5, 4), 6);
    const channels = body.channels?.length
      ? body.channels
      : (["email", "linkedin", "call"] as OutreachChannel[]);
    const tone = body.tone ?? "Direct, specific, no fluff";
    const methodology = body.methodology ?? "Consultative";

    const sys = `You are a top-performing account executive who writes cold outreach that gets replies.
Methodology: ${methodology}. Tone: ${tone}.

Build a ${stepCount}-step multi-channel outreach sequence for the product below.
Channels available: ${channels.map((c) => CHANNEL_LABELS[c]).join(", ")}.
Use a mix of channels — never two emails in a row. Always end with a breakup email.

Rules for every step:
1. Open with a specific, researched observation (never "I hope this finds you well").
2. Tie the observation to a concrete business pain.
3. Soft CTA in steps 1-2 (worth a call?), sharper CTA in steps 3-4 (15-min Thursday?).
4. Step 5 (or last step) = breakup email ("I'll stop reaching out — reply 'yes' if interested").
5. Use {{first_name}}, {{company}}, {{sender}} as merge tags.

Return STRICT JSON only — no prose, no markdown fences:
{
  "name": "<short sequence name, e.g. 'VP Marketing — SaaS consolidation'>",
  "cadence": "<e.g. 'Day 1, Day 4, Day 9, Day 16, Day 24'>",
  "steps": [
    {
      "index": 1,
      "channel": "email" | "linkedin" | "call" | "task",
      "delayDays": <number — days after the previous step>,
      "subject": "<for email only>",
      "body": "<the actual message / script>",
      "goal": "<one sentence — what this step is trying to achieve>"
    }
  ]
}

JSON only.`;

    const user = `Product: ${body.productName}
Target persona: ${body.targetPersona}
Tone: ${tone}
${body.prospectCompany ? `Specific prospect: ${body.prospectCompany}` : "No specific prospect — sequence will be templatized for any prospect matching the persona."}
${body.prospectContact ? `Contact name: ${body.prospectContact}` : ""}
${body.prospectTitle ? `Contact title: ${body.prospectTitle}` : ""}
${body.prospectContext ? `Research notes about this prospect: ${body.prospectContext}` : ""}

Build the ${stepCount}-step sequence as JSON.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.8,
      max_tokens: 3500,
    });

    const extracted = extractChatContent(completion);
    const raw = extracted.content ?? "";
    const parsed = extractJson(raw);

    const isValidSteps =
      parsed?.steps &&
      Array.isArray(parsed.steps) &&
      parsed.steps.length >= 3 &&
      parsed.steps.every(
        (s: any) =>
          s &&
          typeof s.body === "string" &&
          typeof s.channel === "string" &&
          ["email", "linkedin", "call", "task"].includes(s.channel),
      );

    if (!isValidSteps) {
      // Fallback to a static template sequence
      return NextResponse.json({
        ok: true,
        sequence: {
          name: `${body.targetPersona.slice(0, 40)} — outreach`,
          cadence: "Day 1, Day 4, Day 9, Day 16, Day 24",
          steps: FALLBACK_SEQUENCE_STEPS,
        },
        source: "fallback",
        warning:
          extracted.error ??
          "AI returned unparseable sequence. Showing a proven fallback template — replace {{merge_tags}} with real values before sending.",
      });
    }

    const steps: OutreachStep[] = parsed.steps.map((s: any, i: number) => ({
      index: typeof s.index === "number" ? s.index : i + 1,
      channel: s.channel as OutreachChannel,
      delayDays: typeof s.delayDays === "number" ? Math.max(0, s.delayDays) : i === 0 ? 0 : 3,
      subject: s.subject ? String(s.subject) : undefined,
      body: String(s.body ?? ""),
      goal: String(s.goal ?? ""),
    }));

    return NextResponse.json({
      ok: true,
      sequence: {
        name: String(parsed.name ?? `${body.targetPersona.slice(0, 40)} — outreach`),
        cadence: String(parsed.cadence ?? `Day 1, ${steps.map((s, i) => `Day ${steps.slice(0, i + 1).reduce((a, b) => a + b.delayDays, 0)}`).join(", ")}`),
        steps,
      },
      source: "ai",
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
