import { env } from "../../config/env.js";

const MODEL = "embeddinggemma-2:270m";
const DIMENSIONS = 768;

interface EmbeddingResponse {
  embeddings?: number[][];
  error?: string;
}

export async function embedQuery(text: string): Promise<number[]> {
  return createEmbedding(
    `task: search result | query: ${text.trim()}`,
  );
}

export async function embedDocument(
  title: string,
  text: string,
): Promise<number[]> {
  return createEmbedding(
    `title: ${title.trim()} | text: ${text.trim()}`,
  );
}

async function createEmbedding(input: string): Promise<number[]> {
  const baseUrl = env.MODEL_BASE_URL.replace(/\/+$/, "");

  const response = await fetch(`${baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      input,
      keep_alive: "10m",
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    throw new Error(
      `Embedding service failed (${response.status}): ${await response.text()}`,
    );
  }

  const result = (await response.json()) as EmbeddingResponse;
  const vector = result.embeddings?.[0];

  if (
    !vector ||
    vector.length !== DIMENSIONS ||
    vector.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(
      `Invalid embedding. Expected ${DIMENSIONS} numeric dimensions.`,
    );
  }

  return vector;
}
