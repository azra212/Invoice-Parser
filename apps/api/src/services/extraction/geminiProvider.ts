import { modelExtractionSchema } from "@invoice-parser/shared";
import { GoogleGenAI } from "@google/genai";
import { AppError } from "../../errors/AppError";
import { InvalidExtractionError } from "./errors";
import { toGeminiJsonSchema } from "./jsonSchema";
import { extractionPrompt } from "./prompt";
import {
  errorMessage,
  isAuthenticationError,
  isRetryableTransportError,
  withRetry,
} from "./retry";
import { isCsvFile } from "./csvProvider";
import { isTxtFile } from "./txtProvider";
import type {
  ExtractionInput,
  ExtractionProvider,
  GeminiClient,
  GeminiGenerateRequest,
} from "./types";

const responseSchema = toGeminiJsonSchema(modelExtractionSchema);

export class GeminiProvider implements ExtractionProvider {
  readonly id = "gemini";

  constructor(
    private readonly options: {
      apiKey?: string;
      model?: string;
      client?: GeminiClient;
      sleep?: (ms: number) => Promise<void>;
      attempts?: number;
      timeoutMs?: number;
    } = {},
  ) {}

  supports(input: Pick<ExtractionInput, "mimeType" | "fileName">): boolean {
    return !isCsvFile(input) && !isTxtFile(input);
  }

  async extract(input: ExtractionInput) {
    const apiKey =
      this.options.apiKey !== undefined
        ? this.options.apiKey
        : process.env.GEMINI_API_KEY;
    const model =
      this.options.model ||
      process.env.GEMINI_MODEL ||
      "gemini-3-flash-preview";

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new AppError(
        "AI extraction is not configured. Please add a valid Gemini API key.",
        503,
        "AI_NOT_CONFIGURED",
      );
    }

    const client = this.options.client ?? createGoogleClient(apiKey);
    let text: string;

    try {
      const response = await withRetry(
        (_attempt, signal) =>
          client.generate({
            contents: buildContents(input),
            model,
            schema: responseSchema,
            signal,
          }),
        {
          attempts: this.options.attempts ?? 3,
          timeoutMs: this.options.timeoutMs ?? 30_000,
          baseDelayMs: 250,
          shouldRetry: isRetryableTransportError,
          sleep: this.options.sleep,
        },
      );
      text = response.text;
    } catch (error) {
      throw mapGeminiFailure(error);
    }

    let output: unknown;
    try {
      output = JSON.parse(text || "");
    } catch {
      throw new InvalidExtractionError(
        "AI extraction returned an invalid response. Please try again.",
        "AI_INVALID_RESPONSE",
      );
    }

    return {
      providerId: this.id,
      model,
      output,
    };
  }
}

function createGoogleClient(apiKey: string): GeminiClient {
  const ai = new GoogleGenAI({ apiKey });

  return {
    async generate(request: GeminiGenerateRequest) {
      const response = await ai.models.generateContent({
        model: request.model,
        contents: request.contents,
        config: {
          abortSignal: request.signal,
          responseMimeType: "application/json",
          responseJsonSchema: request.schema,
        },
      });

      return { text: response.text ?? "" };
    },
  };
}

function buildContents(
  input: ExtractionInput,
): GeminiGenerateRequest["contents"] {
  const lowerFileName = input.fileName.toLowerCase();
  const isText =
    input.mimeType === "text/plain" ||
    input.mimeType === "text/csv" ||
    lowerFileName.endsWith(".csv") ||
    lowerFileName.endsWith(".txt");

  if (isText) {
    return [
      {
        text: `SOURCE FILE NAME: ${input.fileName}

SOURCE FILE CONTENT:
${input.fileBuffer.toString("utf-8")}`,
      },
      { text: extractionPrompt() },
    ];
  }

  return [
    {
      inlineData: {
        data: input.fileBuffer.toString("base64"),
        mimeType:
          input.mimeType === "application/pdf"
            ? "application/pdf"
            : input.mimeType,
      },
    },
    { text: extractionPrompt() },
  ];
}

function mapGeminiFailure(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const message = errorMessage(error);
  if (
    isAuthenticationError(error) ||
    message.includes("API key") ||
    message.includes("API_KEY")
  ) {
    return new AppError(
      "AI extraction is not configured correctly. Please check the Gemini API key.",
      503,
      "AI_NOT_CONFIGURED",
    );
  }

  if (
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("prepayment credits are depleted")
  ) {
    return new AppError(
      "AI extraction is currently unavailable because Gemini credits are depleted. CSV and TXT files can still be processed without AI.",
      503,
      "AI_CREDITS_DEPLETED",
    );
  }

  return new AppError(
    "AI extraction failed. Please try again or upload a CSV/TXT file that can be processed without AI.",
    502,
    "AI_EXTRACTION_FAILED",
  );
}
