import { env } from "../../config/env.js";
import { hasCloudflareAI } from "../llm/cloudflare-ai.service.js";

const LOCAL_MODEL = "embeddinggemma-2:270m";
const DIMENSIONS = 768;

interface OllamaEmbeddingResponse {
  embeddings?: number[][];
}

interface CloudflareEmbeddingResponse {
  data?: Array<{ embedding?: number[] }>;
  result?: {
    data?: number[][];
  };
  success?: boolean;
  errors?: Array<{ message?: string }>;
}

export function getCurrentEmbeddingModel(): string {
  return hasCloudflareAI()
    ? env.CLOUDFLARE_EMBEDDING_MODEL
    : LOCAL_MODEL;
}

export async function embedQuery(text: string): Promise<number[]> {
  return createEmbedding(text.trim(), true);
}

export async function embedDocument(
  title: string,
  text: string,
): Promise<number[]> {
  return createEmbedding(`${title.trim()}\n${text.trim()}`, false);
}

async function createEmbedding(
  input: string,
  isQuery: boolean,
): Promise<number[]> {
  let vector: number[] | undefined;

  if (hasCloudflareAI()) {
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
      throw new Error("Cloudflare embedding credentials are missing.");
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/embeddings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.CLOUDFLARE_EMBEDDING_MODEL,
          input,
        }),
        signal: AbortSignal.timeout(45000),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Cloudflare embedding failed (${response.status}): ${await response.text()}`,
      );
    }

    const result = (await response.json()) as CloudflareEmbeddingResponse;

    vector =
      result.data?.[0]?.embedding ??
      result.result?.data?.[0];
  } else {
    // Local development retains the existing Ollama embedding model.
    const baseUrl = env.MODEL_BASE_URL.replace(/\/+$/, "");
    const localInput = isQuery
      ? `task: search result | query: ${input}`
      : `title: TYLO memory | text: ${input}`;

    const response = await fetch(`${baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_MODEL,
        input: localInput,
        keep_alive: "10m",
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama embedding failed (${response.status}): ${await response.text()}`,
      );
    }

    const result = (await response.json()) as OllamaEmbeddingResponse;
    vector = result.embeddings?.[0];
  }

  if (
    !vector ||
    vector.length !== DIMENSIONS ||
    vector.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(`Invalid embedding. Expected ${DIMENSIONS} numeric dimensions.`);
  }

  return vector;
}
