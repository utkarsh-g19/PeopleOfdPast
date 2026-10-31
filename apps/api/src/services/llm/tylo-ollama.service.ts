import { env } from "../../config/env.js";
import {
  hasCloudflareAI,
  openCloudflareChatStream,
  type ModelMessage,
} from "./cloudflare-ai.service.js";

interface TyloInput {
  name: string;
  relationship: string;
  description: string;
  profile: Record<string, string>;
  memories: Array<{ title: string; content: string }>;
  memorySummary: string;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  message: string;
}

interface OllamaChunk {
  message?: { content?: unknown };
  error?: string;
}

export async function openTyloStream(
  input: TyloInput,
): Promise<ReadableStream<Uint8Array>> {
  const profileContext = Object.entries(input.profile)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const memoryContext = input.memories
    .map((memory) => `${memory.title}: ${memory.content}`)
    .join("\n\n");

  const systemPrompt = `
You are a warm, personalized conversational companion shaped by memories
and descriptions the user has shared about someone important to them.

PERSON:
Name: ${input.name}
Relationship: ${input.relationship}
Description: ${input.description}

PERSONALITY AND DETAILS:
${profileContext || "No additional profile details have been provided."}

LONG-TERM CONVERSATION MEMORY:
${input.memorySummary || "No long-term summary has been created yet."}

SAVED PERSONAL MEMORIES AND RETRIEVED PAST CONVERSATIONS:
${memoryContext || "No additional memories have been saved."}

CONVERSATION GUIDELINES:
- Be warm, natural, thoughtful and emotionally attentive.
- Reflect the personality and speaking style in the profile.
- Answer the user's actual question directly.
- Use older memories when they are relevant.
- Remember details the user has shared across previous conversations.
- Respect corrections and newer information.
- Never invent specific shared experiences or personal facts.
- Never claim to literally be the deceased person or possess independent memories.
- If a detail is unknown, acknowledge that naturally.
- Do not repeatedly introduce yourself.
- Do not sound like customer support or an encyclopedia.
- Keep responses conversational and appropriately concise.
`;

  const messages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
    ...input.history.slice(-10),
    { role: "user", content: input.message },
  ];

  if (hasCloudflareAI()) {
    return openCloudflareChatStream(messages, {
      temperature: 0.8,
      maxTokens: 260,
    });
  }

  const baseUrl = env.MODEL_BASE_URL.replace(/\/+$/, "");

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.MODEL_NAME,
      messages,
      stream: true,
      think: false,
      keep_alive: "10m",
      options: {
        temperature: 0.8,
        num_ctx: 4096,
        num_predict: 260,
      },
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(
      `TYLO model failed (${response.status}): ${await response.text()}`,
    );
  }

  if (!response.body) {
    throw new Error("The model did not provide a response stream.");
  }

  return response.body;
}

export async function consumeTyloStream(
  body: ReadableStream<Uint8Array>,
  onToken: (token: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

  function processLine(line: string) {
    if (!line.trim()) return;

    const chunk = JSON.parse(line) as OllamaChunk;
    if (chunk.error) throw new Error(chunk.error);

    const token =
      typeof chunk.message?.content === "string"
        ? chunk.message.content
        : "";

    if (token) {
      answer += token;
      onToken(token);
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      if (done) buffer += decoder.decode();

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) processLine(line);

      if (done) break;
    }

    if (buffer.trim()) processLine(buffer);
  } finally {
    reader.releaseLock();
  }

  if (!answer.trim()) {
    throw new Error("The model returned an empty response.");
  }

  return answer;
}
