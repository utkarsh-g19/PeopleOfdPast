import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from the environment.");
  }

  await mongoose.connect(env.MONGODB_URI, {
    dbName: "pot",
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });

  console.log("MongoDB connected successfully.");
  console.log(`Database: ${mongoose.connection.name}`);

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection lost.");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected.");
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log("MongoDB disconnected.");
}
