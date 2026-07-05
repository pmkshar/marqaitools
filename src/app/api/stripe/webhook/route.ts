// Stripe Webhook handler.
// Endpoint: POST /api/stripe/webhook
//
// Handles:
//   - checkout.session.completed     → record stripeCustomerId + stripeSubscriptionId
//   - customer.subscription.updated  → sync plan, period, status
//   - customer.subscription.deleted  → mark subscription as cancelled
//   - invoice.payment_succeeded      → record a paid invoice
//
// Configure the same endpoint URL in your Stripe dashboard → Webhooks.
// Set STRIPE_WEBHOOK_SECRET to the signing secret (whsec_xxx).
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db as prisma } from "@/lib/db";
import { PLANS } from "@/lib/marqai/saas";

export const runtime = "nodejs";
export const maxDuration = 30;
// Stripe requires the raw body to verify the signature.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" as any });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Webhook signature failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const orgId = cs.client_reference_id ?? cs.metadata?.organizationId;
        if (!orgId) break;
        await prisma.subscription.update({
          where: { organizationId: orgId },
          data: {
            stripeCustomerId: cs.customer as string,
            stripeSubscriptionId: cs.subscription as string,
            status: "active",
          },
        });
        break;
      }
      case "customer.subscription.updated": {
        const s = event.data.object as Stripe.Subscription;
        const orgId = s.metadata?.organizationId;
        if (!orgId) break;

        // Resolve plan from the Stripe Price ID
        const priceId = (s.items.data[0]?.price as Stripe.Price | undefined)?.id;
        const plan = PLANS.find((p) => process.env[`STRIPE_PRICE_ID_${p.slug.toUpperCase()}`] === priceId);

        // current_period_start / current_period_end are unix timestamps on the Subscription object
        const periodStart = (s as any).current_period_start as number | undefined;
        const periodEnd = (s as any).current_period_end as number | undefined;

        await prisma.subscription.update({
          where: { organizationId: orgId },
          data: {
            status: s.status === "active" ? "active" : s.status === "trialing" ? "trialing" : s.status === "past_due" ? "past_due" : s.status === "canceled" ? "cancelled" : "active",
            ...(periodStart ? { currentPeriodStart: new Date(periodStart * 1000) } : {}),
            ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}),
            ...(plan ? { planId: plan.slug, aiCreditsLimit: plan.aiCredits } : {}),
            stripePriceId: priceId ?? undefined,
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const s = event.data.object as Stripe.Subscription;
        const orgId = s.metadata?.organizationId;
        if (!orgId) break;
        await prisma.subscription.update({
          where: { organizationId: orgId },
          data: { status: "cancelled" },
        });
        break;
      }
      case "invoice.payment_succeeded": {
        const inv = event.data.object as Stripe.Invoice;
        // Subscription metadata is on inv.subscription_details (newer Stripe API)
        const meta = (inv as any).subscription_details?.metadata ?? inv.metadata ?? {};
        const orgId = meta.organizationId;
        if (!orgId) break;
        const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
        if (!sub) break;
        await prisma.invoice.create({
          data: {
            subscriptionId: sub.id,
            amountCents: inv.amount_paid,
            currency: inv.currency ?? "usd",
            status: "paid",
            issuedAt: new Date(inv.created * 1000),
            description: inv.lines.data[0]?.description ?? "Stripe subscription",
          },
        });
        break;
      }
      default:
        // Unhandled event type — no-op.
        break;
    }
    return NextResponse.json({ received: true, type: event.type });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[stripe/webhook] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
