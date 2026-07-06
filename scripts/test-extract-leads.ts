// Test extractChatContent against a real leads-generation call.
import { getZai } from "/home/z/my-project/src/lib/zai";
import { extractChatContent } from "/home/z/my-project/src/lib/zai-response";
import { extractLeads } from "/home/z/my-project/src/lib/json-utils";

async function main() {
  const zai = await getZai();
  const raw = await zai.chat.completions.create({
    messages: [
      { role: "system", content: 'Return JSON: {"leads":[{"companyName":"Acme","score":80}]}. Generate 3 B2B companies that would buy CRM software.' },
      { role: "user", content: "Product: CRM software" },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  console.log("=== RAW RESPONSE KEYS ===");
  console.log(Object.keys(raw));
  console.log("\n=== RAW choices[0] ===");
  console.log(JSON.stringify(raw.choices?.[0], null, 2));
  console.log("\n=== EXTRACTED CONTENT ===");
  const ext = extractChatContent(raw);
  console.log("Shape:", ext.shape);
  console.log("Error:", ext.error);
  console.log("Content length:", ext.content.length);
  console.log("Content preview:", ext.content.slice(0, 200));
  console.log("\n=== EXTRACTED LEADS ===");
  const leads = extractLeads(ext.content);
  console.log(`Found ${leads.length} leads:`);
  console.log(JSON.stringify(leads, null, 2));
}

main();
