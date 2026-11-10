import path from "path";
import { Router } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError";
import { uploadLimiter } from "../http/rateLimits";
import { DocumentController } from "../controllers/documentController";

const allowedMimeTypes: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".csv": [
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "text/plain",
  ],
  ".txt": ["text/plain"],
};

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowed = allowedMimeTypes[extension] ?? [];

    if (allowed.includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("Invalid file type"));
  },
});

router.post("/upload", uploadLimiter, (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      const tooLarge =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
      next(
        new AppError(
          tooLarge
            ? "File is larger than 10 MB."
            : "Unsupported file type. Please upload a PDF, image, CSV, or TXT file.",
          400,
          tooLarge ? "FILE_TOO_LARGE" : "INVALID_FILE_TYPE",
        ),
      );
      return;
    }

    void DocumentController.uploadDocument(req, res, next);
  });
});

router.get("/", (req, res, next) => {
  void DocumentController.getDocuments(req, res, next);
});
router.get("/export", (req, res, next) => {
  void DocumentController.exportDocuments(req, res, next);
});
router.post("/:id/reprocess", (req, res, next) => {
  void DocumentController.reprocessDocument(req, res, next);
});
router.patch("/:id", (req, res, next) => {
  void DocumentController.updateDocument(req, res, next);
});
router.delete("/:id", (req, res, next) => {
  void DocumentController.deleteDocument(req, res, next);
});
router.get("/:id/audit", (req, res, next) => {
  void DocumentController.getAudit(req, res, next);
});
router.get("/:id/original", (req, res, next) => {
  void DocumentController.viewOriginal(req, res, next);
});

export default router;
