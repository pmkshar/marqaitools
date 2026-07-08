// GET /api/debug/zai-image
//
// Probes the Z.AI image generation API with a list of candidate model
// names and returns the raw API response for each. Used to diagnose
// which image models are available on the user's Z.AI plan.
//
// Returns: { ok, baseUrl, keyMasked, probes: [{ model, status, body }] }
import { NextResponse } from "next/server";
import { getZai } from "@/lib/zai";

export const runtime = "nodejs";
export const maxDuration = 60;

const CANDIDATE_MODELS = [
  "cogview-4-flash",
  "cogview-4",
  "cogview-4-250", // newer naming convention sometimes seen
  "cogview-3-plus",
  "cogview-3-flash",
  "cogview-2",
  "cogview",
  // try without model too
];

export async function GET() {
  const probes: Array<{ model: string; status: number; body: any }> = [];

  try {
    const zai: any = await getZai();
    const baseUrl = zai.config?.baseUrl ?? "unknown";
    const apiKey = zai.config?.apiKey ?? "";

    for (const model of [...CANDIDATE_MODELS, "(no model)"]) {
      try {
        const body: any = { prompt: "test", size: "1024x1024" };
        if (model !== "(no model)") body.model = model;

        // Direct fetch — bypass SDK so we can see the raw API response
        const res = await fetch(`${baseUrl}/images/generations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "X-Z-AI-From": "Z",
          },
          body: JSON.stringify(body),
        });
        const text = await res.text();
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text.slice(0, 500);
        }
        probes.push({ model, status: res.status, body: parsed });
      } catch (e) {
        probes.push({
          model,
          status: 0,
          body: { error: e instanceof Error ? e.message : String(e) },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      baseUrl,
      keyMasked: apiKey ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}` : "<empty>",
      probes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
