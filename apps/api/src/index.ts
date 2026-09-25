// FILE: apps/api/src/index.ts
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { app } from "./app";
import { logger } from "@studio/shared";

const port = process.env.PORT || 4000;
app.listen(port, () => logger.info(`API listening on :${port}`));