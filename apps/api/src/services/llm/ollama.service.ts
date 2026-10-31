import { env } from "../../config/env.js";

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaResponse {
  message?: {
    content?: unknown;
    thinking?: unknown;
  };
  error?: string;
  eval_count?: number;
  done_reason?: string;
}

interface PersonaContext {
  name: string;
  shortBio: string;
  biography: string;
  era: string;
  country: string;
  disciplines: string[];
  sources: Array<{ title: string; url: string }>;
}

interface GenerateReplyInput {
  persona: PersonaContext;
  message: string;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

async function requestOllama(
  messages: OllamaMessage[],
): Promise<{ content: string; evalCount: number }> {
  const baseUrl = env.MODEL_BASE_URL.replace(/\/+$/, "");

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.MODEL_NAME,
      messages,
      stream: false,
      think: false,
      keep_alive: "10m",
      options: {
        temperature: 0.9,
        top_p: 0.95,
        top_k: 64,
        num_ctx: 4096,
        num_predict: 320,
      },
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as OllamaResponse;

  const content =
    typeof data.message?.content === "string"
      ? data.message.content.trim()
      : "";

  return {
    content,
    evalCount: data.eval_count ?? 0,
  };
}

export async function generatePersonaReply({
  persona,
  message,
  history,
}: GenerateReplyInput): Promise<string> {
  const systemPrompt = `
You are ${persona.name}. Speak naturally in the first person.

Your identity and background:
${persona.name} — ${persona.shortBio}
Era: ${persona.era}
Country: ${persona.country}
Fields: ${persona.disciplines.join(", ")}

Historical knowledge:
${persona.biography.slice(0, 5000)}

How to converse:
- Answer the user's actual question directly.
- Stay in character as ${persona.name}.
- Use first person naturally.
- Be intelligent, engaging, warm and thoughtful.
- Use the historical knowledge above for factual answers.
- Never invent historical facts or exact quotations.
- If something is unknown, acknowledge that naturally.
- Do not talk about being an AI, model or simulation.
- Do not give generic introductions unless asked.
- Prefer direct conversational answers over long essays.
`;

  const messages: OllamaMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((item) => ({
      role: item.role,
      content: item.content.slice(0, 1200),
    })),
    { role: "user", content: message },
  ];

  const firstAttempt = await requestOllama(messages);

  console.info(
    `[Ollama] First attempt: ${firstAttempt.content.length} characters, ` +
    `${firstAttempt.evalCount} generated tokens`,
  );

  if (firstAttempt.content) {
    return firstAttempt.content;
  }

  console.warn("[Ollama] Empty response. Retrying with a shorter prompt.");

  const retry = await requestOllama([
    {
      role: "system",
      content: `You are ${persona.name}. Answer naturally in first person.
Your background: ${persona.shortBio}
Historical context: ${persona.biography.slice(0, 1500)}
Answer the user's question directly. Be conversational and historically accurate.`,
    },
    { role: "user", content: message },
  ]);

  if (retry.content) {
    console.info(`[Ollama] Retry succeeded: ${retry.content.length} characters`);
    return retry.content;
  }

  throw new Error(
    "The model returned an empty answer twice. Check the Ollama model and runtime.",
  );
}
