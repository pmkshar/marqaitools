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
//   source: "live_scrape" | "fallback",
//   sources: string[],          // URLs that were actually fetched
//   warning?: string
// }
//
// IMPLEMENTATION NOTES
// --------------------
// This route performs REAL web scraping using the Z.AI SDK's built-in
// `web_search` and `page_reader` functions:
//   1. If the operator provided a website URL, we page-read it directly
//      and extract emails + phone numbers from the raw HTML with regex.
//   2. We run targeted web searches ("<Company> CEO", "<Company> leadership",
//      "<Company> contact email", etc.) and page-read the top results.
//   3. We also try common sub-pages that usually carry contact info:
//      /contact, /about, /team, /leadership, /about-us.
//   4. We hand all the REAL scraped snippets (emails, phones, names found
//      on the page) to the LLM and ask it ONLY to:
//         - match emails/phones to the names that appeared alongside them,
//         - assign a plausible title ONLY when the title was actually on
//           the page (otherwise mark title as "Team Member"),
//         - rate confidence based on whether the email domain matches
//           the company website domain,
//         - write a one-line relevance note for the product being sold.
//      The LLM is explicitly forbidden from inventing names, emails, or
//      phone numbers that did not appear in the scraped source text.
//
// This is the difference between "AI-predicted contacts" (the old broken
// behavior) and "AI-organized contacts scraped from the live web" (the
// new behavior).
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

// ---------- Regex extractors ----------
// Email regex — matches most public formats including + and . subaddresses.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// International phone regex — permissive, captures +, dashes, spaces, parens.
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g;
// Person name regex — two or three capitalized words, used to find names
// mentioned alongside emails/phones on the page. We keep it conservative
// to avoid false positives.
const NAME_RE = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;
// LinkedIn profile URLs.
const LINKEDIN_PROFILE_RE = /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;

// Junk emails / phone fragments to discard.
const EMAIL_BLOCKLIST = new Set([
  "sentry@recommendationservice.com",
  "wix@wix.com",
  "no-reply@example.com",
  "noreply@example.com",
  "support@example.com",
  "info@example.com",
  "contact@example.com",
  "hello@example.com",
  "admin@example.com",
  "team@example.com",
]);

// Common image / script phone false-positives (long digit runs in URLs).
function isJunkPhone(s: string): boolean {
  const digits = s.replace(/\D/g, "");
  // Too short or too long to be a real phone.
  if (digits.length < 7 || digits.length > 15) return true;
  // Repeated digits like 0000000 or 1111111.
  if (/^(\d)\1+$/.test(digits)) return true;
  // Years embedded in slugs (e.g. "2021-09-15").
  if (/20[12]\d/.test(s) && digits.length <= 8) return true;
  return false;
}

function isJunkEmail(s: string): boolean {
  const lower = s.toLowerCase();
  if (EMAIL_BLOCKLIST.has(lower)) return true;
  if (lower.endsWith("@sentry.io")) return true;
  if (lower.endsWith("@example.com")) return true;
  if (lower.endsWith("@wix.com")) return true;
  if (lower.includes(".png") || lower.includes(".jpg") || lower.includes(".gif")) return true;
  return false;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Normalize a website input into a full URL the page_reader can fetch.
function normalizeWebsite(input: string): string {
  let s = input.trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  return s;
}

// Try to derive the company domain (e.g. "acme.com") from any website input.
function deriveDomain(input: string): string {
  if (!input) return "";
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/^www\./, "");
  s = s.split("/")[0];
  return s;
}

// ---------- ZAI function helpers ----------

async function zaiWebSearch(zai: any, query: string, num = 5): Promise<{ url: string; name: string; snippet: string; host_name: string }[]> {
  try {
    const result = await zai.functions.invoke("web_search", { query, num });
    if (!Array.isArray(result)) return [];
    return result.slice(0, num).map((r: any) => ({
      url: String(r.url ?? ""),
      name: String(r.name ?? ""),
      snippet: String(r.snippet ?? ""),
      host_name: String(r.host_name ?? ""),
    })).filter((r: any) => r.url);
  } catch {
    return [];
  }
}

