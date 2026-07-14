// Quick test of Z.AI web_search + page_reader — see what they return and how long each takes.
import ZAI from "z-ai-web-dev-sdk";

async function main() {
  const zai = await ZAI.create();
  console.log("ZAI initialized.");

  // 1. web_search test
  const t0 = Date.now();
  try {
    const r = await zai.functions.invoke("web_search", { query: "Stripe CEO founder leadership team", num: 4 });
    console.log(`\n[web_search] ${Date.now() - t0}ms`);
    console.log("result type:", Array.isArray(r) ? "array" : typeof r);
    if (Array.isArray(r)) {
      console.log("count:", r.length);
      r.slice(0, 2).forEach((x, i) => {
        console.log(`  [${i}] url=${x.url} name=${(x.name ?? "").slice(0, 60)}`);
        console.log(`      snippet=${(x.snippet ?? "").slice(0, 100)}`);
      });
    } else {
      console.log("raw:", JSON.stringify(r).slice(0, 500));
    }
  } catch (e) {
    console.log(`[web_search] FAILED in ${Date.now() - t0}ms:`, e.message);
  }

  // 2. page_reader test on a simple site
  const t1 = Date.now();
  try {
    const r = await zai.functions.invoke("page_reader", { url: "https://stripe.com/about" });
    console.log(`\n[page_reader stripe.com/about] ${Date.now() - t1}ms`);
    if (r && r.data) {
      console.log("title:", r.data.title);
      console.log("html length:", (r.data.html ?? "").length);
      // Show first 500 chars of stripped text
      const text = (r.data.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      console.log("text preview:", text.slice(0, 300));
      // Find any email
      const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      console.log("emails found:", emails?.slice(0, 5));
    } else {
      console.log("raw:", JSON.stringify(r).slice(0, 500));
    }
  } catch (e) {
    console.log(`[page_reader] FAILED in ${Date.now() - t1}ms:`, e.message);
  }

  // 3. page_reader test on LinkedIn
  const t2 = Date.now();
  try {
    const r = await zai.functions.invoke("page_reader", { url: "https://www.linkedin.com/company/stripe" });
    console.log(`\n[page_reader linkedin.com/company/stripe] ${Date.now() - t2}ms`);
    if (r && r.data) {
      const text = (r.data.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      console.log("html length:", (r.data.html ?? "").length);
      console.log("text preview:", text.slice(0, 300));
      const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      console.log("emails found:", emails?.slice(0, 5));
    } else {
      console.log("raw:", JSON.stringify(r).slice(0, 500));
    }
  } catch (e) {
    console.log(`[page_reader linkedin] FAILED in ${Date.now() - t2}ms:`, e.message);
  }

  // 4. Native fetch test
  const t3 = Date.now();
  try {
    const res = await fetch("https://stripe.com/about", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MarqaiBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    console.log(`\n[native fetch stripe.com/about] ${Date.now() - t3}ms`);
    console.log("html length:", html.length);
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    console.log("emails found:", emails?.slice(0, 5));
    console.log("text preview:", text.slice(0, 200));
  } catch (e) {
    console.log(`[native fetch] FAILED in ${Date.now() - t3}ms:`, e.message);
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
