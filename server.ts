import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import documentRoutes from "./backend/routes/documentRoutes";

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ MongoDB CONNECTED");

    const app = express();
    const PORT = Number(process.env.PORT) || 3000;
    app.use(cors());
    app.use(express.json());

    app.use("/api/documents", documentRoutes);

    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
    });

    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });

      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

startServer();
