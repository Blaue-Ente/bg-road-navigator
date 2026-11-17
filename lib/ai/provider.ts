/**
 * One small OpenAI-compatible chat client. NVIDIA's free NIM endpoint is the
 * default; any other OpenAI-compatible provider works by setting AI_BASE_URL,
 * AI_API_KEY and AI_MODEL. No key means "unavailable": callers fall back to
 * the rule-based text and nothing breaks.
 */
const DEFAULT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
/** Present on NVIDIA's free catalog and strong in Bulgarian. Override with AI_MODEL. */
const DEFAULT_MODEL = "mistralai/mistral-large-4-1t-a52b";
const TIMEOUT_MS = 20_000;

export interface AiConfig {
  url: string;
  key: string;
  model: string;
}

export function aiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig | null {
  const key = (env.AI_API_KEY ?? env.NVIDIA_API_KEY ?? "").trim();
  if (!key) return null;
  return {
    url: (env.AI_BASE_URL ?? env.NVIDIA_API_URL ?? DEFAULT_URL).trim(),
    key,
    model: (env.AI_MODEL ?? env.NVIDIA_MODEL ?? DEFAULT_MODEL).trim(),
  };
}

export async function chatText(
  input: { system: string; user: string; maxTokens?: number; timeoutMs?: number },
  deps: {
    config?: AiConfig | null;
    fetchImpl?: typeof fetch;
    /** Why a call gave nothing: status and message only, never the key. */
    onError?: (message: string) => void;
  } = {}
): Promise<string | null> {
  const config = deps.config === undefined ? aiConfig() : deps.config;
  if (!config) return null;
  try {
    const response = await (deps.fetchImpl ?? fetch)(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        max_tokens: input.maxTokens ?? 350,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
      signal: AbortSignal.timeout(input.timeoutMs ?? TIMEOUT_MS),
    });
    if (!response.ok) {
      if (deps.onError) {
        const body = await response.text().catch(() => "");
        deps.onError(`${response.status} ${body.replace(/\s+/g, " ").slice(0, 200)}`.trim());
      }
      return null;
    }
    const payload = (await response.json()) as {
      choices?: Array<{
        finish_reason?: string;
        message?: { content?: string | null } & Record<string, unknown>;
      }>;
      usage?: { completion_tokens?: number };
    };
    // Reasoning models put their thinking in <think> blocks; keep the answer only.
    const text = payload.choices?.[0]?.message?.content
      ?.replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();
    if (!text) {
      // What the answer looked like: reasoning models can spend the whole
      // token budget thinking and leave the content empty.
      const choice = payload.choices?.[0];
      const keys = Object.keys(choice?.message ?? {}).join("+");
      deps.onError?.(
        `empty answer from ${config.model} (finish=${choice?.finish_reason ?? "?"}, fields=${keys || "none"}, tokens=${payload.usage?.completion_tokens ?? "?"})`
      );
    }
    return text ? text : null;
  } catch (error) {
    // The kind of failure (timeout, network, unreadable answer), never the key.
    const detail =
      error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 160) : "unknown";
    deps.onError?.(`the AI call failed (${detail})`);
    return null;
  }
}
