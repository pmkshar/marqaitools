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
          });
        }
        if (url) {
          return NextResponse.json({ ok: true, url, model });
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
        // Any other error (auth, rate limit, network) — fail fast
        return NextResponse.json({ error: msg, model }, { status: 500 });
      }
    }

    return NextResponse.json(
      {
        error: `No image model worked on your Z.AI plan. Tried: ${modelsToTry.join(", ")}. Last error: ${lastError}. Set ZAI_IMAGE_MODEL env var to a model name your plan supports (e.g. cogview-4, cogview-3-plus).`,
      },
      { status: 502 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
