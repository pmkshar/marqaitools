// POST /api/marqai/generate-website
// Body: { brandName, product, audience?, palette?, tone? }
// Returns: { ok: true, sections: [{type, html}], html: string, source: "ai"|"fallback" }
//
// Uses ZAI to draft copy + section HTML, then assembles a self-contained
// HTML document the client can preview / download. Falls back to a
// template-generated landing page if the AI is unavailable.
import { NextRequest, NextResponse } from "next/server";
import { getZai } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
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

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    const sections: WebsiteSection[] =
      parsed?.sections?.map((s: any, i: number) => ({
        type: (s.type ?? "hero") as WebsiteSection["type"],
        html: String(s.html ?? ""),
      })) ?? [];

    // If AI returned no sections, fall back to a template-generated page.
    if (sections.length === 0) {
      const fallbackSections = buildFallbackSections(body, palette);
      const fullHtml = assembleHtmlDocument(body, fallbackSections, palette);
      return NextResponse.json({
        ok: true,
        sections: fallbackSections,
        html: fullHtml,
        source: "fallback",
        warning: `AI returned no parseable sections. Showing template landing page.`,
      });
    }

    const fullHtml = assembleHtmlDocument(body, sections, palette);
    return NextResponse.json({ ok: true, sections, html: fullHtml, source: "ai" });
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

/**
 * Template-generated landing-page sections — used when the AI is
 * unavailable or returns unparseable output. Produces a clean, branded
 * 6-section page so the UI always has something to show.
 */
function buildFallbackSections(b: Body, palette: string[]): WebsiteSection[] {
  const [primary] = palette;
  const safeBrand = escapeHtml(b.brandName);
  const safeProduct = escapeHtml(b.product);
  const safeAudience = escapeHtml(b.audience ?? "modern teams");

  return [
    {
      type: "hero",
      html: `<section><div class="container" style="text-align:center;padding:96px 0;"><h1>${safeBrand} — ${safeProduct} for ${safeAudience}</h1><p style="font-size:1.25rem;max-width:720px;margin:0 auto 24px;">Grow faster with a streamlined, modern platform built for ${safeAudience}. Set up in minutes, scale with confidence.</p><a class="btn" href="#" style="background:${primary};">Start free trial</a></div></section>`,
    },
    {
      type: "features",
      html: `<section><div class="container"><h2 style="text-align:center;">Why teams choose ${safeBrand}</h2><div class="grid grid-3" style="margin-top:32px;"><div class="card"><div class="icon">⚡</div><h3>Fast</h3><p>Optimized for speed and reliability at every scale.</p></div><div class="card"><div class="icon">🔒</div><h3>Secure</h3><p>Enterprise-grade security with audit logs and SSO.</p></div><div class="card"><div class="icon">📈</div><h3>Scalable</h3><p>From your first user to your millionth, we scale with you.</p></div></div></div></section>`,
    },
    {
      type: "testimonial",
      html: `<section><div class="container"><div class="testimonial"><p style="font-size:1.5rem;font-style:italic;">"${safeBrand} transformed how our team ships. We saw a 40% lift in productivity in the first month."</p><p style="margin-top:16px;"><strong>Alex Chen</strong> — VP Engineering, TechCorp</p></div></div></section>`,
    },
    {
      type: "pricing",
      html: `<section><div class="container"><h2 style="text-align:center;">Simple pricing</h2><div class="grid grid-3" style="margin-top:32px;"><div class="pricing-tier"><h3>Starter</h3><div class="price">$29</div><p>For small teams</p><p>Up to 5 users<br>Basic analytics<br>Email support</p></div><div class="pricing-tier featured"><h3>Pro</h3><div class="price">$99</div><p>For growing teams</p><p>Up to 25 users<br>Advanced analytics<br>Priority support</p></div><div class="pricing-tier"><h3>Enterprise</h3><div class="price">Custom</div><p>For large orgs</p><p>Unlimited users<br>SSO + audit logs<br>Dedicated CSM</p></div></div></div></section>`,
    },
    {
      type: "faq",
      html: `<section><div class="container" style="max-width:800px;"><h2 style="text-align:center;">FAQ</h2><div class="faq-item"><h3>How does the free trial work?</h3><p>14 days, no credit card required. Full access to all Pro features.</p></div><div class="faq-item"><h3>Can I change plans later?</h3><p>Yes — upgrade or downgrade anytime. Changes apply on the next billing cycle.</p></div><div class="faq-item"><h3>Do you offer discounts?</h3><p>Annual plans get 20% off. Non-profits get 50% off.</p></div><div class="faq-item"><h3>How do I cancel?</h3><p>One click in your dashboard. No emails, no retention calls.</p></div></div></section>`,
    },
    {
      type: "cta",
      html: `<section class="cta"><div class="container"><h2>Ready to get started?</h2><p>Join thousands of teams using ${safeBrand}.</p><form style="margin-top:24px;"><input type="email" placeholder="you@company.com"/><button class="btn" style="background:#fff;color:${primary};margin-left:8px;">Get started</button></form></div></section>`,
    },
  ];
}
