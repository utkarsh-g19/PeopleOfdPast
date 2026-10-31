import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  const statusCode =
    typeof error?.status === "number" &&
    error.status >= 400 &&
    error.status < 600
      ? error.status
      : 500;

  if (statusCode >= 500) {
    console.error("API Error:", error);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 401
        ? "Authentication required or access token is invalid."
        : statusCode === 403
          ? "You do not have permission to access this resource."
          : statusCode === 500
            ? "Internal server error."
            : "Request could not be completed.",
  });
};
