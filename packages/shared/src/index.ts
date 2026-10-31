import { z } from "zod";

export const experienceSchema = z.enum(["ghost", "tylo"]);
export type Experience = z.infer<typeof experienceSchema>;

export const chatHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export type ChatHistoryMessage =
  z.infer<typeof chatHistoryMessageSchema>;

export const chatRequestSchema = z.object({
  experience: experienceSchema,
  personaId: z.string().min(1).max(100),
  message: z.string().trim().min(1).max(2000),
  history: z.array(chatHistoryMessageSchema).max(12).default([]),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatSource {
  title: string;
  url?: string;
  excerpt?: string;
}

export interface ChatResponse {
  conversationId: string;
  answer: string;
  sources: ChatSource[];
}

export interface PersonaSummary {
  id: string;
  name: string;
  description: string;
  experience: Experience;
  imageUrl?: string;
}
