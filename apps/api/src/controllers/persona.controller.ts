import type { RequestHandler } from "express";
import { Persona } from "../models/persona.model.js";

export const listPersonas: RequestHandler = async (req, res, next) => {
  try {
    const isRecent = req.query.recent === "true";

    const filter: Record<string, unknown> = {
      status: "published",
      recentLegacy: isRecent ? true : { $ne: true },
    };

    if (typeof req.query.q === "string" && req.query.q.trim()) {
      const search = req.query.q.trim();
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { shortBio: { $regex: escaped, $options: "i" } },
      ];
    }

    if (typeof req.query.country === "string") {
      filter.country = req.query.country;
    }

    if (typeof req.query.era === "string") {
      filter.era = req.query.era;
    }

    const personas = await Persona.find(filter)
      .sort(
        isRecent
          ? { deathDate: -1, name: 1 }
          : { featured: -1, name: 1 },
      )
      .lean();

    res.status(200).json({
      success: true,
      count: personas.length,
      personas,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getPersonaBySlug: RequestHandler = async (req, res, next) => {
  try {
    const persona = await Persona.findOne({
      slug: req.params.slug,
      status: "published",
    }).lean();

    if (!persona) {
      res.status(404).json({
        success: false,
        message: "Historical persona not found.",
      });
      return;
    }

    res.status(200).json({ success: true, persona });
  } catch (error: unknown) {
    next(error);
  }
};
