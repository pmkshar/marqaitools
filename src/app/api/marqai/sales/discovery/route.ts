// POST /api/marqai/sales/discovery
// Body: {
//   methodology: SalesMethodology, productContext: string,
//   prospectCompany: string, prospectPersona: string,
//   prospectContext?: string  // any extra known context about the prospect
// }
// Returns: {
//   ok,
//   questions: { category: string, question: string, goal: string }[],
//   source: "ai"|"fallback"
// }
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
import { extractChatContent } from "@/lib/zai-response";
import type { SalesMethodology } from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  methodology: SalesMethodology;
  productContext: string;
  prospectCompany: string;
  prospectPersona: string;
  prospectContext?: string;
}

const FRAMEWORK_CATEGORIES: Record<SalesMethodology, string[]> = {
  BANT: ["Budget", "Authority", "Need", "Timeline"],
  MEDDIC: ["Metrics", "Economic Buyer", "Decision Criteria", "Decision Process", "Identify Pain", "Champion"],
  SPIN: ["Situation", "Problem", "Implication", "Need-payoff"],
  Challenger: ["Commercial Insight", "Reframe", "Emotional Connection", "Urgency"],
  Consultative: ["Current State", "Pain", "Goals", "Desired State", "Blockers"],
};

const FALLBACK_QUESTIONS = [
  {
    category: "Situation",
    question: "Walk me through how your team currently handles marketing operations — what tools are in the stack?",
    goal: "Establish the current state and identify tool sprawl.",
  },
  {
    category: "Problem",
    question: "Where does that current setup break down for you — what's the most frustrating part?",
    goal: "Surface the prospect's primary pain point in their own words.",
  },
  {
    category: "Implication",
    question: "When that breakdown happens, what's the downstream impact — on the team, on revenue, on the timeline?",
    goal: "Magnify the pain by tying it to business outcomes.",
  },
  {
    category: "Need-payoff",
    question: "If you could solve that one thing, what would it unlock for the team this quarter?",
    goal: "Have the prospect articulate the value of solving the problem themselves.",
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.prospectCompany || !body.prospectPersona) {
      return NextResponse.json(
        { error: "Missing prospectCompany or prospectPersona" },
        { status: 400 },
      );
    }

    const methodology: SalesMethodology = body.methodology ?? "SPIN";
    const categories = FRAMEWORK_CATEGORIES[methodology];

    const sys = `You are a master of consultative discovery using the ${methodology} framework.
The ${methodology} categories are: ${categories.join(", ")}.

Generate a set of tailored discovery questions for the prospect below — one question per category, plus one or two bonus questions for the highest-leverage categories.

Return STRICT JSON only — no prose, no markdown fences:
{
  "questions": [
    {
      "category": "<one of: ${categories.join(" | ")}>",
      "question": "<the actual question, 1-2 sentences — open-ended, never yes/no>",
      "goal": "<what the rep is trying to learn from this question>"
    }
  ]
}

Rules:
- Questions must sound natural and conversational, not robotic.
- Tailor each question to the prospect's company/persona/context as much as possible.
- Open-ended only — never yes/no questions.
- The "goal" should be 1 sentence and help the rep understand WHY they're asking.
- Generate ${categories.length + 1} to ${categories.length + 2} questions total.

JSON only.`;

    const user = `Prospect company: ${body.prospectCompany}
Prospect persona: ${body.prospectPersona}
Methodology: ${methodology}
Product being sold: ${body.productContext}
${body.prospectContext ? `Research notes: ${body.prospectContext}` : ""}

Generate the ${methodology} discovery question set as JSON.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 1800,
    });

    const extracted = extractChatContent(completion);
    const raw = extracted.content ?? "";
    const parsed = extractJson(raw);

    const isValidQs =
      parsed?.questions &&
      Array.isArray(parsed.questions) &&
      parsed.questions.length >= 3 &&
      parsed.questions.every(
        (q: any) =>
          q &&
          typeof q.question === "string" &&
          typeof q.goal === "string",
      );

    if (!isValidQs) {
      return NextResponse.json({
        ok: true,
        questions: FALLBACK_QUESTIONS,
        source: "fallback",
        warning:
          extracted.error ??
          "AI returned unparseable questions — showing a generic SPIN-style fallback set.",
      });
    }

    const questions = parsed.questions
      .filter(
        (q: any) =>
          q && typeof q.question === "string" && typeof q.goal === "string",
      )
      .slice(0, 10)
      .map((q: any) => ({
        category: String(q.category ?? "Discovery"),
        question: String(q.question),
        goal: String(q.goal),
      }));

    return NextResponse.json({
      ok: true,
      questions,
      source: "ai",
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
