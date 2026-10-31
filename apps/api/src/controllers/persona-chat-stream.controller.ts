import type { RequestHandler } from "express";
import { z } from "zod";
import { Persona } from "../models/persona.model.js";
import {
  openPersonaStream,
  consumePersonaStream,
} from "../services/llm/persona-stream.service.js";

const requestSchema = z.object({
  personaId: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(2000),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(2000),
    }),
  ).max(12).catch([]),
});

type PersonaSource = {
  title: string;
  url: string;
};

export const streamPersonaChat: RequestHandler = async (req, res, next) => {
  try {
    const parsed = requestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid question.",
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
        message: "Historical figure not found in the archive.",
      });
      return;
    }

    const sources = (persona.sources ?? []) as PersonaSource[];

    // Open Ollama before sending SSE headers. This preserves normal HTTP
    // error responses when the model server is unavailable.
    const upstream = await openPersonaStream({
      persona: {
        name: persona.name,
        shortBio: persona.shortBio,
        biography: persona.biography,
        era: persona.era,
        country: persona.country,
        disciplines: persona.disciplines,
        sources,
      },
      message,
      history,
    });

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const answer = await consumePersonaStream(upstream, (token) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: "token", token })}\n\n`);
      }
    });

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({
        type: "complete",
        persona: { id: persona.slug, name: persona.name },
        sources,
      })}\n\n`);
      res.end();
    }

    console.info(
      `[Ghost Gallery] ${persona.name}: streamed ${answer.length} characters`,
    );
  } catch (error: unknown) {
    console.error("[Ghost Gallery stream]", error);

    if (res.headersSent) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({
          type: "error",
          message: "The conversation could not be completed. Please try again.",
        })}\n\n`);
        res.end();
      }
      return;
    }

    next(error);
  }
};

