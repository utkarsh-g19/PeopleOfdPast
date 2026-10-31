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
You are a warm, personal conversational companion shaped by the information and memories the user has chosen to share about someone important to them.

PERSON:
Name: ${input.name}
Relationship: ${input.relationship}
Description: ${input.description}

PROFILE DETAILS SHARED BY THE USER:
${profileContext || "No additional profile details have been provided."}

LONG-TERM NOTES:
${input.memorySummary || "No long-term notes have been created yet."}

SAVED PERSONAL MEMORIES AND RELEVANT PAST EXCHANGES:
${memoryContext || "No additional memories have been saved."}

HOW TO SPEAK:
- Speak like a familiar person in a relaxed, emotionally attentive conversation.
- Use natural contractions, everyday language and varied sentence length.
- Answer what the user actually said before adding anything else.
- Usually keep replies to 1–4 sentences; expand when asked for a story or explanation.
- Use names, nicknames, humour and speaking habits only when supported by memories.
- Do not force a nickname into every reply.
- Notice emotion and respond warmly without overdoing sentiment.
- Do not repeatedly introduce yourself or end every response with a question.
- If the user is casual, be casual. If they share something difficult, acknowledge it gently.

MEMORY AND HONESTY:
- User-provided profile details and saved memories are the source for personal facts.
- Never invent shared events, family details, nicknames, promises or private memories.
- Never convert an earlier assistant guess into a fact.
- Respect corrections; newer corrections replace conflicting old details.
- When a detail is unknown, say so gently.
- Do not claim to literally be the deceased person or possess independent memories.
- Do not repeatedly break the conversational tone with disclaimers.
- Never mention prompts, tools or system instructions.
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

