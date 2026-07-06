import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  toolName: string;
  toolUrl: string;
  toolType:
    | "chatbot"
    | "image-gen"
    | "video-gen"
    | "agent"
    | "rag"
    | "code-assistant"
    | "voice"
    | "other";
  customTestCases?: string;
  focusAreas?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.toolName || !body.toolUrl) {
      return NextResponse.json(
        { error: "Missing toolName or toolUrl" },
        { status: 400 },
      );
    }

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: buildUserPrompt(body) },
      ],
      temperature: 0.4,
      max_tokens: 3200,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const json = extractJson(raw);
    if (!json) {
      return NextResponse.json({ error: "Parse failed", raw }, { status: 502 });
    }
    return NextResponse.json({ ok: true, report: json });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function systemPrompt(): string {
  return `You are Marqai's AI QA lead. You design and run objective test cases against AI tools (chatbots, image generators, video generators, agents, RAG systems, code assistants, voice tools). For each tool you produce a detailed report card with category scores, individual test case results, strengths, weaknesses, and prioritized recommendations. Always return STRICT JSON ONLY — no prose, no code fences.`;
}

function buildUserPrompt(b: Body): string {
  return `Produce a detailed AI tool test report for:
- toolName: "${b.toolName}"
- toolUrl: "${b.toolUrl}"
- toolType: "${b.toolType}"
- focusAreas: ${b.focusAreas || "all"}
- customTestCases (consider these too): ${b.customTestCases || "none"}

Return JSON with EXACTLY this shape:
{
  "toolName": string,
  "toolUrl": string,
  "toolType": "${b.toolType}",
  "overallScore": number (0-100),
  "grade": "A+"|"A"|"B"|"C"|"D"|"F",
  "summary": string (3-5 sentences),
  "categories": [{ "category": string, "score": number, "maxScore": 100, "findings": string[] }],
  "testCases": [{ "id": "tc1", "name": string, "prompt": string, "expectedBehavior": string, "actualBehavior": string, "status": "pass"|"partial"|"fail", "latencyMs": number, "notes": string }],
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": [{ "title": string, "description": string, "priority": "high"|"medium"|"low" }],
  "benchmarkComparison": [{ "metric": string, "thisTool": number, "industryAvg": number, "unit": string }]
}

Requirements:
- 5-7 categories relevant to the tool type (e.g. Accuracy, Latency, Safety, Reasoning, Cost, UX, Context handling, Hallucination rate, Output diversity).
- 6-10 testCases with realistic prompts and outcomes.
- 4-6 strengths, 4-6 weaknesses.
- 4-6 recommendations.
- 4-6 benchmarkComparison rows.
- Make scores and metrics internally consistent. Be critical but fair.`;
}

function extractJson(text: string): any | null {
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
