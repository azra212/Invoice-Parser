import type { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Document } from "../models/Document";
import { getQueue, getStorage } from "../services/runtime";
import type { ExtractedData } from "@invoice-parser/shared";
import {
  documentIdSchema,
  listDocumentsQuerySchema,
  parseInput,
  updateDocumentSchema,
} from "../http/schemas";
import { mongoDuplicateLookup } from "../services/validation/duplicateLookup";
import {
  statusForIssues,
  validateDocument,
} from "../services/validation/engine";

export class DocumentController {
  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
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
    } catch (error) {
      next(error);
    }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseInput(listDocumentsQuerySchema, req.query);
      const filter: Record<string, unknown> = {};
      if (query.status) filter.status = query.status;
      if (query.q) {
        const pattern = new RegExp(escapeRegex(query.q), "i");
        filter.$or = [
          { supplierName: pattern },
          { documentNumber: pattern },
          { fileName: pattern },
        ];
      }

      const skip = (query.page - 1) * query.limit;
      const [documents, total] = await Promise.all([
        Document.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(query.limit),
        Document.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        data: documents,
        page: query.page,
        limit: query.limit,
        total,
      });
    } catch (error) {
      next(error);
    }
  }

  static async viewOriginal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = parseInput(documentIdSchema, req.params);

      const document = await Document.findById(id);

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
    } catch (error) {
      next(error);
    }
  }

  static async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = parseInput(documentIdSchema, req.params);
      const updates = parseInput(updateDocumentSchema, req.body);

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
    } catch (error) {
      next(error);
    }
  }

  static async reprocessDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = parseInput(documentIdSchema, req.params);

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
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = parseInput(documentIdSchema, req.params);

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
    } catch (error) {
      next(error);
    }
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
