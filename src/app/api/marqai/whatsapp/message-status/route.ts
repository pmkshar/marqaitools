// GET /api/marqai/whatsapp/message-status?campaignId=xxx
// Returns: { ok, logs: WhatsAppMessageLog[] }
//
// Returns delivery / read / click status for all messages in a campaign.
// In production, these statuses are updated by webhook callbacks from Meta.
import { NextRequest, NextResponse } from "next/server";
import { seedWhatsAppMessageLogs } from "@/lib/marqai/mock-data";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    let logs = seedWhatsAppMessageLogs;
    if (campaignId) {
      logs = logs.filter((l) => l.campaignId === campaignId);
    }

    return NextResponse.json({
      ok: true,
      logs,
      note: "Demo mode: returning seed message logs. In production, these are populated by webhook callbacks from Meta.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
