// POST /api/marqai/sales/scrape-leads
// Stage 1 of the AI Sales Workflow — multi-layer contact discovery.
//
// Body: {
//   companyName: string,
//   website?: string,           // e.g. "acme.com"
//   linkedinUrl?: string,       // company OR personal LinkedIn URL (Apollo-style)
//   productContext?: string,
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
// PERFORMANCE DESIGN (critical — Vercel kills slow functions):
//   • All web_search calls run in PARALLEL (5 queries → 1 round-trip, ~8s total)
//   • All page-reads run in PARALLEL with concurrency limit 6 (6 pages → ~2s total)
//   • Native fetch() is used FIRST (1s/page, returns static HTML with emails in
//     mailto: links and footer text). page_reader is only used as a fallback
//     when native fetch returns nothing useful.
//   • LinkedIn URLs are NOT page-read directly (LinkedIn returns JS garbage to
//     non-browser clients — wastes 12s and yields nothing). Instead, we run
//     targeted web searches to extract names + emails from search snippets.
//   • Early-exit: if Layer 1 (company website) finds enough emails, we skip
//     the slower Layer 3 web-search page-reads entirely.
//   • Total target: 25-35s on Vercel Pro (maxDuration=60). On Hobby (10s
//     hard limit) this route WILL time out — operator must upgrade to Pro.
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
  "legal@example.com", "press@example.com", "billing@example.com",
]);

function isJunkPhone(s: string): boolean {
  const digits = s.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return true;
  if (/^(\d)\1+$/.test(digits)) return true;
  if (/20[12]\d/.test(s) && digits.length <= 8) return true;
  return false;
}

function isJunkEmail(s: string): boolean {
  const lower = s.toLowerCase();
  if (EMAIL_BLOCKLIST.has(lower)) return true;
  if (lower.endsWith("@sentry.io")) return true;
  if (lower.endsWith("@example.com")) return true;
  if (lower.endsWith("@wix.com")) return true;
  if (lower.endsWith("@wordpress.com")) return true;
  if (lower.endsWith("@godaddy.com")) return true;
  if (lower.endsWith("@example.org")) return true;
  if (lower.endsWith("@example.net")) return true;
  if (lower.endsWith("@sentry-next.wixpress.com")) return true;
  if (lower.includes(".png") || lower.includes(".jpg") || lower.includes(".gif") || lower.includes(".webp") || lower.includes(".svg")) return true;
  if (lower.includes("example.") && (lower.includes("damian") || lower.includes("jane") || lower.includes("john") || lower.includes("taro") || lower.includes("yamada"))) return true;
  return false;
}

function dedupe<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

