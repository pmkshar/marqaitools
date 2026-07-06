// POST /api/marqai/generate-leads
// Body: { productName, productCategory?, targetMarket?, criteria?, count? }
// Returns: { ok: true, leads: Lead[], source: "ai" | "fallback" }
//
// Uses ZAI to generate a list of qualified prospect companies for the
// given product/service. Each lead has a fit-reason + score 0-100.
// NOTE: AI-generated leads are starting points — emails are constructed
// using common patterns (first.last@domain) and should always be
// verified before sending.
//
// Robust parsing: handles bare arrays, {"companies":[...]}, truncated
// JSON, and prose-wrapped responses. Falls back to mock data if the AI
// is unavailable, so the UI never breaks — the `source` field tells
// the client whether to show a "demo data" banner.
import { NextRequest, NextResponse } from "next/server";
import { getZai } from "@/lib/zai";
import { extractLeads } from "@/lib/json-utils";
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

    const sys = `You are Marqai's B2B lead-generation analyst. Generate a list of ${count} realistic prospect companies that would be strong potential buyers for the product below. Return strict JSON: {"leads":[{...}]}. Do NOT include any prose, no markdown fences, no explanation — only the JSON.`;
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

Vary industries and sizes. Use real-sounding (not generic) company names. Do NOT use Fortune-100 companies — pick mid-market to upper-SMB targets. Return exactly ${count} leads. JSON only — start your response with { and end with }.`;

    // Try the AI call. If anything goes wrong, fall back to mock data
    // so the user always sees leads in the UI.
    let aiRaw = "";
    let aiError: string | null = null;
    let rawLeads: any[] = [];

    try {
      const zai = await getZai();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.85,
        max_tokens: 4096,
      });
      aiRaw = completion.choices?.[0]?.message?.content ?? "";
      rawLeads = extractLeads(aiRaw);
    } catch (e) {
      aiError = e instanceof Error ? e.message : String(e);
    }

    // If AI returned 0 leads despite succeeding, retry once with a
    // simpler prompt and lower count.
    if (rawLeads.length === 0 && !aiError) {
      try {
        const zai = await getZai();
        const retry = await zai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `Return JSON: {"leads":[{"companyName":"","website":"","industry":"","size":"11-50","location":"","linkedin":"","contactName":"","contactTitle":"","fitReason":"","score":75}]}. Generate ${Math.min(
                count,
                8,
              )} realistic mid-market B2B companies that would buy this product. No prose.`,
            },
            { role: "user", content: `Product: ${body.productName}` },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        });
        aiRaw = retry.choices?.[0]?.message?.content ?? "";
        rawLeads = extractLeads(aiRaw);
      } catch (e) {
        aiError = e instanceof Error ? e.message : String(e);
      }
    }

    // Map raw leads to the Lead type.
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

    // If AI failed entirely, return mock leads so the UI works.
    if (leads.length === 0) {
      const mockLeads = generateMockLeads(body, count);
      return NextResponse.json({
        ok: true,
        leads: mockLeads,
        source: "fallback",
        warning: aiError
          ? `AI service unavailable (${aiError}). Showing sample leads for demonstration.`
          : `AI returned no parseable leads. Showing sample leads. Raw preview: ${aiRaw.slice(0, 200)}`,
      });
    }

    return NextResponse.json({
      ok: true,
      leads,
      source: "ai",
      ...(aiError ? { warning: aiError } : {}),
    });
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
  return `${first}.${last}@${domain}`;
}

/**
 * Generate realistic-looking mock leads when the AI is unavailable.
 * Names/contacts are clearly sample data — the `source: "fallback"`
 * flag tells the client to show a "demo data" banner.
 */
function generateMockLeads(body: Body, count: number): Lead[] {
  const industries = [
    "Marketing Agency",
    "IT Services",
    "E-commerce",
    "Manufacturing",
    "SaaS",
    "Consulting",
    "Healthcare",
    "Financial Services",
    "Education",
    "Real Estate",
    "Logistics",
    "Media & Publishing",
  ];
  const cities = [
    "Austin, USA",
    "Berlin, Germany",
    "Vancouver, Canada",
    "London, UK",
    "Singapore",
    "Sydney, Australia",
    "Bengaluru, India",
    "Toronto, Canada",
    "Amsterdam, Netherlands",
    "Dublin, Ireland",
    "São Paulo, Brazil",
    "Tokyo, Japan",
  ];
  const sizes: Lead["size"][] = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
  const titles = [
    "Chief Operating Officer",
    "VP Marketing",
    "Head of Growth",
    "Director of Sales",
    "Managing Director",
    "CMO",
    "Founder & CEO",
    "Head of Customer Success",
  ];
  const firstNames = [
    "Sarah", "Marcus", "Jennifer", "David", "Priya", "Liam", "Sofia", "Daniel",
    "Aisha", "Noah", "Mia", "Ethan", "Olivia", "Lucas", "Emma", "Raj",
  ];
  const lastNames = [
    "Mitchell", "Weber", "Rodriguez", "Chen", "Patel", "Johnson", "Silva", "Kim",
    "Anderson", "Müller", "Garcia", "Wong", "Brown", "Nair", "Lopez", "Tanaka",
  ];
  const prefixWords = [
    "Bright", "Tech", "Green", "Precision", "Apex", "Nimbus", "Vertex", "Quantum",
    "Summit", "Pioneer", "Catalyst", "Stellar", "Pulse", "Forge", "Lumen", "Echo",
  ];
  const suffixWords = [
    "Wave", "Nova", "Leaf", "Engineering", "Labs", "Cloud", "Hub", "Works",
    "Systems", "Group", "Solutions", "Digital", "Forge", "Studio", "Co", "AI",
  ];

  const leads: Lead[] = [];
  const productLower = body.productName.toLowerCase();
  const seed = productLower.length;

  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 7) % prefixWords.length;
    const idx2 = (seed + i * 11) % suffixWords.length;
    const companyName = `${prefixWords[idx]}${suffixWords[idx2]}`;
    const industry = industries[(seed + i) % industries.length];
    const location = cities[(seed + i) % cities.length];
    const size = sizes[(seed + i) % sizes.length];
    const contactName = `${firstNames[(seed + i) % firstNames.length]} ${lastNames[(seed + i * 3) % lastNames.length]}`;
    const contactTitle = titles[(seed + i) % titles.length];
    const score = 60 + ((seed + i * 13) % 35); // 60-94
    const website = `${companyName.toLowerCase().replace(/[^a-z]/g, "")}.com`;
    const email = predictEmail(contactName, website);
    const fitReason = `Mid-market ${industry.toLowerCase()} in ${location.split(",")[0]} with ${size} employees — likely to have budget and authority to evaluate ${body.productName}.`;

    leads.push({
      id: `mock-lead-${Date.now()}-${i}`,
      companyName,
      website,
      industry,
      size,
      location,
      linkedin: `linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z]/g, "-")}`,
      contactName,
      contactTitle,
      fitReason,
      score,
      email,
      status: "new",
      createdAt: new Date().toISOString(),
    });
  }

  return leads;
}
