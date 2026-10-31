import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";

import {
  createCompanion,
  updateCompanion,
  listCompanions,
  getCompanion,
  addMemory,
  deleteCompanion,
} from "../controllers/tylo.controller.js";

import {
  getTyloMessages,
  sendTyloMessage,
} from "../controllers/tylo-chat.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/companions", listCompanions);
router.post("/companions", createCompanion);
router.get("/companions/:id", getCompanion);
router.patch("/companions/:id", updateCompanion);
router.post("/companions/:id/memories", addMemory);
router.delete("/companions/:id", deleteCompanion);

router.get("/companions/:id/messages", getTyloMessages);
router.post("/companions/:id/chat", sendTyloMessage);

export default router;

