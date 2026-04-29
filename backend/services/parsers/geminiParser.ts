import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../../models/documentTypes";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API KEY:", apiKey);
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error(
        "GEMINI_API_KEY is missing or invalid in your .env file.",
      );
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export class GeminiParser {
  static async extractData(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<ExtractedData> {
    const ai = getAI();
    const isText =
      mimeType === "text/plain" ||
      mimeType === "text/csv" ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".txt");

    const contents: any[] = [];

    if (isText) {
      contents.push({
        text: `DATA CONTENT OF ${fileName}:\n${fileBuffer.toString("utf-8")}`,
      });
    } else {
      contents.push({
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType:
            mimeType === "application/pdf" ? "application/pdf" : mimeType,
        },
      });
    }

    contents.push({
      text: `Extract structured data from this document.

Return ONLY valid JSON.

Required fields:
- documentType: "invoice" or "purchase_order"
- supplierName
- documentNumber
- issueDate - ISO standard
- dueDate -  ISO standard
- currency
- lineItems
- subtotal
- tax
- total

Important rules:
- issueDate is the document creation / invoice date.
- dueDate is the payment deadline. If missing, return null.
- currency must be a separate ISO-style code like EUR, USD, BAM, GBP, or other currency code you detected.
- total must be a number only, without currency symbols.
- subtotal, tax, and total must be numbers only, without currency symbols.
- If a field is missing, make sure to NOT return it in the JSON response.
- Do not invent values.
`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: {
              type: Type.STRING,
              enum: ["invoice", "purchase_order"],
            },
            supplierName: { type: Type.STRING },
            documentNumber: { type: Type.STRING },
            issueDate: {
              type: Type.STRING,
              description: "ISO date format YYYY-MM-DD",
            },
            dueDate: {
              type: Type.STRING,
              description: "ISO date format YYYY-MM-DD",
            },
            currency: { type: Type.STRING },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  amount: { type: Type.NUMBER },
                },
                required: ["description", "quantity", "unitPrice", "amount"],
              },
            },
            subtotal: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
          },
          required: [
            "documentType",
            "supplierName",
            "documentNumber",
            "issueDate",
            "currency",
            "lineItems",
            "subtotal",
            "tax",
            "total",
          ],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as ExtractedData;
  }
}
