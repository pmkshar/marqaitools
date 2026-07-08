// POST /api/marqai/sales/objection
// Body: {
//   objection: string,  // verbatim objection from the prospect
//   category?: ObjectionCategory,
//   productName?: string, productContext?: string,
//   tone?: string, methodology?: string
// }
// Returns: {
//   ok,
//   objection: string, category: ObjectionCategory,
//   responses: { approach: string, script: string }[],  // 3 distinct approaches
//   source: "ai"|"fallback"
// }
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
import { extractChatContent } from "@/lib/zai-response";
import type { ObjectionCategory } from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  objection: string;
  category?: ObjectionCategory;
  productName?: string;
  productContext?: string;
  tone?: string;
  methodology?: string;
}

const CATEGORY_HINTS: Record<ObjectionCategory, string> = {
  price: "Reframe from cost to value/ROI. Anchor to total cost of ownership vs alternatives.",
  timing: "Make the cost of delay concrete. Tie to a business event (funding, fiscal year, launch).",
  competitor: "Acknowledge the competitor's strength. Counter with switching cost vs staying cost.",
  authority: "Help the rep get to the economic buyer without bypassing the current contact.",
  need: "Surface the underlying pain the prospect may not have articulated yet.",
  trust: "Provide evidence (case study, customer name, metric, guarantee).",
  complexity: "Reduce perceived risk via pilot, phased rollout, or white-glove onboarding.",
  other: "Diagnose the real concern behind the objection before responding.",
};

function classifyObjection(objection: string): ObjectionCategory {
  const o = objection.toLowerCase();
  if (/(price|expensive|cost|budget|afford|cheap)/.test(o)) return "price";
  if (/(timing|not now|later|next quarter|next year|too soon|too early)/.test(o)) return "timing";
  if (/(hubspot|salesforce|competitor|already using|incumbent|other vendor|alternative)/.test(o))
    return "competitor";
  if (/(boss|cfo|ceo|decision|approve|sign off|authority|higher.up)/.test(o)) return "authority";
  if (/(don't need|not a fit|not for us|no need|don't see the value|why do i need)/.test(o))
    return "need";
  if (/(trust|proven|reliable|risk|security|case study|reference)/.test(o)) return "trust";
  if (/(complex|complicated|hard to implement|onboarding|integration|migration)/.test(o))
    return "complexity";
  return "other";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.objection) {
      return NextResponse.json(
        { error: "Missing objection" },
        { status: 400 },
      );
    }

    const category: ObjectionCategory =
      body.category ?? classifyObjection(body.objection);
    const tone = body.tone ?? "Empathetic, confident, never dismissive";

    const sys = `You are a sales enablement coach. The rep has just heard an objection and needs three distinct response strategies.

Objection category: ${category}.
Strategy hint for this category: ${CATEGORY_HINTS[category]}.
Tone for all scripts: ${tone}.
${body.productContext ? `Product context: ${body.productContext}` : ""}

Return STRICT JSON only — no prose, no markdown fences:
{
  "category": "${category}",
  "responses": [
    {
      "approach": "<2-4 word label for the approach, e.g. 'Acknowledge + reframe'>",
      "script": "<2-3 sentence verbatim script the rep can say to the prospect>"
    },
    {
      "approach": "<different approach label>",
      "script": "<different verbatim script>"
    },
    {
      "approach": "<third approach label>",
      "script": "<third verbatim script>"
    }
  ]
}

Rules:
- Three DIFFERENT approaches — never repeat the same strategy twice.
- Scripts must sound like real spoken language, not written marketing copy.
- Never be defensive or dismissive of the prospect's concern.
- Each script ends with a question or a clear next step.
- Never claim specific numbers or customer names that aren't provided in the product context.

JSON only.`;

    const user = `Objection from prospect: "${body.objection}"
${body.productName ? `Product: ${body.productName}` : ""}

Produce the three response strategies as JSON.`;

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

    const isValidResponses =
      parsed?.responses &&
      Array.isArray(parsed.responses) &&
      parsed.responses.length >= 2 &&
      parsed.responses.every(
        (r: any) =>
          r &&
          typeof r.approach === "string" &&
          typeof r.script === "string" &&
          r.script.length > 20,
      );

    if (!isValidResponses) {
      // Fallback: 3 generic-but-useful responses
      return NextResponse.json({
        ok: true,
        objection: body.objection,
        category,
        responses: [
          {
            approach: "Acknowledge + isolate",
            script:
              "That's a fair concern. Quick check — if we could solve this one thing, is there anything else that would stop us from moving forward?",
          },
          {
            approach: "Reframe to value",
            script:
              "I hear you. The way I'd think about it is — what's the cost of NOT solving this? Most teams we work with found that the cost of the current state was higher than they realized.",
          },
          {
            approach: "Pilot to reduce risk",
            script:
              "Totally understand. What if we started with a small pilot — 14 days, no commitment — so you can see the value before making a bigger decision?",
          },
        ],
        source: "fallback",
        warning:
          extracted.error ?? "AI returned unparseable responses — showing generic fallback scripts.",
      });
    }

    const responses = parsed.responses
      .filter((r: any) => r && typeof r.script === "string" && r.script.length > 20)
      .slice(0, 4)
      .map((r: any) => ({
        approach: String(r.approach ?? "Approach"),
        script: String(r.script),
      }));

    return NextResponse.json({
      ok: true,
      objection: body.objection,
      category,
      responses,
      source: "ai",
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
