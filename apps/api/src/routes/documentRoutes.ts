import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import multer from "multer";
import { DocumentController } from "../controllers/documentController";

const router = Router();

const uploadDir = path.resolve(
  fileURLToPath(new URL("../../uploads", import.meta.url)),
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, callback) => {
    callback(null, `${Date.now()}-${path.basename(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".csv", ".txt"];
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowed.includes(extension)) {
      callback(null, true);
      return;
    }

    callback(new Error("Invalid file type"));
  },
});

router.post("/upload", (req, res) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      res.status(400).json({
        success: false,
        code: "INVALID_FILE_TYPE",
        message:
          error.message === "Invalid file type"
            ? "Unsupported file type. Please upload a PDF, image, CSV, or TXT file."
            : error.message,
      });
      return;
    }

    void DocumentController.uploadDocument(req, res);
  });
});

router.get("/", (req, res) => {
  void DocumentController.getDocuments(req, res);
});
router.patch("/:id", (req, res) => {
  void DocumentController.updateDocument(req, res);
});
router.delete("/:id", (req, res) => {
  void DocumentController.deleteDocument(req, res);
});
router.get("/:id/original", (req, res) => {
  void DocumentController.viewOriginal(req, res);
});

export default router;
