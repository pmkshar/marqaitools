// POST /api/marqai/generate-logo
// Body: { brandName, tagline?, industry?, style, palette, mode: "ai"|"template" }
//   - mode "ai"      → uses ZAI image generation, returns { url }
//   - mode "template" → generates an inline SVG wordmark/monogram, returns { svg }
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultImageModel } from "@/lib/zai";
import type { LogoStyle } from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  brandName: string;
  tagline?: string;
  industry?: string;
  style: LogoStyle;
  palette: string[];
  mode: "ai" | "template";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.brandName) {
      return NextResponse.json({ error: "Missing brandName" }, { status: 400 });
    }

    // ---------- TEMPLATE MODE ----------
    if (body.mode === "template") {
      const svg = buildTemplateLogo(body);
      return NextResponse.json({ ok: true, svg });
    }

    // ---------- AI MODE ----------
    const prompt = buildLogoPrompt(body);
    const zai = await getZai();

    // Different Z.AI plans expose different image models. Try a list until
    // one works. See generate-image/route.ts for full rationale.
    const IMAGE_MODELS = ["cogview-4-flash", "cogview-4", "cogview-3-plus", "cogview-3-flash"];
    const envModel = getDefaultImageModel();
    const modelsToTry = envModel ? [envModel] : IMAGE_MODELS;

    let lastError = "";
    for (const model of modelsToTry) {
      try {
        const result: any = await zai.images.generations.create({
          model,
          prompt,
          size: "1024x1024",
        });

        const item = result?.data?.[0];
        const base64 = item?.base64;
        const url = item?.url;

        if (base64) {
          const dataUrl = `data:image/png;base64,${base64}`;
          return NextResponse.json({ ok: true, url: dataUrl, base64, format: "png", prompt, model, source: "zai" });
        }
        if (url) {
          return NextResponse.json({ ok: true, url, prompt, model, source: "zai" });
        }
        lastError = `Model ${model}: no image data in response`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("1211") || msg.includes("reading 'map'") || msg.includes("Unknown Model")) {
          lastError = `Model ${model}: ${msg}`;
          continue;
        }
        lastError = `Model ${model}: ${msg}`;
        break;
      }
    }

    // FALLBACK: Pollinations.ai — free, no API key required. Used when Z.AI
    // image generation is unavailable on the user's plan.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const seed = Math.floor(Math.random() * 1000000);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          prompt.slice(0, 500),
        )}?width=1024&height=1024&nologo=true&seed=${seed}`;
        const imgRes = await fetch(pollinationsUrl, { signal: AbortSignal.timeout(45000) });
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buf).toString("base64");
          const dataUrl = `data:image/png;base64,${base64}`;
          return NextResponse.json({
            ok: true,
            url: dataUrl,
            base64,
            format: "png",
            prompt,
            source: "pollinations",
            warning: `Z.AI image generation unavailable on your plan (${lastError}). Used Pollinations.ai free fallback instead.`,
          });
        }
        if (imgRes.status === 429 || imgRes.status >= 500) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        lastError += ` | Pollinations HTTP ${imgRes.status}`;
        break;
      } catch (e) {
        lastError += ` | Pollinations attempt ${attempt + 1}: ${e instanceof Error ? e.message : String(e)}`;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }

    // FINAL FALLBACK: generate an SVG template-style logo using the brand
    // palette so the user always gets something usable as a logo.
    const fallbackSvg = buildTemplateLogo(body);
    const fbBase64 = Buffer.from(fallbackSvg).toString("base64");
    const fbDataUrl = `data:image/svg+xml;base64,${fbBase64}`;
    return NextResponse.json({
      ok: true,
      svg: fallbackSvg,
      url: fbDataUrl,
      prompt,
      source: "template-fallback",
      warning: `Z.AI image gen unavailable on your plan and Pollinations.ai rate-limited. Returned an SVG template logo. Switch to "Template" mode for instant SVG logos, or upgrade your Z.AI plan to enable AI image generation.`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildLogoPrompt(b: Body): string {
  const stylePhrases: Record<LogoStyle, string> = {
    minimal: "minimal flat logo, single color, lots of whitespace, refined geometric mark",
    wordmark: "clean wordmark logo, custom letterforms, balanced weight, premium typography",
    emblem: "emblem badge logo, vintage crest, contained within a circular or shield border",
    mascot: "mascot logo, friendly character illustration, expressive and approachable",
    abstract: "abstract geometric logo mark, modern, distinctive silhouette, no text",
    monogram: "monogram logo, intertwined initials, elegant serif, luxury feel",
    gradient: "modern gradient logo, vibrant color blend, soft shapes, tech-startup aesthetic",
  };
  const palette = b.palette?.length ? `palette: ${b.palette.join(", ")}` : "";
  return [
    `Professional logo for a brand named "${b.brandName}"`,
    b.tagline ? `(tagline: "${b.tagline}")` : "",
    b.industry ? `industry: ${b.industry}` : "",
    `Style: ${stylePhrases[b.style] ?? stylePhrases.minimal}`,
    palette,
    "centered, simple background, vector quality, no watermark, no text artifacts",
    "high resolution, suitable for use as a brand logo",
  ].filter(Boolean).join(", ");
}

function buildTemplateLogo(b: Body): string {
  const primary = b.palette?.[0] ?? "#0d9488";
  const secondary = b.palette?.[1] ?? "#14b8a6";
  const accent = b.palette?.[2] ?? "#f59e0b";

  const initials = b.brandName
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const W = 480;
  const H = 240;
  const taglineY = 165;
  const nameY = 130;

  // Different template per style
  switch (b.style) {
    case "monogram":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
        <rect width="${W}" height="${H}" fill="#ffffff"/>
        <circle cx="${W/2}" cy="${H/2 - 10}" r="60" fill="${primary}"/>
        <text x="${W/2}" y="${H/2 + 8}" font-family="Georgia, serif" font-size="48" fill="#ffffff" text-anchor="middle" font-weight="700">${initials}</text>
        <text x="${W/2}" y="${H - 35}" font-family="Inter, system-ui, sans-serif" font-size="16" fill="${primary}" text-anchor="middle" letter-spacing="2">${escapeXml(b.brandName.toUpperCase())}</text>
        ${b.tagline ? `<text x="${W/2}" y="${H - 15}" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">${escapeXml(b.tagline)}</text>` : ""}
      </svg>`;

    case "emblem":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
        <rect width="${W}" height="${H}" fill="#ffffff"/>
        <circle cx="${W/2}" cy="${H/2 - 5}" r="78" fill="none" stroke="${primary}" stroke-width="3"/>
        <circle cx="${W/2}" cy="${H/2 - 5}" r="68" fill="${primary}"/>
        <text x="${W/2}" y="${H/2 - 15}" font-family="Georgia, serif" font-size="32" fill="#ffffff" text-anchor="middle" font-weight="700">${escapeXml(initials)}</text>
        <text x="${W/2}" y="${H/2 + 20}" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#ffffff" text-anchor="middle" letter-spacing="3">EST · ${new Date().getFullYear()}</text>
        <text x="${W/2}" y="${H - 25}" font-family="Georgia, serif" font-size="20" fill="${primary}" text-anchor="middle" font-weight="600">${escapeXml(b.brandName)}</text>
        ${b.tagline ? `<text x="${W/2}" y="${H - 5}" font-family="Inter, system-ui, sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${escapeXml(b.tagline)}</text>` : ""}
      </svg>`;

    case "abstract":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
        <rect width="${W}" height="${H}" fill="#ffffff"/>
        <g transform="translate(${W/2 - 40}, 40)">
          <circle cx="40" cy="40" r="38" fill="${primary}"/>
          <circle cx="60" cy="50" r="28" fill="${secondary}" opacity="0.85"/>
          <circle cx="50" cy="65" r="18" fill="${accent}" opacity="0.7"/>
        </g>
        <text x="${W/2}" y="${nameY + 30}" font-family="Inter, system-ui, sans-serif" font-size="24" fill="${primary}" text-anchor="middle" font-weight="700">${escapeXml(b.brandName)}</text>
        ${b.tagline ? `<text x="${W/2}" y="${taglineY + 20}" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">${escapeXml(b.tagline)}</text>` : ""}
      </svg>`;

    case "gradient":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${primary}"/>
            <stop offset="100%" stop-color="${secondary}"/>
          </linearGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="#ffffff"/>
        <rect x="${W/2 - 40}" y="40" width="80" height="80" rx="20" fill="url(#g1)"/>
        <text x="${W/2}" y="100" font-family="Inter, system-ui, sans-serif" font-size="34" fill="#ffffff" text-anchor="middle" font-weight="700">${escapeXml(initials)}</text>
        <text x="${W/2}" y="${nameY + 30}" font-family="Inter, system-ui, sans-serif" font-size="26" fill="${primary}" text-anchor="middle" font-weight="700">${escapeXml(b.brandName)}</text>
        ${b.tagline ? `<text x="${W/2}" y="${taglineY + 20}" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">${escapeXml(b.tagline)}</text>` : ""}
      </svg>`;

    case "minimal":
    case "wordmark":
    case "mascot":
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
        <rect width="${W}" height="${H}" fill="#ffffff"/>
        <rect x="${W/2 - 140}" y="60" width="8" height="60" fill="${primary}"/>
        <text x="${W/2 - 120}" y="${nameY}" font-family="Inter, system-ui, sans-serif" font-size="36" fill="${primary}" font-weight="800">${escapeXml(b.brandName)}</text>
        ${b.tagline ? `<text x="${W/2 - 120}" y="${taglineY}" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#64748b" letter-spacing="2">${escapeXml(b.tagline.toUpperCase())}</text>` : ""}
        ${b.industry ? `<text x="${W/2 - 120}" y="${taglineY + 25}" font-family="Inter, system-ui, sans-serif" font-size="11" fill="${secondary}" letter-spacing="1">${escapeXml(b.industry.toUpperCase())}</text>` : ""}
      </svg>`;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
