import type { Request, RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";

import { MemoryCompanion } from "../models/memory-companion.model.js";
import { TyloMessage } from "../models/tylo-message.model.js";

import {
  openTyloStream,
  consumeTyloStream,
} from "../services/llm/tylo-ollama.service.js";

import {
  findRelevantTyloMemories,
  saveTyloConversationMemory,
} from "../services/tylo-vector-memory.service.js";

import { refreshTyloSummary } from "../services/tylo-summary.service.js";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

function getOwnerSub(req: Request): string | null {
  const sub = req.auth?.payload?.sub;
  return typeof sub === "string" ? sub : null;
}

export const getTyloMessages: RequestHandler = async (req, res, next) => {
  try {
    const ownerSub = getOwnerSub(req);
    const rawId = req.params.id;
    const id = typeof rawId === "string" ? rawId : rawId?.[0] ?? "";

    if (!ownerSub) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({
        success: false,
        message: "Companion not found.",
      });
      return;
    }

    const companion = await MemoryCompanion.findOne({
      _id: id,
      ownerSub,
    }).select("_id").lean();

    if (!companion) {
      res.status(404).json({
        success: false,
        message: "Companion not found.",
      });
      return;
    }

    const messages = await TyloMessage.find({
      ownerSub,
      companionId: id,
    })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    res.status(200).json({
      success: true,
      messages: messages.map((message) => ({
        id: message._id.toString(),
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const sendTyloMessage: RequestHandler = async (req, res, next) => {
  try {
    const ownerSub = getOwnerSub(req);
    const rawId = req.params.id;
    const id = typeof rawId === "string" ? rawId : rawId?.[0] ?? "";

    if (!ownerSub) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({
        success: false,
        message: "Companion not found.",
      });
      return;
    }

    const parsed = chatSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Please enter a message.",
      });
      return;
    }

    const companion = await MemoryCompanion.findOne({
      _id: id,
      ownerSub,
    });

    if (!companion) {
      res.status(404).json({
        success: false,
        message: "Companion not found.",
      });
      return;
    }

    // Load only the latest eight messages.
    // Older exchanges are retrieved through semantic memory and summary.
    const recentMessages = await TyloMessage.find({
      ownerSub,
      companionId: id,
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(8)
      .select("role content")
      .lean();

    const history = recentMessages.reverse().map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content.slice(0, 600),
    }));

    // Retrieve relevant older exchanges.
    let recalledMemories: Array<{ content: string }> = [];

    try {
      const relevant = await findRelevantTyloMemories(
        ownerSub,
        id,
        parsed.data.message,
      );

      recalledMemories = relevant.map((memory) => ({
        content: memory.content,
      }));
    } catch (error: unknown) {
      console.warn(
        "[TYLO] Semantic recall unavailable; continuing with recent context.",
        error instanceof Error ? error.message : error,
      );
    }

    const rawProfile = companion.profile as unknown as
      | { toObject?: () => Record<string, unknown> }
      | Record<string, unknown>
      | undefined;

    const profileObject =
      rawProfile &&
      "toObject" in rawProfile &&
      typeof rawProfile.toObject === "function"
        ? rawProfile.toObject()
        : rawProfile ?? {};

    const profile = Object.fromEntries(
      Object.entries(profileObject).filter(
        ([, value]) =>
          typeof value === "string" && value.trim().length > 0,
      ),
    ) as Record<string, string>;

    const savedMemories = companion.memories as unknown as Array<{
      title: string;
      content: string;
    }>;

    const memories = [
      ...savedMemories.slice(-3).map((memory) => ({
        title: memory.title,
        content: memory.content.slice(0, 700),
      })),
      ...recalledMemories.slice(0, 4).map((memory, index) => ({
        title: `Retrieved conversation ${index + 1}`,
        content: memory.content.slice(0, 700),
      })),
    ];

    const upstream = await openTyloStream({
      name: companion.name,
      relationship: companion.relationship,
      description: companion.description,
      profile,
      memories,
      memorySummary: companion.memorySummary ?? "",
      history,
      message: parsed.data.message,
    });

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const answer = await consumeTyloStream(upstream, (token) => {
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({ type: "token", token })}\n\n`,
        );
      }
    });

    // Save the complete exchange permanently.
    const savedMessages = await TyloMessage.insertMany([
      {
        ownerSub,
        companionId: companion._id,
        role: "user",
        content: parsed.data.message,
      },
      {
        ownerSub,
        companionId: companion._id,
        role: "assistant",
        content: answer,
      },
    ]);

    const sourceKey =
      `${savedMessages[0]._id.toString()}:${savedMessages[1]._id.toString()}`;

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: "complete",
          messages: savedMessages.map((message) => ({
            id: message._id.toString(),
            role: message.role,
            content: message.content,
            createdAt: message.createdAt,
          })),
        })}\n\n`,
      );
      res.end();
    }

    // Background enrichment. Neither task delays the next user-visible reply.
    void saveTyloConversationMemory(
      ownerSub,
      id,
      parsed.data.message,
      answer,
      sourceKey,
    ).catch((error: unknown) => {
      console.error(
        "[TYLO] Semantic memory save failed:",
        error instanceof Error ? error.message : error,
      );
    });

    void refreshTyloSummary(ownerSub, id).catch((error: unknown) => {
      console.error(
        "[TYLO] Summary refresh failed:",
        error instanceof Error ? error.message : error,
      );
    });
  } catch (error: unknown) {
    console.error("[TYLO chat]", error);

    if (res.headersSent) {
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: "The conversation could not be completed. Please try again.",
          })}\n\n`,
        );
        res.end();
      }
      return;
    }

    next(error);
  }
};
