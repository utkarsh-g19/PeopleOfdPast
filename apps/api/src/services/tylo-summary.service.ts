import mongoose from "mongoose";
import { MemoryCompanion } from "../models/memory-companion.model.js";
import { TyloMessage } from "../models/tylo-message.model.js";

const SUMMARY_INTERVAL = 10;
const BATCH_SIZE = 30;
const MAX_SUMMARY_LENGTH = 12000;

function formatUserNotes(
  messages: Array<{ content: string; createdAt: Date }>,
): string {
  return messages
    .map((message) => {
      const date = new Date(message.createdAt).toISOString().slice(0, 10);
      return `- [${date}] ${message.content.trim()}`;
    })
    .filter((line) => line.length > 0)
    .join("\n");
}

export async function refreshTyloSummary(
  ownerSub: string,
  companionId: string,
): Promise<void> {
  const companion = await MemoryCompanion.findOne({
    _id: companionId,
    ownerSub,
  });

  if (!companion) return;

  const previousCount = companion.summaryMessageCount ?? 0;

  const totalCount = await TyloMessage.countDocuments({
    ownerSub,
    companionId: new mongoose.Types.ObjectId(companionId),
  });

  if (totalCount - previousCount < SUMMARY_INTERVAL) return;

  const batch = await TyloMessage.find({
    ownerSub,
    companionId: new mongoose.Types.ObjectId(companionId),
  })
    .sort({ createdAt: 1, _id: 1 })
    .skip(previousCount)
    .limit(BATCH_SIZE)
    .select("role content createdAt")
    .lean();

  if (batch.length === 0) return;

  // Only user-authored details become factual memory notes.
  const userNotes = formatUserNotes(
    batch
      .filter((message) => message.role === "user")
      .map((message) => ({
        content: message.content,
        createdAt: message.createdAt,
      })),
  );

  // Discard the old prompt-echo summary if one exists.
  const existing = companion.memorySummary ?? "";
  const previousNotes = existing.startsWith("PREVIOUS SUMMARY:")
    ? ""
    : existing.replace(
        /^USER-SHARED DETAILS \(from saved conversations\)\n/,
        "",
      ).trim();

  const combinedNotes = [previousNotes, userNotes]
    .filter(Boolean)
    .join("\n");

  const clippedNotes = combinedNotes.length > MAX_SUMMARY_LENGTH - 100
    ? combinedNotes.slice(-(MAX_SUMMARY_LENGTH - 100))
    : combinedNotes;

  const summary = clippedNotes
    ? `USER-SHARED DETAILS (from saved conversations)\n${clippedNotes}`
    : "";

  const result = await MemoryCompanion.updateOne(
    {
      _id: companionId,
      ownerSub,
      summaryMessageCount: previousCount,
    },
    {
      $set: {
        memorySummary: summary,
        summaryMessageCount: previousCount + batch.length,
      },
    },
  );

  if (result.modifiedCount > 0) {
    console.info(
      `[TYLO memory] Reliable notes updated for ${companion.name}: ` +
      `${previousCount + batch.length} messages processed.`,
    );
  }
}
