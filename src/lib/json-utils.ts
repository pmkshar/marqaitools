// Robust JSON extraction + lead/section parsing utilities.
//
// The Z.AI (GLM-4) model occasionally returns responses that don't match
// the requested schema:
//   - Bare array:        [{"companyName":...}, ...]
//   - Wrong wrapper key: {"companies":[...]} / {"data":[...]} / {"results":[...]}
//   - Markdown fence:    ```json\n{...}\n```
//   - Prose + JSON:      "Here are the leads:\n{...}"
//   - Truncated JSON:    {"leads":[{"companyName":"Acme",... (cut off mid-object)
//
// This module handles all of the above gracefully.

export interface ParsedLead {
  [key: string]: any;
}

/**
 * Extract a JSON object or array from a model response.
 * Handles markdown fences, leading prose, and trailing prose.
 * Returns null if no valid JSON can be extracted.
 */
export function extractJson(text: string): any | null {
  if (!text) return null;
  let t = text.trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```).
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();

  // Try direct parse first (fast path).
  try {
    return JSON.parse(t);
  } catch {
    // Fall through to bracket-matching.
  }

  // Find the first { or [ and bracket-match to the end.
  const objStart = t.indexOf("{");
  const arrStart = t.indexOf("[");
  let startIdx = -1;
  let openCh = "{";
  let closeCh = "}";

  if (objStart === -1 && arrStart === -1) return null;
  if (objStart === -1) {
    startIdx = arrStart;
    openCh = "[";
    closeCh = "]";
  } else if (arrStart === -1) {
    startIdx = objStart;
  } else {
    // Both present — pick the earlier one.
    if (arrStart < objStart) {
      startIdx = arrStart;
      openCh = "[";
      closeCh = "]";
    } else {
      startIdx = objStart;
    }
  }

  const slice = bracketMatch(t, startIdx, openCh, closeCh);
  if (slice === null) return null;
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

/**
 * Bracket-match from `start` (which must point at `openCh`) to its
 * matching closer, respecting strings and escapes. Returns the slice
 * including both brackets, or null if unbalanced (truncated).
 */
function bracketMatch(
  t: string,
  start: number,
  openCh: string,
  closeCh: string,
): string | null {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\") {
      esc = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (c === openCh) depth++;
    else if (c === closeCh) {
      depth--;
      if (depth === 0) return t.slice(start, i + 1);
    }
  }
  // Unbalanced — truncated JSON. Return null so caller can try the
  // regex fallback for individual objects.
  return null;
}

/**
 * Extract a list of leads from a model response, trying every known
 * response shape. As a last resort, uses regex to pull out individual
 * `{...}` objects that contain a `companyName` field — this handles
 * truncated JSON where bracket-matching fails.
 *
 * Returns an array of lead objects (possibly empty).
 */
export function extractLeads(text: string): ParsedLead[] {
  if (!text) return [];

  const parsed = extractJson(text);
  if (parsed) {
    // Shape 1: {"leads": [...]}
    if (Array.isArray(parsed.leads)) return parsed.leads;
    // Shape 2: {"companies": [...]}
    if (Array.isArray(parsed.companies)) return parsed.companies;
    // Shape 3: {"data": [...]}
    if (Array.isArray(parsed.data)) return parsed.data;
    // Shape 4: {"results": [...]}
    if (Array.isArray(parsed.results)) return parsed.results;
    // Shape 5: {"prospects": [...]}
    if (Array.isArray(parsed.prospects)) return parsed.prospects;
    // Shape 6: bare array
    if (Array.isArray(parsed)) return parsed;
    // Shape 7: a single lead object (not wrapped)
    if (parsed.companyName) return [parsed];
  }

  // Fallback: regex-extract individual {...} blocks that contain
  // companyName. This handles truncated JSON where the closing braces
  // are missing.
  return extractObjectsByKey(text, "companyName");
}

/**
 * Regex-extract all `{...}` substrings containing the given key.
 * Uses a non-greedy scan — works even when the overall JSON is
 * truncated, as long as individual lead objects are complete.
 *
 * Strategy: scan every `{` in the text. For each, try to find its
 * matching `}`. If matched, try to parse the slice. If unmatched
 * (truncated outer JSON), skip ahead — the inner objects may still
 * be complete and will be picked up on their own.
 */
export function extractObjectsByKey(text: string, key: string): ParsedLead[] {
  const results: ParsedLead[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== "{") {
      i++;
      continue;
    }
    const end = findMatchingBrace(text, i);
    if (end === -1) {
      // Truncated from this `{` — skip just this brace and continue
      // scanning for inner objects that may be complete.
      i++;
      continue;
    }
    const slice = text.slice(i, end + 1);
    const obj = tryParseLoose(slice, key);
    if (obj) {
      results.push(obj);
      i = end + 1; // skip past this matched object
    } else {
      // This matched object doesn't have our key (e.g. it's the outer
      // wrapper {"leads":[...]}). Advance by 1 so we scan INSIDE it
      // for inner objects that DO have the key.
      i++;
    }
  }

  // If we found nothing, try a last-ditch salvage: for every `{` with
  // no matching closer, grab the slice to end-of-string and try to
  // repair it (add closing braces, strip trailing commas). This catches
  // the case where the LAST object in a truncated array is still
  // mostly-complete.
  if (results.length === 0) {
    for (let j = 0; j < text.length; j++) {
      if (text[j] !== "{") continue;
      const end = findMatchingBrace(text, j);
      if (end !== -1) continue; // only interested in unmatched braces
      const slice = text.slice(j);
      const repaired = salvageTruncated(slice);
      if (repaired) {
        try {
          const obj = JSON.parse(repaired);
          if (obj && typeof obj === "object" && key in obj) {
            results.push(obj);
            break; // one salvage is enough
          }
        } catch {
          // give up
        }
      }
    }
  }
  return results;
}

/**
 * Attempt to repair a truncated JSON object slice by:
 *   - removing trailing commas
 *   - closing open strings
 *   - appending closing braces/brackets to balance depth
 * Returns a string that may parse, or null if it can't be salvaged.
 */
function salvageTruncated(slice: string): string | null {
  let s = slice.trim();
  // Strip trailing commas and whitespace.
  s = s.replace(/,?\s*$/, "");
  // Count unmatched braces/brackets/strings.
  let depthBrace = 0;
  let depthBracket = 0;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depthBrace++;
    else if (c === "}") depthBrace--;
    else if (c === "[") depthBracket++;
    else if (c === "]") depthBracket--;
  }
  // If we ended inside a string, close it.
  if (inStr) s += '"';
  // Re-append closers to balance.
  for (let i = 0; i < depthBracket; i++) s += "]";
  for (let i = 0; i < depthBrace; i++) s += "}";
  return s;
}

function findMatchingBrace(t: string, start: number): number {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\") {
      esc = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Try to parse a single object slice. If it fails JSON.parse, attempt
 * to repair common issues (trailing comma, unescaped quotes, control
 * chars). Only keeps the object if it contains the expected key.
 */
function tryParseLoose(slice: string, expectedKey: string): ParsedLead | null {
  // First try: parse as-is.
  try {
    const obj = JSON.parse(slice);
    if (obj && typeof obj === "object" && expectedKey in obj) return obj;
  } catch {
    // fall through to repair
  }
  // Repair pass 1: remove trailing commas before } or ].
  const repaired1 = slice.replace(/,\s*([}\]])/g, "$1");
  try {
    const obj = JSON.parse(repaired1);
    if (obj && typeof obj === "object" && expectedKey in obj) return obj;
  } catch {
    // fall through
  }
  // Repair pass 2: also unescape forward slashes.
  const repaired2 = repaired1.replace(/\\\\\//g, "/");
  try {
    const obj = JSON.parse(repaired2);
    if (obj && typeof obj === "object" && expectedKey in obj) return obj;
  } catch {
    // give up on this slice
  }
  return null;
}
