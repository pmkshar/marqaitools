// POST /api/marqai/generate-website
// Body: { brandName, product, audience?, palette?, tone? }
// Returns: { sections: [{type, html}], html: string }
//
// Uses ZAI to draft copy + section HTML, then assembles a self-contained
// HTML document the client can preview / download.
import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import type { WebsiteSection } from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  brandName: string;
  product: string;
  audience?: string;
  palette?: string[];
  tone?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.brandName || !body.product) {
      return NextResponse.json({ error: "Missing brandName or product" }, { status: 400 });
    }

    const palette = body.palette?.length ? body.palette : ["#0d9488", "#14b8a6", "#f59e0b"];
    const tone = body.tone ?? "confident, clear, benefit-led";

    const sys = `You are Marqai's senior landing-page copywriter. Produce conversion-optimized marketing copy for a multi-section landing page. Return strict JSON: {"sections":[{"type":"hero"|"features"|"pricing"|"testimonial"|"faq"|"cta","html":"<section html>"}]}. Use only inline-styled HTML suitable for direct embedding. Do not include <html> or <body> tags. Each section must be visually self-contained. No prose outside the JSON.`;
    const user = `Brand: ${body.brandName}
Product/Service: ${body.product}
Target audience: ${body.audience ?? "B2B marketing teams and founders"}
Tone: ${tone}
Palette (use these colors): ${palette.join(", ")}

Generate 6 sections:
1. hero — headline + subheadline + primary CTA
2. features — 3 feature cards (icon optional, headline + description)
3. testimonial — one customer quote + name + title
4. pricing — 3 tiers with feature bullets
5. faq — 4 Q&As
6. cta — final conversion section with email capture

Return strict JSON.`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 3500,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    const sections: WebsiteSection[] =
      parsed?.sections?.map((s: any, i: number) => ({
        type: (s.type ?? "hero") as WebsiteSection["type"],
        html: String(s.html ?? ""),
      })) ?? [];

    if (sections.length === 0) {
      return NextResponse.json({ error: "AI returned no sections" }, { status: 502 });
    }

    const fullHtml = assembleHtmlDocument(body, sections, palette);
    return NextResponse.json({ ok: true, sections, html: fullHtml });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function assembleHtmlDocument(b: Body, sections: WebsiteSection[], palette: string[]): string {
  const [primary, secondary, accent] = palette;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(b.brandName)} — ${escapeHtml(b.product)}</title>
<meta name="description" content="${escapeHtml(b.product)} by ${escapeHtml(b.brandName)}."/>
<style>
  :root { --p: ${primary}; --s: ${secondary}; --a: ${accent}; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; background: #ffffff; line-height: 1.6; }
  .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
  section { padding: 64px 0; border-bottom: 1px solid #f1f5f9; }
  h1, h2, h3 { line-height: 1.2; margin: 0 0 12px; color: #0f172a; }
  h1 { font-size: clamp(2rem, 5vw, 3.25rem); }
  h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); }
  p  { margin: 0 0 12px; color: #475569; }
  .btn { display: inline-block; padding: 12px 24px; background: var(--p); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
  .btn:hover { background: var(--s); }
  .grid { display: grid; gap: 24px; }
  .grid-3 { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .card { padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; }
  .card .icon { font-size: 24px; margin-bottom: 8px; }
  .testimonial { background: #f8fafc; padding: 48px; border-radius: 16px; text-align: center; }
  .pricing-tier { padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; text-align: center; }
  .pricing-tier.featured { border-color: var(--p); box-shadow: 0 10px 30px -10px var(--p); }
  .price { font-size: 2.5rem; font-weight: 700; margin: 12px 0; color: var(--p); }
  .faq-item { padding: 16px 0; border-bottom: 1px solid #e2e8f0; }
  .cta { background: linear-gradient(135deg, var(--p), var(--s)); color: #fff; text-align: center; }
  .cta h2, .cta p { color: #fff; }
  .cta input { padding: 12px 16px; border-radius: 8px; border: none; font-size: 1rem; min-width: 280px; }
  .footer { padding: 32px 0; text-align: center; color: #64748b; font-size: 0.875rem; }
  @media (max-width: 640px) { .pricing-tier { padding: 24px; } .cta input { min-width: 0; width: 100%; margin-bottom: 8px; } }
</style>
</head>
<body>
${sections.map((s) => `<!-- ${s.type} -->\n${s.html}`).join("\n\n")}
<footer class="footer">
  <div class="container">© ${new Date().getFullYear()} ${escapeHtml(b.brandName)}. All rights reserved. Built with Marqai Website Builder.</div>
</footer>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
