// Quick local test: verify that adding `model: "glm-4"` makes the
// Z.AI chat completion API actually return content instead of the
// sparse {"error":{"code":"500"}} envelope.
//
// Run: bun run scripts/test-model-fix.ts

import ZAI from "z-ai-web-dev-sdk";

const apiKey = process.env.ZAI_API_KEY ?? "";
if (!apiKey) {
  console.error("ZAI_API_KEY not set — cannot test");
  process.exit(1);
}

const ZAICtor = ZAI as any;
const zai = new ZAICtor({
  baseUrl: "https://api.z.ai/api/paas/v4",
  apiKey,
});

async function call(label: string, body: any) {
  console.log(`\n=== ${label} ===`);
  console.log("Request body keys:", Object.keys(body));
  try {
    const raw = await zai.chat.completions.create(body);
    const preview = JSON.stringify(raw).slice(0, 200);
    const content = raw?.choices?.[0]?.message?.content ?? "";
    console.log("HTTP ok, response preview:", preview);
    console.log("Extracted content:", content.slice(0, 100));
    if (raw?.error) {
      console.log("ERROR envelope detected:", JSON.stringify(raw.error));
    }
  } catch (e: any) {
    console.log("Exception:", e?.message ?? String(e));
  }
}

async function main() {
  // 1. NO model — should reproduce the 500 envelope
  await call("WITHOUT model param", {
    messages: [
      { role: "system", content: "Reply with: PONG" },
      { role: "user", content: "ping" },
    ],
    max_tokens: 10,
    temperature: 0,
  });

  // 2. WITH model=glm-4 — should return PONG
  await call("WITH model=glm-4", {
    model: "glm-4",
    messages: [
      { role: "system", content: "Reply with: PONG" },
      { role: "user", content: "ping" },
    ],
    max_tokens: 10,
    temperature: 0,
  });

  // 3. WITH model=glm-4-flash — should also work (free tier)
  await call("WITH model=glm-4-flash", {
    model: "glm-4-flash",
    messages: [
      { role: "system", content: "Reply with: PONG" },
      { role: "user", content: "ping" },
    ],
    max_tokens: 10,
    temperature: 0,
  });
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
