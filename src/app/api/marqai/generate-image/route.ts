import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultImageModel } from "@/lib/zai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface GenerateImageBody {
  prompt: string;
  size?: string;
}

// Different Z.AI plan tiers expose different image models. We try them in
// order until one works. This list was built by observing which models
// succeed on different account types (sandbox vs production, free vs paid).
// Adding a new model here means it'll automatically be tried for every
// image generation request.
const IMAGE_MODEL_CANDIDATES = [
  "cogview-4-flash", // free tier on z.ai international (some accounts)
  "cogview-4",       // paid, available on most plans
  "cogview-3-plus",  // paid, available on most plans
  "cogview-3-flash", // BigModel China only — last resort for CN deployments
];

export async function POST(req: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = (await req.json()) as GenerateImageBody;
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const zai = await getZai();

    // Build the list of model names to try. If ZAI_IMAGE_MODEL env var is
    // explicitly set, try ONLY that model. Otherwise try our candidate list.
    const envModel = getDefaultImageModel();
    const modelsToTry = envModel ? [envModel] : IMAGE_MODEL_CANDIDATES;

    // The Z.AI SDK has a quirk: if the API returns an error response
    // (e.g. 1211 Unknown Model), the SDK throws "Cannot read properties
    // of undefined (reading 'map')" because it tries to iterate
    // result.data before checking for an error field. We catch this and
    // move on to the next model candidate.
    let lastError = "";
    for (const model of modelsToTry) {
      try {
        const result: any = await zai.images.generations.create({
          model,
          prompt,
          size: size as any,
        });

        // The SDK downloads the image and returns it as base64.
        const item = result?.data?.[0];
        const base64 = item?.base64;
        const url = item?.url;

        if (base64) {
          const dataUrl = `data:image/png;base64,${base64}`;
          return NextResponse.json({
            ok: true,
            url: dataUrl,
            base64,
            format: "png",
            model,
            source: "zai",
          });
        }
        if (url) {
          return NextResponse.json({ ok: true, url, model, source: "zai" });
        }
        // No image data — try the next model
        lastError = `Model ${model}: no image data in response`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // 1211 = Unknown Model, or SDK crash on missing data field — try next
        if (msg.includes("1211") || msg.includes("reading 'map'") || msg.includes("Unknown Model")) {
          lastError = `Model ${model}: ${msg}`;
          continue;
        }
        // Any other error (auth, rate limit, network) — break to fallback
        lastError = `Model ${model}: ${msg}`;
        break;
      }
    }

    // FALLBACK: Pollinations.ai — free, no API key required, works on any
    // deployment. Used when Z.AI image generation is unavailable (e.g. the
    // user's Z.AI plan doesn't include any cogview models, which is the
    // case on the free Z.AI international tier that only includes chat).
    // Returns a real PNG image fetched and converted to base64 data URL
    // so it works identically to the Z.AI path on the client side.
    //
    // Pollinations can rate-limit (429) or be slow (15-30s). We retry up
    // to 3 times with backoff. If all retries fail, we generate a
    // deterministic SVG placeholder so the user always gets an image.
    const [w, h] = size.split("x").map((n) => parseInt(n, 10) || 1024);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const seed = Math.floor(Math.random() * 1000000);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          prompt.slice(0, 500),
        )}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
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
            source: "pollinations",
            warning: `Z.AI image generation unavailable on your plan (${lastError}). Used Pollinations.ai free fallback instead. Upgrade your Z.AI plan or set ZAI_IMAGE_MODEL to enable Z.AI cogview generation.`,
          });
        }
        if (imgRes.status === 429 || imgRes.status >= 500) {
          // Retryable — wait and try again
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

    // FINAL FALLBACK: generate a deterministic SVG placeholder based on the
    // prompt hash so the user always gets a visual result. Not AI-generated
    // but at least renders something distinctive per prompt.
    try {
      const svg = generateSvgPlaceholder(prompt, w, h);
      const base64 = Buffer.from(svg).toString("base64");
      const dataUrl = `data:image/svg+xml;base64,${base64}`;
      return NextResponse.json({
        ok: true,
        url: dataUrl,
        base64,
        format: "svg",
        source: "placeholder",
        warning: `Z.AI image gen unavailable on your plan and Pollinations.ai rate-limited. Returned an SVG placeholder. Upgrade your Z.AI plan to enable real AI image generation.`,
      });
    } catch (e) {
      lastError += ` | SVG placeholder error: ${e instanceof Error ? e.message : String(e)}`;
    }

    return NextResponse.json(
      {
        error: `Image generation failed. Z.AI: ${lastError}. Set ZAI_IMAGE_MODEL env var to a model name your Z.AI plan supports (e.g. cogview-4, cogview-3-plus).`,
      },
      { status: 502 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Generates a deterministic SVG placeholder image based on the prompt hash.
 * Used as a last-resort fallback when both Z.AI and Pollinations.ai fail.
 * Returns a colorful abstract gradient with the prompt text overlaid.
 */
function generateSvgPlaceholder(prompt: string, w: number, h: number): string {
  // Simple hash → hue
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) - hash + prompt.charCodeAt(i)) | 0;
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360;
  const hue3 = (hue1 + 180) % 360;
  const safeText = prompt.slice(0, 60).replace(/[<>&"']/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue1}, 70%, 55%)"/>
      <stop offset="50%" stop-color="hsl(${hue2}, 70%, 50%)"/>
      <stop offset="100%" stop-color="hsl(${hue3}, 70%, 45%)"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * 0.25}" cy="${h * 0.3}" r="${Math.min(w, h) * 0.12}" fill="rgba(255,255,255,0.2)"/>
  <circle cx="${w * 0.75}" cy="${h * 0.7}" r="${Math.min(w, h) * 0.18}" fill="rgba(0,0,0,0.15)"/>
  <text x="${w / 2}" y="${h / 2}" font-family="Inter, system-ui, sans-serif" font-size="${Math.floor(Math.min(w, h) / 18)}" fill="white" text-anchor="middle" font-weight="700">${safeText}</text>
  <text x="${w / 2}" y="${h / 2 + Math.floor(Math.min(w, h) / 14)}" font-family="Inter, system-ui, sans-serif" font-size="${Math.floor(Math.min(w, h) / 32)}" fill="rgba(255,255,255,0.7)" text-anchor="middle">placeholder image</text>
</svg>`;
}
