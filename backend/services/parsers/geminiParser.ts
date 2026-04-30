import { AppError } from "../../errors/AppError";
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../../models/documentTypes";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new AppError(
        "AI extraction is not configured. Please add a valid Gemini API key.",
        503,
        "AI_NOT_CONFIGURED",
      );
    }

    aiInstance = new GoogleGenAI({ apiKey });
  }

  return aiInstance;
}

const nullableString = {
  anyOf: [{ type: Type.STRING }, { type: Type.NULL }],
};

const nullableNumber = {
  anyOf: [{ type: Type.NUMBER }, { type: Type.NULL }],
};

const nullableDocumentType = {
  anyOf: [
    {
      type: Type.STRING,
      enum: ["invoice", "purchase_order"],
    },
    { type: Type.NULL },
  ],
};

export class GeminiParser {
  static async extractData(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<ExtractedData> {
    const ai = getAI();

    const lowerFileName = fileName.toLowerCase();

    const isText =
      mimeType === "text/plain" ||
      mimeType === "text/csv" ||
      lowerFileName.endsWith(".csv") ||
      lowerFileName.endsWith(".txt");

    const contents: any[] = [];

    if (isText) {
      contents.push({
        text: `SOURCE FILE NAME: ${fileName}

SOURCE FILE CONTENT:
${fileBuffer.toString("utf-8")}`,
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
      text: `You are a strict data extraction engine.

Return ONLY valid JSON matching the schema.

Critical rules:
- Extract only text or values explicitly visible in the document.
- Do not guess.
- Do not infer.
- Do not estimate.
- Do not fill missing fields using examples, common invoice patterns, filenames, or prior knowledge.
- If a value is not explicitly present, return null.
- If a value is ambiguous or unclear, return null.
- Do not invent supplier names.
- Do not invent document numbers.
- Do not invent issue dates or due dates.
- Do not invent currency.
- Do not invent subtotal, tax, or total.
- Do not assume the document type unless the document clearly says invoice or purchase order.
- Do not use the source file name as a document number.
- Do not use today's date.
- Do not calculate document-level subtotal, tax, or total unless those values are explicitly labeled in the document.
- A table column called "total" is not automatically the document total.
- If the file only contains line items, extract the line items and return null for missing document metadata.
- The document may be written in a language other than English.
- Translate field labels as needed to understand and extract the data.
- Return all JSON field names exactly as specified in English.
- Return documentType only as "invoice", "purchase_order", or null.
- Keep supplier/company names exactly as written unless they are clearly transliterated.
- Return line item descriptions as stated in the document, without translation. 
- Do not treat unfamiliar foreign-language text as missing unless you truly cannot identify the value.
- Understand common invoice tax labels in other languages.

Date rules:
- Dates must be returned as YYYY-MM-DD.
- Only return a date if the full date is explicitly present.
- If only a month/year or partial date is present, return null.
- If the date format is ambiguous, return null.

Line item rules:
- Extract line items only from actual rows in an item/product/service table.
- Do not treat table headers as line items.
- For each line item field, return null if missing.
- It is allowed for lineItems to be an empty array.

Expected JSON shape:
{
  "documentType": "invoice" | "purchase_order" | null,
  "supplierName": string | null,
  "documentNumber": string | null,
  "issueDate": string | null,
  "dueDate": string | null,
  "currency": string | null,
  "lineItems": [
    {
      "description": string | null,
      "quantity": number | null,
      "unitPrice": number | null,
      "amount": number | null
    }
  ],
  "subtotal": number | null,
  "tax": number | null,
  "total": number | null
}`,
    });

    let response;

    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentType: nullableDocumentType,
              supplierName: nullableString,
              documentNumber: nullableString,
              issueDate: nullableString,
              dueDate: nullableString,
              currency: nullableString,
              lineItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: nullableString,
                    quantity: nullableNumber,
                    unitPrice: nullableNumber,
                    amount: nullableNumber,
                  },
                  required: ["description", "quantity", "unitPrice", "amount"],
                },
              },
              subtotal: nullableNumber,
              tax: nullableNumber,
              total: nullableNumber,
            },
            required: [
              "documentType",
              "supplierName",
              "documentNumber",
              "issueDate",
              "dueDate",
              "currency",
              "lineItems",
              "subtotal",
              "tax",
              "total",
            ],
          },
        },
      });
    } catch (err: any) {
      const message = String(err?.message ?? "");

      if (
        err?.status === 429 ||
        message.includes("RESOURCE_EXHAUSTED") ||
        message.includes("prepayment credits are depleted")
      ) {
        throw new AppError(
          "AI extraction is currently unavailable because Gemini credits are depleted. CSV and TXT files can still be processed without AI.",
          503,
          "AI_CREDITS_DEPLETED",
        );
      }

      if (
        message.includes("GEMINI_API_KEY") ||
        message.includes("API key") ||
        message.includes("API_KEY")
      ) {
        throw new AppError(
          "AI extraction is not configured correctly. Please check the Gemini API key.",
          503,
          "AI_NOT_CONFIGURED",
        );
      }

      throw new AppError(
        "AI extraction failed. Please try again or upload a CSV/TXT file that can be processed without AI.",
        502,
        "AI_EXTRACTION_FAILED",
      );
    }

    let result: any;

    try {
      result = JSON.parse(response.text || "{}");
    } catch {
      throw new AppError(
        "AI extraction returned an invalid response. Please try again.",
        502,
        "AI_INVALID_RESPONSE",
      );
    }

    return {
      documentType: result.documentType ?? null,
      supplierName: result.supplierName ?? null,
      documentNumber: result.documentNumber ?? null,
      issueDate: result.issueDate ?? null,
      dueDate: result.dueDate ?? null,
      currency: result.currency ?? null,
      lineItems: Array.isArray(result.lineItems) ? result.lineItems : [],
      subtotal: result.subtotal ?? null,
      tax: result.tax ?? null,
      total: result.total ?? null,
    } as ExtractedData;
  }
}
