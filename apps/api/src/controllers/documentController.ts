import type { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Document } from "../models/Document";
import { AppError } from "../errors/AppError";
import { AuditEvent } from "../models/AuditEvent";
import { recordAudit } from "../services/audit/recordAudit";
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

      const user = currentUser(req);
      const created = await Document.create({
        fileName: req.file.originalname,
        organizationId: user.organizationId,
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
      await recordAudit({
        organizationId: user.organizationId,
        documentId: String(created._id),
        userId: user.id,
        action: "created",
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
      const user = currentUser(req);
      const query = parseInput(listDocumentsQuerySchema, req.query);
      const filter: Record<string, unknown> = {
        organizationId: user.organizationId,
      };
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
          .select("-rawExtraction")
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

  static async getAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const user = currentUser(req);
      const { id } = parseInput(documentIdSchema, req.params);
      const document = await Document.findOne({
        _id: id,
        organizationId: user.organizationId,
      }).select("_id");
      if (!document) {
        return res.status(404).json({
          success: false,
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found.",
        });
      }
      const events = await AuditEvent.find({
        documentId: id,
        organizationId: user.organizationId,
      }).sort({ createdAt: -1 });
      return res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  static async viewOriginal(req: Request, res: Response, next: NextFunction) {
    try {
      const user = currentUser(req);
      const { id } = parseInput(documentIdSchema, req.params);

      const document = await Document.findOne({
        _id: id,
        organizationId: user.organizationId,
      });

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
      const user = currentUser(req);
      const { id } = parseInput(documentIdSchema, req.params);
      const updates = parseInput(updateDocumentSchema, req.body);

      const existingDoc = await Document.findOne({
        _id: id,
        organizationId: user.organizationId,
      });

      if (!existingDoc) {
        return res.status(404).json({
          success: false,
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found.",
        });
      }

      const before = existingDoc.toObject();
      const dataForValidation = {
        ...existingDoc.toObject(),
        ...updates,
      };

      delete (dataForValidation as any).status;

      const validationIssues = await validateDocument(
        dataForValidation as ExtractedData,
        {
          currentDocumentId: id,
          findDuplicate: mongoDuplicateLookup(user.organizationId),
        },
      );

      const finalStatus = updates.status ?? statusForIssues(validationIssues);

      existingDoc.set({
        ...updates,
        validationIssues,
        status: finalStatus,
      });

      const savedDoc = await existingDoc.save();
      const action =
        updates.status === "validated"
          ? "confirmed"
          : updates.status === "rejected"
            ? "rejected"
            : "edited";
      await recordAudit({
        organizationId: user.organizationId,
        documentId: id,
        userId: user.id,
        action,
        changes: fieldChanges(before, savedDoc.toObject()),
      });

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
      const user = currentUser(req);
      const { id } = parseInput(documentIdSchema, req.params);

      const document = await Document.findOne({
        _id: id,
        organizationId: user.organizationId,
      });
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
      await recordAudit({
        organizationId: user.organizationId,
        documentId: id,
        userId: user.id,
        action: "reprocessed",
      });

      return res.status(202).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = currentUser(req);
      const { id } = parseInput(documentIdSchema, req.params);

      const deletedDoc = await Document.findOneAndDelete({
        _id: id,
        organizationId: user.organizationId,
      });

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

      await recordAudit({
        organizationId: user.organizationId,
        documentId: id,
        userId: user.id,
        action: "deleted",
      });

      return res.json({
        success: true,
        data: deletedDoc,
      });
    } catch (error) {
      next(error);
    }
  }
}

const TRACKED_FIELDS = [
  "documentType",
  "supplierName",
  "documentNumber",
  "issueDate",
  "dueDate",
  "currency",
  "subtotal",
  "tax",
  "total",
] as const;

function currentUser(req: Request) {
  if (!req.user) {
    throw new AppError("Sign in required.", 401, "UNAUTHENTICATED");
  }
  return req.user;
}

function fieldChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of TRACKED_FIELDS) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      changes[field] = { from: before[field], to: after[field] };
    }
  }
  return changes;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
