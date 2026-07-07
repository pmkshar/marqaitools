"use client";

export function ApiReferenceDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <section>
        <h4 className="text-base font-bold mb-2 text-slate-700">1. Authentication</h4>
        <p className="mb-2">
          Marqai uses NextAuth.js with the credentials provider. After login, the session is stored as an HTTP-only JWT cookie named <code className="bg-muted px-1 rounded">next-auth.session-token</code>.
        </p>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto"><code>{`POST /api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

email=user@example.com&password=...&csrfToken=...`}</code></pre>
        <p className="mt-2">Returns: 302 redirect with <code className="bg-muted px-1 rounded">Set-Cookie: next-auth.session-token=...</code>.</p>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-slate-700">2. Common Patterns</h4>
        <div className="space-y-2">
          <div><strong>Headers:</strong> <code className="bg-muted px-1 rounded">Content-Type: application/json</code>, <code className="bg-muted px-1 rounded">Cookie: next-auth.session-token=...</code></div>
          <div><strong>Success:</strong> <code className="bg-muted px-1 rounded">{"{ ok: true, data: { ... } }"}</code></div>
          <div><strong>Error:</strong> <code className="bg-muted px-1 rounded">{"{ ok: false, error: { code, message } }"}</code></div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Code</th>
                <th className="text-left p-2 border">HTTP</th>
                <th className="text-left p-2 border">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["unauthorized", "401", "No session or session expired"],
                ["forbidden", "403", "Session valid but lacks RBAC permission"],
                ["credits_exhausted", "402", "Plan's AI credit limit reached"],
                ["seat_limit_reached", "402", "Plan's seat limit reached"],
                ["invalid_input", "400", "Zod validation failed"],
                ["not_found", "404", "Resource not found in caller's organization"],
                ["rate_limited", "429", "Too many requests"],
                ["internal_error", "500", "Unexpected server error"],
              ].map(([c, h, m]) => (
                <tr key={c}>
                  <td className="p-2 border font-mono text-[10px]">{c}</td>
                  <td className="p-2 border font-mono">{h}</td>
                  <td className="p-2 border">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-slate-700">3. AI Routes</h4>

        <div className="space-y-4">
          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/analyze</div>
            <div className="text-xs text-muted-foreground mt-1">Run an SEO audit OR a website analysis. Permission: seo:execute or analyzer:execute. Cost: 5 (SEO) / 10 (website) credits.</div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`{
  "mode": "seo",           // or "website"
  "url": "https://example.com"
}`}</code></pre>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/generate-image</div>
            <div className="text-xs text-muted-foreground mt-1">Generate a marketing image. Permission: images:execute+. Cost: 8 credits.</div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`{
  "prompt": "Flat-lay of skincare products on marble background",
  "size": "1024x1024",
  "style": "photorealistic"
}`}</code></pre>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/generate-content</div>
            <div className="text-xs text-muted-foreground mt-1">Generate marketing copy. Permission: social:execute / email:execute / videos:execute. Cost: 2 credits.</div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`{
  "type": "social-post",  // or "email-subject" | "email-body" | "video-script" | "hashtags"
  "platform": "linkedin",
  "topic": "Launch of our new AI feature",
  "tone": "professional",
  "count": 3
}`}</code></pre>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/generate-video</div>
            <div className="text-xs text-muted-foreground mt-1">Generate a video storyboard + thumbnail. Permission: videos:execute+. Cost: 25 credits.</div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`{
  "title": "Product Launch Teaser",
  "script": "Introducing our new AI feature...",
  "style": "promo",
  "aspectRatio": "16:9"
}`}</code></pre>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/send-email</div>
            <div className="text-xs text-muted-foreground mt-1">Send an email campaign (simulated). Permission: email:manage. Cost: 0.</div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`{
  "campaignId": "camp-xxx",
  "sendNow": true
}`}</code></pre>
          </div>

          <div className="rounded-md border p-3 bg-primary/5">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/sales/chat</div>
            <div className="text-xs text-muted-foreground mt-1">
              Run one conversational turn with an AI sales agent. Returns the agent's reply, updated stage, and BANT/MEDDIC qualification deltas. Permission: sales-agents:execute+.
            </div>
          </div>

          <div className="rounded-md border p-3 bg-primary/5">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/sales/qualify</div>
            <div className="text-xs text-muted-foreground mt-1">
              One-shot BANT/MEDDIC/SPIN qualification for a lead. Returns a 0-100 fit score, summary, recommended next step, and 3-5 discovery questions. Permission: sales-agents:execute+.
            </div>
          </div>

          <div className="rounded-md border p-3 bg-primary/5">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/sales/outreach</div>
            <div className="text-xs text-muted-foreground mt-1">
              Generate a 4-6 step multi-channel outreach sequence (email + LinkedIn + call) personalized to a buyer persona. Permission: sales-agents:execute+.
            </div>
          </div>

          <div className="rounded-md border p-3 bg-primary/5">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/sales/coach</div>
            <div className="text-xs text-muted-foreground mt-1">
              Coach an active deal using MEDDIC. Returns prioritized recommendations, risk factors, next steps, and a 0-100 close probability. Permission: sales-agents:execute+.
            </div>
          </div>

          <div className="rounded-md border p-3 bg-primary/5">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/sales/objection</div>
            <div className="text-xs text-muted-foreground mt-1">
              Generate three distinct response strategies for any sales objection. Auto-classifies the objection category (price, timing, competitor, etc.). Permission: sales-agents:execute+.
            </div>
          </div>

          <div className="rounded-md border p-3 bg-primary/5">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/sales/discovery</div>
            <div className="text-xs text-muted-foreground mt-1">
              Generate a tailored set of SPIN/BANT/MEDDIC discovery questions for a prospect. Each question comes with a "goal" explaining what the rep is trying to learn. Permission: sales-agents:execute+.
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/test-ai-tool</div>
            <div className="text-xs text-muted-foreground mt-1">
              Run the AI tool testing suite. Permission: ai-testing:execute+. Cost: 50 credits.
              The test prompt now follows Marqai's 33-item testing taxonomy (14 strategies + 10 methodologies + 9 AI scenarios)
              — each test case is tagged with the AI scenario it maps to. Tool type can be any of:
              <code className="bg-muted px-1 mx-1 rounded">chatbot</code>
              <code className="bg-muted px-1 mx-1 rounded">image-gen</code>
              <code className="bg-muted px-1 mx-1 rounded">video-gen</code>
              <code className="bg-muted px-1 mx-1 rounded">agent</code>
              <code className="bg-muted px-1 mx-1 rounded">rag</code>
              <code className="bg-muted px-1 mx-1 rounded">code-assistant</code>
              <code className="bg-muted px-1 mx-1 rounded">voice</code>
              <code className="bg-muted px-1 mx-1 rounded">ecommerce</code>
              <code className="bg-muted px-1 mx-1 rounded">other</code>.
            </div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`{
  "toolName": "ChatGPT 4o",
  "toolUrl": "https://chat.openai.com",
  "toolType": "chatbot",
  "focusAreas": "All categories",
  "customTestCases": "One test case per line"
}`}</code></pre>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">GET /api/marqai/module-reports</div>
            <div className="text-xs text-muted-foreground mt-1">
              Live QA status for every Marqai module. Probes each AI-powered module's endpoint,
              returns functional coverage %, AI integration status (works/fallback/broken),
              smoke test status, open issues, and which Testing Strategies + AI Test Scenarios apply.
              Also returns the full testing taxonomy (34 items: 15 strategies + 10 methodologies + 9 AI scenarios). No permission required (read-only).
            </div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`// Response shape:
{
  "ok": true,
  "generatedAt": "ISO timestamp",
  "summary": {
    "totalModules": 19,
    "aiPowered": 9,
    "aiWorking": 9,
    "avgFunctionalCoverage": 94,
    "totalOpenIssues": 10
  },
  "reports": [{ "moduleId": "leads-generator", "moduleName": "Leads Generator", ... }],
  "taxonomy": { "strategies": [...], "methodologies": [...], "scenarios": [...] }
}`}</code></pre>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/whatsapp/send-broadcast</div>
            <div className="text-xs text-muted-foreground mt-1">
              Send a WhatsApp broadcast to multiple recipients at once. Permission: whatsapp:execute+.
              Cost: 0 AI credits (uses Meta Cloud API directly). Body must include either
              <code className="bg-muted px-1 mx-1 rounded">campaignId</code> OR
              <code className="bg-muted px-1 mx-1 rounded">templateId + contactIds</code>.
              Templates must be Meta-approved; contacts must be opted-in.
            </div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`{
  "campaignId": "wa-camp-xxx",
  // OR inline:
  "templateId": "wa-tpl-1",
  "contactIds": ["wa-c-1", "wa-c-2"],
  "variableOverrides": { "wa-c-1": { "{{1}}": "Priya" } }
}`}</code></pre>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/whatsapp/send-single</div>
            <div className="text-xs text-muted-foreground mt-1">
              Send a single transactional WhatsApp message (order confirmation, OTP, appointment reminder, etc.).
              Permission: whatsapp:execute+. Cost: 0.
            </div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`{
  "templateId": "wa-tpl-3",
  "phone": "+14155551234",
  "variables": { "{{1}}": "Priya", "{{2}}": "88412" }
}`}</code></pre>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">POST /api/marqai/whatsapp/generate-template</div>
            <div className="text-xs text-muted-foreground mt-1">
              Use Marqai AI to draft a Meta-compliant WhatsApp template from a natural-language intent.
              Permission: whatsapp:execute+. Cost: 25 AI credits. Returns a draft template the user reviews and submits to Meta.
            </div>
            <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto"><code>{`{ "intent": "Diwali greeting + 20% off electronics + free shipping + Diwali10 code" }`}</code></pre>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">GET /api/marqai/whatsapp/message-status?campaignId=xxx</div>
            <div className="text-xs text-muted-foreground mt-1">
              Get delivery / read / click / reply status for all messages in a campaign. Permission: whatsapp:view+.
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">GET/POST /api/marqai/whatsapp/webhook</div>
            <div className="text-xs text-muted-foreground mt-1">
              Webhook receiver for WhatsApp Cloud API callbacks. <strong>GET</strong> handles Meta webhook verification
              (verify token: <code className="bg-muted px-1 rounded">marqai_verify_2026</code>). <strong>POST</strong> receives
              inbound messages, status updates, and template status updates. Configure in WhatsApp Business Manager → Webhooks.
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="font-mono text-xs text-emerald-700">GET /api/marqai/whatsapp/test-connection</div>
            <div className="text-xs text-muted-foreground mt-1">
              Verify the WhatsApp Business connection is live. Returns provider, quality rating, messaging tier.
              Permission: whatsapp:view+.
            </div>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-slate-700">4. RBAC Routes (TODO)</h4>
        <div className="space-y-2 text-xs">
          <div><code className="bg-muted px-1 rounded">GET /api/marqai/roles</code> — List roles. Permission: roles:view.</div>
          <div><code className="bg-muted px-1 rounded">POST /api/marqai/roles</code> — Create role. Permission: roles:manage.</div>
          <div><code className="bg-muted px-1 rounded">PATCH /api/marqai/roles/:id</code> — Update. Permission: roles:manage.</div>
          <div><code className="bg-muted px-1 rounded">DELETE /api/marqai/roles/:id</code> — Delete (locked roles cannot be deleted). Permission: roles:manage.</div>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-slate-700">5. Team Routes (TODO)</h4>
        <div className="space-y-2 text-xs">
          <div><code className="bg-muted px-1 rounded">GET /api/marqai/team</code> — List. Permission: team:view.</div>
          <div><code className="bg-muted px-1 rounded">POST /api/marqai/team/invite</code> — Invite. Permission: team:manage.</div>
          <div><code className="bg-muted px-1 rounded">PATCH /api/marqai/team/:id</code> — Update. Permission: team:manage.</div>
          <div><code className="bg-muted px-1 rounded">DELETE /api/marqai/team/:id</code> — Remove. Permission: team:manage.</div>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-slate-700">6. Subscription Routes (TODO)</h4>
        <div className="space-y-2 text-xs">
          <div><code className="bg-muted px-1 rounded">GET /api/marqai/subscription</code> — Get current subscription, usage, invoices.</div>
          <div><code className="bg-muted px-1 rounded">POST /api/marqai/subscription/upgrade</code> — Body: <code className="bg-muted px-1 rounded">{"{ planSlug }"}</code>.</div>
          <div><code className="bg-muted px-1 rounded">POST /api/marqai/subscription/cancel</code> — No body. Cancels at end of cycle.</div>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-slate-700">7. Rate Limits</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Category</th>
                <th className="text-left p-2 border">Limit</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Auth (login, signup)", "10 req/min per IP"],
                ["AI endpoints", "Limited by AI credits (no per-IP limit)"],
                ["Other authenticated", "100 req/min per user"],
                ["Public", "60 req/min per IP"],
              ].map(([c, l]) => (
                <tr key={c}>
                  <td className="p-2 border">{c}</td>
                  <td className="p-2 border">{l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-2">When rate limited, you receive HTTP 429 with <code className="bg-muted px-1 rounded">Retry-After</code> header.</p>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-slate-700">8. SDK Example (TypeScript)</h4>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto"><code>{`const BASE = "https://marqaitools.vercel.app";

