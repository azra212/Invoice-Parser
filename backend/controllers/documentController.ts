import { Request, Response } from "express";
import { DocumentProcessor } from "../services/documentProcessor";
import fs from "fs";
import { Document } from "../models/Document";
import { DocumentValidator } from "../services/validators/documentValidator";

export class DocumentController {
  // upload route in documentRoutes.ts calls this function when a file is uploaded. It processes the file and returns the result.
  static async uploadDocument(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileBuffer = fs.readFileSync(req.file.path);
      const processedDoc = await DocumentProcessor.process(
        fileBuffer,
        req.file.mimetype,
        req.file.originalname,
      );

      // Cleanup temp file
      fs.unlinkSync(req.file.path);

      res.status(201).json({
        success: true,
        data: processedDoc,
      });
    } catch (error: any) {
      console.error("Upload/Process Error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get route in documentRoutes.ts calls this function to fetch all documents from the database and return them in the response.
  static async getDocuments(req: Request, res: Response) {
    try {
      const documents = await Document.find().sort({ createdAt: -1 });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: "Failed to fetch documents",
        },
      });
    }
  }

  // Patch route in documentRoutes.ts calls this function to update a specific document based on the provided ID and update data in
  // the request body.
  static async updateDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id || id === "undefined") {
        return res.status(400).json({
          success: false,
          error: { message: "Invalid document ID" },
        });
      }

      // 1. Get existing document
      const existingDoc = await Document.findById(id);

      if (!existingDoc) {
        return res.status(404).json({
          success: false,
          error: { message: "Document not found" },
        });
      }

      // 2. Merge updates with existing data
      // 2. Merge ONLY data fields (exclude status)
      const dataForValidation = {
        ...existingDoc.toObject(),
        ...updates,
      };

      // remove status from validation input
      delete (dataForValidation as any).status;

      // 3. Re-run validation
      const validationIssues = DocumentValidator.validate(dataForValidation);

      const hasErrors = validationIssues.some((i) => i.severity === "error");

      // 4. Decide final status
      let finalStatus;

      if (updates.status) {
        // USER override ALWAYS wins
        finalStatus = updates.status;
      } else {
        finalStatus = hasErrors ? "needs_review" : "validated";
      }

      // 5. Update document
      existingDoc.set({
        ...updates,
        validationIssues,
        status: finalStatus,
      });

      // 5. Save
      const savedDoc = await existingDoc.save();

      res.json({
        success: true,
        data: savedDoc,
      });
    } catch (error: any) {
      console.error("Update error:", error);

      res.status(500).json({
        success: false,
        error: { message: "Failed to update document" },
      });
    }
  }

  // documentController.ts

  static async deleteDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id || id === "undefined") {
        return res.status(400).json({
          success: false,
          error: { message: "Invalid document ID" },
        });
      }

      const deletedDoc = await Document.findByIdAndDelete(id);

      if (!deletedDoc) {
        return res.status(404).json({
          success: false,
          error: { message: "Document not found" },
        });
      }

      res.json({
        success: true,
        data: deletedDoc,
      });
    } catch (error: any) {
      console.error("Delete error:", error);

      res.status(500).json({
        success: false,
        error: { message: "Failed to delete document" },
      });
    }
  }
}
