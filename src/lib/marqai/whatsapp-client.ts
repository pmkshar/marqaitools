// ============================================================
// WhatsApp Cloud API client (Meta Graph API v20.0)
// ============================================================
// Used by all /api/marqai/whatsapp/* routes. Reads credentials
// from environment variables; when missing, the caller falls
// back to demo mode (simulated sends) so the module is usable
// without a live Meta account.
//
// Required env vars (set in Vercel → Project → Settings → Env Vars):
//   WHATSAPP_ACCESS_TOKEN     — permanent System User token from Meta Business
//   WHATSAPP_PHONE_NUMBER_ID  — Phone number ID from WhatsApp → API Setup page
//   WHATSAPP_APP_SECRET       — App secret from Meta Developer → App Settings → Basic
//                               (used to verify X-Hub-Signature-256 on webhooks)
//   WHATSAPP_BUSINESS_ACCOUNT_ID — optional, for listing templates / analytics
//   WHATSAPP_API_KEY          — internal API key for /external/* endpoints
//                               (used by other tools integrating with this module)
// ============================================================

export const META_GRAPH_VERSION = "v20.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export interface WhatsAppEnv {
  accessToken: string | undefined;
  phoneNumberId: string | undefined;
  businessAccountId: string | undefined;
  appSecret: string | undefined;
  apiKey: string | undefined;
}

export function readWhatsAppEnv(): WhatsAppEnv {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    apiKey: process.env.WHATSAPP_API_KEY,
  };
}

export function isWhatsAppConfigured(env?: WhatsAppEnv): boolean {
  const e = env ?? readWhatsAppEnv();
  return Boolean(e.accessToken && e.phoneNumberId);
}

// ============================================================
// Phone number normalization (E.164)
// ============================================================

/**
 * Normalizes a phone number to E.164 format (no '+', digits only).
 * Accepts inputs like '+14155551234', '14155551234', '1 (415) 555-1234'.
 * Returns null if the number is invalid.
 */
export function normalizePhone(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

// ============================================================
// Template variable rendering
// ============================================================

/**
 * Renders a WhatsApp template body by substituting {{1}}, {{2}}, ... placeholders
 * with values from the variables map or contact custom fields.
 *
 * @param body       — template body string with {{N}} placeholders
 * @param variables  — map of {{N}} → value (e.g. { "{{1}}": "Alice" })
 * @param samples    — fallback array of sample values indexed by N-1
 */
export function renderTemplateBody(
  body: string,
  variables: Record<string, string> = {},
  samples: string[] = [],
): string {
  let out = body;
  const matches = body.match(/\{\{(\d+)\}\}/g) ?? [];
  matches.forEach((m, i) => {
    const v = variables[m] ?? samples[i] ?? m;
    out = out.replace(new RegExp(m.replace(/[{}]/g, "\\$&"), "g"), v);
  });
  return out;
}

/**
 * Extracts {{N}} placeholders in order from a template body, returns ["{{1}}", "{{2}}", ...].
 */
export function extractPlaceholders(body: string): string[] {
  const matches = body.match(/\{\{(\d+)\}\}/g) ?? [];
  // dedupe in order of first appearance
  return Array.from(new Set(matches));
}

// ============================================================
// Meta Cloud API message builders
// ============================================================

export interface TemplateComponentParam {
  type: "text" | "currency" | "date_time" | "image" | "document" | "video";
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
  date_time?: { fallback_value: string };
  image?: { link: string };
  document?: { link: string };
  video?: { link: string };
}

export interface TemplateButtonComponent {
  type: "button";
  sub_type: "url" | "quick_reply" | "code";
  index: number;
  parameters: { type: "text"; text: string }[];
}

export interface MetaTemplateMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components?: Array<
      | { type: "header"; parameters: TemplateComponentParam[] }
      | { type: "body"; parameters: TemplateComponentParam[] }
      | TemplateButtonComponent
    >;
  };
}

export interface MetaTextMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: { body: string; preview_url?: boolean };
}

/**
 * Builds a Meta Cloud API template message payload.
 *
 * @param elementName  — template elementName (lowercase_with_underscores)
 * @param language     — language code (e.g. "en_US", "en")
 * @param bodyParams   — array of values for {{1}}, {{2}}, ... in the body
 * @param headerParams — optional values for header variables
 * @param buttonParams — optional map of buttonIndex → value, for dynamic URL buttons
 */
export function buildTemplateMessage(
  to: string,
  elementName: string,
  language: string,
  bodyParams: string[] = [],
  headerParams: string[] = [],
  buttonParams: Record<number, string> = {},
): MetaTemplateMessage {
  const components: MetaTemplateMessage["template"]["components"] = [];
  if (headerParams.length > 0) {
    components.push({
      type: "header",
      parameters: headerParams.map((text) => ({ type: "text" as const, text })),
    });
  }
  if (bodyParams.length > 0) {
    components.push({
      type: "body",
      parameters: bodyParams.map((text) => ({ type: "text" as const, text })),
    });
  }
  Object.entries(buttonParams).forEach(([idx, text]) => {
    components.push({
      type: "button",
      sub_type: "url",
      index: Number(idx),
      parameters: [{ type: "text", text }],
    });
  });

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: elementName,
      language: { code: language },
      components: components.length > 0 ? components : undefined,
    },
  };
}

