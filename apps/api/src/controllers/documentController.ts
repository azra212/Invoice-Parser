import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Document } from "../models/Document";
import { getQueue, getStorage } from "../services/runtime";
import type { ExtractedData } from "@invoice-parser/shared";
import { mongoDuplicateLookup } from "../services/validation/duplicateLookup";
import {
  statusForIssues,
  validateDocument,
} from "../services/validation/engine";

export class DocumentController {
  static async uploadDocument(req: Request, res: Response) {
    try {
      if (!req.file?.buffer) {
        return res.status(400).json({
          success: false,
          code: "NO_FILE_UPLOADED",
          message: "Please choose a file to upload.",
        });
      }

      const stored = await getStorage().put({
        body: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      });

      const created = await Document.create({
        fileName: req.file.originalname,
        processingAttempt: 1,
        status: "uploaded",
        lineItems: [],
        validationIssues: [],
        originalFile: {
          originalName: stored.originalName,
          storedName: stored.key.split("/").pop() ?? stored.key,
          path: stored.key,
          storageKey: stored.key,
          mimeType: stored.mimeType,
        },
      });

      await getQueue().enqueue({
        documentId: String(created._id),
        attempt: 1,
      });

      return res.status(202).json({
        success: true,
        data: created,
      });
    } catch (error: any) {
      console.error("Upload Error:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        code: error.code || "DOCUMENT_UPLOAD_FAILED",
        message: error.message || "Document upload failed. Please try again.",
      });
    }
  }

  static async getDocuments(_req: Request, res: Response) {
    try {
      const documents = await Document.find().sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error("Fetch Documents Error:", error);

      return res.status(500).json({
        success: false,
        code: "DOCUMENT_FETCH_FAILED",
        message: "Failed to fetch documents.",
      });
    }
  }

  static async viewOriginal(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const document = await Document.findById(id);

      if (!id || id === "undefined") {
        return res.status(400).json({
          success: false,
          code: "INVALID_DOCUMENT_ID",
          message: "Invalid document ID.",
        });
      }

      const storageKey =
        document?.originalFile?.storageKey || document?.originalFile?.path;

      if (!document || !storageKey) {
        return res.status(404).json({
          success: false,
          code: "ORIGINAL_FILE_NOT_FOUND",
          message: "Original file is not available for this document.",
        });
      }

      if (!path.isAbsolute(storageKey) && !storageKey.includes("..")) {
        const stored = await getStorage().read(storageKey);
        if (stored) {
          res.setHeader(
            "Content-Type",
            document.originalFile?.mimeType || stored.mimeType,
          );
          return res.send(stored.body);
        }
      }

      const legacyPath = document.originalFile?.path;
      if (legacyPath && fs.existsSync(path.resolve(legacyPath))) {
        return res.sendFile(path.resolve(legacyPath));
      }

      return res.status(404).json({
        success: false,
        code: "ORIGINAL_FILE_MISSING",
        message: "Original file is missing from storage.",
      });
    } catch (error: any) {
      console.error("View Original File Error:", error);

      return res.status(500).json({
        success: false,
        code: "ORIGINAL_FILE_OPEN_FAILED",
        message: "Failed to open original file.",
      });
    }
  }

  static async updateDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id || id === "undefined") {
        return res.status(400).json({
          success: false,
          code: "INVALID_DOCUMENT_ID",
          message: "Invalid document ID.",
        });
      }

      const existingDoc = await Document.findById(id);

      if (!existingDoc) {
        return res.status(404).json({
          success: false,
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found.",
        });
      }

      const dataForValidation = {
        ...existingDoc.toObject(),
        ...updates,
      };

      delete (dataForValidation as any).status;

      const validationIssues = await validateDocument(
        dataForValidation as ExtractedData,
        {
          currentDocumentId: id,
          findDuplicate: mongoDuplicateLookup(),
        },
      );

      const finalStatus = updates.status ?? statusForIssues(validationIssues);

      existingDoc.set({
        ...updates,
        validationIssues,
        status: finalStatus,
      });

      const savedDoc = await existingDoc.save();

      return res.json({
        success: true,
        data: savedDoc,
      });
    } catch (error: any) {
      console.error("Update Document Error:", error);

      return res.status(500).json({
        success: false,
        code: "DOCUMENT_UPDATE_FAILED",
        message: "Failed to update document.",
      });
    }
  }

  static async reprocessDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id || id === "undefined") {
        return res.status(400).json({
          success: false,
          code: "INVALID_DOCUMENT_ID",
          message: "Invalid document ID.",
        });
      }

      const document = await Document.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found.",
        });
      }

      if (document.status === "uploaded" || document.status === "processing") {
        return res.status(202).json({ success: true, data: document });
      }

      const attempt = (document.processingAttempt ?? 0) + 1;
      document.processingAttempt = attempt;
      document.status = "uploaded";
      await document.save();
      await getQueue().enqueue({ documentId: id, attempt });

      return res.status(202).json({ success: true, data: document });
    } catch (error: any) {
      console.error("Reprocess Document Error:", error);
      return res.status(500).json({
        success: false,
        code: "DOCUMENT_REPROCESS_FAILED",
        message: "Failed to reprocess document.",
      });
    }
  }

  static async deleteDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id || id === "undefined") {
        return res.status(400).json({
          success: false,
          code: "INVALID_DOCUMENT_ID",
          message: "Invalid document ID.",
        });
      }

      const deletedDoc = await Document.findByIdAndDelete(id);

      if (!deletedDoc) {
        return res.status(404).json({
          success: false,
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found.",
        });
      }

      const storageKey = deletedDoc.originalFile?.storageKey;
      if (storageKey) {
        await getStorage().delete(storageKey);
      } else if (deletedDoc.originalFile?.path) {
        const absoluteFilePath = path.resolve(deletedDoc.originalFile.path);
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
        }
      }

      return res.json({
        success: true,
        data: deletedDoc,
      });
    } catch (error: any) {
      console.error("Delete Document Error:", error);

      return res.status(500).json({
        success: false,
        code: "DOCUMENT_DELETE_FAILED",
        message: "Failed to delete document.",
      });
    }
  }
}
