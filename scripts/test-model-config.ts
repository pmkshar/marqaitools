// Verify that getDefaultModel() / getDefaultImageModel() / getZaiDiagnostics()
// all return the expected values, and that the model param is correctly
// surfaced in the diagnostic snapshot.
//
// Run: bun run scripts/test-model-config.ts

import { getDefaultModel, getDefaultImageModel, getZaiDiagnostics } from "../src/lib/zai";

console.log("=== Default model ===");
console.log("chat model:", getDefaultModel());
console.log("image model:", getDefaultImageModel());

console.log("\n=== Full diagnostics ===");
const diag = getZaiDiagnostics();
console.log(JSON.stringify(diag, null, 2));

console.log("\n=== Assertions ===");
const checks = [
  { name: "model is set", ok: Boolean(diag.model) },
  { name: "imageModel is set", ok: Boolean(diag.imageModel) },
  { name: "defaultModel is glm-4", ok: diag.defaultModel === "glm-4" },
  { name: "defaultImageModel is cogview-3-plus", ok: diag.defaultImageModel === "cogview-3-plus" },
  { name: "note mentions 500 error", ok: diag.note.includes("500") },
  { name: "note mentions ZAI_MODEL", ok: diag.note.includes("ZAI_MODEL") },
];

let pass = 0;
let fail = 0;
for (const c of checks) {
  console.log(`  ${c.ok ? "PASS" : "FAIL"}  ${c.name}`);
  if (c.ok) pass++;
  else fail++;
}
console.log(`\n${pass}/${checks.length} checks passed`);
process.exit(fail === 0 ? 0 : 1);
