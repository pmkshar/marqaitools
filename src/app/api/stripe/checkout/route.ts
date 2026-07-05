// Stripe Checkout Session creator.
// POST /api/stripe/checkout
// Body: { planSlug: "starter"|"growth"|"scale", organizationId: string }
// Returns: { url: string }
//
// When Stripe env vars are not configured, returns 503 with a hint so the
// client can fall back to the simulated in-memory upgrade flow.
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripePriceIdFor, isStripeConfigured } from "@/lib/marqai/saas";
import type { PlanSlug } from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error: "Stripe not configured. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and STRIPE_PRICE_ID_* env vars.",
        simulated: true,
      },
      { status: 503 },
    );
  }

  try {
    const { planSlug, organizationId } = (await req.json()) as { planSlug: PlanSlug; organizationId: string };
    if (!planSlug || !organizationId) {
      return NextResponse.json({ error: "Missing planSlug or organizationId" }, { status: 400 });
    }
    const priceId = stripePriceIdFor(planSlug);
    if (!priceId) {
      return NextResponse.json({ error: `No Stripe Price ID mapped for plan "${planSlug}"` }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: organizationId,
      subscription_data: {
        metadata: { organizationId, planSlug },
      },
      success_url: `${process.env.NEXTAUTH_URL ?? req.nextUrl.origin}/?upgrade=success&plan=${planSlug}`,
      cancel_url: `${process.env.NEXTAUTH_URL ?? req.nextUrl.origin}/?upgrade=cancelled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
