// Debug what the Stripe+LinkedIn searches actually return.
import ZAI from "z-ai-web-dev-sdk";

async function main() {
  const zai = await ZAI.create();
  const linkedinUrl = "https://www.linkedin.com/in/patrickcollison";
  const slug = linkedinUrl.split("/in/")[1]?.split(/[/?#]/)[0] ?? "";
  console.log("slug:", slug);

  const queries = [
    `${slug.replace(/[-_]/g, " ")} Stripe email`,
    "Stripe CEO founder leadership team",
    "Stripe site:linkedin.com/in",
  ];

  for (const q of queries) {
    console.log(`\n=== Query: "${q}" ===`);
    const r = await zai.functions.invoke("web_search", { query: q, num: 5 });
    if (Array.isArray(r)) {
      r.forEach((x, i) => {
        console.log(`  [${i}] url=${x.url}`);
        console.log(`      name=${(x.name ?? "").slice(0, 80)}`);
        console.log(`      snippet=${(x.snippet ?? "").slice(0, 150)}`);
      });
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
