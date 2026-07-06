// Smoke test the leads API — call Z.AI directly with the same prompt
// and inspect the raw response to diagnose "AI returned no leads".
import { getZai } from "../src/lib/zai";

async function main() {
  console.log("--- Testing leads generation with count=12 (default) ---");
  const count = 12;

  const sys = `You are Marqai's B2B lead-generation analyst. Generate a list of ${count} realistic prospect companies that would be strong potential buyers for the product below. Return strict JSON: {"leads":[{...}]}. Do NOT include any prose.`;
  const user = `Product/Service: CRM software for small businesses
Category: SaaS / B2B
Target market: Global
Criteria: Companies likely to have budget, need, and authority to buy

For each lead, return a JSON object with EXACTLY these keys:
{
  "companyName": string,
  "website": string (e.g. "acme.com" — no protocol),
  "industry": string,
  "size": "1-10" | "11-50" | "51-200" | "201-1000" | "1000+",
  "location": string (city, country),
  "linkedin": string (linkedin.com/company/slug),
  "contactName": string (likely decision-maker's full name),
  "contactTitle": string (e.g. "VP Marketing", "Head of Growth"),
  "fitReason": string (1-2 sentences explaining why this company is a fit),
  "score": number (0-100, higher = better fit)
}

Vary industries and sizes. Use real-sounding (not generic) company names. Do NOT use Fortune-100 companies — pick mid-market to upper-SMB targets. Return exactly ${count} leads. JSON only.`;

  try {
    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.85,
      max_tokens: 3500,
    });

    console.log("=== FULL COMPLETION OBJECT ===");
    console.log(JSON.stringify(completion, null, 2).slice(0, 2000));
    console.log("...");

    const raw = completion.choices?.[0]?.message?.content ?? "";
    console.log("\n=== RAW CONTENT (first 1500 chars) ===");
    console.log(raw.slice(0, 1500));
    console.log("\n=== RAW CONTENT LENGTH ===");
    console.log(raw.length, "chars");
    console.log("\n=== FINISH REASON ===");
    console.log(completion.choices?.[0]?.finish_reason ?? "(none)");
    console.log("\n=== USAGE ===");
    console.log(completion.usage ?? "(none)");
  } catch (e) {
    console.error("ERROR:", e instanceof Error ? e.message : e);
  }
}

main();
