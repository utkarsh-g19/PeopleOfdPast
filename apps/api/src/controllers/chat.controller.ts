import type { RequestHandler } from "express";
import { z } from "zod";
import { Persona } from "../models/persona.model.js";
import { generatePersonaReply } from "../services/llm/ollama.service.js";

type PersonaSource = {
  title: string;
  url: string;
};

const requestSchema = z.object({
  experience: z.enum(["ghost"]).optional().default("ghost"),
  personaId: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(2000),

  // Bad history is discarded; it must not block a new question.
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .max(12)
    .catch([]),
});

export const chatWithPersona: RequestHandler = async (req, res, next) => {
  try {
    const parsed = requestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid question and select a historical figure.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { personaId, message, history } = parsed.data;

    const persona = await Persona.findOne({
      slug: personaId,
      status: "published",
    }).lean();

    if (!persona) {
      res.status(404).json({
        success: false,
        message: "This historical figure could not be found in the archive.",
      });
      return;
    }

    const personaSources = (persona.sources ?? []) as PersonaSource[];

    const answer = await generatePersonaReply({
      persona: {
        name: persona.name,
        shortBio: persona.shortBio,
        biography: persona.biography,
        era: persona.era,
        country: persona.country,
        disciplines: persona.disciplines,
        sources: personaSources,
      },
      message,
      history: history.slice(-8),
    });

    res.status(200).json({
      success: true,
      answer,
      persona: {
        id: persona.slug,
        name: persona.name,
      },
      sources: personaSources.map((source) => ({
        title: source.title,
        url: source.url,
      })),
    });
  } catch (error: unknown) {
    next(error);
  }
};
