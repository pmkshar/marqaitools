// POST /api/marqai/sales/coach
// Body: {
//   agentName?: string, methodology: SalesMethodology, productContext: string,
//   dealName: string, prospectCompany: string, contactName?: string,
//   dealValue?: number, currency?: string, stage: string, closeDate?: string,
//   context: string  // free-form notes about the deal
// }
// Returns: {
//   ok, recommendations: DealRecommendation[], riskFactors: string[],
//   nextSteps: string[], closeProbability: number (0-100),
//   summary: string, source: "ai"|"fallback"
// }
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
import { extractChatContent } from "@/lib/zai-response";
import type {
  DealRecommendation,
  SalesMethodology,
} from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  agentName?: string;
  methodology: SalesMethodology;
  productContext: string;
  dealName: string;
  prospectCompany: string;
  contactName?: string;
  dealValue?: number;
  currency?: string;
  stage: string;
  closeDate?: string;
  context: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.dealName || !body.context) {
      return NextResponse.json(
        { error: "Missing dealName or context" },
        { status: 400 },
      );
    }

    const methodology: SalesMethodology = body.methodology ?? "MEDDIC";

    const sys = `You are a senior sales manager coaching a rep on a live deal.
Use the ${methodology} framework. Identify gaps, surface risks, and prescribe specific actions.

Return STRICT JSON only — no prose, no markdown fences:
{
  "recommendations": [
    {
      "category": "strategy" | "messaging" | "process" | "risk",
      "priority": "high" | "medium" | "low",
      "title": "<short action title, max 8 words>",
      "description": "<2-4 sentences explaining what to do and why>"
    }
  ],
  "riskFactors": [
    "<one-line risk per item, e.g. 'Economic buyer (CFO) not yet engaged'>"
  ],
  "nextSteps": [
    "<one-line action with a deadline, e.g. 'Send ROI one-pager (today)'>"
  ],
  "closeProbability": <0-100 number>,
  "summary": "<2-3 sentence coaching summary — what's working, what's at risk, what to do next>"
}

Rules:
- Produce 3-5 recommendations. At least one must be "high" priority.
- Risk factors should be specific to THIS deal, not generic.
- Next steps must be concrete + time-bound (today / this week / before next call).
- closeProbability should reflect realistic deal health (most active deals score 30-70).

JSON only.`;

    const user = `Deal being coached:
- Deal name: ${body.dealName}
- Prospect company: ${body.prospectCompany}
- Contact: ${body.contactName ?? "Unknown"}
- Deal value: ${body.dealValue ? `${body.currency ?? "USD"} ${body.dealValue.toLocaleString()}` : "Unknown"}
- Stage: ${body.stage}
- Target close date: ${body.closeDate ?? "Unknown"}
- Methodology: ${methodology}
- Product being sold: ${body.productContext}

Rep's notes about this deal:
${body.context}

Produce the ${methodology} coaching output as JSON.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.6,
      max_tokens: 2500,
    });

    const extracted = extractChatContent(completion);
    const raw = extracted.content ?? "";
    const parsed = extractJson(raw);

    const isValidRecs =
      parsed?.recommendations &&
      Array.isArray(parsed.recommendations) &&
      parsed.recommendations.length >= 1;

    if (!isValidRecs) {
      // Fallback coaching — minimal but useful.
      const fallbackRecs: DealRecommendation[] = [
        {
          category: "process",
          priority: "high",
          title: "Confirm next meeting date",
          description:
            "Without a confirmed next step on the calendar, this deal will stall. Send a calendar invite today for a follow-up before the target close date.",
        },
        {
          category: "strategy",
          priority: "medium",
          title: "Identify the economic buyer",
          description:
            "Confirm who signs the contract. If the current contact is not the economic buyer, ask them to bring that person into the next conversation.",
        },
      ];
      return NextResponse.json({
        ok: true,
        recommendations: fallbackRecs,
        riskFactors: [
          "Coaching AI returned unparseable output — recommendations are generic fallback",
        ],
        nextSteps: [
          "Confirm next meeting date (today)",
          "Identify the economic buyer (this week)",
        ],
        closeProbability: 35,
        summary:
          "AI coaching failed to parse — showing a minimal fallback. Provide more context in the deal notes and retry for a tailored coaching session.",
        source: "fallback",
        warning: extracted.error ?? "AI returned unparseable output",
      });
    }

    const recommendations: DealRecommendation[] = parsed.recommendations
      .filter(
        (r: any) =>
          r &&
          typeof r.title === "string" &&
          typeof r.description === "string",
      )
      .map((r: any) => ({
        category: (["strategy", "messaging", "process", "risk"].includes(r.category)
          ? r.category
          : "strategy") as DealRecommendation["category"],
        priority: (["high", "medium", "low"].includes(r.priority)
          ? r.priority
          : "medium") as DealRecommendation["priority"],
        title: String(r.title),
        description: String(r.description),
      }));

    const riskFactors: string[] = Array.isArray(parsed.riskFactors)
      ? parsed.riskFactors.map(String).filter(Boolean)
      : [];
    const nextSteps: string[] = Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps.map(String).filter(Boolean)
      : [];
    const closeProbabilityNum = Number(parsed.closeProbability);
    const closeProbability = isNaN(closeProbabilityNum)
      ? 40
      : Math.max(0, Math.min(100, Math.round(closeProbabilityNum)));

    return NextResponse.json({
      ok: true,
      recommendations,
      riskFactors,
      nextSteps,
      closeProbability,
      summary: String(parsed.summary ?? ""),
      source: "ai",
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
