// POST /api/marqai/sales/call-confirm
// Stage 4 of the AI Sales Workflow.
//
// Body: {
//   companyName: string,
//   contactName: string,
//   contactTitle?: string,
//   meetingLabel: string,         // e.g. "Tue 22 Jul · 11:00 AM Online (Asia/Kolkata)"
//   meetingMode: "online" | "offline",
//   productName: string,
//   productContext: string,
//   senderName?: string
// }
//
// Returns: {
//   ok: true,
//   callScript: string,           // what the AI agent says on the call
//   prospectResponse: string,     // what the prospect said in reply (simulated)
//   outcome: "confirmed" | "reschedule" | "declined" | "voicemail",
//   clientUpdateMessage: string,  // final update message to the operator/client
//   source: "ai" | "fallback",
//   warning?: string
// }
//
// NOTE: There is no live VoIP / Twilio Voice integration in this
// environment. This route SIMULATES the confirmation call by having
// the LLM role-play both sides of the conversation and classify the
// outcome. The operator sees the simulated transcript + outcome +
// the final client-update message they should send to confirm the
// schedule.
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
import { extractChatContent } from "@/lib/zai-response";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  companyName: string;
  contactName: string;
  contactTitle?: string;
  meetingLabel: string;
  meetingMode: "online" | "offline";
  productName: string;
  productContext: string;
  senderName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.companyName?.trim() || !body.contactName?.trim() || !body.meetingLabel?.trim() || !body.productContext?.trim()) {
      return NextResponse.json(
        { error: "Missing companyName, contactName, meetingLabel, or productContext" },
        { status: 400 },
      );
    }
    const mode = body.meetingMode === "offline" ? "offline" : "online";
    const sender = body.senderName?.trim() || "your AI sales agent";
    const firstName = body.contactName.split(" ")[0];

    const sys = `You are an AI sales agent placing an automated confirmation call to a prospect who has been scheduled for a ${mode === "online" ? "video call" : "in-person"} meeting. You will simulate BOTH sides of the call.

CALL FLOW (the script you write must follow this):
1. Greeting: "Hi ${firstName}, this is ${sender} calling from Marqai. Is this a good time to speak for 30 seconds?"
2. Purpose: "I'm calling to confirm our meeting scheduled for ${body.meetingLabel}."
3. Confirm: Ask if the time still works, or if they'd like to reschedule.
4. Value reminder: In one sentence, remind them what the meeting is about (${body.productName} — what it solves for them).
5. Close: Confirm next steps ("Great — you'll get a calendar invite and a reminder 30 minutes before. Looking forward to it.") OR offer to reschedule OR leave a voicemail.

PROSPECT RESPONSE SIMULATION:
Role-play the prospect's reply realistically. The prospect is busy, may or may not pick up, may confirm, may ask to reschedule, or may decline. Pick ONE outcome weighted as follows:
- "confirmed": ~65% — prospect confirms the meeting time
- "reschedule": ~20% — prospect asks for a different time
- "voicemail": ~10% — prospect doesn't pick up, you leave a voicemail
- "declined": ~5% — prospect declines the meeting

CLIENT UPDATE MESSAGE:
At the end, produce a single short message that the operator (the Marqai user) should see as the final status update. This message should:
- State the outcome in plain English
- Include the meeting label
- If "confirmed": confirm the meeting is locked in
- If "reschedule": state that a new slot is needed
- If "voicemail": state that a voicemail was left and a follow-up is needed
- If "declined": state that the prospect declined

Return STRICT JSON only — no prose, no markdown fences:
{
  "callScript": "<the full script the AI agent reads on the call, with line breaks>",
  "prospectResponse": "<what the prospect said, in their voice>",
  "outcome": "confirmed" | "reschedule" | "voicemail" | "declined",
  "clientUpdateMessage": "<one short paragraph for the operator>"
}

JSON only.`;

    const user = `Prospect:
- Company: ${body.companyName}
- Name: ${body.contactName}
${body.contactTitle ? `- Title: ${body.contactTitle}` : ""}

Meeting: ${body.meetingLabel} (${mode === "online" ? "online video call" : "in-person"})
Product: ${body.productName}
Product context: ${body.productContext}
Caller: ${sender}

Simulate the confirmation call as JSON.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const extracted = extractChatContent(completion);
    const raw = extracted.content ?? "";
    const parsed = extractJson(raw);

    const validOutcomes = ["confirmed", "reschedule", "voicemail", "declined"];
    const isValid =
      parsed?.callScript && typeof parsed.callScript === "string" &&
      parsed?.prospectResponse && typeof parsed.prospectResponse === "string" &&
      parsed?.outcome && validOutcomes.includes(parsed.outcome) &&
      parsed?.clientUpdateMessage && typeof parsed.clientUpdateMessage === "string";

    if (!isValid) {
      return NextResponse.json({
        ok: true,
        callScript: `Hi ${firstName}, this is ${sender} calling from Marqai. Is this a good time to speak for 30 seconds?

I'm calling to confirm our meeting scheduled for ${body.meetingLabel}.

Does that time still work for you, or would you like to reschedule?

The meeting is about ${body.productName} — specifically how it can help ${body.companyName} with ${body.productContext.split(",")[0].toLowerCase().slice(0, 60)}.

If the time works, you'll get a calendar invite and a reminder 30 minutes before. Looking forward to it.`,
        prospectResponse: `Hi ${sender} — yes, that time still works. I'll be there.`,
        outcome: "confirmed",
        clientUpdateMessage: `Confirmation call to ${body.contactName} at ${body.companyName} completed. Prospect confirmed the meeting scheduled for ${body.meetingLabel}. Calendar invite and 30-minute reminder will be sent. No further action needed.`,
        source: "fallback",
        warning:
          extracted.error ??
          "AI returned an unparseable call simulation. Showing a fallback script + a confirmed outcome.",
      });
    }

    return NextResponse.json({
      ok: true,
      callScript: String(parsed.callScript),
      prospectResponse: String(parsed.prospectResponse),
      outcome: String(parsed.outcome) as "confirmed" | "reschedule" | "voicemail" | "declined",
      clientUpdateMessage: String(parsed.clientUpdateMessage),
      source: "ai",
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
