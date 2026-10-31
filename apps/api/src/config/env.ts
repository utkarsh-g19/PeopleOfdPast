import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  WEB_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:5173"),

  MONGODB_URI: z.string().min(1).optional(),

  AUTH0_DOMAIN: z.string().min(1).optional(),

  AUTH0_AUDIENCE: z.string().min(1).optional(),

  MODEL_BASE_URL: z
    .string()
    .url()
    .default("http://localhost:11434"),

  MODEL_NAME: z.string().default("gemma4:e2b"),
});

export const env = envSchema.parse(process.env);
