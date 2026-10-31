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
    delta?: { content?: unknown };
  }>;
  response?: unknown;
  error?: { message?: string } | string;
}

export function hasCloudflareAI(): boolean {
  const hasAccount = Boolean(env.CLOUDFLARE_ACCOUNT_ID);
  const hasToken = Boolean(env.CLOUDFLARE_API_TOKEN);

  if (hasAccount !== hasToken) {
    throw new Error("Both Cloudflare account ID and API token are required.");
  }

  return hasAccount && hasToken;
}

function getEndpoint(): string {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
    throw new Error("Cloudflare credentials are missing.");
  }

  return `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`;
}

function getHeaders(accept = "text/event-stream"): Record<string, string> {
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new Error("Cloudflare API token is missing.");
  }

  return {
    Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json",
    Accept: accept,
  };
}

function extractText(value: unknown): string {
  if (typeof value === "string") return value;

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
  return (
    extractText(chunk.choices?.[0]?.delta?.content) ||
    extractText(chunk.choices?.[0]?.message?.content) ||
    extractText(chunk.response)
  );
}

export async function completeCloudflareChat(
  messages: ModelMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: getHeaders("application/json"),
    body: JSON.stringify({
      model: env.CLOUDFLARE_CHAT_MODEL,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.65,
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
    throw new Error("Cloudflare AI returned an empty answer.");
  }

  return answer;
}

function emergencyReply(messages: ModelMessage[]): string {
  const system = messages.find((item) => item.role === "system")?.content ?? "";

  if (
    system.includes("LONG-TERM NOTES") ||
    system.includes("PROFILE DETAILS SHARED BY THE USER")
  ) {
    return "I'm here with you. I don't want to guess about something important. Tell me a little more, or ask me again in a moment.";
  }

  return "I want to give you a thoughtful, accurate answer rather than guess. Ask me that once more in a moment.";
}

function oneChunkStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          JSON.stringify({ message: { content: text } }) + "\n",
        ),
      );
      controller.close();
    },
  });
}

function normalizeCloudflareStream(
  body: ReadableStream<Uint8Array>,
  retry: () => Promise<string>,
  safeReply: string,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      async function pump(): Promise<void> {
        let buffer = "";
        let outputLength = 0;

        function emit(text: string): void {
          if (!text) return;

          outputLength += text.length;
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
            console.warn("[Cloudflare AI] Ignored an invalid stream event.");
            return;
          }

          if (chunk.error) {
            const detail =
              typeof chunk.error === "string"
                ? chunk.error
                : chunk.error.message || "Unknown provider error";

            throw new Error(detail);
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

          if (outputLength === 0) {
            console.warn("[Cloudflare AI] Empty stream; retrying without streaming.");

            try {
              emit(await retry());
            } catch (error: unknown) {
              console.error("[Cloudflare AI] Retry failed:", error);
              emit(safeReply);
            }
          }

          if (outputLength === 0) emit(safeReply);

          console.info(
            `[Cloudflare AI] Completed response: ${outputLength} characters.`,
          );

          controller.close();
        } catch (error: unknown) {
          console.error("[Cloudflare AI] Stream interrupted:", error);

          if (outputLength === 0) {
            try {
              emit(await retry());
            } catch (retryError: unknown) {
              console.error("[Cloudflare AI] Recovery request failed:", retryError);
              emit(safeReply);
            }
          } else {
            emit("\n\nI may have lost part of that thought. Ask me to continue.");
          }

          controller.close();
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
  const safeReply = emergencyReply(messages);
  const retry = () => completeCloudflareChat(messages, options);

  try {
    const response = await fetch(getEndpoint(), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: env.CLOUDFLARE_CHAT_MODEL,
        messages,
        stream: true,
        temperature: options.temperature ?? 0.65,
        max_tokens: options.maxTokens ?? 400,
        chat_template_kwargs: {
          enable_thinking: false,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      console.error(
        `[Cloudflare AI] Stream request failed (${response.status}): ${await response.text()}`,
      );

      try {
        return oneChunkStream(await retry());
      } catch (error: unknown) {
        console.error("[Cloudflare AI] Non-streaming retry failed:", error);
        return oneChunkStream(safeReply);
      }
    }

    if (!response.body) {
      try {
        return oneChunkStream(await retry());
      } catch (error: unknown) {
        console.error("[Cloudflare AI] Recovery request failed:", error);
        return oneChunkStream(safeReply);
      }
    }

    return normalizeCloudflareStream(response.body, retry, safeReply);
  } catch (error: unknown) {
    console.error("[Cloudflare AI] Could not open model stream:", error);

    try {
      return oneChunkStream(await retry());
    } catch (retryError: unknown) {
      console.error("[Cloudflare AI] Recovery request failed:", retryError);
      return oneChunkStream(safeReply);
    }
  }
}
