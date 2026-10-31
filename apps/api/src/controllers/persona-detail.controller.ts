import type { RequestHandler } from "express";
import { Persona } from "../models/persona.model.js";

export const getPersonaDetails: RequestHandler = async (req, res, next) => {
  try {
    const rawSlug = req.params.slug;
    const slug = typeof rawSlug === "string" ? rawSlug : rawSlug?.[0] ?? "";

    if (!slug || slug.length > 100) {
      res.status(400).json({
        success: false,
        message: "Invalid historical figure.",
      });
      return;
    }

    const persona = await Persona.findOne({
      slug,
      status: "published",
    })
      .select(
        "slug name shortBio biography era country city disciplines portraitUrl portraitCredit",
      )
      .lean();

    if (!persona) {
      res.status(404).json({
        success: false,
        message: "Historical figure not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      persona,
    });
  } catch (error: unknown) {
    next(error);
  }
};
