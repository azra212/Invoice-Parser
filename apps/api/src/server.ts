import cors from "cors";
import dotenv from "dotenv";
import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { allowedOrigins, parseEnv, type Env } from "./config/env";
import { toErrorResponse } from "./http/errors";
import { healthReport } from "./http/health";
import { logger, requestLogger } from "./http/logger";
import { apiLimiter } from "./http/rateLimits";
import { buildOpenApi } from "./openapi/buildOpenApi";
import documentRoutes from "./routes/documentRoutes";
import { processStoredDocument } from "./services/documentProcessor";
import { createQueue } from "./services/queue/createQueue";
import { configureRuntime } from "./services/runtime";
import { createStorage } from "./services/storage/createStorage";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

export function createApp(env: Env): Express {
  const app = express();
  const origins = new Set(allowedOrigins(env));

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(requestLogger());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", apiLimiter);

  const health = async (_req: Request, res: Response) => {
    const report = await healthReport(env);
    res.status(report.statusCode).json(report.body);
  };
  app.get("/api/v1/health", (req, res, next) => {
    void health(req, res).catch(next);
  });
  app.get("/api/health", (req, res, next) => {
    void health(req, res).catch(next);
  });
  app.get("/api/v1/openapi.json", (_req, res) => {
    res.json(buildOpenApi());
  });

  app.use("/api/v1/documents", documentRoutes);
  app.use("/api/documents", documentRoutes);

  if (env.NODE_ENV === "production") {
    const webDist = env.WEB_DIST_PATH
      ? path.resolve(env.WEB_DIST_PATH)
      : path.join(repoRoot, "apps", "web", "dist");

    if (fs.existsSync(webDist)) {
      app.use(express.static(webDist));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(webDist, "index.html"));
      });
    } else {
      console.warn(
        `Web build not found at ${webDist}. The API is running without the UI.`,
      );
    }
  }

  app.use((error: unknown, req: Request, res: Response, _next: unknown) => {
    const requestId = typeof req.id === "string" ? req.id : undefined;
    const response = toErrorResponse(error, requestId);
    if (response.status >= 500) {
      logger.error({ err: error, requestId }, "request failed");
    }
    res.status(response.status).json(response.body);
  });

  return app;
}

export async function start() {
  dotenv.config({ path: path.join(repoRoot, ".env"), quiet: true });
  const env = parseEnv();

  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");

  const storage = createStorage(env);
  const queue = createQueue(env);
  configureRuntime({ storage, queue });
  queue.start((job) => processStoredDocument(job.documentId, job.attempt));

  const app = createApp(env);
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${env.PORT}`);
  });
}

const entry = process.argv[1];
const isDirectRun =
  entry !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(entry)).href;

if (isDirectRun) {
  start().catch((error: unknown) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
