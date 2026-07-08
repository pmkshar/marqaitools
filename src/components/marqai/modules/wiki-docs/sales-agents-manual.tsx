"use client";

export function SalesAgentsManualDoc() {
  return (
    <div className="space-y-8 text-sm leading-relaxed">
      {/* ============================================================ */}
      {/* 1. OVERVIEW                                                  */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          1. Overview — What the AI Sales Agents module is
        </h4>
        <p className="mb-3">
          The <strong>AI Sales Agents</strong> module is Marqai&apos;s multi-agent
          conversational sales suite. Instead of one monolithic chatbot, it ships
          six specialized agents — each tuned for a specific stage of the revenue
          pipeline. Together they cover the full sales motion: from the moment a
          lead enters the system, through qualification, multi-step outreach, live
          discovery conversations, deal coaching, objection handling, and finally
          closed-won / closed-lost. Every agent can be configured with its own
          product context, tone, target persona, and sales methodology (BANT,
          MEDDIC, SPIN, Challenger, or Consultative).
        </p>
        <p className="mb-3">
          The agents run entirely inside Marqai — they share a single store with
          the Leads Generator and Email Automation modules so a lead generated
          elsewhere in the platform can be picked up by a qualifier agent,
          dropped into an outreach sequence, and followed up by a deal coach
          without any copy-paste. All conversations, sequences, and coaching
          sessions are persisted client-side in your organization&apos;s store
          and surfaced as KPIs on the module dashboard. The agents call the
          shared Z.AI gateway (/api/marqai/sales/*) which means they work
          wherever your Marqai workspace is deployed, with no additional keys
          or external SaaS subscriptions required.
        </p>
        <p>
          This manual documents how to use each agent, the methodologies they
          support, the automation they enable, and the strategic advantages
          they unlock for revenue teams using Marqai.
        </p>
      </section>

      {/* ============================================================ */}
      {/* 2. AGENT ROSTER                                              */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          2. The six agent types — what each does and when to use it
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Agent</th>
                <th className="text-left p-2 border">Primary goal</th>
                <th className="text-left p-2 border">When to deploy</th>
                <th className="text-left p-2 border">API endpoint</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Qualifier",
                  "Score and route leads using BANT / MEDDIC criteria",
                  "The moment a new lead enters the system — before any human touches it",
                  "POST /api/marqai/sales/qualify",
                ],
                [
                  "Outreach",
                  "Generate and dispatch multi-step email sequences (3–7 touchpoints)",
                  "After a lead is qualified as Marketing-Qualified or Sales-Qualified",
                  "POST /api/marqai/sales/outreach",
                ],
                [
                  "Conversation",
                  "Run a full-cycle sales conversation across 7 stages (discovery → closed-won)",
                  "When a lead is warm enough for a real-time chat or guided async thread",
                  "POST /api/marqai/sales/chat",
                ],
                [
                  "Discovery",
                  "Surface tailored discovery questions based on the product + prospect context",
                  "Before a discovery call — to arm the AE with the right questions",
                  "POST /api/marqai/sales/discovery",
                ],
                [
                  "Deal Coach",
                  "Analyze an active deal and produce a close plan, risks, and probability",
                  "Once a deal is in the proposal / negotiation stage",
                  "POST /api/marqai/sales/coach",
                ],
                [
                  "Objection Handler",
                  "Generate a structured response to any sales objection (price, timing, …)",
                  "Whenever a prospect raises an objection in any channel",
                  "POST /api/marqai/sales/objection",
                ],
              ].map(([a, g, w, api]) => (
                <tr key={a}>
                  <td className="p-2 border font-medium">{a}</td>
                  <td className="p-2 border">{g}</td>
                  <td className="p-2 border text-muted-foreground">{w}</td>
                  <td className="p-2 border font-mono text-[10px]">{api}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-muted-foreground">
          Each agent is independent — you can run Qualifier + Outreach without
          ever spinning up the Conversation agent. But they compound when
          chained: a lead qualified by the Qualifier can be auto-enrolled into
          an Outreach sequence, which can trigger a Deal Coach session when a
          prospect replies, which can spawn an Objection Handler call when a
          specific objection is detected.
        </p>
      </section>

      {/* ============================================================ */}
      {/* 3. SALES METHODOLOGIES                                       */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          3. Sales methodologies supported
        </h4>
        <p className="mb-3">
          Every agent accepts a <code className="text-xs">methodology</code> field.
          Pick the framework that matches how your team sells — the agent will
          steer its questions, scoring, and recommendations accordingly.
        </p>
        <div className="space-y-2">
          {[
            [
              "BANT",
              "Budget · Authority · Need · Timing",
              "Classic IBM framework. Best for transactional B2B sales with a single decision-maker. The Qualifier agent will ask explicit budget-range questions, identify the economic buyer, and confirm a purchase window.",
            ],
            [
              "MEDDIC",
              "Metrics · Economic Buyer · Decision Criteria · Decision Process · Identify Pain · Champion",
              "Enterprise-grade framework (originated at PTC). Best for complex six-figure+ deals with multiple stakeholders. The Qualifier agent will demand quantitative success metrics and a verified champion inside the account before scoring the lead as Sales-Qualified.",
            ],
            [
              "SPIN",
              "Situation · Problem · Implication · Need-Payoff",
              "Neil Rackham&apos;s consultative framework. Best when the prospect doesn&apos;t yet realize they have a problem. The Discovery agent will sequence questions from low-risk (Situation) to high-impact (Need-Payoff) to build value before pitching.",
            ],
            [
              "Challenger",
              "Teach · Tailor · Take Control",
              "CEB / Dixon&apos;s framework. Best for disruptive products where the prospect&apos;s current worldview needs to shift. The Conversation agent will lead with a commercial insight that reframes the prospect&apos;s thinking before connecting it to your solution.",
            ],
            [
              "Consultative",
              "Diagnose before prescribing",
              "Generic trust-based framework. Best for high-consideration services (consulting, financial, legal). Agents will spend more time on rapport + diagnosis and less on demo features.",
            ],
          ].map(([name, expansion, use]) => (
            <div key={name} className="border rounded-md p-3 bg-muted/30">
              <div className="font-semibold text-sm mb-1">
                {name}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  — {expansion}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{use}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. STEP-BY-STEP USAGE                                        */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          4. Step-by-step usage manual
        </h4>

        <h5 className="font-semibold mt-4 mb-2 text-sm">4.1 Setting up an agent</h5>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Navigate to <strong>AI Sales Agents</strong> in the sidebar (Outreach group).</li>
          <li>On the <strong>Agents</strong> tab, click <em>+ New Agent</em>.</li>
          <li>Choose an agent type (Qualifier, Outreach, Conversation, Discovery, Deal Coach, Objection Handler).</li>
          <li>Pick a sales methodology (BANT / MEDDIC / SPIN / Challenger / Consultative).</li>
          <li>Fill in the product context — what you sell, who buys it, your top three value props, your top three competitors.</li>
          <li>Choose a tone (e.g. <em>Consultative</em>, <em>Direct</em>, <em>Advisor</em>, <em>Challenger</em>).</li>
          <li>Click <strong>Create</strong>. The agent will be added to your roster and can be toggled active / paused.</li>
        </ol>

        <h5 className="font-semibold mt-4 mb-2 text-sm">4.2 Qualifying a lead</h5>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open the <strong>AI Sales Agents</strong> module → <strong>Agents</strong> tab → click your Qualifier agent.</li>
          <li>Click <em>Qualify Lead</em>. Paste the lead&apos;s profile (name, role, company, any notes from the lead generator).</li>
          <li>The agent will return a structured BANT / MEDDIC score with: budget signal (high / medium / low), authority signal, need signal, timing signal, and an overall qualification verdict (SQL / MQL / Unqualified / Disqualified) plus a recommended next step.</li>
          <li>The qualification is saved to the lead record and surfaces on the dashboard KPI.</li>
        </ol>

        <h5 className="font-semibold mt-4 mb-2 text-sm">4.3 Building an outreach sequence</h5>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Switch to the <strong>Outreach</strong> tab.</li>
          <li>Click <em>+ New Sequence</em>. Name it (e.g. &ldquo;Q4 SaaS Founder cold sequence&rdquo;).</li>
          <li>Pick the audience — either all SQLs from the Qualifier, or a manual list of leads.</li>
          <li>Choose sequence length (3 / 5 / 7 steps) and cadence (e.g. day 0, day 2, day 5, day 9, day 14).</li>
          <li>The agent generates a draft for each step (subject line + body) tailored to your product context + persona.</li>
          <li>Review, edit, then click <strong>Activate</strong>. The sequence will dispatch emails on schedule via the Email Automation module&apos;s send pipeline.</li>
        </ol>

        <h5 className="font-semibold mt-4 mb-2 text-sm">4.4 Running a sales conversation</h5>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open the <strong>Conversations</strong> tab.</li>
          <li>Click <em>+ New Conversation</em>. Select a lead + a Conversation agent.</li>
          <li>The agent opens in <em>Discovery</em> stage. Type your message and the agent will respond, advancing through Discovery → Qualification → Demo → Proposal → Negotiation → Closed-Won / Closed-Lost as the conversation progresses.</li>
          <li>Each message is timestamped + attributed. You can copy any message to clipboard or download the full transcript as JSON.</li>
          <li>The conversation stage is shown live; you can manually override the stage if the agent mis-classifies.</li>
        </ol>

        <h5 className="font-semibold mt-4 mb-2 text-sm">4.5 Coaching an active deal</h5>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open the <strong>Deal Coach</strong> tab.</li>
          <li>Click <em>+ Coach a Deal</em>. Paste the deal context: prospect name, stage, deal size, stakeholders, known objections, current state of play.</li>
          <li>The agent returns a coaching session with: close probability (0–100%), top three risks, recommended next steps, suggested talking tracks, and a 30/60/90-day plan.</li>
          <li>Save the session. It will surface in the &ldquo;Avg Deal Probability&rdquo; KPI on the module dashboard.</li>
        </ol>

        <h5 className="font-semibold mt-4 mb-2 text-sm">4.6 Handling an objection</h5>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open the <strong>Objections</strong> tab.</li>
          <li>Click <em>+ Handle Objection</em>. Select an objection category (Price / Timing / Competitor / Authority / Need / Trust / Complexity / Other).</li>
          <li>Paste the prospect&apos;s exact objection wording.</li>
          <li>The agent returns a structured response: acknowledge → reframe → evidence → ask. Each part is editable.</li>
          <li>Click <strong>Copy</strong> to send the response in your channel of choice (email, WhatsApp, live chat).</li>
        </ol>
      </section>

      {/* ============================================================ */}
      {/* 5. AUTOMATION CAPABILITIES                                   */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          5. Automation capabilities
        </h4>
        <p className="mb-3">
          The Sales Agents module isn&apos;t just a chat interface — it ships
          with several built-in automations that turn it into a 24/7 revenue
          assistant. Each automation can be enabled / disabled per agent.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Auto-qualify on lead creation.</strong> When a new lead is
            generated (via the Leads Generator module or imported via CSV), the
            Qualifier agent automatically runs and tags the lead with its score
            + recommended next step. No human triage needed.
          </li>
          <li>
            <strong>Sequence auto-enrollment.</strong> When a lead is qualified
            as MQL or SQL, Marqai can auto-enroll it in the matching Outreach
            sequence based on the lead&apos;s persona / segment. The enrollment
            rules are configurable (e.g. &ldquo;Founders → Q4 Founder sequence,
            Marketers → Q4 Marketer sequence&rdquo;).
          </li>
          <li>
            <strong>Reply detection → Deal Coach.</strong> When a prospect
            replies to an outreach email, Marqai can auto-trigger a Deal Coach
            session on that deal so the AE walks into the next call with a
            close plan already drafted.
          </li>
          <li>
            <strong>Objection triage.</strong> Reply emails are scanned for
            objection keywords (price, competitor, timing, …). When detected,
            the Objection Handler agent pre-drafts a response and surfaces it
            for human review — cutting response time from hours to minutes.
          </li>
          <li>
            <strong>Scheduled discovery question refresh.</strong> The
            Discovery agent can re-generate its question set weekly based on
            the latest won/lost deal patterns, ensuring AEs always have the
            most current line of questioning.
          </li>
          <li>
            <strong>Daily deal-pipeline digest.</strong> The Deal Coach agent
            can produce a daily digest email summarizing the top 5 at-risk
            deals across the pipeline with the recommended next step for each.
          </li>
          <li>
            <strong>Auto-stage advancement.</strong> In the Conversations tab,
            the agent auto-advances the stage based on conversation signals
            (e.g. prospect confirms budget → advance to Qualification). Stage
            can be manually overridden.
          </li>
        </ul>
      </section>

      {/* ============================================================ */}
      {/* 6. ADVANTAGES                                                */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          6. Advantages &amp; possibilities in Marqai
        </h4>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="border rounded-md p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <h5 className="font-semibold mb-2 text-emerald-800 dark:text-emerald-200">
              Always-on coverage
            </h5>
            <p className="text-xs">
              Leads are qualified within seconds of arrival — including nights,
              weekends, and holidays. First-response time drops from hours to
              seconds, which is the single biggest predictor of conversion in
              outbound sales.
            </p>
          </div>
          <div className="border rounded-md p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
              Consistent methodology
            </h5>
            <p className="text-xs">
              Every rep — from your top AE to a brand-new SDR — applies the same
              BANT / MEDDIC / SPIN framework. No more &ldquo;this rep skips
              qualification&rdquo; gaps. The methodology is encoded in the agent.
            </p>
          </div>
          <div className="border rounded-md p-4 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800">
            <h5 className="font-semibold mb-2 text-violet-800 dark:text-violet-200">
              Multi-channel orchestration
            </h5>
            <p className="text-xs">
              Outreach sequences can dispatch via email, WhatsApp (Marqai&apos;s
              WhatsApp Marketing module), or both. The agent decides the
              optimal channel per touchpoint based on the prospect&apos;s
              engagement history.
            </p>
          </div>
          <div className="border rounded-md p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <h5 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">
              Lower cognitive load on reps
            </h5>
            <p className="text-xs">
              Discovery questions, objection responses, and deal close plans are
              pre-drafted. Reps review and personalize instead of starting from
              a blank page — 30–60 minutes saved per deal.
            </p>
          </div>
          <div className="border rounded-md p-4 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
            <h5 className="font-semibold mb-2 text-rose-800 dark:text-rose-200">
              Audit-ready conversation record
            </h5>
            <p className="text-xs">
              Every conversation is timestamped + attributed + stored. Compliance,
              coaching, and dispute-resolution all draw from the same source of
              truth. No more &ldquo;he said / she said&rdquo; over what was
              promised.
            </p>
          </div>
          <div className="border rounded-md p-4 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800">
            <h5 className="font-semibold mb-2 text-cyan-800 dark:text-cyan-200">
              Native to Marqai — no extra cost
            </h5>
            <p className="text-xs">
              The agents run on the same Z.AI gateway that powers every other
              Marqai module. No separate per-seat AI subscription, no third-party
              SaaS, no API keys to manage. Available from the <strong>Scale</strong>{" "}
              plan onward.
            </p>
          </div>
          <div className="border rounded-md p-4 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
            <h5 className="font-semibold mb-2 text-teal-800 dark:text-teal-200">
              Persona + tone-aware
            </h5>
            <p className="text-xs">
              Each agent can be tuned for a specific buyer persona (Founder,
              VP Marketing, CTO, …) and tone (Consultative, Direct, Advisor,
              Challenger). One product, multiple agent configurations — match
              the message to the moment.
            </p>
          </div>
          <div className="border rounded-md p-4 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
            <h5 className="font-semibold mb-2 text-indigo-800 dark:text-indigo-200">
              Cross-module compounding
            </h5>
            <p className="text-xs">
              Agents share the store with Leads Generator, Email Automation,
              WhatsApp Marketing, and Scheduler. A lead generated here can be
              qualified there, sequenced here, messaged there, and reported on
              over there — without leaving Marqai.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. POSSIBILITIES                                             */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          7. Possibilities — what you can build on top
        </h4>
        <p className="mb-3">
          Because the agents expose stable REST endpoints under{" "}
          <code className="text-xs">/api/marqai/sales/*</code>, you can build
          custom workflows on top of them. Some possibilities:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Inbound-form auto-router.</strong> Hook the Marqai form API
            to the Qualifier; route SQLs straight to a Slack channel for instant
            AE pickup, MQLs to a nurture sequence, and unqualified leads to a
            re-engagement queue.
          </li>
          <li>
            <strong>Web-chat embed.</strong> Drop the Conversation agent into
            your website so visitors can talk to a sales-trained bot 24/7. The
            transcript is auto-saved as a Sales Conversation in Marqai.
          </li>
          <li>
            <strong>Weekly pipeline review.</strong> Run the Deal Coach agent
            across every open deal every Monday morning; surface a one-page
            pipeline-health report to the head of sales.
          </li>
          <li>
            <strong>Objection knowledge base.</strong> Every objection the
            agent handles can be auto-archived into a searchable knowledge base
            that new reps study during onboarding.
          </li>
          <li>
            <strong>A/B test methodologies.</strong> Run two Qualifier agents
            in parallel — one BANT, one MEDDIC — on split lead cohorts and
            compare conversion lift.
          </li>
          <li>
            <strong>CRM sync.</strong> Mirror every conversation, sequence, and
            coaching session to your CRM (HubSpot, Salesforce, Pipedrive) so
            your existing dashboards stay accurate.
          </li>
          <li>
            <strong>Sales-coach bot for reps.</strong> Reps paste a tricky
            prospect reply into the Objection Handler; the bot suggests three
            response strategies ranked by tone. The rep picks one, edits, sends.
          </li>
          <li>
            <strong>Quarterly methodology refresh.</strong> Every quarter, run
            the Discovery agent against your last 100 won + lost deals. It will
            surface which questions correlated with wins — feed those back into
            the next quarter&apos;s discovery question set.
          </li>
        </ul>
      </section>

      {/* ============================================================ */}
      {/* 8. BEST PRACTICES                                            */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          8. Best practices
        </h4>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Seed every agent with rich product context.</strong> The
            more the agent knows about your value props, top competitors, and
            ideal-customer profile, the sharper its outputs. A vague product
            context produces vague qualifying questions and generic outreach.
          </li>
          <li>
            <strong>Pick one methodology per agent.</strong> Don&apos;t try to
            run BANT and MEDDIC in the same agent. If you sell to both SMB and
            Enterprise, create two Qualifier agents — one BANT, one MEDDIC —
            and route leads by company size.
          </li>
          <li>
            <strong>Always review AI-drafted outreach before activating.</strong>{" "}
            The Outreach agent is a starting point, not a finish line. Edit the
            subject lines, tighten the body, and add a personal first-line
            reference per recipient.
          </li>
          <li>
            <strong>Use the Deal Coach weekly.</strong> Don&apos;t wait until a
            deal is stuck — coach it every week. The close-probability trend is
            more useful than any single snapshot.
          </li>
          <li>
            <strong>Close the loop on objections.</strong> Every time a rep
            handles an objection the agent didn&apos;t anticipate, paste it back
            into the Objection Handler. Over time your agent becomes a bespoke
            objection library for your product.
          </li>
          <li>
            <strong>Pair agents with human reps.</strong> The agents are
            accelerators, not replacements. The highest-performing teams use
            agents to handle the first 80% (qualification, draft outreach,
            discovery prep) and humans to handle the last 20% (closing,
            relationship-building, nuanced negotiation).
          </li>
          <li>
            <strong>Audit conversations monthly.</strong> Pull 10 random
            transcripts per month per agent. Look for: hallucinated product
            features, tone drift, and missed buying signals. Tune the agent&apos;s
            system prompt accordingly.
          </li>
        </ul>
      </section>

      {/* ============================================================ */}
      {/* 9. API REFERENCE                                             */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          9. API reference
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Endpoint</th>
                <th className="text-left p-2 border">Method</th>
                <th className="text-left p-2 border">Purpose</th>
                <th className="text-left p-2 border">Key inputs</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["/api/marqai/sales/qualify", "POST", "Score a lead on BANT/MEDDIC", "lead profile, methodology"],
                ["/api/marqai/sales/outreach", "POST", "Generate an outreach sequence", "audience, length, cadence"],
                ["/api/marqai/sales/chat", "POST", "Advance a sales conversation", "lead, message history, stage"],
                ["/api/marqai/sales/discovery", "POST", "Generate discovery questions", "product context, persona"],
                ["/api/marqai/sales/coach", "POST", "Coach an active deal", "deal context, stage, stakeholders"],
                ["/api/marqai/sales/objection", "POST", "Generate objection response", "category, objection text"],
              ].map(([ep, m, p, k]) => (
                <tr key={ep}>
                  <td className="p-2 border font-mono text-[10px]">{ep}</td>
                  <td className="p-2 border">{m}</td>
                  <td className="p-2 border">{p}</td>
                  <td className="p-2 border text-muted-foreground">{k}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          All endpoints accept JSON bodies, return JSON responses, and run on
          Vercel serverless functions with a 60-second timeout. Authenticated
          via the standard Marqai session cookie. RBAC enforced — only roles
          with <code>execute</code> permission on <code>sales-agents</code> may
          call them.
        </p>
      </section>

      {/* ============================================================ */}
      {/* 10. WORKED EXAMPLE                                           */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          10. Worked example — full cycle from lead to closed-won
        </h4>
        <p className="mb-3">
          To make this concrete, here is the end-to-end journey of a single
          prospect through the Sales Agents module.
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Lead generated.</strong> The Leads Generator module
            produces &ldquo;Jane Doe, VP Marketing at Acme SaaS, 200 employees,
            recently raised Series B.&rdquo;
          </li>
          <li>
            <strong>Auto-qualification.</strong> The Qualifier agent
            (methodology = MEDDIC) auto-runs on the new lead. Output:{" "}
            <em>Metrics: medium (implied from Series B size). Economic Buyer:
            unclear. Decision Criteria: unknown. Identify Pain: implied scaling
            pain. Champion: none yet. Verdict: MQL — needs human outreach to
            surface economic buyer + champion.</em>
          </li>
          <li>
            <strong>Auto-enrollment.</strong> MQL verdict triggers auto-enrollment
            in the &ldquo;VP Marketing post-Series-B&rdquo; Outreach sequence
            (5 emails over 14 days, tone = Advisor).
          </li>
          <li>
            <strong>Reply received.</strong> Jane replies to email #2 with:
            &ldquo;Interesting — but we just signed with Drift last quarter. Why
            switch?&rdquo;
          </li>
          <li>
            <strong>Objection triage.</strong> Reply-detector flags the
            &ldquo;just signed with Drift&rdquo; as a Competitor objection. The
            Objection Handler auto-drafts a response: acknowledge → reframe
            (Marqai consolidates 6 tools into 1) → evidence (case study) → ask
            (15-min call to compare).
          </li>
          <li>
            <strong>Deal Coach session.</strong> Auto-triggered by the reply.
            The Deal Coach analyzes: stage = Qualification, deal size = unknown,
            risks = (1) competitive incumbent, (2) no champion identified, (3)
            decision process unknown. Close probability: 25%. Recommended next
            step: 15-min discovery call to map decision process + identify
            champion.
          </li>
          <li>
            <strong>Discovery prep.</strong> The Discovery agent generates 8
            tailored questions to ask on the discovery call — sequenced SPIN
            style: 2 Situation, 3 Problem, 2 Implication, 1 Need-Payoff.
          </li>
          <li>
            <strong>Live conversation.</strong> The AE runs the call with the
            Conversation agent open in the Conversations tab. Each AE message +
            prospect response is logged; the agent suggests the next question
            from the discovery question set.
          </li>
          <li>
            <strong>Stage advancement.</strong> Prospect confirms budget
            ($50K/yr) and introduces the CFO as co-decision-maker. The agent
            auto-advances the conversation from Discovery → Qualification.
          </li>
          <li>
            <strong>Deal Coach re-run.</strong> With budget + decision-process
            surfaced, close probability jumps to 55%. Deal Coach recommends a
            tailored demo + a 30-day pilot proposal.
          </li>
          <li>
            <strong>Closed-won.</strong> After 3 more weeks of negotiation
            (logged as a Conversation), Jane signs. Stage set to Closed-Won.
            The full transcript is archived for compliance + onboarding the new
            customer-success team.
          </li>
        </ol>
        <p className="mt-3">
          The above cycle — from cold lead to closed-won — happened with the AE
          spending roughly 90 minutes of hands-on time across 4 weeks. The
          agents handled qualification, sequence drafting, objection drafting,
          discovery prep, and deal coaching in the background.
        </p>
      </section>

      {/* ============================================================ */}
      {/* 11. FAQ                                                      */}
      {/* ============================================================ */}
      <section>
        <h4 className="text-base font-bold mb-3 text-violet-700">
          11. FAQ &amp; troubleshooting
        </h4>
        <div className="space-y-3">
          <div className="border-l-2 border-violet-300 pl-3">
            <p className="font-semibold text-sm">
              The agent&apos;s response looks generic. How do I make it sharper?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Edit the agent&apos;s product context to include: your top 3
              competitors + how you beat each, 3 customer pain points you solve,
              2 quantified case-study outcomes, and the top 3 objections you
              hear. The richer the context, the sharper the output.
            </p>
          </div>
          <div className="border-l-2 border-violet-300 pl-3">
            <p className="font-semibold text-sm">
              Can I use the agents in a non-English language?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Yes. The underlying LLM supports 100+ languages. Set the agent&apos;s
              tone to <em>&lt;your-language&gt; — &lt;style&gt;</em> (e.g.
              &ldquo;Spanish — formal consultative&rdquo;) and the agent will
              respond in that language.
            </p>
          </div>
          <div className="border-l-2 border-violet-300 pl-3">
            <p className="font-semibold text-sm">
              The Outreach sequence didn&apos;t send emails. Why?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Check that: (1) the sequence is Active (not Draft), (2) the lead
              has a valid email address, (3) the Email Automation module&apos;s
              SMTP / provider is configured in Settings, and (4) the lead
              hasn&apos;t already been opted out. The activity log on each
              sequence step shows the dispatch status.
            </p>
          </div>
          <div className="border-l-2 border-violet-300 pl-3">
            <p className="font-semibold text-sm">
              Can I export a conversation for compliance review?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Yes — open the conversation and click <em>Download Transcript</em>.
              The transcript exports as JSON (full message history + metadata) or
              as plain text (human-readable).
            </p>
          </div>
          <div className="border-l-2 border-violet-300 pl-3">
            <p className="font-semibold text-sm">
              How do I switch methodologies mid-deal?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a second agent of the same type with the new methodology,
              then re-run the agent against the same lead/deal. The previous
              session is preserved; a new session is created with the new
              methodology&apos;s framing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
