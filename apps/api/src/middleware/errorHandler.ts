// FILE: apps/api/src/middleware/errorHandler.ts
import { ErrorRequestHandler } from "express";
import { logger } from "@studio/shared";
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, "Unhandled API error");
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
};