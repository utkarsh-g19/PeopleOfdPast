import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { TyloMessage } from "../models/tylo-message.model.js";
import { TyloMemory } from "../models/tylo-memory.model.js";
import {
  embedDocument,
  getCurrentEmbeddingModel,
} from "../services/embeddings/embedding.service.js";
import { hasCloudflareAI } from "../services/llm/cloudflare-ai.service.js";

async function backfillFromTranscripts(): Promise<void> {
  if (!hasCloudflareAI()) {
    throw new Error("Cloudflare credentials are missing.");
  }

  await connectDatabase();

  const targetModel = getCurrentEmbeddingModel();

  const messages = await TyloMessage.find({})
    .sort({ ownerSub: 1, companionId: 1, createdAt: 1, _id: 1 })
    .lean();

  console.info(`[TYLO backfill] Found ${messages.length} transcript messages.`);
  console.info(`[TYLO backfill] Embedding model: ${targetModel}`);

  const pendingUsers = new Map<string, (typeof messages)[number]>();

  let created = 0;
  let skipped = 0;
  let failed = 0;
  let unmatched = 0;

  for (const message of messages) {
    const companionId = message.companionId.toString();
    const groupKey = `${message.ownerSub}:${companionId}`;

    if (message.role === "user") {
      if (pendingUsers.has(groupKey)) {
        unmatched++;
      }

      pendingUsers.set(groupKey, message);
      continue;
    }

    const userMessage = pendingUsers.get(groupKey);

    if (!userMessage) {
      unmatched++;
      continue;
    }

    pendingUsers.delete(groupKey);

    const sourceKey =
      `${userMessage._id.toString()}:${message._id.toString()}`;

    const content =
      `User: ${userMessage.content}\n` +
      `Companion: ${message.content}`;

    try {
      const existing = await TyloMemory.findOne({ sourceKey })
        .select("embeddingModel")
        .lean();

      if (existing?.embeddingModel === targetModel) {
        skipped++;
        continue;
      }

      const embedding = await embedDocument(
        "TYLO conversation memory",
        content,
      );

      await TyloMemory.updateOne(
        { sourceKey },
        {
          $set: {
            ownerSub: userMessage.ownerSub,
            companionId: new mongoose.Types.ObjectId(companionId),
            sourceKey,
            embeddingModel: targetModel,
            content,
            embedding,
            turnAt: userMessage.createdAt,
          },
        },
        { upsert: true },
      );

      created++;

      console.info(
        `[TYLO backfill] Embedded exchange ${created}: ${userMessage._id}`,
      );
    } catch (error: unknown) {
      failed++;
      console.error(
        `[TYLO backfill] Failed exchange ${sourceKey}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  unmatched += pendingUsers.size;

  console.info("\n[TYLO backfill complete]");
  console.info(`Created/re-embedded: ${created}`);
  console.info(`Already current: ${skipped}`);
  console.info(`Failed: ${failed}`);
  console.info(`Unmatched transcript messages: ${unmatched}`);
}

backfillFromTranscripts()
  .catch((error: unknown) => {
    console.error("[TYLO backfill fatal]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
