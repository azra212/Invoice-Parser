import { TxtParser } from "../parsers/txtParser";
import { isCsvFile } from "./csvProvider";
import type { ExtractionInput, ExtractionProvider } from "./types";

export function isTxtFile(
  input: Pick<ExtractionInput, "mimeType" | "fileName">,
) {
  if (isCsvFile(input)) return false;
  return (
    input.mimeType === "text/plain" ||
    input.fileName.toLowerCase().endsWith(".txt")
  );
}

export const txtProvider: ExtractionProvider = {
  id: "txt",
  supports: isTxtFile,
  async extract(input) {
    return {
      providerId: "txt",
      model: null,
      output: TxtParser.extractData(input.fileBuffer),
    };
  },
};
