import mongoose from "mongoose";
import { env } from "../config/env.js";
import { MemoryCompanion } from "../models/memory-companion.model.js";
import { TyloMessage } from "../models/tylo-message.model.js";
import {
  completeCloudflareChat,
  hasCloudflareAI,
} from "./llm/cloudflare-ai.service.js";

const SUMMARY_INTERVAL = 10;
const BATCH_SIZE = 30;

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

  const conversation = batch.map((item) =>
    `${item.role === "user" ? "USER" : "COMPANION"}: ${item.content.slice(0, 1500)}`
  ).join("\n\n");

  const previousSummary = companion.memorySummary || "";

  const prompt = `
You are maintaining the long-term memory archive for a private TYLO companion.

PREVIOUS SUMMARY:
${previousSummary || "No previous summary exists."}

NEW CONVERSATION:
${conversation}

Update the previous summary using the new conversation.

PRESERVE:
1. Facts the user explicitly shared about the person.
2. Important shared experiences and stories.
3. Nicknames, favourite expressions and speaking habits.
4. The user's preferences and important personal context.
5. Corrections made by the user. Corrections supersede older conflicting details.
6. Ongoing topics and meaningful conversational context.

STRICT ACCURACY:
- Never turn an assistant-generated statement into a fact about the real person.
- Clearly distinguish user-provided facts from uncertain or unverified details.
- Never invent missing details.
- Do not infer personality, relationships or events.
- Remove redundant information while preserving meaningful detail.
- Retain names, dates and distinctive phrases accurately.

Return a compact, well-organized factual memory summary.
Use headings and bullet points. Do not include conversational filler.
`;

  let summary: string;

  if (hasCloudflareAI()) {
    summary = await completeCloudflareChat(
      [
        {
          role: "system",
          content: "You are an accurate memory archivist. Never fabricate facts.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.15, maxTokens: 700 },
    );
  } else {
    const baseUrl = env.MODEL_BASE_URL.replace(/\/+$/, "");

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "You are an accurate memory archivist. Never fabricate facts.",
          },
          { role: "user", content: prompt },
        ],
        stream: false,
        think: false,
        keep_alive: "10m",
        options: {
          temperature: 0.15,
          num_ctx: 4096,
          num_predict: 700,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      throw new Error(
        `TYLO summary failed (${response.status}): ${await response.text()}`,
      );
    }

    const result = await response.json() as {
      message?: { content?: unknown };
    };

    summary =
      typeof result.message?.content === "string"
        ? result.message.content.trim()
        : "";
  }

  if (!summary.trim()) {
    throw new Error("TYLO generated an empty memory summary.");
  }

  const updated = await MemoryCompanion.findOneAndUpdate(
    {
      _id: companionId,
      ownerSub,
      summaryMessageCount: previousCount,
    },
    {
      $set: {
        memorySummary: summary.slice(0, 12000),
        summaryMessageCount: previousCount + batch.length,
      },
    },
    { new: true },
  );

  if (updated) {
    console.info(
      `[TYLO memory] Summary updated for ${companion.name}: ` +
      `${previousCount + batch.length} messages processed.`,
    );
  }
}
