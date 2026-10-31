import { Router } from "express";
import { chatWithPersona } from "../controllers/chat.controller.js";
import { streamPersonaChat } from "../controllers/persona-chat-stream.controller.js";

const router = Router();

router.post("/", chatWithPersona);
router.post("/stream", streamPersonaChat);

export default router;