async function login(email: string, password: string) {
  const res = await fetch(\`\${BASE}/api/auth/callback/credentials\`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password, csrfToken: await getCsrf() }),
    credentials: "include",
  });
  return res.ok;
}

async function runSeoAudit(url: string) {
  const res = await fetch(\`\${BASE}/api/marqai/analyze\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "seo", url }),
    credentials: "include",
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error.message);
  return json.data;
}`}</code></pre>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-slate-700">9. Webhooks (TODO)</h4>
        <p className="mb-2">Marqai can emit webhooks for events in your organization. Configure the webhook URL in Settings → Integrations.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Event</th>
                <th className="text-left p-2 border">Payload</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["seo.audit.completed", "{ reportId, url, score }"],
                ["image.generated", "{ imageId, url, prompt }"],
                ["video.rendered", "{ videoId, thumbnailUrl, durationSec }"],
                ["email.sent", "{ campaignId, recipients, sentAt }"],
                ["email.opened", "{ campaignId, recipientEmail, openedAt }"],
                ["ai_test.completed", "{ reportId, toolName, overallScore }"],
                ["subscription.upgraded", "{ organizationId, oldPlan, newPlan }"],
                ["subscription.cancelled", "{ organizationId, cancelledAt, effectiveAt }"],
                ["team.member_invited", "{ organizationId, email, roleId }"],
                ["team.member_removed", "{ organizationId, userId }"],
              ].map(([e, p]) => (
                <tr key={e}>
                  <td className="p-2 border font-mono text-[10px]">{e}</td>
                  <td className="p-2 border font-mono text-[10px]">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-2">Webhooks are signed with HMAC-SHA256. Verify the <code className="bg-muted px-1 rounded">X-Marqai-Signature</code> header.</p>
      </section>
    </div>
  );
}
