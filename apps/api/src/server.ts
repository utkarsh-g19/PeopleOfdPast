import app from "./app.js";
import { env } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

async function startServer(): Promise<void> {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log("---------------------------------");
    console.log("       POT API STARTED");
    console.log("---------------------------------");
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Port: ${env.PORT}`);
    console.log(`Health: http://localhost:${env.PORT}/api/v1/health`);
  });

  const shutdown = (signal: string): void => {
    console.log(`${signal} received. Shutting down...`);

    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error: unknown) => {
  console.error("Failed to start POT API:", error);
  process.exit(1);
});
