import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface Body {
  campaignId: string;
  to?: string;
  subject: string;
  bodyHtml: string;
  recipientCount?: number;
}

// In a real product this would integrate with SendGrid / Postmark / SES / Resend.
// For this demo we simulate the send + open/click metrics so the UI flow works end-to-end.

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.subject || !body.bodyHtml) {
      return NextResponse.json({ error: "Missing subject or body" }, { status: 400 });
    }

    // Simulate send latency
    await new Promise((r) => setTimeout(r, 900));

    const recipients = body.recipientCount ?? Math.floor(500 + Math.random() * 5000);
    const delivered = Math.floor(recipients * (0.96 + Math.random() * 0.03));
    const opens = Math.floor(delivered * (0.32 + Math.random() * 0.18));
    const clicks = Math.floor(opens * (0.12 + Math.random() * 0.14));
    const unsubscribes = Math.floor(delivered * (Math.random() * 0.01));
    const bounces = recipients - delivered;

    return NextResponse.json({
      ok: true,
      messageId: `msg-${Date.now().toString(36)}`,
      stats: {
        recipients,
        delivered,
        opens,
        clicks,
        unsubscribes,
        bounces,
        openRate: (opens / delivered) * 100,
        clickRate: (clicks / delivered) * 100,
        unsubscribeRate: (unsubscribes / delivered) * 100,
        bounceRate: (bounces / recipients) * 100,
      },
      sentAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
