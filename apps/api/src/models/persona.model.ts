import mongoose, {
  Schema,
  type InferSchemaType,
} from "mongoose";

const sourceSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    sourceType: {
      type: String,
      enum: ["official", "academic", "reference"],
      default: "reference",
    },
  },
  { _id: false }
);

const personaSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    shortBio: { type: String, required: true },
    biography: { type: String, required: true },
    era: { type: String, required: true, index: true },
    country: { type: String, required: true, index: true },
    city: { type: String },
    disciplines: [{ type: String }],
    portraitUrl: { type: String },
    portraitCredit: { type: String },
    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    sources: [sourceSchema],
  },
  { timestamps: true }
);

export type PersonaDocument = InferSchemaType<typeof personaSchema>;

export const Persona =
  mongoose.models.Persona ??
  mongoose.model("Persona", personaSchema);

