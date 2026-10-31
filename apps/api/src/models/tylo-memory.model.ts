import mongoose, { Schema } from "mongoose";

const tyloMemorySchema = new Schema(
  {
    ownerSub: {
      type: String,
      required: true,
    },
    companionId: {
      type: Schema.Types.ObjectId,
      ref: "MemoryCompanion",
      required: true,
    },
    sourceKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    turnAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "tylomemories",
  },
);

tyloMemorySchema.index({
  ownerSub: 1,
  companionId: 1,
  turnAt: -1,
});

export const TyloMemory =
  mongoose.models.TyloMemory ??
  mongoose.model("TyloMemory", tyloMemorySchema);
