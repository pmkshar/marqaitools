// Probe the international z.ai endpoint with multiple models
// to determine if the user's new key is a real international key
// or still a BigModel China key that happens to be recognized on both.

const models = [
  'glm-4-flash',
  'glm-4-flashx',
  'glm-4-air',
  'glm-4-airx',
  'glm-4',
  'glm-4-long',
  'glm-4-plus',
  'glm-4.5',
  'glm-4.6',
  'glm-4v',          // vision
  'glm-4v-flash',
  'glm-4v-plus',
  'glm-zero-preview',
  'glm-4-0520',
];

async function probe(baseUrl, label) {
  console.log(`\n========== ${label} (${baseUrl}) ==========`);
  const key = process.env.PROBE_KEY;
  if (!key) {
    console.error('PROBE_KEY env var not set');
    return;
  }
  for (const model of models) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 8,
        }),
      });
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = { raw: text.slice(0, 200) }; }
      const err = parsed?.error;
      if (err) {
        console.log(`  ${model.padEnd(20)} HTTP ${res.status}  err=${err.code} ${String(err.message).slice(0, 80)}`);
      } else if (parsed?.choices?.length) {
        const content = parsed.choices[0]?.message?.content || '';
        console.log(`  ${model.padEnd(20)} HTTP ${res.status}  OK ✓  content="${String(content).slice(0, 40)}"`);
      } else {
        console.log(`  ${model.padEnd(20)} HTTP ${res.status}  shape=${JSON.stringify(parsed).slice(0, 100)}`);
      }
    } catch (e) {
      console.log(`  ${model.padEnd(20)} NETWORK ERROR ${e.message}`);
    }
  }
}

(async () => {
  await probe('https://api.z.ai/api/paas/v4', 'INTERNATIONAL z.ai');
  await probe('https://open.bigmodel.cn/api/paas/v4', 'BIGMODEL CHINA');
})();
