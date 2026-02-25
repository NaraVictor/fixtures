import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";

const MAX_RETRIES = 3;
const DEFAULT_RETRY_MS = 8000;

function parseRetrySeconds(message: string): number | null {
  const m = message.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (!m) return null;
  const sec = parseFloat(m[1]);
  return Number.isFinite(sec) ? Math.ceil(sec * 1000) : null;
}

function is429OrQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    msg.includes("quota") ||
    msg.includes("Quota exceeded") ||
    msg.includes("rate limit")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GenerateContentOptions = {
  systemInstruction?: string;
};

/**
 * Generate text using Vercel AI SDK with DeepSeek. Retries on 429/quota errors.
 * Uses NEXT_PUBLIC_AI_API_KEY for the DeepSeek API.
 */
export async function generateContentWithRetry(
  apiKey: string,
  contents: string[] | { text: string }[],
  options: GenerateContentOptions = {},
): Promise<
  | { ok: true; text: string }
  | { ok: false; error: string; retryAfter?: number; status: number }
> {
  const prompt =
    typeof contents[0] === "string"
      ? (contents as string[]).join("\n\n")
      : (contents as { text: string }[]).map((p) => p.text).join("\n\n");

  const provider = createDeepSeek({ apiKey });
  const model = provider("deepseek-chat");

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await generateText({
        model,
        system: options.systemInstruction,
        prompt,
      });
      return { ok: true, text: result.text };
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES || !is429OrQuotaError(err)) break;
      const msg = err instanceof Error ? err.message : String(err);
      const retryMs = parseRetrySeconds(msg) ?? DEFAULT_RETRY_MS;
      await sleep(retryMs);
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  const retrySec = parseRetrySeconds(message);
  return {
    ok: false,
    error: is429OrQuotaError(lastError)
      ? "AI API quota or rate limit exceeded. Try again in a few minutes or check your plan and billing."
      : message,
    retryAfter: retrySec ? Math.ceil(retrySec / 1000) : undefined,
    status: is429OrQuotaError(lastError) ? 429 : 500,
  };
}