export function buildTextMessage(to: string, body: string, previewUrl = false): MetaTextMessage {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body, preview_url: previewUrl },
  };
}

// ============================================================
// Meta Cloud API HTTP wrapper
// ============================================================

export interface MetaSendResult {
  messageId: string;
  status: "queued" | "sent" | "failed";
  raw?: unknown;
  error?: string;
}

/**
 * Sends a WhatsApp message via Meta Cloud API.
 * Returns the wamid (message_id) on success, or error info on failure.
 */
export async function sendMetaMessage(
  phoneNumberId: string,
  accessToken: string,
  payload: MetaTemplateMessage | MetaTextMessage,
): Promise<MetaSendResult> {
  const url = `${META_GRAPH_BASE}/${phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const err = data?.error;
      const msg = err
        ? `${err.code ?? res.status}: ${err.error_subcode ? `[${err.error_subcode}] ` : ""}${err.message ?? "Meta API error"}`
        : `Meta API error: HTTP ${res.status}`;
      return { messageId: "", status: "failed", raw: data, error: msg };
    }

    const messageId = data?.messages?.[0]?.id ?? "";
    return { messageId, status: "queued", raw: data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { messageId: "", status: "failed", error: msg };
  }
}

// ============================================================
// Meta Cloud API — phone number info (for test-connection)
// ============================================================

export interface PhoneNumberInfo {
  verified_name: string;
  display_phone_number: string;
  quality_rating: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
  current_status:
    | "CONNECTED"
    | "DISCONNECTED"
    | "BANNED"
    | "RESTRICTED"
    | "FLAGGED"
    | "PENDING_REVIEW"
    | string;
  messaging_limit_tier: string;
  throughputs: Array<{ tier: string; throughput: { amount: number; unit: string } }>;
}

export async function fetchPhoneNumberInfo(
  phoneNumberId: string,
  accessToken: string,
): Promise<{ ok: boolean; info?: PhoneNumberInfo; error?: string }> {
  const url = `${META_GRAPH_BASE}/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,current_status,messaging_limit_tier,throughputs`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error?.message ?? `Meta API error: HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    return { ok: true, info: data as PhoneNumberInfo };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

// ============================================================
// Webhook signature verification (X-Hub-Signature-256)
// ============================================================

/**
 * Verifies the X-Hub-Signature-256 header sent by Meta on webhook callbacks.
 * Returns true if the signature matches the HMAC-SHA256 of the raw body.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signatureHeader || !appSecret) return false;
  const expected = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === expected;
}

// ============================================================
// Webhook event parsing helpers
// ============================================================

export interface ParsedWebhookEvent {
  type: "message" | "status" | "template_status" | "unknown";
  // For inbound messages
  from?: string;
  messageText?: string;
  messageId?: string; // wamid of inbound message
  timestamp?: string;
  // For status updates
  status?: "sent" | "delivered" | "read" | "failed";
  recipientWamid?: string; // wamid of originally sent message
  errorCode?: number;
  errorMessage?: string;
  // For template status updates
  templateName?: string;
  templateStatus?: "APPROVED" | "REJECTED" | "PENDING" | "PAUSED" | "DISABLED";
  templateReason?: string;
}

/**
 * Parses a Meta webhook payload into a normalized list of events.
 * Meta can batch multiple entries/changes in a single payload.
 */
export function parseWebhookPayload(payload: any): ParsedWebhookEvent[] {
  const events: ParsedWebhookEvent[] = [];
  const entries = payload?.entry ?? [];
  for (const entry of entries) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;

      // Inbound messages
      if (Array.isArray(value.messages) && value.messages.length > 0) {
        for (const msg of value.messages) {
          events.push({
            type: "message",
            from: msg.from,
            messageId: msg.id,
            messageText: msg.text?.body ?? msg.button?.text ?? msg.interactive?.button_reply?.title,
            timestamp: msg.timestamp,
          });
        }
      }

      // Status updates
      if (Array.isArray(value.statuses) && value.statuses.length > 0) {
        for (const s of value.statuses) {
          events.push({
            type: "status",
            status: s.status,
            recipientWamid: s.id,
            timestamp: s.timestamp,
            errorCode: s.errors?.[0]?.code,
            errorMessage: s.errors?.[0]?.message,
          });
        }
      }

      // Template status updates
      if (value?.event === "message_template_status_update") {
        events.push({
          type: "template_status",
          templateName: value?.message_template_name,
          templateStatus: value?.message_template_status,
          templateReason: value?.reason,
        });
      }
    }
  }
  return events;
}

// ============================================================
// Demo mode helpers (used when env vars are missing)
// ============================================================

export function generateDemoWamid(): string {
  return `wamid.HBgL${Math.random().toString(36).slice(2, 14).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 14)
    .toUpperCase()}`;
}