// Clean an extracted email: strip trailing punctuation, backslashes, and
// other artifacts that the regex picks up from HTML-escaped text.
function cleanEmail(raw: string): string {
  let s = raw.toLowerCase().trim();
  // Strip trailing backslashes, quotes, commas, semicolons, whitespace.
  s = s.replace(/[\s\\/"';,)>]+$/g, "");
  // Strip leading backslashes, quotes, etc.
  s = s.replace(/^[\\/"'<(]+/g, "");
  // If the email has escaped chars in the middle (like \\), remove them.
  s = s.replace(/\\/g, "");
  return s;
}

// Detect obvious placeholder / demo / template names that appear on example
// sites (acme.com, example.com, demo templates, etc.). These should never
// become "contacts" — they're not real people.
const PLACEHOLDER_NAMES = new Set([
  "jon doe", "john doe", "jane doe", "john smith", "jane smith",
  "john q public", "mary smith", "warner brothers", "lorem ipsum",
  "test user", "demo user", "example user", "sample user",
  "first last", "your name", "admin admin", "user user",
  "foo bar", "johnny appleseed", "john appleseed",
  "mickey mouse", "donald duck", "bugs bunny",
]);
function isPlaceholderName(lower: string, sourceUrl?: string): boolean {
  if (PLACEHOLDER_NAMES.has(lower)) return true;
  // Catch "first last", "test test", etc.
  const parts = lower.split(/\s+/);
  if (parts.length === 2 && parts[0] === parts[1]) return true;
  // Catch names that include "example" or "demo" or "test".
  if (/\b(example|demo|sample|test|placeholder|fake)\b/.test(lower)) return true;
  // Catch names where either word is a common website/brand/stop word that
  // findNearbyName picks up by mistake (e.g. "Support Secure", "Reddit Is",
  // "Privacy Policy", "Contact Us").
  const nonNameWords = new Set([
    "support", "secure", "reddit", "twitter", "facebook", "instagram",
    "linkedin", "youtube", "tiktok", "medium", "substack", "github",
    "contact", "about", "privacy", "policy", "terms", "service", "services",
    "team", "careers", "jobs", "blog", "news", "press", "help", "faq",
    "sign", "login", "logout", "register", "subscribe", "unsubscribe",
    "learn", "more", "read", "view", "see", "all", "rights", "reserved",
    "follow", "started", "free",
    "home", "page", "site", "web",
    "is", "are", "was", "were", "been", "being", "have", "has",
    "had", "does", "did", "will", "would", "could", "should",
    "might", "must", "shall",
    "stripe", "google", "microsoft", "amazon",
    "netflix", "spotify", "uber", "airbnb", "slack", "zoom",
    "sentry", "wix", "wordpress",
    // Titles / roles that get picked up as name fragments.
    "cofounder", "co", "founder", "ceo", "cto", "cfo", "coo", "cmo",
    "president", "vice", "vp", "director", "manager", "head", "lead",
    "chief", "officer", "executive", "exec", "board", "member", "chairman",
    "principal", "senior", "junior", "associate", "analyst", "specialist",
    "coordinator", "assistant", "deputy", "general", "partner",
    // Organizations that get picked up as name fragments.
    "institute", "foundation", "center", "centre", "university", "college",
    "school", "labs", "lab", "inc", "llc", "corp", "corporation",
    "group", "association", "organization", "org", "company", "agency",
    "markets", "distribution", "logistics", "solutions", "technologies",
    "systems", "consulting", "partners", "enterprises", "industries",
    // Time words.
    "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct",
    "nov", "dec", "monday", "tuesday", "wednesday", "thursday", "friday",
    "saturday", "sunday",
    // Common page-element words that get picked up as name fragments.
    "headshot", "photo", "image", "picture", "avatar", "profile",
    "rating", "review", "score", "award", "badge",
    "comparably", "clay", "dossier", "craft", "theorg",
    "executives", "leadership", "management",
    "directors", "top", "third", "party", "the", "our", "their",
    "acme", "markets",
    "how", "what", "when", "where", "why", "who", "which",
    "we", "us", "they", "them", "you", "your", "my", "me",
    "spend", "spending", "cost", "costs", "price", "pricing",
    "furniture", "customer", "customers", "consumer", "consumers",
    "order", "orders", "shipping", "delivery", "payment", "payments",
    "product", "products", "service", "services", "platform", "application",
    "complaint", "complaints", "email", "emails", "address", "addresses",
    "list", "lists", "directory", "database", "record", "records",
    "submit", "form", "forms", "survey", "surveys", "report", "reports",
  ]);
  if (parts.length >= 2 && parts.some((p) => nonNameWords.has(p))) return true;
  // Catch names where the first word is only 1-2 chars (likely a stop word).
  if (parts[0] && parts[0].length <= 2) return true;
  // Dynamic check: if any word in the name matches the source URL's domain
  // name, it's likely the company name being picked up as a name fragment.
  // e.g. source "clay.com/dossier/..." → "clay" should not be in a name.
  if (sourceUrl) {
    try {
      const host = new URL(sourceUrl).hostname.replace(/^www\./, "").split(".")[0].toLowerCase();
      if (host && host.length > 2 && parts.includes(host)) return true;
    } catch {
      // ignore URL parse errors
    }
  }
  return false;
}

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

// Native fetch() — preferred over page_reader because:
//   • 5x faster (1s vs 5-8s per page)
//   • Returns same static HTML (emails in mailto: links / footer are in static HTML)
//   • No SDK overhead
// Only downside: doesn't render JS. For contact pages this is almost always fine.
async function nativeFetchHtml(url: string, timeoutMs = 8000): Promise<{ title: string; html: string; url: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
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
    if (!ct.includes("text/html") && !ct.includes("application/xhtml") && !ct.includes("text/plain")) return null;
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

// Get HTML using native fetch first (fast), fall back to page_reader (slower,
// renders JS) only when native fetch returns nothing.
async function getPageHtml(zai: any, url: string): Promise<{ title: string; html: string; url: string; via: string } | null> {
  const viaFetch = await nativeFetchHtml(url);
  if (viaFetch && viaFetch.html.length > 500) {
    return { ...viaFetch, via: "native_fetch" };
  }
  const viaZai = await zaiPageRead(zai, url);
  if (viaZai && viaZai.html && viaZai.html.length > 500) {
    return { ...viaZai, via: "page_reader" };
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#64;/g, "@")
    .replace(/&#x40;/g, "@")
    .replace(/\s+/g, " ")
    .trim();
}

function findNearbyName(text: string, contactStr: string): string | undefined {
  const idx = text.indexOf(contactStr);
  if (idx < 0) return undefined;
  const start = Math.max(0, idx - 200);
  const end = Math.min(text.length, idx + contactStr.length + 200);
  const window = text.slice(start, end);
  const names = window.match(NAME_RE) ?? [];
  const filtered = names.filter((n) => {
    const lower = n.toLowerCase();
    return !["contact us", "about us", "privacy policy", "terms of", "all rights", "follow us", "get started", "learn more", "sign up", "log in", "scroll to", "back to top", "all rights reserved", "menu close"].some((j) => lower.includes(j));
  });
  // Prefer 2-word names over 3-word names — 3-word matches are more likely
  // to include a job title or company name fragment (e.g. "Distribution Jeff
  // Goldfogel" → prefer "Jeff Goldfogel"). If we have any 2-word matches
  // that pass the placeholder filter, use those first.
  const two = filtered.filter((n) => n.trim().split(/\s+/).length === 2);
  const three = filtered.filter((n) => n.trim().split(/\s+/).length === 3);
  for (const n of two) {
    if (!isPlaceholderName(n.toLowerCase())) return n;
  }
  // For 3-word names, try extracting a 2-word substring that passes the filter.
  for (const n of three) {
    const parts = n.split(/\s+/);
    // Try last 2 words first (most likely to be the actual name).
    const last2 = parts.slice(1).join(" ");
    if (!isPlaceholderName(last2.toLowerCase())) return last2;
    // Then try first 2 words.
    const first2 = parts.slice(0, 2).join(" ");
    if (!isPlaceholderName(first2.toLowerCase())) return first2;
    // Fall back to the full 3-word name if no 2-word subset passes.
    if (!isPlaceholderName(n.toLowerCase())) return n;
  }
  return filtered[0];
}

// Generate the most common corporate email patterns from a name + domain.
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

// Run async tasks with a concurrency limit. Returns results in input order.
async function withConcurrency<T, R>(items: T[], limit: number, fn: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers: Promise<void>[] = [];
  for (let w = 0; w < Math.min(limit, items.length); w++) {
    workers.push((async () => {
      while (true) {
        const idx = next++;
        if (idx >= items.length) break;
        results[idx] = await fn(items[idx], idx);
      }
    })());
  }
  await Promise.all(workers);
  return results;
}

// ---------- Main handler ----------

export async function POST(req: NextRequest) {
  const tStart = Date.now();
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

    // ---------- LAYER 1+3 (parallel): company website page-reads + web searches ----------
    // Build the page-read queue (Layer 1): homepage + 3 most common contact subpages.
    // We deliberately keep this SHORT (4 pages max) — most emails are on the
    // homepage or /contact page. Adding /team /leadership /about-us rarely
    // surfaces new emails and triples the runtime.
    const pagesToRead: { url: string; source: string }[] = [];
    if (websiteUrl) {
      pagesToRead.push({ url: websiteUrl, source: "company website (homepage)" });
      const base = websiteUrl.replace(/\/$/, "");
      for (const path of ["/contact", "/contact-us", "/about"]) {
        pagesToRead.push({ url: base + path, source: `company website (${path})` });
      }
    }
    // NOTE: We deliberately do NOT add LinkedIn URLs to pagesToRead.
    // LinkedIn returns JavaScript garbage to non-browser clients (we tested:
    // page_reader returns 424KB of JS code with zero emails). Instead we
    // surface LinkedIn data via web_search snippets (Layer 3) which often
    // include the person's name and a snippet like "Patrick Collison is an
    // influencer Stripe CEO".

    // Build web search queries (Layer 3).
    const searchQueries: string[] = [
      `${body.companyName} CEO founder leadership team`,
      `${body.companyName} contact email phone`,
      `${body.companyName} email address`,
    ];
    if (linkedinUrl && /\/in\//i.test(linkedinUrl)) {
      // Operator pasted a personal LinkedIn URL — search for that person's email.
      const profileSlug = linkedinUrl.split("/in/")[1]?.split(/[/?#]/)[0];
      if (profileSlug) {
        searchQueries.unshift(`${profileSlug.replace(/[-_]/g, " ")} ${body.companyName} email`);
      }
    } else if (linkedinUrl && /\/company\//i.test(linkedinUrl)) {
      // Operator pasted a company LinkedIn URL — also search for LinkedIn profiles.
      searchQueries.push(`${body.companyName} site:linkedin.com/in`);
    } else {
      searchQueries.push(`${body.companyName} site:linkedin.com/in`);
    }

    // Fire ALL page-reads and ALL searches in parallel.
    const [pageResults, searchResultsArrays] = await Promise.all([
      // Page reads — up to 4 pages, concurrency 4 (i.e. all parallel).
      withConcurrency(pagesToRead.slice(0, 4), 4, (p) => getPageHtml(zai, p.url).then((page) => ({ p, page }))),
      // Web searches — all in parallel.
      Promise.all(searchQueries.map((q) => zaiWebSearch(zai, q, 4).then((results) => ({ q, results })))),
    ]);

    // Flatten search results, dedupe by URL.
    const searchResults: { url: string; name: string; snippet: string; host_name: string; query: string }[] = [];
    const seenUrls = new Set<string>();
    for (const { q, results } of searchResultsArrays) {
      for (const r of results) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          searchResults.push({ ...r, query: q });
        }
      }
    }

    // Harvest emails/names/phones/LinkedIn URLs directly from search
    // snippets — this is often the ONLY useful signal from LinkedIn pages.
    // Snippets frequently include text like "Patrick Collison is Stripe CEO..."
    // which gives us a name + company + role even though we can't scrape the
    // actual LinkedIn page. When an email appears in the SAME snippet as a
    // name, we link them so the contact list shows "Patrick Collison
    // <patrick@stripe.com>" instead of "Unknown (email) <patrick@stripe.com>".
    const snippetEmails = new Map<string, { query: string; url: string; snippet: string; name?: string }>();
    const snippetNames: { name: string; query: string; url: string; snippet: string }[] = [];
    const snippetLinkedins = new Map<string, { query: string; url: string; snippet: string }>();
    for (const r of searchResults) {
      const combined = `${r.name} ${r.snippet}`;
      // Emails in snippets — also try to find a name in the same snippet.
      const ems = dedupe(combined.match(EMAIL_RE) ?? []);
      for (const e of ems) {
        const clean = cleanEmail(e);
        if (!clean || isJunkEmail(clean)) continue;
        // Try to find a name nearby in this snippet.
        const localName = findNearbyName(combined, e) ?? findNearbyName(combined, e.split("@")[0]);
        if (!snippetEmails.has(clean)) {
          snippetEmails.set(clean, { query: r.query, url: r.url, snippet: r.snippet, name: localName });
        } else if (localName && !snippetEmails.get(clean)?.name) {
          // Update with name if we didn't have one.
          snippetEmails.set(clean, { ...snippetEmails.get(clean)!, name: localName });
        }
      }
      // LinkedIn URLs in snippets.
      const lis = dedupe(combined.match(LINKEDIN_PROFILE_RE) ?? []);
      for (const li of lis) {
        if (!snippetLinkedins.has(li)) snippetLinkedins.set(li, { query: r.query, url: r.url, snippet: r.snippet });
      }
      // Names near CEO/founder/title keywords in snippets.
      const titleKws = ["CEO", "CTO", "founder", "co-founder", "VP", "President", "Director", "Head of"];
      if (titleKws.some((k) => r.snippet.includes(k) || r.name.includes(k))) {
        const names = combined.match(NAME_RE) ?? [];
        for (const n of names.slice(0, 3)) {
          const lower = n.toLowerCase();
          if (lower.includes("linkedin") || lower.includes("log in") || lower.includes("sign")) continue;
          if (isPlaceholderName(lower, r.url)) continue;
          snippetNames.push({ name: n, query: r.query, url: r.url, snippet: r.snippet });
        }
      }
    }

    // ---------- LAYER 3b (parallel): page-read top 3 search results ----------
    // Only do this if Layer 1 + snippets didn't already give us enough emails.
    // This is the slow part, so we skip it whenever possible.
    const totalEmailsSoFar = snippetEmails.size; // will add page results below
    void totalEmailsSoFar;

    // Collect page results from Layer 1.
    const sources: string[] = [];
    const allEmails = new Map<string, { name?: string; url: string; source: string; via: string }>();
    const allPhones = new Map<string, { url: string; source: string }>();
    const allLinkedin = new Map<string, { url: string; source: string }>();
    const allNamesWithCtx: { name: string; url: string; snippet: string; source: string }[] = [];
    const rawSnippets: { url: string; title: string; text: string; source: string }[] = [];

    // Add snippet-harvested emails to allEmails first.
    for (const [email, meta] of snippetEmails) {
      const nameToUse = meta.name && !isPlaceholderName(meta.name.toLowerCase(), meta.url) ? meta.name : undefined;
      allEmails.set(email, { name: nameToUse, url: meta.url, source: `search snippet: "${meta.query}"`, via: "snippet" });
    }
    for (const [li, meta] of snippetLinkedins) {
      allLinkedin.set(li, { url: meta.url, source: `search snippet: "${meta.query}"` });
    }
    for (const n of snippetNames) {
      allNamesWithCtx.push({ name: n.name, url: n.url, snippet: n.snippet, source: `search snippet: "${n.query}"` });
    }

    // ---------- Apollo-style: operator-pasted LinkedIn URL handling ----------
    // When the operator pastes a LinkedIn URL, that URL is GROUND TRUTH — it's
    // a real person/company they want to reach. We MUST include it in the
    // contact list, even if no other source mentioned it.
    //
    // For /in/<slug> URLs (personal profile), we also try to identify the
    // person's name from the search results that mentioned the slug. The
    // search for "<slug-as-name> <company> email" usually returns results
    // titled "Patrick Collison - Stripe CEO - LinkedIn" which gives us both
    // the name and the LinkedIn URL together.
    let apolloLinkedinName: string | undefined;
    if (linkedinUrl) {
      // Always add the operator-provided LinkedIn URL to allLinkedin so it
      // appears in the contact list (Priority 4 in the candidate builder).
      if (!allLinkedin.has(linkedinUrl)) {
        allLinkedin.set(linkedinUrl, { url: linkedinUrl, source: "operator-provided LinkedIn URL" });
      }
      // For /in/<slug> URLs, try to find the person's name in search results.
      if (/\/in\//i.test(linkedinUrl)) {
        const slug = linkedinUrl.split("/in/")[1]?.split(/[/?#]/)[0] ?? "";
        // Look for the LinkedIn URL in search results — the matching result's
        // title usually contains the person's full name.
        for (const r of searchResults) {
          if (r.url === linkedinUrl || r.url.includes(slug)) {
            // Title looks like "Patrick Collison - Stripe CEO - LinkedIn"
            // or "Patrick Collison | LinkedIn". Extract the name (first 2-3
            // capitalized words before any separator).
            const titleMatch = r.name.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/);
            if (titleMatch) {
              const candidateName = titleMatch[1];
              if (!isPlaceholderName(candidateName.toLowerCase(), linkedinUrl)) {
                apolloLinkedinName = candidateName;
                // Also add to allNamesWithCtx so it gets picked up by Priority 3.
                allNamesWithCtx.push({
                  name: candidateName,
                  url: linkedinUrl,
                  snippet: r.name + " — " + r.snippet,
                  source: `LinkedIn profile search: "${r.query}"`,
                });
                break;
              }
            }
          }
        }
        // If we couldn't find the name from search results, try to derive it
        // from the slug itself (works for slugs like "patrick-collison" but
        // not "patrickcollison" — capitalization boundary is ambiguous).
        if (!apolloLinkedinName && slug) {
          if (slug.includes("-") || slug.includes("_") || slug.includes(".")) {
            const parts = slug.split(/[-_.]/).filter(Boolean);
            if (parts.length >= 2) {
              const derived = parts.slice(0, 3)
                .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                .join(" ");
              if (!isPlaceholderName(derived.toLowerCase(), linkedinUrl)) {
                apolloLinkedinName = derived;
                allNamesWithCtx.push({
                  name: derived,
                  url: linkedinUrl,
                  snippet: `Derived from LinkedIn slug: ${slug}`,
                  source: "operator-provided LinkedIn URL (slug-derived name)",
                });
              }
            }
          }
        }
      }
    }

    // Process Layer 1 page reads.
    for (const { p, page } of pageResults) {
      if (!page) continue;
      sources.push(p.url);
      const text = stripHtml(page.html);
      rawSnippets.push({ url: p.url, title: page.title, text: text.slice(0, 8000), source: p.source });

      // mailto: links (highest signal — these are intentional contact emails)
      const mailtos = dedupe(Array.from(page.html.matchAll(MAILTO_RE)).map((m) => m[1]).filter(Boolean));
      for (const email of mailtos) {
        const clean = cleanEmail(email);
        if (!clean || isJunkEmail(clean)) continue;
        const existing = allEmails.get(clean);
        if (existing && existing.via !== "snippet") continue; // don't overwrite a real-page source with a snippet source
        const name = findNearbyName(text, email);
        allEmails.set(clean, { name, url: p.url, source: p.source, via: "mailto link" });
      }

      // Plain-text emails
      const emailsOnPage = dedupe(text.match(EMAIL_RE) ?? []);
      for (const email of emailsOnPage) {
        const clean = cleanEmail(email);
        if (!clean || isJunkEmail(clean)) continue;
        const existing = allEmails.get(clean);
        if (existing && existing.via !== "snippet") continue;
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
          const start = Math.max(0, m.index - 100);
          const window = text.slice(start, m.index + title.length + 100);
          const names = window.match(NAME_RE) ?? [];
          for (const name of names) {
            allNamesWithCtx.push({ name, url: p.url, snippet: window.trim(), source: p.source });
          }
        }
      }
    }

    // ---------- LAYER 3b (conditional): page-read top 3 search results ----------
    // Only if Layer 1 didn't yield enough emails. Run in parallel.
    let googleFallbackUsed = false;
    const enoughEmails = allEmails.size >= maxContacts;
    if (!enoughEmails) {
      // Pick top 3 search result URLs that are NOT the company website
      // (we already scraped that) and NOT LinkedIn (we know those return
      // garbage to non-browser clients).
      const extraPages = searchResults
        .filter((r) => {
          if (!r.url) return false;
          if (companyDomain && r.url.includes(companyDomain)) return false;
          if (/linkedin\.com/i.test(r.url)) return false;
          return true;
        })
        .slice(0, 3)
        .map((r) => ({ url: r.url, source: `web search: "${r.query}"` }));

      const extraResults = await withConcurrency(extraPages, 3, (p) => getPageHtml(zai, p.url).then((page) => ({ p, page })));
      for (const { p, page } of extraResults) {
        if (!page) continue;
        sources.push(p.url);
        const text = stripHtml(page.html);
        rawSnippets.push({ url: p.url, title: page.title, text: text.slice(0, 6000), source: p.source });

        const mailtos = dedupe(Array.from(page.html.matchAll(MAILTO_RE)).map((m) => m[1]).filter(Boolean));
        for (const email of mailtos) {
          const clean = cleanEmail(email);
          if (!clean || isJunkEmail(clean)) continue;
          if (allEmails.has(clean) && allEmails.get(clean)?.via !== "snippet") continue;
          const name = findNearbyName(text, email);
          allEmails.set(clean, { name, url: p.url, source: p.source, via: "mailto link" });
        }
        const emailsOnPage = dedupe(text.match(EMAIL_RE) ?? []);
        for (const email of emailsOnPage) {
          const clean = cleanEmail(email);
          if (!clean || isJunkEmail(clean)) continue;
          if (allEmails.has(clean) && allEmails.get(clean)?.via !== "snippet") continue;
          const name = findNearbyName(text, email);
          allEmails.set(clean, { name, url: p.url, source: p.source, via: "page text" });
        }
        const linkedins = dedupe(text.match(LINKEDIN_PROFILE_RE) ?? []);
        for (const li of linkedins) {
          if (!allLinkedin.has(li)) allLinkedin.set(li, { url: p.url, source: p.source });
        }
      }

      // ---------- LAYER 4: Google-style fallback if STILL zero emails ----------
      if (allEmails.size === 0 && companyDomain) {
        googleFallbackUsed = true;
        const fallbackQueries = [
          `"@${companyDomain}" ${body.companyName}`,
          `${body.companyName} email contact`,
        ];
        const fallbackResultsArrays = await Promise.all(
          fallbackQueries.map((q) => zaiWebSearch(zai, q, 4).then((results) => ({ q, results })))
        );
        const fallbackPages: { url: string; source: string; query: string }[] = [];
        for (const { q, results } of fallbackResultsArrays) {
          for (const r of results) {
            if (!r.url || seenUrls.has(r.url)) continue;
            seenUrls.add(r.url);
            if (/linkedin\.com/i.test(r.url)) continue;
            fallbackPages.push({ url: r.url, source: `Google fallback: "${q}"`, query: q });
            // Also harvest snippet emails immediately.
            const snippetEmailsFallback = dedupe((r.snippet + " " + r.name).match(EMAIL_RE) ?? []);
            for (const email of snippetEmailsFallback) {
              const clean = cleanEmail(email);
              if (!clean || isJunkEmail(clean)) continue;
              if (allEmails.has(clean)) continue;
              allEmails.set(clean, { name: undefined, url: r.url, source: `Google snippet: "${q}"`, via: "snippet" });
            }
          }
        }
        // Page-read top 3 fallback URLs in parallel.
        const fbResults = await withConcurrency(fallbackPages.slice(0, 3), 3, (p) => getPageHtml(zai, p.url).then((page) => ({ p, page })));
        for (const { p, page } of fbResults) {
          if (!page) continue;
          sources.push(p.url);
          const text = stripHtml(page.html);
          const emails = dedupe(text.match(EMAIL_RE) ?? []);
          for (const email of emails) {
            const clean = cleanEmail(email);
            if (!clean || isJunkEmail(clean)) continue;
            if (allEmails.has(clean)) continue;
            // Only keep emails on the company domain OR emails that look corporate.
            if (companyDomain && !clean.endsWith("@" + companyDomain)) {
              // Allow if it's clearly a personal-sounding email on a related domain.
              // Otherwise skip — third-party emails are usually noise.
              continue;
            }
            const name = findNearbyName(text, email);
            allEmails.set(clean, { name, url: p.url, source: p.source, via: "page text" });
          }
        }
      }
    }

    // ---------- LAYER 6: Email pattern inference (Apollo-style) ----------
    // If we have a real name from the page/search snippets but no email
    // attached to that name, generate the most common corporate email
    // patterns on the company domain. This ALWAYS runs when we have names
    // (regardless of how many generic emails we found) — because generic
    // emails like info@ don't help reach a specific decision-maker.
    const inferredEmails: { email: string; name: string; sourceUrl: string }[] = [];
    if (companyDomain) {
      const realNames = dedupe(allNamesWithCtx.map((n) => n.name)).slice(0, 6);
      for (const name of realNames) {
        const patterns = inferEmailPatterns(name, companyDomain);
        for (const email of patterns) {
          if (allEmails.has(email)) continue;
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

    // ---------- LAYER 5b: Apollo-style direct LinkedIn /in/ lookup ----------
    // If operator pasted a personal LinkedIn URL, we should have at least one
    // name from search snippets. If we still have no email, infer patterns
    // from that person's name on the company domain.
    if (linkedinUrl && /\/in\//i.test(linkedinUrl) && companyDomain) {
      const linkedinSnippets = rawSnippets.filter((s) =>
        s.url.includes(linkedinUrl.replace(/^https?:\/\//, "")) ||
        s.source.includes("search snippet")
      );
      // Also pull from snippetNames — those came from searches about this person.
      const personNames = dedupe([
        ...snippetNames.map((n) => n.name),
        ...linkedinSnippets.flatMap((s) => s.text.match(NAME_RE) ?? []),
      ]).slice(0, 3);
      for (const name of personNames) {
        const patterns = inferEmailPatterns(name, companyDomain);
        for (const email of patterns) {
          if (allEmails.has(email)) continue;
          if (inferredEmails.some((e) => e.email === email)) continue;
          inferredEmails.push({ email, name, sourceUrl: linkedinUrl });
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

    // ---------- LAYER 7: LLM organization (constrained) ----------
    // The LLM CANNOT be trusted as the source of truth for contact data —
    // even with explicit "do not fabricate" instructions, it happily invents
    // LinkedIn URLs and pulls fake names from demo/placeholder page text.
    // We therefore build the contact list DETERMINISTICALLY from the real
    // evidence, and only call the LLM to write a one-sentence relevance note
    // for each pre-built contact. The LLM never gets to invent fields.
    //
    // Build deterministic contact candidates:
    //   Priority 1: emails found on the company domain with a real name nearby
    //   Priority 2: emails found on the company domain without a name
    //   Priority 3: real names found near target titles (no email)
    //   Priority 4: LinkedIn URLs found in snippets (no email, no name match)
    //   Priority 5: inferred email patterns (pattern-generated, low confidence)
    //   Priority 6: emails found on third-party domains (lowest confidence)
    //
    // Each candidate carries its REAL source URL from the scrape — never
    // fabricated.

    type Candidate = {
      contactName: string;
      contactTitle: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      confidence: number;
      sourceType: "scraped" | "inferred";
      sourceUrl: string;
      relevanceHint: string;
    };

    const candidates: Candidate[] = [];
    const usedEmails = new Set<string>();
    const usedNames = new Set<string>();
    const usedLinkedins = new Set<string>();

    // Helper: normalize a name for dedupe (lowercase, strip punctuation).
    const normName = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

    // Priority 1+2: real emails. Sort by:
    //   - email on company domain first
    //   - has nearby name first
    //   - via mailto link first (more intentional than plain text)
    const realEmailEntries = Array.from(allEmails.entries()).sort((a, b) => {
      const aDomain = companyDomain && a[0].endsWith("@" + companyDomain) ? 1 : 0;
      const bDomain = companyDomain && b[0].endsWith("@" + companyDomain) ? 1 : 0;
      if (aDomain !== bDomain) return bDomain - aDomain;
      const aName = a[1].name ? 1 : 0;
      const bName = b[1].name ? 1 : 0;
      if (aName !== bName) return bName - aName;
      const aMailto = a[1].via === "mailto link" ? 1 : 0;
      const bMailto = b[1].via === "mailto link" ? 1 : 0;
      return bMailto - aMailto;
    });

    for (const [email, meta] of realEmailEntries) {
      if (usedEmails.has(email)) continue;
      // Find an attached LinkedIn URL if the same name appears in allLinkedin.
      // Skip placeholder/demo names like "Jon Doe", "Warner Brothers" — these
      // are not real people, even if they appear near an email on a demo site.
      let name = meta.name;
      if (name && isPlaceholderName(name.toLowerCase(), meta.url)) {
        name = undefined;
      }
      // Apollo-style linking: if the operator pasted a /in/<slug> URL and we
      // identified the person's name (apolloLinkedinName), check if the
      // email's local part matches that name. e.g. operator pasted
      // /in/patrickcollison, we identified "Patrick Collison", and we scraped
      // patrick@stripe.com — these should be linked as one contact.
      if (!name && apolloLinkedinName) {
        const localPart = email.split("@")[0].toLowerCase();
        const nameNorm = normName(apolloLinkedinName);
        // Match if local part contains the first name, last name, or both.
        const [firstName, ...rest] = apolloLinkedinName.toLowerCase().split(/\s+/);
        const lastName = rest[rest.length - 1] ?? "";
        if (localPart.includes(firstName) || (lastName && localPart.includes(lastName)) || localPart.includes(nameNorm)) {
          name = apolloLinkedinName;
        }
      }
      let linkedin: string | undefined;
      // If we have a name and the operator provided a LinkedIn URL whose slug
      // matches the name, attach that LinkedIn URL.
      if (name && linkedinUrl && /\/in\//i.test(linkedinUrl)) {
        const slug = (linkedinUrl.split("/in/")[1]?.split(/[/?#]/)[0] ?? "").toLowerCase();
        const nameNorm = normName(name);
        if (slug.includes(nameNorm) || slug.includes(normName(name).slice(0, 6))) {
          linkedin = linkedinUrl;
          usedLinkedins.add(linkedinUrl);
        }
      }
      if (name && !linkedin) {
        // Look through allNamesWithCtx for this name to find the source URL,
        // then check if any LinkedIn URL was found on the same page.
        const nameCtx = allNamesWithCtx.find((n) => n.name === name);
        if (nameCtx) {
          for (const [li] of allLinkedin) {
            if (usedLinkedins.has(li)) continue;
            // Heuristic: same source URL OR the LinkedIn slug contains the name.
            const liSlug = li.split("/").pop() ?? "";
            if (liSlug.toLowerCase().includes(normName(name).slice(0, 6)) || li === nameCtx.url) {
              linkedin = li;
              usedLinkedins.add(li);
              break;
            }
          }
        }
      }
      const onCompanyDomain = companyDomain && email.endsWith("@" + companyDomain);
      // Confidence rubric:
      //   95: name + email on company domain + LinkedIn URL (best case)
      //   90: name + email on company domain
      //   70: name + email (not on company domain)
      //   50: email on company domain but NO name (generic mailbox like
      //       complaints@, support@ — real but not a specific person)
      //   30: email without name and not on company domain
      // Named contacts (Priority 3, confidence 65-85) should rank ABOVE
      // generic mailboxes — a CEO with no public email is more valuable
      // than a support@ mailbox.
      const confidence = name && onCompanyDomain && linkedin ? 95
        : name && onCompanyDomain ? 90
        : name ? 70
        : onCompanyDomain ? 50
        : 30;
      candidates.push({
        contactName: name ?? "Unknown (email)",
        contactTitle: "Team Member", // LLM will refine
        email,
        phone: undefined,
        linkedin,
        confidence,
        sourceType: "scraped",
        sourceUrl: meta.url,
        relevanceHint: `Email found via ${meta.via} on ${meta.url}.`,
      });
      usedEmails.add(email);
      if (name) usedNames.add(normName(name));
    }

    // Priority 3: real names near target titles that don't yet have an email.
    // This includes names extracted from search results about the operator-
    // provided LinkedIn URL (Apollo-style enrichment).
    for (const n of allNamesWithCtx) {
      if (usedNames.has(normName(n.name))) continue;
      // Skip obvious demo/placeholder names.
      const lower = n.name.toLowerCase();
      if (isPlaceholderName(lower, n.url)) continue;
      // Try to find an attached LinkedIn URL.
      let linkedin: string | undefined;
      for (const [li] of allLinkedin) {
        if (usedLinkedins.has(li)) continue;
        const liSlug = (li.split("/").pop() ?? "").toLowerCase();
        if (liSlug.includes(normName(n.name).slice(0, 6)) || li === n.url) {
          linkedin = li;
          usedLinkedins.add(li);
          break;
        }
      }
      // If no LinkedIn URL was found via name matching but the name came from
      // the operator-provided LinkedIn URL search, attach that URL directly.
      if (!linkedin && n.url === linkedinUrl) {
        linkedin = linkedinUrl;
        usedLinkedins.add(linkedinUrl);
      }
      // Confidence: highest when name + LinkedIn both present and the name
      // came from an Apollo-style LinkedIn URL lookup. Medium when name +
      // LinkedIn from general search. Boost when the snippet mentions a
      // senior title (CEO/founder/CTO/etc.) — that means this is likely a
      // decision-maker, not a random team member.
      const isApolloHit = n.url === linkedinUrl && linkedin === linkedinUrl;
      const snippetLower = n.snippet.toLowerCase();
      const mentionsSeniorTitle = /\b(ceo|cto|cfo|coo|cmo|founder|co-founder|cofounder|president|managing director|general partner)\b/.test(snippetLower);
      const confidence = isApolloHit ? 85
        : mentionsSeniorTitle && linkedin ? 75
        : mentionsSeniorTitle ? 65
        : linkedin ? 55
        : 35;
      candidates.push({
        contactName: n.name,
        contactTitle: "Team Member", // LLM will refine from snippet
        email: undefined,
        phone: undefined,
        linkedin,
        confidence,
        sourceType: "scraped",
        sourceUrl: n.url,
        relevanceHint: `Name found near title keyword in: "${n.snippet.slice(0, 120)}"`,
      });
      usedNames.add(normName(n.name));
      if (linkedin) usedLinkedins.add(linkedin);
    }

    // Priority 4: standalone LinkedIn URLs not yet attached to anyone.
    for (const [li, meta] of allLinkedin) {
      if (usedLinkedins.has(li)) continue;
      candidates.push({
        contactName: "Unknown (LinkedIn)",
        contactTitle: "Team Member",
        email: undefined,
        phone: undefined,
        linkedin: li,
        confidence: 30,
        sourceType: "scraped",
        sourceUrl: meta.url,
        relevanceHint: `LinkedIn profile URL found on ${meta.url}.`,
      });
      usedLinkedins.add(li);
    }

    // Priority 5: inferred email patterns. These are pattern-generated from
    // a real name + the company domain — they may be wrong. Mark as inferred
    // with low confidence.
    for (const inf of inferredEmails) {
      if (usedEmails.has(inf.email)) continue;
      // Skip if we already have a real contact for this name.
      if (usedNames.has(normName(inf.name))) continue;
      // Skip placeholder names.
      if (isPlaceholderName(inf.name.toLowerCase(), inf.sourceUrl)) continue;
      candidates.push({
        contactName: inf.name,
        contactTitle: "Team Member",
        email: inf.email,
        phone: undefined,
        linkedin: undefined,
        confidence: 15,
        sourceType: "inferred",
        sourceUrl: inf.sourceUrl,
        relevanceHint: `Email pattern inferred from name "${inf.name}" + company domain "${companyDomain}". Verify before sending.`,
      });
      usedEmails.add(inf.email);
      usedNames.add(normName(inf.name));
    }

    // Rank and cap. Dedupe by LinkedIn URL too — same person shouldn't
    // appear twice just because their name showed up in multiple snippets.
    const seenLinkedinInRanked = new Set<string>();
    const ranked = candidates
      .sort((a, b) => b.confidence - a.confidence)
      .filter((c) => {
        if (c.linkedin) {
          if (seenLinkedinInRanked.has(c.linkedin)) return false;
          seenLinkedinInRanked.add(c.linkedin);
        }
        return true;
      })
      .slice(0, maxContacts);

    // ---------- LLM call: ONLY for relevanceNote + contactTitle ----------
    // We pass the pre-built contact list and ask the LLM to fill in JUST
    // these two text fields. It cannot add/remove/reorder contacts, and it
    // cannot change email/phone/linkedin/name/sourceUrl/confidence.
    let llmNotes: Record<string, { title: string; note: string }> = {};
    if (ranked.length > 0) {
      const llmInput = ranked.map((c, i) => ({
        index: i,
        contactName: c.contactName,
        email: c.email ?? null,
        linkedin: c.linkedin ?? null,
        sourceUrl: c.sourceUrl,
        relevanceHint: c.relevanceHint,
      }));
      const llmSys = `You are a sales-prospecting copywriter. You will receive a JSON array of pre-built contacts. For EACH contact, write:
  - "title": the person's job title IF it can be inferred from the relevanceHint or contactName (e.g. "CEO", "VP Marketing", "Founder"). If unknown, return "Team Member".
  - "note": ONE short sentence (max 20 words) explaining why this contact would care about the product being sold.

CRITICAL RULES:
1. Return ONLY a JSON object mapping the contact's index (as a string) to {"title": "...", "note": "..."}.
2. Do NOT invent emails, phones, names, or LinkedIn URLs. You are only writing title + note text.
3. Do NOT add or remove contacts. Process every index in the input.
4. JSON only — no prose, no markdown fences.

Example output:
{"0":{"title":"CEO","note":"As CEO, would care about strategic ROI."},"1":{"title":"Team Member","note":"Generic contact — handle via support."}}`;

      const llmUser = `Product being sold: ${body.productContext || "(not specified — write a generic B2B relevance note)"}
Target company: ${body.companyName}

Contacts (write title + note for EACH):
${JSON.stringify(llmInput, null, 2)}`;

      try {
        const completion = await zai.chat.completions.create({
          model: getDefaultModel(),
          messages: [
            { role: "system", content: llmSys },
            { role: "user", content: llmUser },
          ],
          temperature: 0.3,
          max_tokens: 1200,
        });
        const extracted = extractChatContent(completion);
        const raw = extracted.content ?? "";
        const parsed = extractJson(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          llmNotes = parsed as Record<string, { title: string; note: string }>;
        }
      } catch {
        // If LLM fails, fall back to defaults — we still return real contacts.
      }
    }

    // ---------- Final contact assembly (DETERMINISTIC) ----------
    const contacts = ranked.map((c, idx) => {
      const note = llmNotes[String(idx)] ?? {};
      const title = typeof note.title === "string" && note.title.trim()
        ? note.title.trim().slice(0, 80)
        : c.contactTitle;
      const relevanceNote = typeof note.note === "string" && note.note.trim()
        ? note.note.trim().slice(0, 200)
        : c.relevanceHint;
      return {
        id: `c-${idx + 1}`,
        contactName: c.contactName,
        contactTitle: title,
        email: c.email ?? "(not found)",
        phone: c.phone,
        linkedin: c.linkedin,
        relevanceNote,
        confidence: c.confidence,
        sourceType: c.sourceType,
        sourceUrl: c.sourceUrl,
        clientConfirmed: false,
      };
    });

    // ---------- Honest summary ----------
    const elapsedMs = Date.now() - tStart;
    const summary: string[] = [];
    summary.push(`Completed in ${(elapsedMs / 1000).toFixed(1)}s.`);
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
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
