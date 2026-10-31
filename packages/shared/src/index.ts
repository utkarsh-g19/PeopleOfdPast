import { z } from "zod";

// Experiences supported by POT
export const experienceSchema = z.enum(["ghost", "tylo"]);
export type Experience = z.infer<typeof experienceSchema>;

// Request sent when a user starts a conversation
export const chatRequestSchema = z.object({
  experience: experienceSchema,
  personaId: z.string().min(1),
  message: z.string().trim().min(1).max(4000),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// Sources attached to an AI response
export interface ChatSource {
  title: string;
  url?: string;
  excerpt?: string;
}

// Standard response returned by our chat API
export interface ChatResponse {
  conversationId: string;
  answer: string;
  sources: ChatSource[];
}

// Basic historical or personal persona representation
export interface PersonaSummary {
  id: string;
  name: string;
  description: string;
  experience: Experience;
  imageUrl?: string;
}