async function zaiPageRead(zai: any, url: string): Promise<{ title: string; html: string; url: string } | null> {
  try {
    const result = await zai.functions.invoke("page_reader", { url });
    if (!result || typeof result !== "object") return null;
    const data = result.data ?? result;
    if (!data || typeof data.html !== "string") return null;
    return {
      title: String(data.title ?? ""),
      html: String(data.html ?? ""),
      url: String(data.url ?? url),
    };
  } catch {
    return null;
  }
}

// Strip HTML tags but preserve whitespace around words so the name regex
// still picks up "John Smith" rather than "JohnSmith".
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Find a name that appears within ±120 chars of a contact string.
function findNearbyName(text: string, contactStr: string): string | undefined {
  const idx = text.indexOf(contactStr);
  if (idx < 0) return undefined;
  const start = Math.max(0, idx - 120);
  const end = Math.min(text.length, idx + contactStr.length + 120);
  const window = text.slice(start, end);
  const names = window.match(NAME_RE) ?? [];
  // Filter out common false positives.
  const filtered = names.filter((n) => {
    const lower = n.toLowerCase();
    return !["contact us", "about us", "privacy policy", "terms of", "all rights", "follow us"].some((j) => lower.includes(j));
  });
  return filtered[0];
}

// ---------- Main handler ----------

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
      : ["CEO", "CTO", "VP Marketing", "Head of Growth", "Head of Sales", "Founder", "COO"];
    const companyDomain = deriveDomain(body.website ?? "");
    const websiteUrl = normalizeWebsite(body.website ?? "");

    const zai = await getZai();

    // ---------- STEP 1: page-read the company website directly ----------
    const pagesToRead: { url: string; source: string }[] = [];
    if (websiteUrl) {
      pagesToRead.push({ url: websiteUrl, source: "company website (homepage)" });
      // Try common contact subpages.
      const base = websiteUrl.replace(/\/$/, "");
      for (const path of ["/contact", "/contact-us", "/about", "/about-us", "/team", "/leadership", "/people"]) {
        pagesToRead.push({ url: base + path, source: `company website (${path})` });
      }
    }

    // ---------- STEP 2: web search for company leadership + contact info ----------
    const searchQueries = [
      `${body.companyName} CEO founder leadership team`,
      `${body.companyName} contact email phone`,
      ...(body.linkedinUrl ? [`${body.companyName} site:linkedin.com/in`] : []),
      `${body.companyName} press news announcement`,
    ];
    const searchResults: { url: string; name: string; snippet: string; host_name: string; query: string }[] = [];
    for (const q of searchQueries) {
      const results = await zaiWebSearch(zai, q, 4);
      for (const r of results) {
        searchResults.push({ ...r, query: q });
      }
    }

    // Add top search result URLs to the page-read list (deduped).
    const seenUrls = new Set<string>();
    for (const r of searchResults) {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        pagesToRead.push({ url: r.url, source: `web search: "${r.query}"` });
      }
    }

    // Cap the number of pages we read to avoid blowing through tokens / time.
    const pages = pagesToRead.slice(0, 10);

    // ---------- STEP 3: page-read each URL, extract contacts ----------
    const sources: string[] = [];
    const allEmails = new Map<string, { name?: string; url: string; source: string }>();
    const allPhones = new Map<string, { url: string; source: string }>();
    const allLinkedin = new Map<string, { url: string; source: string }>();
    const allNamesWithCtx: { name: string; url: string; snippet: string; source: string }[] = [];
    const rawSnippets: { url: string; title: string; text: string; source: string }[] = [];

    for (const p of pages) {
      const page = await zaiPageRead(zai, p.url);
      if (!page) continue;
      sources.push(p.url);

      const text = stripHtml(page.html);
      rawSnippets.push({ url: p.url, title: page.title, text: text.slice(0, 8000), source: p.source });

      // Extract emails.
      const emailsOnPage = dedupe(text.match(EMAIL_RE) ?? []);
      for (const email of emailsOnPage) {
        if (isJunkEmail(email)) continue;
        const name = findNearbyName(text, email);
        allEmails.set(email.toLowerCase(), { name, url: p.url, source: p.source });
      }

      // Extract phones.
      const phonesOnPage = dedupe(text.match(PHONE_RE) ?? []);
      for (const phone of phonesOnPage) {
        if (isJunkPhone(phone)) continue;
        allPhones.set(phone, { url: p.url, source: p.source });
      }

      // Extract LinkedIn profiles.
      const linkedins = dedupe(text.match(LINKEDIN_PROFILE_RE) ?? []);
      for (const li of linkedins) {
        allLinkedin.set(li, { url: p.url, source: p.source });
      }

      // Capture names mentioned alongside target titles.
      for (const title of targetTitles) {
        const titleRe = new RegExp(`\\b${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
        let m: RegExpExecArray | null;
        while ((m = titleRe.exec(text)) !== null) {
          const start = Math.max(0, m.index - 80);
          const window = text.slice(start, m.index + title.length + 80);
          const names = window.match(NAME_RE) ?? [];
          for (const name of names) {
            allNamesWithCtx.push({ name, url: p.url, snippet: window.trim(), source: p.source });
          }
        }
      }
    }

    // ---------- STEP 4: hand REAL scraped data to LLM to organize ----------
    // Build a compact "evidence packet" — the LLM may only use what's in here.
    const evidenceLines: string[] = [];
    let i = 0;
    for (const [email, meta] of allEmails) {
      evidenceLines.push(`EMAIL[${i++}]: ${email}${meta.name ? ` (nearby name: ${meta.name})` : ""} [src: ${meta.source}]`);
    }
    i = 0;
    for (const [phone, meta] of allPhones) {
      evidenceLines.push(`PHONE[${i++}]: ${phone} [src: ${meta.source}]`);
    }
    i = 0;
    for (const [li, meta] of allLinkedin) {
      evidenceLines.push(`LINKEDIN[${i++}]: ${li} [src: ${meta.source}]`);
    }
    if (allNamesWithCtx.length > 0) {
      evidenceLines.push("NAMES_FOUND_NEAR_TITLES:");
      for (const n of allNamesWithCtx.slice(0, 30)) {
        evidenceLines.push(`  - ${n.name} [near: "${n.snippet.slice(0, 100)}" | src: ${n.source}]`);
      }
    }
    // Also include the top search snippets — these often contain real names + titles.
    evidenceLines.push("SEARCH_SNIPPETS:");
    for (const r of searchResults.slice(0, 12)) {
      evidenceLines.push(`  - [${r.host_name}] ${r.name}: ${r.snippet}`);
    }

    const evidence = evidenceLines.join("\n");

    const sys = `You are a sales-prospecting assistant. You will be given a packet of EVIDENCE scraped LIVE from the company's website and from web search results. Your job is to ORGANIZE this evidence into a clean contact list.

CRITICAL RULES — VIOLATING THESE IS A SHOWSTOPPER:
1. You may ONLY use names, emails, phone numbers, and LinkedIn URLs that appear VERBATIM in the evidence packet below.
2. You may NEVER invent, guess, or "pattern-fill" an email or phone number. If no email exists in the evidence for a person, set "email" to null.
3. You may NEVER invent a name. If the evidence shows an email like "jdoe@acme.com" but no full name nearby, set "contactName" to "Unknown (jdoe@acme.com)".
4. You may assign a "contactTitle" based on what the page said near the name (e.g. if the snippet says "Jane Doe, VP Marketing", the title is "VP Marketing"). If no title is mentioned near the name, set "contactTitle" to "Team Member".
5. Rate "confidence" honestly based on this rubric:
   - 80-100: Email domain matches the company website domain AND a name+title appeared nearby.
   - 50-79:  Email domain matches the company website domain but no name nearby, OR name+title found but no email.
   - 20-49:  Name found in a search snippet but no email/phone to attach.
   - 0-19:   Only a generic info@ / contact@ mailbox was found, or only a phone number with no name.
6. The "relevanceNote" should explain, in one sentence, why this contact would care about the product being sold (use the product context provided). If the contact is clearly generic (e.g. info@ mailbox), say so.
7. Drop junk: ignore emails like info@, contact@, support@, noreply@, privacy@, legal@, press@ UNLESS the operator explicitly was looking for those. Prefer personal emails.
8. Dedupe by email (keep highest-confidence entry).
9. Rank highest-confidence first.
10. Return at most ${maxContacts} contacts.

If the evidence packet is empty or contains zero real contact names/emails/phones, return an empty contacts array — do NOT fabricate fallback data.

Return STRICT JSON only — no prose, no markdown fences:
{
  "contacts": [
    {
      "contactName": "<full name OR 'Unknown (email)' if name not on page>",
      "contactTitle": "<title from the page OR 'Team Member'>",
      "email": "<exact email from evidence, OR null>",
      "phone": "<exact phone from evidence, OR null>",
      "linkedin": "<exact LinkedIn URL from evidence, OR null>",
      "relevanceNote": "<one sentence>",
      "confidence": <number 0-100>,
      "sourceUrl": "<URL where this contact was actually found>"
    }
  ]
}

JSON only.`;

    const user = `Target company: ${body.companyName}
${companyDomain ? `Company domain: ${companyDomain}` : "Company domain: (unknown — no website provided)"}
${body.linkedinUrl ? `LinkedIn URL provided: ${body.linkedinUrl}` : ""}
${body.productContext ? `What we sell: ${body.productContext}` : "What we sell: (not specified — pick general B2B buyers)"}
Titles of interest: ${targetTitles.join(", ")}

================ EVIDENCE PACKET (scraped live) ================
${evidence || "(no evidence was scraped — the company website and web search returned no usable contact data)"}
================================================================

Organize the evidence into at most ${maxContacts} contacts as JSON.`;

    const completion = await zai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 2200,
    });

    const extracted = extractChatContent(completion);
    const raw = extracted.content ?? "";
    const parsed = extractJson(raw);

    const isValid =
      parsed?.contacts &&
      Array.isArray(parsed.contacts) &&
      parsed.contacts.every(
        (c: any) =>
          c &&
          typeof c.contactName === "string" &&
          typeof c.contactTitle === "string",
      );

    // If the LLM obeyed and returned an empty array (no real evidence), OR
    // returned junk, fall through to an honest "no contacts found" response.
    const aiContacts: any[] = isValid ? parsed.contacts : [];

    const contacts = aiContacts.slice(0, maxContacts).map((c: any, idx: number) => {
      const email = c.email && typeof c.email === "string" ? c.email : undefined;
      const phone = c.phone && typeof c.phone === "string" ? c.phone : undefined;
      const linkedin = c.linkedin && typeof c.linkedin === "string" ? c.linkedin : undefined;
      return {
        id: `c-${idx + 1}`,
        contactName: String(c.contactName),
        contactTitle: String(c.contactTitle),
        email: email ?? "(not found on website)",
        phone,
        linkedin,
        relevanceNote: c.relevanceNote ? String(c.relevanceNote) : undefined,
        confidence: typeof c.confidence === "number"
          ? Math.min(Math.max(c.confidence, 0), 100)
          : 30,
        sourceUrl: c.sourceUrl ? String(c.sourceUrl) : undefined,
        clientConfirmed: false,
      };
    });

    // Build an honest summary of what was actually scraped.
    const summary: string[] = [];
    summary.push(`Scraped ${pages.length} page(s) from ${sources.length} source URL(s).`);
    summary.push(`Found ${allEmails.size} raw email(s), ${allPhones.size} raw phone(s), ${allLinkedin.size} LinkedIn profile(s).`);
    if (contacts.length === 0) {
      summary.push("No usable contacts could be extracted — the company website may not list decision-makers publicly, or scraping was blocked.");
    } else {
      summary.push(`${contacts.length} contact(s) organized from the evidence above.`);
    }

    return NextResponse.json({
      ok: true,
      contacts,
      source: "live_scrape",
      sources,
      evidenceSummary: summary.join(" "),
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
