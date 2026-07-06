// Robust extraction of the assistant's text content from a Z.AI / GLM
// chat-completion response.
//
// The SDK's `zai.chat.completions.create()` returns whatever JSON the
// API sends, unmodified. Different Z.AI deployments (api.z.ai vs
// open.bigmodel.cn vs internal-api.z.ai) return slightly different
// shapes:
//
//   Shape A (OpenAI-compatible — what we expected):
//     { choices: [{ message: { content: "..." } }] }
//
//   Shape B (nested under `data`):
//     { data: { choices: [{ message: { content: "..." } }] } }
//
//   Shape C (GLM-4 native):
//     { choices: [{ delta: { content: "..." } }] }
//     or streaming-style even when stream:false
//
//   Shape D (error envelope that still returns 200):
//     { error: { message: "..." } }
//     { success: false, msg: "..." }
//
// This helper tries every known path and returns the first non-empty
// string it finds. Returns { content, error, shape } so callers can
// log which path worked (or didn't).

export interface ExtractedContent {
  content: string;
  error: string | null;
  shape: string;
  rawPreview: string;
}

export function extractChatContent(resp: any): ExtractedContent {
  if (!resp) {
    return { content: "", error: "Empty response object", shape: "null", rawPreview: "" };
  }

  // Capture a preview for diagnostics (truncate to 300 chars, redact nothing).
  const rawPreview = safeStringify(resp).slice(0, 300);

  // Detect error envelopes that return 200.
  if (resp.error) {
    const msg = typeof resp.error === "string" ? resp.error : resp.error.message || JSON.stringify(resp.error);
    return { content: "", error: `API error: ${msg}`, shape: "error-envelope", rawPreview };
  }
  if (resp.success === false) {
    const msg = resp.msg || resp.message || resp.error || "Unknown error";
    return { content: "", error: `API success=false: ${msg}`, shape: "success-false", rawPreview };
  }

  // Try every known path for the choices array.
  const choices =
    resp.choices ??
    resp.data?.choices ??
    resp.response?.choices ??
    resp.result?.choices ??
    resp.output?.choices ??
    [];
  if (!Array.isArray(choices) || choices.length === 0) {
    return { content: "", error: "No choices in response", shape: "no-choices", rawPreview };
  }

  const choice0 = choices[0];
  if (!choice0 || typeof choice0 !== "object") {
    return { content: "", error: "Empty choice[0]", shape: "empty-choice", rawPreview };
  }

  // Try every known path for the message content.
  const message = choice0.message ?? choice0.delta ?? choice0.output ?? choice0;
  const content =
    message?.content ??
    message?.text ??
    choice0.text ??
    choice0.content ??
    "";

  if (typeof content !== "string" || content.trim() === "") {
    // Maybe it's an array of parts (some providers return content as
    // [{type:"text", text:"..."}]).
    if (Array.isArray(message?.content)) {
      const text = message.content
        .filter((p: any) => p?.type === "text" || typeof p?.text === "string")
        .map((p: any) => p.text)
        .join("");
      if (text) return { content: text, error: null, shape: "content-array", rawPreview };
    }
    return {
      content: "",
      error: "Empty content in choice[0].message",
      shape: "empty-content",
      rawPreview,
    };
  }

  // Determine which shape path worked (for logging).
  let shape = "choices[0].message.content";
  if (resp.data?.choices) shape = "data.choices[0].message.content";
  else if (resp.response?.choices) shape = "response.choices[0].message.content";
  else if (choice0.delta) shape = "choices[0].delta.content";
  else if (choice0.text) shape = "choices[0].text";

  return { content, error: null, shape, rawPreview };
}

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}
