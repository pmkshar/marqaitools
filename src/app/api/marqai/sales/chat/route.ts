// POST /api/marqai/sales/chat
// Body: {
//   agentName: string, agentType: SalesAgentType, methodology: SalesMethodology,
//   systemPrompt: string, productContext: string, tone: string,
//   prospectCompany?: string, prospectContact?: string, prospectTitle?: string,
//   stage: SalesConversationStage,
//   messages: { role, content }[],
//   userInput: string, userInputRole?: "user" | "prospect"
// }
// Returns: { ok, reply, stage, qualification?, intent?, methodologyNote?, sentiment? }
//
// Single-shot conversational turn. History is passed in; agent returns
// the next best message + optional stage / qualification updates.
// Robust parsing: if the model doesn't return strict JSON, fall back to
// the raw text so the conversation never dead-ends.
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
import { extractChatContent } from "@/lib/zai-response";
import type { SalesConversationStage, BANTQualification } from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface InMessage {
  role: "agent" | "prospect" | "user";
  content: string;
}

interface Body {
  agentName: string;
  agentType: string;
  methodology: string;
  systemPrompt: string;
  productContext: string;
  tone: string;
  prospectCompany?: string;
  prospectContact?: string;
  prospectTitle?: string;
  stage: SalesConversationStage;
  messages: InMessage[];
  userInput: string;
  userInputRole?: "user" | "prospect";
}

const STAGE_PROMPTS: Record<SalesConversationStage, string> = {
  discovery:
    "You are in DISCOVERY. Understand the prospect's situation, pain, and buying context. Do NOT pitch the product yet. Ask one focused question per turn.",
  qualification:
    "You are in QUALIFICATION. Confirm BANT/MEDDIC signals explicitly. Surface any missing pillars. Move to demo only when qualification is solid.",
  demo:
    "You are in DEMO. Tailor every feature you show to a pain the prospect has shared. Do not do a feature tour. Close the demo with a recap and a proposal-stage CTA.",
  proposal:
    "You are in PROPOSAL. Frame pricing in terms of value and ROI, not features. Pre-empt common objections. Always propose a clear next step.",
  negotiation:
    "You are in NEGOTIATION. Hold the line on value; trade concessions for commitments. Never discount without getting something in return.",
  "closed-won":
    "The deal is closed-won. Be warm, set expectations for onboarding, and ask for a referral or case study commitment.",
  "closed-lost":
    "The deal is closed-lost. Be gracious, ask for feedback, leave the door open, and request a LinkedIn connection.",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.userInput) {
      return NextResponse.json({ error: "Missing userInput" }, { status: 400 });
    }
    if (!body.systemPrompt) {
      return NextResponse.json({ error: "Missing systemPrompt" }, { status: 400 });
    }

    const userInputRole = body.userInputRole ?? "user";
    const history = (body.messages ?? []).slice(-12).map((m) => ({
      role: (m.role === "agent" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    }));

    const sys = `${body.systemPrompt}

You are operating as: ${body.agentName} (${body.agentType} agent).
Methodology: ${body.methodology}.
Tone: ${body.tone}.
Product context: ${body.productContext}

${body.prospectCompany ? `Prospect company: ${body.prospectCompany}` : ""}
${body.prospectContact ? `Prospect contact: ${body.prospectContact}` : ""}
${body.prospectTitle ? `Prospect title: ${body.prospectTitle}` : ""}
Current conversation stage: ${body.stage}

${STAGE_PROMPTS[body.stage] ?? ""}

Reply with STRICT JSON only — no prose, no markdown fences. Shape:
{
  "reply": "<what you say next to the prospect, 1-3 sentences>",
  "stage": "<one of: discovery | qualification | demo | proposal | negotiation | closed-won | closed-lost>",
  "qualification": {
    "budget": "<short string or null>",
    "authority": "<short string or null>",
    "need": "<short string or null>",
    "timeline": "<short string or null>",
    "score": <0-100 number>,
    "notes": "<one-sentence summary>"
  },
  "intent": "<one-word intent label>",
  "methodologyNote": "<which methodology pillar this turn advances>",
  "sentiment": "positive | neutral | negative"
}

Rules:
- "reply" must be 1-3 sentences — what you would literally say next.
- Only advance "stage" when the prospect has clearly signaled readiness. Otherwise keep the same stage.
- "qualification" is cumulative — fill in any pillars you can infer from the conversation so far.
- "qualification.score" is a 0-100 fit score. Start at 30 if nothing is known; raise as pillars are confirmed.
- Output JSON only.`;

    const user = `${userInputRole === "prospect" ? "Prospect says:" : "Rep instructs:"} ${body.userInput}

Conversation so far (most recent last):
${history.map((m) => `${m.role === "assistant" ? "AGENT" : "PROSPECT/REP"}: ${m.content}`).join("\n") || "(no prior messages)"}

What should the agent say or do next? Return JSON.`;

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

    const fallbackReply = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim() || "Could you say a bit more about that so I can make sure I understand?";

    const reply: string = parsed?.reply ?? fallbackReply;
    const stage: SalesConversationStage = (parsed?.stage as SalesConversationStage) ?? body.stage;

    let qualification: BANTQualification | undefined;
    if (parsed?.qualification && typeof parsed.qualification === "object") {
      const q = parsed.qualification;
      const scoreNum = Number(q.score);
      qualification = {
        budget: q.budget ? String(q.budget) : undefined,
        authority: q.authority ? String(q.authority) : undefined,
        need: q.need ? String(q.need) : undefined,
        timeline: q.timeline ? String(q.timeline) : undefined,
        score: isNaN(scoreNum) ? 30 : Math.max(0, Math.min(100, Math.round(scoreNum))),
        notes: q.notes ? String(q.notes) : undefined,
      };
    }

    return NextResponse.json({
      ok: true,
      reply,
      stage,
      ...(qualification ? { qualification } : {}),
      ...(parsed?.intent ? { intent: String(parsed.intent) } : {}),
      ...(parsed?.methodologyNote ? { methodologyNote: String(parsed.methodologyNote) } : {}),
      ...(parsed?.sentiment ? { sentiment: String(parsed.sentiment) } : {}),
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
