import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzeBody {
  url: string;
  mode?: "seo" | "website";
}

export async function POST(req: NextRequest) {
  try {
    const { url, mode = "seo" } = (await req.json()) as AnalyzeBody;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    const systemPrompt = `You are Marqai's senior SEO & web performance auditor. Given a target URL, produce a comprehensive ${mode} analysis as JSON. If you cannot fetch live data, infer realistic values for the domain based on the URL and your knowledge. Always return strict JSON only — no prose, no code fences.`;

    const userPrompt =
      mode === "seo" ? buildSeoPrompt(normalizedUrl) : buildWebsitePrompt(normalizedUrl);

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 2400,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const json = extractJson(raw);

    if (!json) {
      return NextResponse.json(
        { error: "Failed to parse analysis", raw },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      report: json,
      analyzedAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildSeoPrompt(url: string): string {
  return `Analyze the SEO of "${url}". Return JSON with EXACTLY this shape:
{
  "url": "${url}",
  "overallScore": number,
  "scores": { "performance": number, "seo": number, "accessibility": number, "bestPractices": number, "content": number, "mobile": number },
  "meta": { "title": string, "titleLength": number, "description": string, "descriptionLength": number, "canonical": string, "robots": string, "ogTitle": string, "ogDescription": string, "ogImage": string },
  "headnings": { "h1": string[], "h2": string[], "h3": string[] },
  "keywords": [{ "keyword": string, "density": number, "count": number }],
  "backlinks": number,
  "domainAuthority": number,
  "pageAuthority": number,
  "loadTimeMs": number,
  "pageSizeKb": number,
  "findings": [{ "id": string, "category": "critical"|"warning"|"info"|"passed", "title": string, "description": string, "recommendation": string }],
  "missingAnalytics": string[],
  "topPages": [{ "url": string, "traffic": number, "change": number }],
  "competitors": [{ "domain": string, "overlap": number, "traffic": number }]
}
Notes:
- "headnings" is intentionally spelled that way — use that key.
- missingAnalytics should list things like "GA4 not detected", "GTM missing", "Search Console not verified", "Schema.org markup missing", "Sitemap.xml not found", "robots.txt allows all".
- Provide 6-10 findings across categories.
- Make the data realistic for the domain.`;
}

function buildWebsitePrompt(url: string): string {
  return `Analyze the website "${url}". Return JSON with EXACTLY this shape:
{
  "url": "${url}",
  "techStack": [{ "name": string, "category": string, "confidence": number }],
  "performance": { "lcp": number, "cls": number, "fcp": number, "ttfb": number, "speedIndex": number, "tbt": number },
  "traffic": { "monthlyVisits": number, "visitsChange": number, "avgVisitDuration": string, "bounceRate": number, "pagesPerVisit": number },
  "trafficByCountry": [{ "country": string, "code": string, "share": number }],
  "trafficSources": [{ "source": string, "share": number, "visits": number }],
  "topPages": [{ "url": string, "visits": number, "share": number }],
  "keywords": [{ "keyword": string, "position": number, "volume": number, "intent": string }],
  "competitors": [{ "domain": string, "overlap": number, "visits": number }],
  "missingFeatures": [{ "feature": string, "severity": "high"|"medium"|"low", "impact": string }],
  "recommendations": [{ "title": string, "description": string, "priority": number }],
  "socialPresence": [{ "platform": "twitter"|"linkedin"|"facebook"|"instagram"|"youtube"|"tiktok"|"pinterest", "handle": string, "followers": number, "activity": string }],
  "securityScore": number,
  "mobileScore": number
}
Notes:
- Provide 4-6 techStack entries, 4-5 trafficByCountry, 4-5 trafficSources, 4-5 topPages, 6-8 keywords, 3-5 competitors, 4-6 missingFeatures, 5-8 recommendations.
- Be realistic for the domain.`;
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
