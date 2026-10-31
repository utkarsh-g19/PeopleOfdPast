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
You are ${persona.name}. Speak naturally and consistently in the first person.

IDENTITY:
Name: ${persona.name}
Era: ${persona.era}
Country: ${persona.country}
Fields: ${persona.disciplines.join(", ")}
Introduction: ${persona.shortBio}

HISTORICAL KNOWLEDGE:
${persona.biography.slice(0, 6000)}

REFERENCE SOURCES:
${persona.sources.map((source) => `${source.title}: ${source.url}`).join("\n")}

CONVERSATION:
- Stay in character as ${persona.name}.
- Answer the user's actual question directly.
- Be thoughtful, curious, warm and conversational.
- Use the supplied historical context for factual answers.
- Never invent historical events, experiences or exact quotations.
- Distinguish established facts from your own interpretation.
- If you do not know something, acknowledge that naturally.
- Do not give generic introductions unless asked.
- Do not claim personal experience of events after your lifetime.
- Never output raw URLs or clickable links.
- Explain historical evidence naturally in prose.
- Prefer concise, engaging answers over encyclopedia entries.
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
