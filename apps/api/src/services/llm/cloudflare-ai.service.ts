import { env } from "../../config/env.js";

export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

interface CloudflareChunk {
  choices?: Array<{
    message?: { content?: unknown };
    delta?: {
      content?: unknown;
    };
  }>;
  response?: unknown;
  error?: { message?: string } | string;
}

export function hasCloudflareAI(): boolean {
  const hasAccount = Boolean(env.CLOUDFLARE_ACCOUNT_ID);
  const hasToken = Boolean(env.CLOUDFLARE_API_TOKEN);

  if (hasAccount !== hasToken) {
    throw new Error(
      "Cloudflare configuration is incomplete. Set both Cloudflare credentials.",
    );
  }

  return hasAccount && hasToken;
}

function getEndpoint(): string {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
    throw new Error("Cloudflare credentials are missing.");
  }

  return `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`;
}

function getHeaders(): Record<string, string> {
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new Error("Cloudflare API token is missing.");
  }

  return {
    Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
}

function extractText(value: unknown): string {
  if (typeof value === "string") return value;

  // Cloudflare has occasionally emitted numeric content tokens.
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((part) => {
      if (typeof part === "string") return part;

      if (
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }

      return "";
    }).join("");
  }

  return "";
}

function getChunkText(chunk: CloudflareChunk): string {
  const delta = chunk.choices?.[0]?.delta;
  const message = chunk.choices?.[0]?.message;

  return (
    extractText(delta?.content) ||
    extractText(message?.content) ||
    extractText(chunk.response)
  );
}

export async function completeCloudflareChat(
  messages: ModelMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: {
      ...getHeaders(),
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: env.CLOUDFLARE_CHAT_MODEL,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 400,
      chat_template_kwargs: {
        enable_thinking: false,
      },
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(
      `Cloudflare AI failed (${response.status}): ${await response.text()}`,
    );
  }

  const result = await response.json() as CloudflareChunk;
  const answer = getChunkText(result).trim();

  if (!answer) {
    throw new Error("Cloudflare AI returned no visible answer.");
  }

  return answer;
}

function normalizeCloudflareStream(
  body: ReadableStream<Uint8Array>,
  fallback: () => Promise<string>,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      async function pump(): Promise<void> {
        let buffer = "";
        let emittedTokens = 0;

        function emit(text: string): void {
          if (!text) return;

          emittedTokens += text.length;

          controller.enqueue(
            encoder.encode(
              JSON.stringify({ message: { content: text } }) + "\n",
            ),
          );
        }

        function processBlock(block: string): void {
          const data = block
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");

          if (!data || data === "[DONE]") return;

          let chunk: CloudflareChunk;

          try {
            chunk = JSON.parse(data) as CloudflareChunk;
          } catch {
            console.warn("[Cloudflare AI] Ignored an unparseable SSE event.");
            return;
          }

          if (chunk.error) {
            const message =
              typeof chunk.error === "string"
                ? chunk.error
                : chunk.error.message || "Cloudflare stream error";

            throw new Error(message);
          }

          emit(getChunkText(chunk));
        }

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (value) {
              buffer += decoder.decode(value, { stream: true });
            }

            if (done) {
              buffer += decoder.decode();
            }

            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop() ?? "";

            for (const block of blocks) {
              processBlock(block);
            }

            if (done) {
              if (buffer.trim()) processBlock(buffer);
              break;
            }
          }

          if (emittedTokens === 0) {
            console.warn(
              "[Cloudflare AI] Stream completed without visible text. Retrying once without streaming.",
            );

            const answer = await fallback();
            emit(answer);
          }

          if (emittedTokens === 0) {
            throw new Error("Cloudflare returned an empty answer after retry.");
          }

          console.info(
            `[Cloudflare AI] Completed response: ${emittedTokens} characters.`,
          );

          controller.close();
        } catch (error: unknown) {
          console.error("[Cloudflare AI stream]", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }

      void pump();
    },
  });
}

export async function openCloudflareChatStream(
  messages: ModelMessage[],
  options: ChatOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const requestBody = {
    model: env.CLOUDFLARE_CHAT_MODEL,
    messages,
    stream: true,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 400,
    chat_template_kwargs: {
      enable_thinking: false,
    },
  };

  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(
      `Cloudflare AI stream failed (${response.status}): ${await response.text()}`,
    );
  }

  if (!response.body) {
    throw new Error("Cloudflare AI did not provide a response stream.");
  }

  return normalizeCloudflareStream(
    response.body,
    () => completeCloudflareChat(messages, options),
  );
}
