// POST /api/marqai/sales/qualify
// Body: {
//   methodology: "BANT"|"MEDDIC"|"SPIN"|"Challenger"|"Consultative",
//   productContext: string,
//   lead: { companyName, contactName, contactTitle, industry, size, location, fitReason },
//   researchNotes?: string  // any extra context the rep has gathered
// }
// Returns: {
//   ok, qualification: BANTQualification,
//   summary: string,            // 1-paragraph qualification narrative
//   recommendedNextStep: string,
//   discoveryQuestions: string[]  // 3-5 questions to ask next
// }
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
import { extractChatContent } from "@/lib/zai-response";
import type { BANTQualification, SalesMethodology } from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface LeadInput {
  companyName?: string;
  contactName?: string;
  contactTitle?: string;
  industry?: string;
  size?: string;
  location?: string;
  fitReason?: string;
  email?: string;
  website?: string;
  linkedin?: string;
}

interface Body {
  methodology: SalesMethodology;
  productContext: string;
  lead: LeadInput;
  researchNotes?: string;
}

const PILLAR_LABELS: Record<SalesMethodology, string[]> = {
  BANT: ["Budget", "Authority", "Need", "Timeline"],
  MEDDIC: ["Metrics", "Economic Buyer", "Decision Criteria", "Decision Process", "Identify Pain", "Champion"],
  SPIN: ["Situation", "Problem", "Implication", "Need-payoff"],
  Challenger: ["Commercial Insight", "Reframe", "Emotional Connection", "Urgency"],
  Consultative: ["Pain", "Goals", "Current State", "Desired State", "Blockers"],
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.lead || !body.productContext) {
      return NextResponse.json(
        { error: "Missing lead or productContext" },
        { status: 400 },
      );
    }

    const methodology: SalesMethodology = body.methodology ?? "BANT";
    const pillars = PILLAR_LABELS[methodology];

    const sys = `You are a senior sales analyst specializing in ${methodology} qualification.
Product being sold: ${body.productContext}

Analyze the lead below and produce a structured ${methodology} qualification.
The pillars of ${methodology} are: ${pillars.join(", ")}.

Return STRICT JSON only — no prose, no markdown fences:
{
  "qualification": {
    "budget": "<inferred budget signal, or 'Unknown — needs discovery' if unclear>",
    "authority": "<inferred authority/decision-maker signal, or 'Unknown'>",
    "need": "<inferred business need, the strongest pillar — usually derivable from industry + size + fitReason>",
    "timeline": "<inferred buying timeline, or 'Unknown'>",
    "score": <0-100 fit score>,
    "notes": "<one-sentence summary of fit>"
  },
  "summary": "<2-4 sentence qualification narrative>",
  "recommendedNextStep": "<one specific action the rep should take this week>",
  "discoveryQuestions": [
    "<3-5 specific questions the rep should ask to fill the unknown pillars>"
  ]
}

Scoring guide:
- 80-100: Strong fit on 3+ pillars. Move to demo.
- 60-79:  Solid fit on 2 pillars. Continue discovery.
- 40-59:  Weak signals. Nurture or quick disqualify.
- 0-39:   Likely not a fit. Disqualify politely.

JSON only.`;

    const user = `Lead:
- Company: ${body.lead.companyName ?? "Unknown"}
- Contact: ${body.lead.contactName ?? "Unknown"} (${body.lead.contactTitle ?? "title n/a"})
- Industry: ${body.lead.industry ?? "Unknown"}
- Size: ${body.lead.size ?? "Unknown"}
- Location: ${body.lead.location ?? "Unknown"}
- Fit reason (from lead-gen): ${body.lead.fitReason ?? "n/a"}
- Website: ${body.lead.website ?? "n/a"}
- LinkedIn: ${body.lead.linkedin ?? "n/a"}

Research notes from rep:
${body.researchNotes ?? "(none)"}

Produce the ${methodology} qualification as JSON.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.55,
      max_tokens: 1800,
    });

    const extracted = extractChatContent(completion);
    const raw = extracted.content ?? "";
    const parsed = extractJson(raw);

    if (!parsed || !parsed.qualification) {
      // Fallback: synthesize a minimal qualification so the UI works.
      const fallbackQual: BANTQualification = {
        budget: "Unknown — needs discovery",
        authority: body.lead.contactTitle ?? "Unknown",
        need: body.lead.fitReason ?? "Unknown",
        timeline: "Unknown — needs discovery",
        score: 45,
        notes: `Auto-generated fallback. ${methodology} qualification could not be parsed from the AI response.`,
      };
      return NextResponse.json({
        ok: true,
        qualification: fallbackQual,
        summary:
          "AI qualification parsing failed — showing a minimal fallback. Try again or refine the lead context.",
        recommendedNextStep:
          "Send a short discovery email asking about the prospect's current marketing stack and biggest pain point.",
        discoveryQuestions: [
          `What's the biggest marketing challenge ${body.lead.companyName ?? "your team"} is facing this quarter?`,
          "Who else is involved in evaluating new marketing tools?",
          "What's your timeline for making a decision?",
        ],
        source: "fallback",
        warning: extracted.error ?? "AI returned unparseable output",
      });
    }

    const q = parsed.qualification;
    const scoreNum = Number(q.score);
    const qualification: BANTQualification = {
      budget: q.budget ? String(q.budget) : undefined,
      authority: q.authority ? String(q.authority) : undefined,
      need: q.need ? String(q.need) : undefined,
      timeline: q.timeline ? String(q.timeline) : undefined,
      score: isNaN(scoreNum) ? 50 : Math.max(0, Math.min(100, Math.round(scoreNum))),
      notes: q.notes ? String(q.notes) : undefined,
    };

    return NextResponse.json({
      ok: true,
      qualification,
      summary: String(parsed.summary ?? ""),
      recommendedNextStep: String(parsed.recommendedNextStep ?? ""),
      discoveryQuestions: Array.isArray(parsed.discoveryQuestions)
        ? parsed.discoveryQuestions.map(String).slice(0, 5)
        : [],
      source: "ai",
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
