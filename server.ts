import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

// This file is the entry point. Express creates my backend server. createServer from Vite is used to integrate Vite's
// development server for hot module replacement during development.
// The server connects to MongoDB using Mongoose, sets up middleware, and defines API routes for handling document uploads and retrieval.
// In production, it serves static files from the "dist" directory where the frontend is built.
// Path is the node helper for file paths.
// Cors is used to allow cross-origin requests from the frontend to the backend API.
// Import dotenv loads .env variables like MONGO_URI and GEMINI_API_KEY
// Import documentRoutes imports my document-related API routes defined in backend/routes/documentRoutes.ts,

dotenv.config();

import documentRoutes from "./backend/routes/documentRoutes";

// startServer is the main function that initializes the server. It connects to MongoDB,
// sets up Express middleware, and starts listening on a specified port.

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ MongoDB CONNECTED");

    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());

    // This mounts  document routes. router.get("/") becomes GET /api/documents/ and router.post("/") becomes POST /api/documents/
    app.use("/api/documents", documentRoutes);

    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
    });

    // If you are developing locally, use Vite middleware. In production, serve the built frontend from the "dist" directory.
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });

      // Lets Express serve the React frontend.
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
    process.exit(1); // stop app if DB fails
  }
}

startServer();
