"use client";

export function BillingDoc() {
  const plans = [
    {
      name: "Starter",
      price: "$49/mo",
      seats: "3 seats",
      credits: "1,000 AI credits/mo",
      trial: "14 days",
      desc: "Solo marketers and small teams getting started.",
      features: ["Dashboard, SEO, Social, Scheduler, Email", "Daily content calendar", "Email automation (2 flows)", "Community support"],
    },
    {
      name: "Growth",
      price: "$149/mo",
      seats: "10 seats",
      credits: "5,000 AI credits/mo",
      trial: "14 days",
      desc: "Growing marketing teams that need creative production at scale.",
      popular: true,
      features: ["Everything in Starter", "AI Image Studio", "AI Video Studio", "Website Analyzer", "Priority email support"],
    },
    {
      name: "Scale",
      price: "$399/mo",
      seats: "25 seats",
      credits: "20,000 AI credits/mo",
      trial: "14 days",
      desc: "Agencies and enterprises that also test & benchmark AI tools.",
      features: ["Everything in Growth", "AI Tool Testing module", "Custom Role Master", "Advanced audit logs", "Dedicated success manager"],
    },
    {
      name: "Enterprise",
      price: "Custom",
      seats: "Unlimited",
      credits: "Custom credits",
      trial: "30 days",
      desc: "Large organizations with custom SSO, security, and volume needs.",
      features: ["Everything in Scale", "SSO / SAML", "Custom data residency", "Dedicated infrastructure", "24/7 phone support", "Custom SLA"],
    },
  ];

  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <section>
        <h4 className="text-base font-bold mb-3 text-rose-700">Plan Catalog</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-lg border p-4 ${p.popular ? "border-amber-400 bg-amber-50/30" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold flex items-center gap-2">
                  {p.name}
                  {p.popular && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded">POPULAR</span>}
                </div>
                <div className="text-sm font-semibold">{p.price}</div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{p.desc}</div>
              <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                <div className="bg-muted rounded px-2 py-1">{p.seats}</div>
                <div className="bg-muted rounded px-2 py-1">{p.credits}</div>
                <div className="bg-muted rounded px-2 py-1">{p.trial} trial</div>
              </div>
              <ul className="text-xs space-y-0.5">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">AI Credit Costs</h4>
        <p className="mb-2">Every AI operation consumes credits. Credits reset on the first day of each billing cycle.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Operation</th>
                <th className="text-left p-2 border">Credits</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["SEO audit", "5"],
                ["Website analysis", "10"],
                ["Image generation", "8"],
                ["Video generation", "25"],
                ["Content generation", "2"],
                ["Hashtag generation", "1"],
                ["Email subject AI", "1"],
                ["Email body AI", "2"],
                ["Video storyboard AI", "3"],
                ["AI tool test suite", "50"],
              ].map(([op, c]) => (
                <tr key={op}>
                  <td className="p-2 border">{op}</td>
                  <td className="p-2 border font-mono">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">Billing Cycle</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Billing cycle = 1 month, starting from the day you add billing details.</li>
          <li>Cycle renews automatically on the same day each month.</li>
          <li>Example: Add billing on July 15 → your cycle is the 15th of each month.</li>
          <li>Invoice is generated and charged on the cycle start date.</li>
          <li>Failed charges: 3-day grace period, then account suspended.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">Trials</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Starter / Growth / Scale: 14-day free trial.</li>
          <li>Enterprise: 30-day free trial.</li>
          <li>No credit card required to start a trial.</li>
          <li>Trial gives full access to the chosen plan's features.</li>
          <li>After trial: account becomes read-only. Add billing to resume.</li>
        </ul>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Day</th>
                <th className="text-left p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["0", "Trial starts — welcome email"],
                ["5", "'How's it going?' tips email"],
                ["10", "'Trial ending in 4 days' reminder"],
                ["12", "'Add billing to keep your data' — final reminder"],
                ["14", "Trial ends — account read-only"],
                ["+3", "'Last chance — your data will be deleted in 4 days'"],
                ["+7", "Trial data permanently deleted"],
              ].map(([d, a]) => (
                <tr key={d}>
                  <td className="p-2 border font-mono">{d}</td>
                  <td className="p-2 border">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">Upgrades & Downgrades</h4>
        <div className="space-y-3">
          <div className="rounded-md border p-3">
            <div className="font-medium text-xs mb-1 text-emerald-700">Mid-cycle upgrade</div>
            <ul className="list-disc pl-5 text-xs space-y-0.5">
              <li>Upgrade takes effect immediately.</li>
              <li>Prorated charge today = (new_plan_price - old_plan_price) × (days_remaining / days_in_cycle).</li>
              <li>Example: Day 15 of Growth ($149), upgrade to Scale ($399). Proration = ($399 - $149) × (15/30) = $125 charged today.</li>
              <li>AI credits: limit immediately jumps. Used credits carry over.</li>
              <li>Seats: limit immediately jumps. Nothing breaks.</li>
            </ul>
          </div>
          <div className="rounded-md border p-3">
            <div className="font-medium text-xs mb-1 text-amber-700">Cycle-end downgrade</div>
            <ul className="list-disc pl-5 text-xs space-y-0.5">
              <li>Downgrade is queued for the end of the current cycle.</li>
              <li>Until then, you keep full access to the higher-tier features.</li>
              <li>At cycle end: plan changes, AI credit limit drops, hidden modules' data preserved.</li>
              <li>If you have more team members than the new plan's seat limit: the most recently added members are marked "suspended" until you remove some or upgrade again.</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">Cancellations & Data Retention</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cancel anytime from Subscription → Cancel subscription.</li>
          <li>Account remains active until end of current billing cycle.</li>
          <li>At cycle end: account becomes read-only. No new AI operations. Existing data preserved.</li>
          <li>Data retention: 90 days after cancellation. During this window, you can re-subscribe and restore full access.</li>
          <li>After 90 days: all data is permanently deleted (campaigns, reports, scheduled posts, images, videos, audit logs).</li>
          <li>Invoices are retained for 7 years for tax compliance.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">Overage Policy</h4>
        <p className="mb-2">When you exhaust your monthly AI credits:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Marqai does NOT stop you — your campaigns continue running.</li>
          <li>Each additional credit is billed at $0.01.</li>
          <li>Overages are calculated and charged at the end of the billing cycle.</li>
          <li>You receive an email when you hit 80%, 90%, and 100% of your credit limit.</li>
          <li>You can set a "credit hard cap" in Settings → Billing → "Halt AI operations at limit". With this on, AI operations return HTTP 402 instead of running.</li>
        </ol>
        <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs">
          <strong>Example:</strong> Growth plan, 5,000 credits included. You use 6,200. Overages = 1,200 × $0.01 = $12. Your next invoice is $149 + $12 = $161.
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">Failed Payments & Dunning</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Day</th>
                <th className="text-left p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["0", "Payment fails — automatic retry"],
                ["1", "Email: 'Payment failed — please update your billing details.'"],
                ["3", "Account suspended (read-only). Second email."],
                ["7", "Final email: 'Account will be cancelled in 3 days.'"],
                ["10", "Subscription cancelled. Data retained 90 days."],
              ].map(([d, a]) => (
                <tr key={d}>
                  <td className="p-2 border font-mono">{d}</td>
                  <td className="p-2 border">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">Refunds</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Within 7 days of payment:</strong> Full refund, no questions asked. Email billing@marqai.app.</li>
          <li><strong>After 7 days:</strong> Case-by-case. If you've used &gt;50% of AI credits, partial refund. If &lt;50%, full refund minus $10 processing fee.</li>
          <li><strong>Trial periods:</strong> Always free, no refund needed.</li>
          <li><strong>Annual plans (TODO):</strong> Prorated refund for unused months.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">Taxes</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>US customers: sales tax added based on your state.</li>
          <li>EU customers: VAT added based on your country.</li>
          <li>India customers: GST (18%) added.</li>
          <li>Other: no tax added (your jurisdiction may require self-reporting).</li>
          <li>Tax-exempt organizations: email billing@marqai.app with your tax-exempt certificate.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-rose-700">FAQ</h4>
        <div className="space-y-3">
          {[
            ["Can I get a single invoice for multiple Organizations?", "Yes, on Enterprise plans. We can consolidate billing across multiple orgs under one parent account. Contact enterprise@marqai.app."],
            ["Can I pay by bank transfer instead of card?", "Yes, on annual plans >= $5,000. Email billing@marqai.app."],
            ["Do you offer discounts for startups or non-profits?", "Yes — 30% off for verified non-profits and startups < 2 years old with < $1M funding. Apply at marqai.app/startup-program."],
            ["Can I export my invoices for accounting?", "Yes — Subscription → Invoice history → Download PDF. All invoices are also emailed to the billing contact."],
            ["What happens to my data if I downgrade and a module becomes hidden?", "Your data in that module is preserved for 90 days. If you upgrade again within 90 days, you'll see all your old data."],
            ["Can I pause my subscription instead of cancelling?", "Yes — Subscription → Pause subscription. You can pause for 1–3 months. During the pause, your account is read-only and you're not charged."],
          ].map(([q, a]) => (
            <div key={q} className="rounded-md border p-3">
              <div className="font-medium text-xs mb-1">Q: {q}</div>
              <div className="text-xs text-muted-foreground">A: {a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
