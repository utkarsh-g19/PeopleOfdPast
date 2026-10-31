import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import personaRoutes from "./routes/persona.routes.js";
import tyloRoutes from "./routes/tylo.routes.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import chatRoutes from "./routes/chat.routes.js";
const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  }),
);

app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/personas", personaRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/tylo", tyloRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
