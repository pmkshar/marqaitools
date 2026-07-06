// Test the robust extractLeads parser against all known response shapes.
import { extractLeads, extractJson } from "../src/lib/json-utils";

const cases: Array<{ name: string; input: string; expectMin: number }> = [
  {
    name: "standard {leads: [...]}",
    input: `{"leads":[{"companyName":"Acme","score":80},{"companyName":"Beta","score":70}]}`,
    expectMin: 2,
  },
  {
    name: "wrong key {companies: [...]}",
    input: `{"companies":[{"companyName":"Acme","score":80}]}`,
    expectMin: 1,
  },
  {
    name: "wrong key {data: [...]}",
    input: `{"data":[{"companyName":"Acme","score":80}]}`,
    expectMin: 1,
  },
  {
    name: "wrong key {results: [...]}",
    input: `{"results":[{"companyName":"Acme","score":80}]}`,
    expectMin: 1,
  },
  {
    name: "bare array [...]",
    input: `[{"companyName":"Acme","score":80},{"companyName":"Beta","score":70}]`,
    expectMin: 2,
  },
  {
    name: "markdown fence ```json",
    input: '```json\n{"leads":[{"companyName":"Acme","score":80}]}\n```',
    expectMin: 1,
  },
  {
    name: "prose + JSON",
    input: `Here are the leads you requested:\n{"leads":[{"companyName":"Acme","score":80}]}\nLet me know if you need more.`,
    expectMin: 1,
  },
  {
    name: "truncated JSON (cut mid-array)",
    input: `{"leads":[{"companyName":"Acme","score":80},{"companyName":"Beta","score":70},{"companyName":"Ga`,
    expectMin: 2, // should still get Acme + Beta via regex fallback
  },
  {
    name: "trailing comma (malformed)",
    input: `{"leads":[{"companyName":"Acme","score":80,}]}`,
    expectMin: 1, // regex fallback repairs trailing comma
  },
  {
    name: "empty response",
    input: ``,
    expectMin: 0,
  },
  {
    name: "prose only, no JSON",
    input: `I cannot generate leads for this product.`,
    expectMin: 0,
  },
];

let passed = 0;
let failed = 0;
for (const c of cases) {
  const leads = extractLeads(c.input);
  const ok = leads.length >= c.expectMin;
  console.log(`${ok ? "✓" : "✗"} ${c.name} — got ${leads.length}, expected ≥ ${c.expectMin}`);
  if (!ok) {
    console.log(`   Input: ${c.input.slice(0, 100)}...`);
    failed++;
  } else {
    passed++;
  }
}
console.log(`\n${passed}/${passed + failed} passed`);
process.exit(failed === 0 ? 0 : 1);
