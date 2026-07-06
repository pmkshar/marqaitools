import { NextRequest, NextResponse } from "next/server";
import { getZai } from "@/lib/zai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  task:
    | "social-post"
    | "email-subject"
    | "email-body"
    | "video-script"
    | "hashtags"
    | "seo-meta"
    | "ad-copy";
  prompt: string;
  platform?: string;
  tone?: string;
  audience?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.task || !body.prompt) {
      return NextResponse.json({ error: "Missing task or prompt" }, { status: 400 });
    }

    const sys = `You are Marqai's senior copywriter. Produce the requested marketing copy. Always return JSON with the key "output" containing the result string (or a stringified list where appropriate). No prose, no code fences.`;
    const user = buildPrompt(body);

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    const text =
      (parsed && (parsed.output || (Array.isArray(parsed) ? parsed.join("\n") : JSON.stringify(parsed)))) ||
      raw.trim();

    return NextResponse.json({ ok: true, text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildPrompt(b: Body): string {
  switch (b.task) {
    case "social-post":
      return `Write a single high-engagement social post for ${b.platform ?? "Twitter/X"}.
Tone: ${b.tone ?? "confident, concise, no hype"}.
Audience: ${b.audience ?? "B2B marketers and founders"}.
Topic / brief: ${b.prompt}
Constraints: under 280 chars if Twitter, else under 600 chars. Include 2-4 relevant hashtags at the end. Return JSON: {"output": "<post text>"}.`;
    case "email-subject":
      return `Write 5 email subject line options for this brief. Each under 60 chars. Return JSON: {"output": "<line1>\\n<line2>\\n<line3>\\n<line4>\\n<line5>"}.
Brief: ${b.prompt}`;
    case "email-body":
      return `Write a full HTML email body for this brief. Keep it scannable: short paragraphs, one H2, one CTA button. Return JSON: {"output": "<html string>"}.
Brief: ${b.prompt}`;
    case "video-script":
      return `Write a short marketing video script (3-5 scenes). For each scene return {index, text (voiceover), visual (on-screen description)}. Return JSON: {"output": "<json array as string>"}. Brief: ${b.prompt}`;
    case "hashtags":
      return `Suggest 12 relevant hashtags for this content brief, ranked by reach potential. Return JSON: {"output": "<tag1>\\n<tag2>..."}.
Brief: ${b.prompt}`;
    case "seo-meta":
      return `Write a SEO meta title (<=60 chars) and meta description (<=155 chars) for this URL/topic. Return JSON: {"output": "TITLE: <title>\\nDESCRIPTION: <desc>"}.
Topic: ${b.prompt}`;
    case "ad-copy":
      return `Write 3 Facebook/Instagram ad copy variations (headline + body + CTA) for this brief. Return JSON: {"output": "<var1 as headline | body | cta>\\n<var2>\\n<var3>"}.
Brief: ${b.prompt}`;
    default:
      return `Return JSON {"output": "${b.prompt}"}`;
  }
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
