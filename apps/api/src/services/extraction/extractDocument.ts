import {
  modelExtractionSchema,
  type ExtractedData,
  type RawExtraction,
} from "@invoice-parser/shared";
import { AppError } from "../../errors/AppError";
import { normalizeExtractedData } from "../normalizers/documentNormalizer";
import { confidenceForKnownValues } from "./confidence";
import { csvProvider } from "./csvProvider";
import { InvalidExtractionError } from "./errors";
import { GeminiProvider } from "./geminiProvider";
import { txtProvider } from "./txtProvider";
import type { ExtractionInput, ExtractionProvider } from "./types";

export type ExtractionSuccess = {
  data: ExtractedData;
  fieldConfidence: Record<string, number>;
  rawExtraction: RawExtraction;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeConfidenceEntries(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const field = typeof entry.field === "string" ? entry.field.trim() : "";
    const confidence = readNumber(entry.confidence);
    if (!field || confidence === null) return [];
    return [{ field, confidence }];
  });
}

function acceptExtraction(
  provider: ExtractionProvider,
  output: unknown,
  model: string | null,
  receivedAt: string,
): ExtractionSuccess {
  if (!isRecord(output)) {
    throw new InvalidExtractionError(
      provider.id === "gemini"
        ? "AI extraction returned an invalid response. Please try again."
        : "Extraction did not match the document schema.",
      provider.id === "gemini" ? "AI_INVALID_RESPONSE" : "EXTRACTION_INVALID",
    );
  }

  const normalized = {
    ...normalizeExtractedData(output),
    fieldConfidence: normalizeConfidenceEntries(output.fieldConfidence),
  };
  const parsed = modelExtractionSchema.safeParse(normalized);

  if (!parsed.success) {
    throw new InvalidExtractionError(
      provider.id === "gemini"
        ? "AI extraction returned an invalid response. Please try again."
        : "Extraction did not match the document schema.",
      provider.id === "gemini" ? "AI_INVALID_RESPONSE" : "EXTRACTION_INVALID",
    );
  }

  const { fieldConfidence, ...data } = parsed.data;
  const confidence =
    provider.id === "gemini"
      ? Object.fromEntries(
          fieldConfidence.map((entry) => [entry.field, entry.confidence]),
        )
      : confidenceForKnownValues(data);

  return {
    data,
    fieldConfidence: confidence,
    rawExtraction: {
      provider: provider.id,
      model,
      output,
      receivedAt,
    },
  };
}

export function defaultProviders(): ExtractionProvider[] {
  return [csvProvider, txtProvider, new GeminiProvider()];
}

export async function extractDocument(options: {
  input: ExtractionInput;
  providers?: ExtractionProvider[];
  now?: () => Date;
}): Promise<ExtractionSuccess> {
  const providers = options.providers ?? defaultProviders();
  const provider = providers.find((candidate) =>
    candidate.supports(options.input),
  );

  if (!provider) {
    throw new AppError(
      "Unsupported file type. Please upload a PDF, image, CSV, or TXT file.",
      400,
      "UNSUPPORTED_FILE_TYPE",
    );
  }

  const schemaAttempts = provider.id === "gemini" ? 2 : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= schemaAttempts; attempt += 1) {
    const raw = await provider.extract(options.input);
    try {
      return acceptExtraction(
        provider,
        raw.output,
        raw.model,
        (options.now ?? (() => new Date()))().toISOString(),
      );
    } catch (error) {
      lastError = error;
      if (
        !(error instanceof InvalidExtractionError) ||
        attempt === schemaAttempts
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}
