import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { TyloMemory } from "../models/tylo-memory.model.js";
import {
  embedDocument,
  getCurrentEmbeddingModel,
} from "../services/embeddings/embedding.service.js";
import { hasCloudflareAI } from "../services/llm/cloudflare-ai.service.js";

async function migrateVectors(): Promise<void> {
  if (!hasCloudflareAI()) {
    throw new Error(
      "Cloudflare credentials are required. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.",
    );
  }

  await connectDatabase();

  const targetModel = getCurrentEmbeddingModel();

  const memories = await TyloMemory.find({
    embeddingModel: { $ne: targetModel },
  })
    .select("_id content embeddingModel")
    .lean();

  console.info(`[TYLO migration] Found ${memories.length} memories to re-embed.`);
  console.info(`[TYLO migration] Target: ${targetModel}`);

  let migrated = 0;
  let failed = 0;

  for (const memory of memories) {
    try {
      const embedding = await embedDocument(
        "TYLO conversation memory",
        memory.content,
      );

      await TyloMemory.updateOne(
        { _id: memory._id },
        {
          $set: {
            embedding,
            embeddingModel: targetModel,
          },
        },
      );

      migrated++;

      if (migrated % 5 === 0 || migrated === memories.length) {
        console.info(`[TYLO migration] ${migrated}/${memories.length} migrated.`);
      }
    } catch (error: unknown) {
      failed++;
      console.error(
        `[TYLO migration] Failed record ${memory._id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.info("\n[TYLO migration complete]");
  console.info(`Migrated: ${migrated}`);
  console.info(`Failed: ${failed}`);
}

migrateVectors()
  .catch((error: unknown) => {
    console.error("[TYLO migration fatal]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
