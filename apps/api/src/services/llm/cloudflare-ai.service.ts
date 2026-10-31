import { env } from "../../config/env.js";

export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

interface CloudflareChatResponse {
  choices?: Array<{
    message?: { content?: unknown };
    delta?: { content?: unknown };
  }>;
  error?: { message?: string } | string;
}

export function hasCloudflareAI(): boolean {
  const hasAccount = Boolean(env.CLOUDFLARE_ACCOUNT_ID);
  const hasToken = Boolean(env.CLOUDFLARE_API_TOKEN);

  if (hasAccount !== hasToken) {
    throw new Error(
      "Cloudflare configuration is incomplete. Set both CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.",
    );
  }

  return hasAccount && hasToken;
}

function getEndpoint(): string {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
    throw new Error("Cloudflare Workers AI credentials are missing.");
  }

  return (
    `https://api.cloudflare.com/client/v4/accounts/` +
    `${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`
  );
}

function getHeaders(): Record<string, string> {
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new Error("Cloudflare API token is missing.");
  }

  return {
    Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function completeCloudflareChat(
  messages: ModelMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: env.CLOUDFLARE_CHAT_MODEL,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 400,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(
      `Cloudflare AI failed (${response.status}): ${await response.text()}`,
    );
  }

  const result = (await response.json()) as CloudflareChatResponse;
  const content = result.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Cloudflare AI returned an empty response.");
  }

  return content.trim();
}

// Convert OpenAI-compatible SSE chunks into Ollama-style JSON lines.
// This lets our existing chat controllers and stream consumers stay unchanged.
function normalizeCloudflareStream(
  body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      async function pump(): Promise<void> {
        let buffer = "";

        function processBlock(block: string): void {
          const data = block
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");

          if (!data || data === "[DONE]") return;

          const chunk = JSON.parse(data) as CloudflareChatResponse;

          if (chunk.error) {
            const message =
              typeof chunk.error === "string"
                ? chunk.error
                : chunk.error.message || "Cloudflare stream error";
            throw new Error(message);
          }

          const token = chunk.choices?.[0]?.delta?.content;

          if (typeof token === "string" && token.length > 0) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ message: { content: token } }) + "\n"),
            );
          }
        }

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (value) buffer += decoder.decode(value, { stream: true });
            if (done) buffer += decoder.decode();

            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop() ?? "";

            for (const block of blocks) processBlock(block);

            if (done) {
              if (buffer.trim()) processBlock(buffer);
              break;
            }
          }

          controller.close();
        } catch (error: unknown) {
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
  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: env.CLOUDFLARE_CHAT_MODEL,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 400,
    }),
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

  return normalizeCloudflareStream(response.body);
}
