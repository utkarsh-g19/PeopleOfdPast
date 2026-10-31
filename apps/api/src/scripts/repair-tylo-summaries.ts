import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { MemoryCompanion } from "../models/memory-companion.model.js";
import { TyloMessage } from "../models/tylo-message.model.js";

const MAX_SUMMARY_LENGTH = 12000;

async function repairSummaries(): Promise<void> {
  await connectDatabase();

  const companions = await MemoryCompanion.find({})
    .select("_id ownerSub name")
    .lean();

  for (const companion of companions) {
    const messages = await TyloMessage.find({
      ownerSub: companion.ownerSub,
      companionId: companion._id,
    })
      .sort({ createdAt: 1, _id: 1 })
      .select("role content createdAt")
      .lean();

    const notes = messages
      .filter((message) => message.role === "user")
      .map((message) => {
        const date = new Date(message.createdAt)
          .toISOString()
          .slice(0, 10);

        return `- [${date}] ${message.content.trim()}`;
      })
      .join("\n");

    const clipped = notes.length > MAX_SUMMARY_LENGTH - 100
      ? notes.slice(-(MAX_SUMMARY_LENGTH - 100))
      : notes;

    const summary = clipped
      ? `USER-SHARED DETAILS (from saved conversations)\n${clipped}`
      : "";

    await MemoryCompanion.updateOne(
      { _id: companion._id, ownerSub: companion.ownerSub },
      {
        $set: {
          memorySummary: summary,
          summaryMessageCount: messages.length,
        },
      },
    );

    console.info(
      `[TYLO repair] ${companion.name}: ` +
      `${messages.length} messages, ${messages.filter(m => m.role === "user").length} user notes.`,
    );
  }
}

repairSummaries()
  .catch((error: unknown) => {
    console.error("[TYLO repair failed]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
