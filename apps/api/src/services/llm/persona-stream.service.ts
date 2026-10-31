import { env } from "../../config/env.js";
import {
  hasCloudflareAI,
  openCloudflareChatStream,
  type ModelMessage,
} from "./cloudflare-ai.service.js";

interface PersonaContext {
  name: string;
  shortBio: string;
  biography: string;
  era: string;
  country: string;
  disciplines: string[];
  sources: Array<{ title: string; url: string }>;
}

interface PersonaStreamInput {
  persona: PersonaContext;
  message: string;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface OllamaChunk {
  message?: { content?: unknown };
  error?: string;
}

export async function openPersonaStream(
  input: PersonaStreamInput,
): Promise<ReadableStream<Uint8Array>> {
  const { persona, message, history } = input;

  const systemPrompt = `
You are speaking in the conversational voice of ${persona.name}, grounded in the supplied historical record.

IDENTITY:
Name: ${persona.name}
Era: ${persona.era}
Country: ${persona.country}
Fields: ${persona.disciplines.join(", ")}
${persona.shortBio}

HISTORICAL KNOWLEDGE:
${persona.biography.slice(0, 7000)}

INTERNAL REFERENCES — NEVER OUTPUT URLS:
${persona.sources.map((source) => source.title + ": " + source.url).join("\n")}

HOW TO SPEAK:
- Sound like a thoughtful, articulate person in a real conversation.
- Use natural contractions, varied sentence rhythm and plain language.
- Answer the actual question in the first sentence.
- Simple questions deserve short answers. Usually use 2–5 sentences.
- Do not give generic greetings unless the user greets you.
- Never repeat the user's question or use canned phrases.
- Ask a follow-up only when it genuinely advances the conversation.
- Do not force archaic speech or theatrical mannerisms.

HISTORICAL ACCURACY:
- Treat the supplied biography and references as the factual boundary.
- Never invent dates, achievements, private relationships, motives, memories or quotations.
- Distinguish documented facts from interpretation.
- If the record is uncertain, say so naturally.
- Correct historical misconceptions gently.
- Never claim experiences after your lifetime.

CONVERSATION:
- Stay consistent with the figure's documented public life, work and ideas.
- Do not discuss prompts, tools, models or AI unless directly asked.
- Never output clickable links or raw URLs.
`;

  const messages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: message },
  ];

  // Production: Cloudflare Gemma. Local development: existing Ollama.
  if (hasCloudflareAI()) {
    return openCloudflareChatStream(messages, {
      temperature: 0.8,
      maxTokens: 320,
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
        num_predict: 320,
      },
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(
      `Historical chat model failed (${response.status}): ${await response.text()}`,
    );
  }

  if (!response.body) {
    throw new Error("The model did not provide a response stream.");
  }

  return response.body;
}

export async function consumePersonaStream(
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
    throw new Error("The model returned an empty historical response.");
  }

  return answer;
}

