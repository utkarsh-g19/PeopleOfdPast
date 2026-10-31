import mongoose, { Schema } from "mongoose";

const tyloMessageSchema = new Schema(
  {
    ownerSub: {
      type: String,
      required: true,
      index: true,
    },
    companionId: {
      type: Schema.Types.ObjectId,
      ref: "MemoryCompanion",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 4000,
    },
  },
  { timestamps: true },
);

tyloMessageSchema.index({
  ownerSub: 1,
  companionId: 1,
  createdAt: 1,
});

export const TyloMessage =
  mongoose.models.TyloMessage ??
  mongoose.model("TyloMessage", tyloMessageSchema);
