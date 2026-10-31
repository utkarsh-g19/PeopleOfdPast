import mongoose from "mongoose";
import { TyloMemory } from "../models/tylo-memory.model.js";
import {
  embedQuery,
  embedDocument,
  getCurrentEmbeddingModel,
} from "./embeddings/embedding.service.js";

interface RetrievedMemory {
  content: string;
  turnAt: Date;
  score: number;
}

export async function findRelevantTyloMemories(
  ownerSub: string,
  companionId: string,
  question: string,
): Promise<RetrievedMemory[]> {
  const [queryVector] = await Promise.all([
    embedQuery(question),
  ]);

  const embeddingModel = getCurrentEmbeddingModel();

  const results = await TyloMemory.aggregate([
    {
      $vectorSearch: {
        index: "tylo_memory_vector_index",
        path: "embedding",
        queryVector,
        numCandidates: 50,
        limit: 4,
        filter: {
          ownerSub,
          companionId: new mongoose.Types.ObjectId(companionId),
          embeddingModel,
        },
      },
    },
    {
      $project: {
        content: 1,
        turnAt: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]).exec();

  return results as RetrievedMemory[];
}

export async function saveTyloConversationMemory(
  ownerSub: string,
  companionId: string,
  userMessage: string,
  assistantMessage: string,
  sourceKey: string,
): Promise<void> {
  const embeddingModel = getCurrentEmbeddingModel();

  // Skip only if this exchange is already embedded with the active model.
  const existing = await TyloMemory.exists({
    sourceKey,
    embeddingModel,
  });

  if (existing) return;

  const content =
    `User: ${userMessage}\nCompanion: ${assistantMessage}`;

  const embedding = await embedDocument(
    "TYLO conversation memory",
    content,
  );

  // Update an old vector when its embedding model has changed.
  await TyloMemory.updateOne(
    { sourceKey },
    {
      $set: {
        ownerSub,
        companionId: new mongoose.Types.ObjectId(companionId),
        embeddingModel,
        content,
        embedding,
        turnAt: new Date(),
      },
    },
    { upsert: true },
  );
}
