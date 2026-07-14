// POST /api/marqai/sales/scrape-leads
// Stage 1 of the AI Sales Workflow.
//
// Body: {
//   companyName: string,
//   website?: string,           // e.g. "acme.com"
//   linkedinUrl?: string,       // e.g. "https://linkedin.com/company/acme"
//   productContext?: string,    // what we sell — used to pick relevant decision-makers
//   targetTitles?: string[],    // e.g. ["VP Marketing", "Head of Growth"]
//   maxContacts?: number        // default 5
// }
//
// Returns: {
//   ok: true,
//   contacts: ScrapedContact[],
//   source: "ai" | "fallback",
//   warning?: string
// }
//
// NOTE: The Z.AI SDK exposed in this project does not include live
// web-scraping. This route therefore performs AI-driven contact
// ENRICHMENT — given a company name + website + LinkedIn URL, the
// LLM predicts the most likely decision-makers (name, title,
// pattern-based email, switchboard phone) and rates its own
// confidence per row. Operators must confirm each contact before
// advancing to the intro-email stage, exactly as they would with
// scraped data.
import { NextRequest, NextResponse } from "next/server";
import { getZai, getDefaultModel } from "@/lib/zai";
import { extractJson } from "@/lib/json-utils";
import { extractChatContent } from "@/lib/zai-response";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  companyName: string;
  website?: string;
  linkedinUrl?: string;
  productContext?: string;
  targetTitles?: string[];
  maxContacts?: number;
}

const FALLBACK_CONTACTS = [
  {
    contactName: "Decision Maker",
    contactTitle: "VP Marketing",
    email: "vp.marketing@example.com",
    phone: "+1-555-0100",
    linkedin: "https://linkedin.com/in/example",
    relevanceNote: "Owns marketing budget — primary buyer for the product.",
    confidence: 40,
  },
  {
    contactName: "Operations Lead",
    contactTitle: "Head of Operations",
    email: "ops@example.com",
    phone: "+1-555-0101",
    linkedin: "https://linkedin.com/in/example",
    relevanceNote: "Day-to-day operator — strong champion for new tooling.",
    confidence: 35,
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.companyName?.trim()) {
      return NextResponse.json(
        { error: "Missing companyName" },
        { status: 400 },
      );
    }

    const maxContacts = Math.min(Math.max(body.maxContacts ?? 5, 1), 8);
    const targetTitles = body.targetTitles?.length
      ? body.targetTitles
      : ["CEO", "VP Marketing", "Head of Growth", "CTO", "Head of Sales"];

    const sys = `You are an AI sales prospecting engine. Given a target company and what we sell, you predict the most likely decision-makers at that company — their name, title, email pattern, direct phone, and LinkedIn profile URL.

CRITICAL: Real-time scraping is not available in this environment. You must therefore produce your best PREDICTED contact list based on:
- The company's known size, industry, and public website
- Typical org structures for companies of that size
- Public email patterns for the company's domain (e.g. first.last@company.com)
- The product being sold (pick decision-makers who would care about it)

For each contact you produce, set a realistic confidence score (0-100):
- 80-100: you have high certainty this person exists at this company in this role
- 50-79:  this is a likely role+seniority at a company like this, name may be approximate
- 0-49:   this is a placeholder suggestion — operator must verify before relying on it

NEVER fabricate a real-looking personal phone number. For direct lines you cannot verify, return the company switchboard pattern (e.g. "+1-555-0100") or omit phone entirely.

NEVER claim an email is verified. The operator will confirm before send.

Return STRICT JSON only — no prose, no markdown fences:
{
  "contacts": [
    {
      "contactName": "<full name>",
      "contactTitle": "<e.g. VP Marketing>",
      "email": "<pattern-based best guess on the company domain>",
      "phone": "<switchboard or omit>",
      "linkedin": "<https://linkedin.com/in/... or omit>",
      "relevanceNote": "<one sentence — why this role cares about the product being sold>",
      "confidence": <number 0-100>
    }
  ]
}

Return at most ${maxContacts} contacts, ranked highest-confidence first.

JSON only.`;

    const user = `Target company: ${body.companyName}
${body.website ? `Website: ${body.website}` : "Website: (not provided — infer from company name)"}
${body.linkedinUrl ? `LinkedIn: ${body.linkedinUrl}` : "LinkedIn: (not provided)"}
${body.productContext ? `What we sell: ${body.productContext}` : "What we sell: (not specified — pick general marketing-ops buyers)"}
Titles of interest: ${targetTitles.join(", ")}

Produce ${maxContacts} predicted contacts as JSON.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.6,
      max_tokens: 2200,
    });

    const extracted = extractChatContent(completion);
    const raw = extracted.content ?? "";
    const parsed = extractJson(raw);

    const isValid =
      parsed?.contacts &&
      Array.isArray(parsed.contacts) &&
      parsed.contacts.length > 0 &&
      parsed.contacts.every(
        (c: any) =>
          c &&
          typeof c.contactName === "string" &&
          typeof c.contactTitle === "string" &&
          typeof c.email === "string",
      );

    if (!isValid) {
      return NextResponse.json({
        ok: true,
        contacts: FALLBACK_CONTACTS.slice(0, maxContacts).map((c, i) => ({
          id: `c-${i + 1}`,
          ...c,
          clientConfirmed: false,
        })),
        source: "fallback",
        warning:
          extracted.error ??
          "AI returned unparseable contact list. Showing placeholder contacts — verify all details manually before sending.",
      });
    }

    const contacts = parsed.contacts.slice(0, maxContacts).map((c: any, i: number) => ({
      id: `c-${i + 1}`,
      contactName: String(c.contactName),
      contactTitle: String(c.contactTitle),
      email: String(c.email),
      phone: c.phone ? String(c.phone) : undefined,
      linkedin: c.linkedin ? String(c.linkedin) : undefined,
      relevanceNote: c.relevanceNote ? String(c.relevanceNote) : undefined,
      confidence: typeof c.confidence === "number"
        ? Math.min(Math.max(c.confidence, 0), 100)
        : 50,
      clientConfirmed: false,
    }));

    return NextResponse.json({
      ok: true,
      contacts,
      source: "ai",
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
