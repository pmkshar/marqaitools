// Test extractChatContent against the real Z.AI API response.
import { getZai } from "/home/z/my-project/src/lib/zai";
import { extractChatContent } from "/home/z/my-project/src/lib/zai-response";

async function main() {
  const zai = await getZai();
  const raw = await zai.chat.completions.create({
    messages: [
      { role: "system", content: "Reply with exactly: PONG" },
      { role: "user", content: "ping" },
    ],
    max_tokens: 10,
    temperature: 0,
  });

  console.log("=== RAW RESPONSE KEYS ===");
  console.log(Object.keys(raw));
  console.log("\n=== RAW RESPONSE (first 500 chars) ===");
  console.log(JSON.stringify(raw).slice(0, 500));
  console.log("\n=== EXTRACTED ===");
  const ext = extractChatContent(raw);
  console.log(JSON.stringify(ext, null, 2));
}

main();
