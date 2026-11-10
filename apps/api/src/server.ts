import cors from "cors";
import dotenv from "dotenv";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { allowedOrigins, parseEnv, type Env } from "./config/env";
import documentRoutes from "./routes/documentRoutes";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

export function createApp(env: Env): Express {
  const app = express();
  const origins = new Set(allowedOrigins(env));

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed`));
      },
    }),
  );
  app.use(express.json());

  app.use("/api/documents", documentRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

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

  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const message = error instanceof Error ? error.message : "Request failed";
      const originRejected = message.startsWith("Origin ");

      if (!originRejected) {
        console.error(error);
      }

      res.status(originRejected ? 403 : 500).json({
        success: false,
        code: originRejected ? "ORIGIN_NOT_ALLOWED" : "REQUEST_FAILED",
        message: originRejected ? message : "Request failed",
      });
    },
  );

  return app;
}

export async function start() {
  dotenv.config({ path: path.join(repoRoot, ".env"), quiet: true });
  const env = parseEnv();

  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");

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
