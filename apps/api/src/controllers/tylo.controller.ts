import type { Request, RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { MemoryCompanion } from "../models/memory-companion.model.js";
import { TyloMessage } from "../models/tylo-message.model.js";
import { TyloMemory } from "../models/tylo-memory.model.js";

const profileSchema = z.object({
  ageAndLifeStages: z.string().max(2000).default(""),
  relationshipHistory: z.string().max(2000).default(""),
  personality: z.string().max(3000).default(""),
  nicknames: z.string().max(2000).default(""),
  specialMoments: z.string().max(5000).default(""),
  interests: z.string().max(2000).default(""),
  valuesAndBeliefs: z.string().max(2000).default(""),
  speakingStyle: z.string().max(2000).default(""),
  familyAndFriends: z.string().max(2000).default(""),
  dailyRoutines: z.string().max(2000).default(""),
  stories: z.string().max(5000).default(""),
  likesAndDislikes: z.string().max(2000).default(""),
  favouritePhrases: z.string().max(2000).default(""),
  lessonsAndAdvice: z.string().max(3000).default(""),
  importantDates: z.string().max(2000).default(""),
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  relationship: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).optional().default(""),
  profile: profileSchema.optional(),
});

const memorySchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(5000),
});

type MemoryEntry = {
  _id: { toString(): string };
  title: string;
  content: string;
  createdAt: Date;
};

function getOwnerSub(req: Request): string | null {
  const sub = req.auth?.payload?.sub;
  return typeof sub === "string" ? sub : null;
}

function presentCompanion(
  companion: InstanceType<typeof MemoryCompanion>,
) {
  const memories = companion.memories as unknown as MemoryEntry[];

  return {
    id: companion._id.toString(),
    name: companion.name,
    relationship: companion.relationship,
    description: companion.description,
    profile: companion.profile ?? {},
    memories: memories.map((memory) => ({
      id: memory._id.toString(),
      title: memory.title,
      content: memory.content,
      createdAt: memory.createdAt,
    })),
    createdAt: companion.createdAt,
    updatedAt: companion.updatedAt,
  };
}

export const createCompanion: RequestHandler = async (req, res, next) => {
  try {
    const ownerSub = getOwnerSub(req);
    if (!ownerSub) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Please check the companion details.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const companion = await MemoryCompanion.create({
      ...parsed.data,
      ownerSub,
      memories: [],
    });

    res.status(201).json({
      success: true,
      companion: presentCompanion(companion),
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const listCompanions: RequestHandler = async (req, res, next) => {
  try {
    const ownerSub = getOwnerSub(req);
    if (!ownerSub) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const companions = await MemoryCompanion.find({ ownerSub })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      companions: companions.map(presentCompanion),
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getCompanion: RequestHandler = async (req, res, next) => {
  try {
    const ownerSub = getOwnerSub(req);
    if (!ownerSub) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ success: false, message: "Companion not found." });
      return;
    }

    const companion = await MemoryCompanion.findOne({ _id: id, ownerSub });

    if (!companion) {
      res.status(404).json({ success: false, message: "Companion not found." });
      return;
    }

    res.status(200).json({
      success: true,
      companion: presentCompanion(companion),
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const addMemory: RequestHandler = async (req, res, next) => {
  try {
    const ownerSub = getOwnerSub(req);
    if (!ownerSub) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ success: false, message: "Companion not found." });
      return;
    }

    const parsed = memorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Please enter a memory title and description.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const companion = await MemoryCompanion.findOne({ _id: id, ownerSub });

    if (!companion) {
      res.status(404).json({ success: false, message: "Companion not found." });
      return;
    }

    companion.memories.push(parsed.data);
    await companion.save();

    res.status(201).json({
      success: true,
      companion: presentCompanion(companion),
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const updateCompanion: RequestHandler = async (req, res, next) => {
  try {
    const ownerSub = getOwnerSub(req);
    if (!ownerSub) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ success: false, message: "Companion not found." });
      return;
    }

    const updateSchema = z.object({
      name: z.string().trim().min(1).max(100).optional(),
      relationship: z.string().trim().min(1).max(80).optional(),
      description: z.string().trim().max(2000).optional(),
      profile: profileSchema.optional(),
    }).strict().refine(
      (data) => Object.keys(data).length > 0,
      { message: "Provide at least one field to update." },
    );

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Please check the profile details.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const companion = await MemoryCompanion.findOne({ _id: id, ownerSub });

    if (!companion) {
      res.status(404).json({ success: false, message: "Companion not found." });
      return;
    }

    const { profile, ...basicFields } = parsed.data;

    Object.assign(companion, basicFields);

    if (profile) {
      companion.set("profile", profile);
    }

    await companion.save();

    res.status(200).json({
      success: true,
      companion: presentCompanion(companion),
    });
  } catch (error: unknown) {
    next(error);
  }
};
export const deleteCompanion: RequestHandler = async (req, res, next) => {
  try {
    const ownerSub = getOwnerSub(req);
    if (!ownerSub) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ success: false, message: "Companion not found." });
      return;
    }

    const deleted = await MemoryCompanion.findOneAndDelete({
      _id: id,
      ownerSub,
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: "Companion not found." });
      return;
    }

    // Remove the complete conversation transcript with the companion.
    await TyloMessage.deleteMany({
      ownerSub,
      companionId: deleted._id,
    });

    await TyloMemory.deleteMany({
      ownerSub,
      companionId: deleted._id,
    });

    res.status(200).json({ success: true });
  } catch (error: unknown) {
    next(error);
  }
};




