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

    // Harvest emails/names/phones LINKEDIN_PROFILE_REs directly from search
    // snippets — this is often the ONLY useful signal from LinkedIn pages.
    // Snippets frequently include text like "Patrick Collison is Stripe CEO..."
    // which gives us a name + company + role even though we can't scrape the
    // actual LinkedIn page.
    const snippetEmails = new Map<string, { query: string; url: string; snippet: string }>();
    const snippetNames: { name: string; query: string; url: string; snippet: string }[] = [];
    const snippetLinkedins = new Map<string, { query: string; url: string }>();
    for (const r of searchResults) {
      const combined = `${r.name} ${r.snippet}`;
      // Emails in snippets.
      const ems = dedupe(combined.match(EMAIL_RE) ?? []);
      for (const e of ems) {
        const clean = e.toLowerCase();
        if (isJunkEmail(clean)) continue;
        if (!snippetEmails.has(clean)) snippetEmails.set(clean, { query: r.query, url: r.url, snippet: r.snippet });
      }
      // LinkedIn URLs in snippets.
      const lis = dedupe(combined.match(LINKEDIN_PROFILE_RE) ?? []);
      for (const li of lis) {
        if (!snippetLinkedins.has(li)) snippetLinkedins.set(li, { query: r.query, url: r.url });
      }
      // Names near CEO/founder/title keywords in snippets.
      const titleKws = ["CEO", "CTO", "founder", "co-founder", "VP", "President", "Director", "Head of"];
      if (titleKws.some((k) => r.snippet.includes(k) || r.name.includes(k))) {
        const names = combined.match(NAME_RE) ?? [];
        for (const n of names.slice(0, 3)) {
          const lower = n.toLowerCase();
          if (lower.includes("linkedin") || lower.includes("log in") || lower.includes("sign")) continue;
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
      allEmails.set(email, { name: undefined, url: meta.url, source: `search snippet: "${meta.query}"`, via: "snippet" });
    }
    for (const [li, meta] of snippetLinkedins) {
      allLinkedin.set(li, { url: meta.url, source: `search snippet: "${meta.query}"` });
    }
    for (const n of snippetNames) {
      allNamesWithCtx.push({ name: n.name, url: n.url, snippet: n.snippet, source: `search snippet: "${n.query}"` });
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
        const clean = email.toLowerCase().trim();
        if (isJunkEmail(clean)) continue;
        const existing = allEmails.get(clean);
        if (existing && existing.via !== "snippet") continue; // don't overwrite a real-page source with a snippet source
        const name = findNearbyName(text, email);
        allEmails.set(clean, { name, url: p.url, source: p.source, via: "mailto link" });
      }

      // Plain-text emails
      const emailsOnPage = dedupe(text.match(EMAIL_RE) ?? []);
      for (const email of emailsOnPage) {
        const clean = email.toLowerCase();
        if (isJunkEmail(clean)) continue;
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
          const clean = email.toLowerCase().trim();
          if (isJunkEmail(clean)) continue;
          if (allEmails.has(clean) && allEmails.get(clean)?.via !== "snippet") continue;
          const name = findNearbyName(text, email);
          allEmails.set(clean, { name, url: p.url, source: p.source, via: "mailto link" });
        }
        const emailsOnPage = dedupe(text.match(EMAIL_RE) ?? []);
        for (const email of emailsOnPage) {
          const clean = email.toLowerCase();
          if (isJunkEmail(clean)) continue;
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
              const clean = email.toLowerCase();
              if (isJunkEmail(clean)) continue;
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
            const clean = email.toLowerCase();
            if (isJunkEmail(clean)) continue;
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

    // ---------- LAYER 7: LLM organization ----------
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
7. Dedupe by EMAIL (keep highest-confidence entry).
8. ALSO dedupe by PERSON NAME — if the same person appears with both a scraped email and an inferred email, KEEP ONLY THE HIGHEST-CONFIDENCE entry (usually the scraped one). Do not list the same person twice.
9. Rank highest-confidence first.
10. Return at most ${maxContacts} contacts.

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
      ...(extracted.error ? { warning: extracted.error } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
