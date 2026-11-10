export type ExtractionInput = {
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
};

export type ProviderExtraction = {
  providerId: string;
  model: string | null;
  output: unknown;
};

export interface ExtractionProvider {
  readonly id: string;
  supports(input: Pick<ExtractionInput, "mimeType" | "fileName">): boolean;
  extract(input: ExtractionInput): Promise<ProviderExtraction>;
}

export type GeminiGenerateRequest = {
  contents: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  >;
  model: string;
  schema: unknown;
  signal: AbortSignal;
};

export interface GeminiClient {
  generate(request: GeminiGenerateRequest): Promise<{ text: string }>;
}
