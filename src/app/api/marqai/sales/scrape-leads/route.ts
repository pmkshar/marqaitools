// POST /api/marqai/sales/scrape-leads
// Stage 1 of the AI Sales Workflow.
//
// Body: {
//   companyName: string,
//   website?: string,           // e.g. "acme.com"
//   linkedinUrl?: string,       // company OR personal LinkedIn URL (Apollo-style)
//   productContext?: string,    // what we sell
//   targetTitles?: string[],
//   maxContacts?: number
// }
//
// Returns: {
//   ok: true,
//   contacts: ScrapedContact[],
//   source: "live_scrape" | "fallback",
//   sources: string[],
//   evidenceSummary: string,
//   warning?: string
// }
//
// HOW THIS ROUTE WORKS (multi-layer scraping)
// -------------------------------------------
// Layer 1: Z.AI page_reader on the company website (homepage + /contact,
//          /about, /team, /leadership, /about-us, /people).
// Layer 2: Native fetch() fallback for any page_reader failure (some
//          Vercel regions return null from page_reader for sites that
//          require browser rendering; native fetch at least gets the
//          raw HTML which often contains email addresses in <a href="mailto:">
//          tags or footer text).
// Layer 3: Z.AI web_search for "<Company> CEO founder leadership team",
//          "<Company> contact email phone", "<Company> site:linkedin.com",
//          "<Company> press news announcement". Page-read each result.
// Layer 4: Google-style fallback searches when layers 1-3 yield zero
//          usable emails: '"@<domain>" <company>' (find any email on
//          the company domain that appears anywhere on the public web),
//          '<company> leadership email', '<company> contact us email'.
// Layer 5: Apollo.ai-style LinkedIn lookup. If linkedinUrl is a
//          /company/<name> URL, page-read it for the leadership list.
//          If it's a /in/<person> URL, page-read the profile, extract
//          the person's name + title, then infer an email pattern on
//          the company domain (first.last@domain, etc.).
// Layer 6: Email pattern inference. When we have a real name + real
//          company domain but no email was found on any page, generate
//          the 5 most common corporate email patterns and mark each as
//          "inferred" with low confidence. The operator must verify
//          before sending.
// Layer 7: LLM organization. Hand all REAL scraped evidence (emails,
//          phones, names, LinkedIn URLs, source URLs) to the LLM with
//          hard rules: only use evidence that appears verbatim, never
//          invent emails or phones, return empty array if no evidence.
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
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g;
const NAME_RE = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;
const LINKEDIN_PROFILE_RE = /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+/gi;
const MAILTO_RE = /mailto:([^"'\s?>]+)/gi;

const EMAIL_BLOCKLIST = new Set([
  "sentry@recommendationservice.com", "wix@wix.com",
  "no-reply@example.com", "noreply@example.com", "support@example.com",
  "contact@example.com", "hello@example.com", "admin@example.com",
  "team@example.com", "info@example.com", "privacy@example.com",
  "legal@example.com", "press@example.com",
]);

function isJunkPhone(s: string): boolean {
  const digits = s.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return true;
  if (/^(\d)\1+$/.test(digits)) return true;
  if (/20[12]\d/.test(s) && digits.length <= 8) return true;
  return false;
}

function isJunkEmail(s: string, companyDomain: string): boolean {
  const lower = s.toLowerCase();
  if (EMAIL_BLOCKLIST.has(lower)) return true;
  if (lower.endsWith("@sentry.io")) return true;
  if (lower.endsWith("@example.com")) return true;
  if (lower.endsWith("@wix.com")) return true;
  if (lower.endsWith("@wordpress.com")) return true;
  if (lower.endsWith("@godaddy.com")) return true;
  if (lower.includes(".png") || lower.includes(".jpg") || lower.includes(".gif") || lower.includes(".webp")) return true;
  // Discard emails on totally unrelated domains IF we know the company
  // domain (they're almost always tracking pixels or third-party).
  // Exception: we keep them — they might be a real contact on a
  // subsidiary domain. We just downgrade their confidence later.
  void companyDomain;
  return false;
}

function dedupe<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

function normalizeWebsite(input: string): string {
  let s = input.trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  return s;
}

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

// Native fetch() fallback — bypasses Z.AI page_reader entirely.
// Many sites work better with a plain HTTP fetch because page_reader
// on Vercel sometimes returns null for sites that need cookies/JS.
async function nativeFetchHtml(url: string): Promise<{ title: string; html: string; url: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MarqaiSalesAgent/1.0; +https://marqai.tools/bot)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) return null;
    const html = await res.text();
    if (!html || html.length < 200) return null;
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return {
      title: titleMatch ? titleMatch[1].trim() : "",
      html,
      url,
    };
  } catch {
    return null;
  }
}

// Get HTML using zai page_reader first, fall back to native fetch.
async function getPageHtml(zai: any, url: string): Promise<{ title: string; html: string; url: string; via: "page_reader" | "native_fetch" } | null> {
  const viaZai = await zaiPageRead(zai, url);
  if (viaZai && viaZai.html && viaZai.html.length > 500) {
    return { ...viaZai, via: "page_reader" };
  }
  const viaFetch = await nativeFetchHtml(url);
  if (viaFetch) return { ...viaFetch, via: "native_fetch" };
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#64;/g, "@")
    .replace(/\s+/g, " ")
    .trim();
}

function findNearbyName(text: string, contactStr: string): string | undefined {
  const idx = text.indexOf(contactStr);
  if (idx < 0) return undefined;
  const start = Math.max(0, idx - 150);
  const end = Math.min(text.length, idx + contactStr.length + 150);
  const window = text.slice(start, end);
  const names = window.match(NAME_RE) ?? [];
  const filtered = names.filter((n) => {
    const lower = n.toLowerCase();
    return !["contact us", "about us", "privacy policy", "terms of", "all rights", "follow us", "get started", "learn more", "sign up", "log in"].some((j) => lower.includes(j));
  });
  return filtered[0];
}

// Generate the 5 most common corporate email patterns from a name + domain.
// Used as Layer 6 — only when no real email was found on any page.
function inferEmailPatterns(fullName: string, domain: string): string[] {
  if (!fullName || !domain) return [];
  const parts = fullName.toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return [];
  const [first, ...rest] = parts;
  const last = rest[rest.length - 1];
  const firstInitial = first[0];
  const lastInitial = last[0];
  return dedupe([
    `${first}.${last}@${domain}`,
    `${first}${last}@${domain}`,
    `${first}@${domain}`,
    `${firstInitial}${last}@${domain}`,
    `${first}${lastInitial}@${domain}`,
    `${firstInitial}.${last}@${domain}`,
    `${last}@${domain}`,
  ]);
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
      : ["CEO", "CTO", "VP Marketing", "Head of Growth", "Head of Sales", "Founder", "COO", "CMO", "VP Sales"];
    const companyDomain = deriveDomain(body.website ?? "");
    const websiteUrl = normalizeWebsite(body.website ?? "");
    const linkedinUrl = body.linkedinUrl?.trim() || "";

    const zai = await getZai();

    // ---------- Build the page-read queue ----------
    const pagesToRead: { url: string; source: string }[] = [];

    // Layer 1: company website + common subpages.
    if (websiteUrl) {
      pagesToRead.push({ url: websiteUrl, source: "company website (homepage)" });
      const base = websiteUrl.replace(/\/$/, "");
      for (const path of ["/contact", "/contact-us", "/about", "/about-us", "/team", "/leadership", "/people", "/staff", "/management"]) {
        pagesToRead.push({ url: base + path, source: `company website (${path})` });
      }
    }

    // Layer 5 (Apollo-style): if a LinkedIn URL was provided, page-read it
    // directly — works for both /company/<name> and /in/<person> URLs.
    if (linkedinUrl) {
      pagesToRead.push({ url: linkedinUrl, source: "LinkedIn (operator-provided URL)" });
    }

    // Layer 3: web search for company leadership + contact info.
    const searchQueries = [
      `${body.companyName} CEO founder leadership team`,
      `${body.companyName} contact email phone`,
      `${body.companyName} email address`,
      `${body.companyName} press news announcement`,
    ];
    if (linkedinUrl && /\/in\//i.test(linkedinUrl)) {
      // If operator pasted a personal LinkedIn URL, also search for that person.
      const profileSlug = linkedinUrl.split("/in/")[1]?.split(/[/?#]/)[0];
      if (profileSlug) {
        searchQueries.unshift(`${profileSlug.replace(/[-_]/g, " ")} ${body.companyName} email`);
      }
    } else {
      searchQueries.push(`${body.companyName} site:linkedin.com/in`);
    }
    const searchResults: { url: string; name: string; snippet: string; host_name: string; query: string }[] = [];
    for (const q of searchQueries) {
      const results = await zaiWebSearch(zai, q, 4);
      for (const r of results) {
        searchResults.push({ ...r, query: q });
      }
    }
    const seenUrls = new Set<string>();
    for (const r of searchResults) {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        pagesToRead.push({ url: r.url, source: `web search: "${r.query}"` });
      }
    }

    const pages = pagesToRead.slice(0, 12);

    // ---------- Scrape each page ----------
    const sources: string[] = [];
    const allEmails = new Map<string, { name?: string; url: string; source: string; via: string }>();
    const allPhones = new Map<string, { url: string; source: string }>();
    const allLinkedin = new Map<string, { url: string; source: string }>();
    const allNamesWithCtx: { name: string; url: string; snippet: string; source: string }[] = [];
    const rawSnippets: { url: string; title: string; text: string; source: string }[] = [];

    for (const p of pages) {
      const page = await getPageHtml(zai, p.url);
      if (!page) continue;
      sources.push(p.url);

      const text = stripHtml(page.html);
      rawSnippets.push({ url: p.url, title: page.title, text: text.slice(0, 8000), source: p.source });

      // mailto: links (highest signal — these are intentional contact emails)
      const mailtos = dedupe(Array.from(page.html.matchAll(MAILTO_RE)).map((m) => m[1]).filter(Boolean));
      for (const email of mailtos) {
        const clean = email.toLowerCase().trim();
        if (isJunkEmail(clean, companyDomain)) continue;
        const name = findNearbyName(text, email);
        allEmails.set(clean, { name, url: p.url, source: p.source, via: "mailto link" });
      }

      // Plain-text emails
      const emailsOnPage = dedupe(text.match(EMAIL_RE) ?? []);
      for (const email of emailsOnPage) {
        const clean = email.toLowerCase();
        if (isJunkEmail(clean, companyDomain)) continue;
        if (allEmails.has(clean)) continue;
        const name = findNearbyName(text, email);
        allEmails.set(clean, { name, url: p.url, source: p.source, via: "page text" });
      }

      // Phones
      const phonesOnPage = dedupe(text.match(PHONE_RE) ?? []);
      for (const phone of phonesOnPage) {
        if (isJunkPhone(phone)) continue;
        if (allPhones.has(phone)) continue;
        allPhones.set(phone, { url: p.url, source: p.source });
      }

      // LinkedIn profiles
      const linkedins = dedupe(text.match(LINKEDIN_PROFILE_RE) ?? []);
      for (const li of linkedins) {
        if (!allLinkedin.has(li)) allLinkedin.set(li, { url: p.url, source: p.source });
      }

      // Names near titles
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

    // ---------- Layer 4: Google-style fallback if zero emails found ----------
    let googleFallbackUsed = false;
    if (allEmails.size === 0 && companyDomain) {
      googleFallbackUsed = true;
      const fallbackQueries = [
        `"@${companyDomain}" ${body.companyName}`,
        `${body.companyName} email contact site:${companyDomain}`,
        `"${body.companyName}" "email" contact`,
        `${body.companyName} leadership email phone`,
      ];
      for (const q of fallbackQueries) {
        const results = await zaiWebSearch(zai, q, 5);
        for (const r of results) {
          if (!r.url || seenUrls.has(r.url)) continue;
          seenUrls.add(r.url);
          const page = await getPageHtml(zai, r.url);
          if (!page) continue;
          sources.push(r.url);
          const text = stripHtml(page.html);
          const emails = dedupe(text.match(EMAIL_RE) ?? []);
          for (const email of emails) {
            const clean = email.toLowerCase();
            if (isJunkEmail(clean, companyDomain)) continue;
            if (allEmails.has(clean)) continue;
            // Only keep emails on the company domain (we're looking for
            // corporate contacts, not random emails on third-party pages).
            if (!clean.endsWith("@" + companyDomain) && !clean.includes("@" + companyDomain.split(".")[0] + ".")) continue;
            const name = findNearbyName(text, email);
            allEmails.set(clean, { name, url: r.url, source: `Google fallback: "${q}"`, via: "page text" });
          }
          // Also harvest search snippets themselves — they often contain
          // emails in plain text.
          const snippetEmails = dedupe((r.snippet + " " + r.name).match(EMAIL_RE) ?? []);
          for (const email of snippetEmails) {
            const clean = email.toLowerCase();
            if (isJunkEmail(clean, companyDomain)) continue;
            if (allEmails.has(clean)) continue;
            allEmails.set(clean, { name: undefined, url: r.url, source: `Google snippet: "${q}"`, via: "search snippet" });
          }
        }
      }
    }

    // ---------- Layer 6: Email pattern inference (Apollo-style) ----------
    // If we have a real name from the page but no email, generate the 5
    // most common corporate email patterns on the company domain.
    const inferredEmails: { email: string; name: string; sourceUrl: string }[] = [];
    if (companyDomain && allEmails.size < maxContacts) {
      // Collect real names we found near titles.
      const realNames = dedupe(allNamesWithCtx.map((n) => n.name)).slice(0, 6);
      for (const name of realNames) {
        const patterns = inferEmailPatterns(name, companyDomain);
        for (const email of patterns) {
          // Skip if we already have this email from a real source.
          if (allEmails.has(email)) continue;
          // Skip if we already added it as inferred.
          if (inferredEmails.some((e) => e.email === email)) continue;
          const nameEntry = allNamesWithCtx.find((n) => n.name === name);
          inferredEmails.push({
            email,
            name,
            sourceUrl: nameEntry?.url ?? websiteUrl,
          });
        }
      }
    }

    // ---------- Layer 5b: Apollo-style direct LinkedIn /in/ lookup ----------
    // If operator pasted a personal LinkedIn URL, we should have at least
    // one name+title from page-reading it. If we still have no email,
    // infer patterns from that person's name on the company domain.
    if (linkedinUrl && /\/in\//i.test(linkedinUrl) && companyDomain) {
      // Try to extract the person's name from the LinkedIn page text we already read.
      const linkedinPage = rawSnippets.find((s) => s.url === linkedinUrl || s.url.includes(linkedinUrl.replace(/^https?:\/\//, "")));
      if (linkedinPage) {
        const names = linkedinPage.text.match(NAME_RE) ?? [];
        // Filter out junk and common LinkedIn UI text.
        const realNames = names.filter((n) => {
          const lower = n.toLowerCase();
          return !["log in", "sign up", "join now", "sign in", "learn more", "view profile", "linked in", "all rights"].some((j) => lower.includes(j));
        }).slice(0, 3);
        for (const name of realNames) {
          const patterns = inferEmailPatterns(name, companyDomain);
          for (const email of patterns) {
            if (allEmails.has(email)) continue;
            if (inferredEmails.some((e) => e.email === email)) continue;
            inferredEmails.push({ email, name, sourceUrl: linkedinUrl });
          }
        }
      }
    }

    // ---------- Build evidence packet for LLM ----------
    const evidenceLines: string[] = [];
    let i = 0;
    for (const [email, meta] of allEmails) {
      evidenceLines.push(`EMAIL[${i++}]: ${email}${meta.name ? ` (nearby name: ${meta.name})` : ""} [via ${meta.via} | src: ${meta.source} | url: ${meta.url}]`);
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
        evidenceLines.push(`  - ${n.name} [near: "${n.snippet.slice(0, 100)}" | src: ${n.source} | url: ${n.url}]`);
      }
    }
    if (inferredEmails.length > 0) {
      evidenceLines.push("INFERRED_EMAIL_PATTERNS (generated from real names + company domain — mark these as 'inferred' with low confidence):");
      for (const e of inferredEmails.slice(0, 20)) {
        evidenceLines.push(`  - ${e.email} (for name: ${e.name}) [src: ${e.sourceUrl}]`);
      }
    }
    evidenceLines.push("SEARCH_SNIPPETS:");
    for (const r of searchResults.slice(0, 12)) {
      evidenceLines.push(`  - [${r.host_name}] ${r.name}: ${r.snippet}`);
    }

    const evidence = evidenceLines.join("\n");

    // ---------- Layer 7: LLM organization ----------
    const sys = `You are a sales-prospecting assistant. You will be given a packet of EVIDENCE scraped LIVE from the company's website, LinkedIn, and Google search results. Your job is to ORGANIZE this evidence into a clean contact list.

CRITICAL RULES — VIOLATING THESE IS A SHOWSTOPPER:
1. You may ONLY use names, emails, phone numbers, and LinkedIn URLs that appear VERBATIM in the evidence packet below OR in the INFERRED_EMAIL_PATTERNS section.
2. You may NEVER invent an email or phone number that doesn't appear in the evidence. The only exception is INFERRED_EMAIL_PATTERNS — those are pattern-generated from a real name + the company domain, and you may use them but MUST set "confidence" to 20 or lower and "sourceType" to "inferred".
3. For real scraped emails/phones, set "sourceType" to "scraped" and confidence per this rubric:
   - 80-100: Email domain matches the company website domain AND a name+title appeared nearby.
   - 50-79:  Email domain matches the company website domain but no name nearby, OR name+title found but no email.
   - 20-49:  Name found in a search snippet but no email/phone to attach.
4. You may assign a "contactTitle" based on what the page said near the name (e.g. if the snippet says "Jane Doe, VP Marketing", the title is "VP Marketing"). If no title is mentioned near the name, set "contactTitle" to "Team Member".
5. The "relevanceNote" should explain, in one sentence, why this contact would care about the product being sold (use the product context provided). If the contact is clearly generic (e.g. info@ mailbox), say so.
6. Drop junk: ignore emails like info@, contact@, support@, noreply@, privacy@, legal@, press@ UNLESS the operator explicitly was looking for those. Prefer personal emails.
7. Dedupe by email (keep highest-confidence entry).
8. Rank highest-confidence first.
9. Return at most ${maxContacts} contacts.

If the evidence packet is empty or contains zero real contact names/emails/phones AND zero inferred patterns, return an empty contacts array — do NOT fabricate fallback data.

Return STRICT JSON only — no prose, no markdown fences:
{
  "contacts": [
    {
      "contactName": "<full name OR 'Unknown (email)' if name not on page>",
      "contactTitle": "<title from the page OR 'Team Member'>",
      "email": "<exact email from evidence OR from inferred patterns, OR null>",
      "phone": "<exact phone from evidence, OR null>",
      "linkedin": "<exact LinkedIn URL from evidence, OR null>",
      "relevanceNote": "<one sentence>",
      "confidence": <number 0-100>,
      "sourceType": "scraped" | "inferred",
      "sourceUrl": "<URL where this contact was actually found>"
    }
  ]
}

JSON only.`;

    const user = `Target company: ${body.companyName}
${companyDomain ? `Company domain: ${companyDomain}` : "Company domain: (unknown — no website provided)"}
${linkedinUrl ? `LinkedIn URL provided: ${linkedinUrl}` : ""}
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
      max_tokens: 2400,
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

    const aiContacts: any[] = isValid ? parsed.contacts : [];

    const contacts = aiContacts.slice(0, maxContacts).map((c: any, idx: number) => {
      const email = c.email && typeof c.email === "string" ? c.email : undefined;
      const phone = c.phone && typeof c.phone === "string" ? c.phone : undefined;
      const linkedin = c.linkedin && typeof c.linkedin === "string" ? c.linkedin : undefined;
      return {
        id: `c-${idx + 1}`,
        contactName: String(c.contactName),
        contactTitle: String(c.contactTitle),
        email: email ?? "(not found)",
        phone,
        linkedin,
        relevanceNote: c.relevanceNote ? String(c.relevanceNote) : undefined,
        confidence: typeof c.confidence === "number"
          ? Math.min(Math.max(c.confidence, 0), 100)
          : 30,
        sourceType: c.sourceType === "inferred" ? "inferred" : "scraped",
        sourceUrl: c.sourceUrl ? String(c.sourceUrl) : undefined,
        clientConfirmed: false,
      };
    });

    // ---------- Honest summary ----------
    const summary: string[] = [];
    summary.push(`Scraped ${pages.length} page(s) directly + ${googleFallbackUsed ? "ran Google fallback searches" : "no Google fallback needed"}.`);
    summary.push(`Found ${allEmails.size} real email(s), ${allPhones.size} phone(s), ${allLinkedin.size} LinkedIn profile(s), ${inferredEmails.length} inferred email pattern(s).`);
    summary.push(`Total source URLs scraped: ${sources.length}.`);
    if (contacts.length === 0) {
      summary.push("No usable contacts could be extracted — the company website may not list decision-makers publicly, scraping may have been blocked, or the company has a very small web footprint.");
    } else {
      const scraped = contacts.filter((c) => c.sourceType === "scraped").length;
      const inferred = contacts.filter((c) => c.sourceType === "inferred").length;
      summary.push(`${contacts.length} contact(s) organized from evidence (${scraped} scraped, ${inferred} inferred).`);
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
