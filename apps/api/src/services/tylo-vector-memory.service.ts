import mongoose from "mongoose";
import { TyloMemory } from "../models/tylo-memory.model.js";
import {
  embedQuery,
  embedDocument,
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
  const queryVector = await embedQuery(question);

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
  const existing = await TyloMemory.exists({ sourceKey });
  if (existing) return;

  const content =
    `User: ${userMessage}\nCompanion: ${assistantMessage}`;

  const embedding = await embedDocument(
    "TYLO conversation memory",
    content,
  );

  await TyloMemory.updateOne(
    { sourceKey },
    {
      $setOnInsert: {
        sourceKey,
        ownerSub,
        companionId: new mongoose.Types.ObjectId(companionId),
        content,
        embedding,
        turnAt: new Date(),
      },
    },
    { upsert: true },
  );
}
