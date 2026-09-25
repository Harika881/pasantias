// FILE: apps/api/src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimit";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import generateRoutes from "./routes/generate";
import jobRoutes from "./routes/jobs";
import sceneRoutes from "./routes/scenes";
import settingsRoutes from "./routes/settings";
import youtubeRoutes from "./routes/youtube";
import usageRoutes from "./routes/usage";

export const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(rateLimiter);
app.use("/uploads", express.static(path.join(__dirname, "../../../uploads")));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/scenes", sceneRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/usage", usageRoutes);

app.use(errorHandler);