// Stripe Billing Portal — lets customers manage their card / cancel / view invoices.
// POST /api/stripe/portal
// Body: { organizationId: string }
// Returns: { url: string }
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { isStripeConfigured } from "@/lib/marqai/saas";
import { db as prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured", simulated: true }, { status: 503 });
  }

  try {
    const { organizationId } = (await req.json()) as { organizationId: string };
    if (!organizationId) return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });

    const sub = await prisma.subscription.findUnique({ where: { organizationId } });
    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer found for this organization" }, { status: 404 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL ?? req.nextUrl.origin}/`,
    });

    return NextResponse.json({ ok: true, url: portal.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
