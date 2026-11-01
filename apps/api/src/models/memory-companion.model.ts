import mongoose, { Schema, type InferSchemaType } from "mongoose";

const memoryEntrySchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true },
);

const profileSchema = new Schema(
  {
    ageAndLifeStages: { type: String, default: "", maxlength: 2000 },
    relationshipHistory: { type: String, default: "", maxlength: 2000 },
    personality: { type: String, default: "", maxlength: 3000 },
    nicknames: { type: String, default: "", maxlength: 2000 },
    specialMoments: { type: String, default: "", maxlength: 5000 },
    interests: { type: String, default: "", maxlength: 2000 },
    valuesAndBeliefs: { type: String, default: "", maxlength: 2000 },
    speakingStyle: { type: String, default: "", maxlength: 2000 },
    familyAndFriends: { type: String, default: "", maxlength: 2000 },
    dailyRoutines: { type: String, default: "", maxlength: 2000 },
    stories: { type: String, default: "", maxlength: 5000 },
    likesAndDislikes: { type: String, default: "", maxlength: 2000 },
    favouritePhrases: { type: String, default: "", maxlength: 2000 },
    lessonsAndAdvice: { type: String, default: "", maxlength: 3000 },
    importantDates: { type: String, default: "", maxlength: 2000 },
  },
  { _id: false },
);

const companionSchema = new Schema(
  {
    ownerSub: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    relationship: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", maxlength: 2000 },
    profileImageDataUrl: { type: String, default: "", maxlength: 700000 },
    memorySummary: {
      type: String,
      default: "",
      maxlength: 12000,
    },
    summaryMessageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    profile: {
      type: profileSchema,
      default: () => ({}),
    },
    memories: {
      type: [memoryEntrySchema],
      default: [],
    },
  },
  { timestamps: true },
);

companionSchema.index({ ownerSub: 1, updatedAt: -1 });

export type MemoryCompanionDocument =
  InferSchemaType<typeof companionSchema>;

export const MemoryCompanion =
  mongoose.models.MemoryCompanion ??
  mongoose.model("MemoryCompanion", companionSchema);

