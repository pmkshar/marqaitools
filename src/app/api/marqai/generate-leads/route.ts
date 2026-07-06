// POST /api/marqai/generate-leads
// Body: { productName, productCategory?, targetMarket?, criteria?, count? }
// Returns: { leads: Lead[] }
//
// Uses ZAI to generate a list of qualified prospect companies for the
// given product/service. Each lead has a fit-reason + score 0-100.
// NOTE: AI-generated leads are starting points — emails are constructed
// using common patterns (first.last@domain) and should always be
// verified before sending.
import { NextRequest, NextResponse } from "next/server";
import { getZai } from "@/lib/zai";
import type { Lead } from "@/lib/marqai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  productName: string;
  productCategory?: string;
  targetMarket?: string;
  criteria?: string;
  count?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.productName) {
      return NextResponse.json({ error: "Missing productName" }, { status: 400 });
    }
    const count = Math.min(Math.max(body.count ?? 12, 3), 25);

    const sys = `You are Marqai's B2B lead-generation analyst. Generate a list of ${count} realistic prospect companies that would be strong potential buyers for the product below. Return strict JSON: {"leads":[{...}]}. Do NOT include any prose.`;
    const user = `Product/Service: ${body.productName}
Category: ${body.productCategory ?? "General B2B"}
Target market: ${body.targetMarket ?? "Global"}
Criteria: ${body.criteria ?? "Companies likely to have budget, need, and authority to buy"}

For each lead, return a JSON object with EXACTLY these keys:
{
  "companyName": string,
  "website": string (e.g. "acme.com" — no protocol),
  "industry": string,
  "size": "1-10" | "11-50" | "51-200" | "201-1000" | "1000+",
  "location": string (city, country),
  "linkedin": string (linkedin.com/company/slug),
  "contactName": string (likely decision-maker's full name),
  "contactTitle": string (e.g. "VP Marketing", "Head of Growth"),
  "fitReason": string (1-2 sentences explaining why this company is a fit),
  "score": number (0-100, higher = better fit)
}

Vary industries and sizes. Use real-sounding (not generic) company names. Do NOT use Fortune-100 companies — pick mid-market to upper-SMB targets. Return exactly ${count} leads. JSON only.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.85,
      max_tokens: 3500,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    const rawLeads: any[] = parsed?.leads ?? [];

    const leads: Lead[] = rawLeads.slice(0, count).map((l, idx) => {
      const score = clampInt(l.score ?? 50, 0, 100);
      const email = predictEmail(l.contactName, l.website);
      return {
        id: `lead-${Date.now()}-${idx}`,
        companyName: String(l.companyName ?? "Unknown"),
        website: l.website ? String(l.website) : undefined,
        industry: l.industry ? String(l.industry) : undefined,
        size: l.size,
        location: l.location ? String(l.location) : undefined,
        linkedin: l.linkedin ? String(l.linkedin) : undefined,
        contactName: l.contactName ? String(l.contactName) : undefined,
        contactTitle: l.contactTitle ? String(l.contactTitle) : undefined,
        fitReason: l.fitReason ? String(l.fitReason) : undefined,
        score,
        email,
        status: "new",
        createdAt: new Date().toISOString(),
      };
    });

    if (leads.length === 0) {
      return NextResponse.json({ error: "AI returned no leads" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, leads });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function clampInt(n: number, min: number, max: number): number {
  if (typeof n !== "number" || isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function predictEmail(contactName: string | undefined, website: string | undefined): string | undefined {
  if (!contactName || !website) return undefined;
  const parts = contactName.toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return undefined;
  const [first, last] = parts;
  const domain = website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  // Try first.last pattern (most common)
  return `${first}.${last}@${domain}`;
}

function extractJson(text: string): any | null {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') inStr = !inStr;
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        const slice = t.slice(start, i + 1);
        try { return JSON.parse(slice); } catch { return null; }
      }
    }
  }
  return null;
}
