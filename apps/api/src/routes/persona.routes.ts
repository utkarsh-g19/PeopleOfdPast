import { Router } from "express";
import {
  listPersonas,
  getPersonaBySlug,
} from "../controllers/persona.controller.js";
import { getPersonaDetails } from "../controllers/persona-detail.controller.js";

const router = Router();

router.get("/", listPersonas);
router.get("/:slug/details", getPersonaDetails);
router.get("/:slug", getPersonaBySlug);

export default router;
