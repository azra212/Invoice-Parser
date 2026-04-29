// This file says: “When a request comes in, which controller function should handle it?”

import { Router } from "express";
import multer from "multer";
import { DocumentController } from "../controllers/documentController";
import path from "path";

const router = Router();

const storage = multer.diskStorage({
  destination: "backend/uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Creates the upload handler using the disk storage config.
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".csv", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

router.post(
  "/upload",
  upload.single("file"),
  DocumentController.uploadDocument,
);
router.get("/", DocumentController.getDocuments);
router.patch("/:id", DocumentController.updateDocument);
router.delete("/:id", DocumentController.deleteDocument);

export default router;
