import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  title: string;
  script: string;
  style: "promo" | "explainer" | "social-short" | "tutorial" | "testimonial";
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  durationSec: number;
}

// Simulated video render — in production this would call a service like
// Runway / Pika / Synthesia / Mux. For this demo, we return:
//   - thumbnailUrl: a stock image used as the <video poster=...>
//   - videoUrl: a small royalty-free sample MP4 so the <video> element
//               actually plays in the UI (Google's sample bucket).
//   - scenes: 3-5 parsed scene cards for the storyboard panel

// Royalty-free sample MP4s (Google Cloud sample bucket — small, fast, playable)
const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.title || !body.script) {
      return NextResponse.json({ error: "Missing title or script" }, { status: 400 });
    }

    // Parse script into ~3-5 scenes
    const scenes = parseScenes(body.script, body.durationSec);

    // Simulate render time
    await new Promise((r) => setTimeout(r, 1400));

    // Pick a stock thumbnail (placeholder poster image)
    const thumbnails = [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80",
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&q=80",
    ];
    const thumbnailUrl = thumbnails[Math.floor(Math.random() * thumbnails.length)];
    const videoUrl = SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)];

    return NextResponse.json({
      ok: true,
      video: {
        scenes,
        thumbnailUrl,
        videoUrl,
        durationSec: body.durationSec,
        status: "done" as const,
        createdAt: new Date().toISOString(),
      },
      note: "Demo mode: a royalty-free sample MP4 is returned as videoUrl so the <video> element plays. In production, replace with a real render service (Runway / Pika / Mux).",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function parseScenes(script: string, totalSec: number) {
  // Split by sentence-ish; aim for 3-5 scenes
  const lines = script
    .split(/(?:\n|(?<=[.!?])\s+)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const sceneCount = Math.min(5, Math.max(3, Math.ceil(lines.length / 2)));
  const perScene = Math.max(1, Math.ceil(lines.length / sceneCount));
  const scenes: { index: number; text: string; visual: string }[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const text = lines.slice(i * perScene, (i + 1) * perScene).join(" ");
    if (!text) break;
    scenes.push({
      index: i + 1,
      text,
      visual: visualFor(i, sceneCount),
    });
  }
  return scenes;
}

function visualFor(i: number, total: number): string {
  const options = [
    "Animated title card with brand gradient",
    "Dashboard pan with floating metric callouts",
    "Split-screen before/after comparison",
    "User testimonial quote card",
    "Closing card with CTA button + logo",
  ];
  return options[i % options.length];
}
