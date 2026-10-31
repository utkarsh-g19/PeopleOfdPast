import type { PersonaSummary } from "@pot/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

interface ApiPersona {
  slug: string;
  name: string;
  shortBio: string;
  portraitUrl?: string;
  country?: string;
  portraitCredit?: string;
  portraitSourceUrl?: string;
}

interface PersonaListResponse {
  success: boolean;
  personas: ApiPersona[];
}

export async function fetchHistoricalProfiles(
  signal?: AbortSignal,
): Promise<PersonaSummary[]> {
  const response = await fetch(`${API_BASE}/personas`, { signal });

  if (!response.ok) throw new Error(await readError(response));

  const result = (await response.json()) as PersonaListResponse;

  if (!Array.isArray(result.personas)) {
    throw new Error("Unexpected historical archive response.");
  }

  return result.personas.map((persona) => ({
    id: persona.slug,
    name: persona.name,
    description: persona.shortBio,
    experience: "ghost",
    imageUrl: persona.portraitUrl,
    country: persona.country,
    imageCredit: persona.portraitCredit,
    imageSourceUrl: persona.portraitSourceUrl,
  }));
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendPersonaMessage(
  personaId: string,
  message: string,
  history: ChatMessage[],
): Promise<{ answer: string }> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      experience: "ghost",
      personaId,
      message,
      history: history.slice(-8),
    }),
  });

  if (!response.ok) throw new Error(await readError(response));

  const result = (await response.json()) as {
    success: boolean;
    answer?: string;
    message?: string;
  };

  if (!result.success || typeof result.answer !== "string") {
    throw new Error(result.message || "The model returned an invalid response.");
  }

  return { answer: result.answer };
}

export async function streamPersonaMessage(
  personaId: string,
  message: string,
  history: ChatMessage[],
  onToken: (token: string) => void,
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personaId,
      message,
      history: history.slice(-8),
    }),
  });

  if (!response.ok) throw new Error(await readError(response));
  if (!response.body) throw new Error("No response stream received.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let completed = false;

  function processBlock(block: string) {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");

    if (!data) return;

    const event = JSON.parse(data) as {
      type: "token" | "complete" | "error";
      token?: string;
      message?: string;
    };

    if (event.type === "token" && typeof event.token === "string") {
      onToken(event.token);
    } else if (event.type === "complete") {
      completed = true;
    } else if (event.type === "error") {
      throw new Error(event.message || "The conversation failed.");
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) buffer += decoder.decode(value, { stream: true });
      if (done) buffer += decoder.decode();

      buffer = buffer.replace(/\r\n/g, "\n");

      let boundary = buffer.indexOf("\n\n");

      while (boundary !== -1) {
        processBlock(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }

      if (done) {
        if (buffer.trim()) processBlock(buffer);
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!completed) {
    throw new Error("The server ended before the response completed.");
  }
}

export interface HistoricalPersonaDetails {
  slug: string;
  name: string;
  shortBio: string;
  biography: string;
  era: string;
  country: string;
  city?: string;
  disciplines: string[];
  portraitUrl?: string;
  portraitCredit?: string;
  portraitSourceUrl?: string;
}
export async function fetchHistoricalPersonaDetails(
  slug: string,
  signal?: AbortSignal,
): Promise<HistoricalPersonaDetails> {
  const response = await fetch(
    `${API_BASE}/personas/${encodeURIComponent(slug)}/details`,
    { signal },
  );

  if (!response.ok) throw new Error(await readError(response));

  const result = (await response.json()) as {
    success: boolean;
    persona?: HistoricalPersonaDetails;
  };

  if (!result.persona) throw new Error("Historical profile not found.");

  return result.persona;
}


