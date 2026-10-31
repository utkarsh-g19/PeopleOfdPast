import type { RequestHandler } from "express";

export const getHealth: RequestHandler = (_req, res) => {
  res.status(200).json({
    success: true,
    message: "POT API is running.",
    timestamp: new Date().toISOString(),
    service: "people-of-the-past-api",
  });
};
