// Smoke test the getZai() helper — verify both fallback paths:
//   1. Without ZAI_API_KEY → falls back to file-based loader (uses /etc/.z-ai-config)
//   2. With ZAI_API_KEY → uses direct instantiation
import { getZai, resetZaiCache } from "../src/lib/zai";

async function main() {
  // Strategy 1: no env var → should use /etc/.z-ai-config (sandbox-only).
  console.log("--- Test 1: no ZAI_API_KEY (should fall back to file loader) ---");
  resetZaiCache();
  delete process.env.ZAI_API_KEY;
  try {
    const zai = await getZai();
    console.log("OK: got instance via file loader");
    const r = await zai.chat.completions.create({
      messages: [{ role: "user", content: "Reply with the single word: PONG" }],
      max_tokens: 10,
      temperature: 0,
    });
    console.log("  chat response:", r.choices?.[0]?.message?.content?.slice(0, 50));
  } catch (e) {
    console.error("FAIL:", e instanceof Error ? e.message : e);
  }

  // Strategy 2: env var set → should use direct instantiation.
  // Use the sandbox's known-good creds (from /etc/.z-ai-config) so the
  // smoke test actually validates the request flow.
  console.log("\n--- Test 2: ZAI_API_KEY set (should use direct instantiation) ---");
  resetZaiCache();
  process.env.ZAI_API_KEY = "Z.ai";
  process.env.ZAI_BASE_URL = "https://internal-api.z.ai/v1";
  try {
    const zai = await getZai();
    console.log("OK: got instance via env-var path");
    const r = await zai.chat.completions.create({
      messages: [{ role: "user", content: "Reply with the single word: PONG" }],
      max_tokens: 10,
      temperature: 0,
    });
    console.log("  chat response:", r.choices?.[0]?.message?.content?.slice(0, 50));
  } catch (e) {
    console.error("FAIL:", e instanceof Error ? e.message : e);
  }
}

main();
