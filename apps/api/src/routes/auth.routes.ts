import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
  const sub = req.auth?.payload?.sub;

  if (typeof sub !== "string" || !sub) {
    res.status(401).json({
      success: false,
      message: "Invalid authentication identity",
    });

    return;
  }

  res.status(200).json({
    success: true,
    user: {
      sub,
    },
  });
});

export default router;
