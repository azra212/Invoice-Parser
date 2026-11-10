import { CsvParser } from "../parsers/csvParser";
import type { ExtractionInput, ExtractionProvider } from "./types";

export function isCsvFile(
  input: Pick<ExtractionInput, "mimeType" | "fileName">,
) {
  return (
    input.mimeType === "text/csv" ||
    input.fileName.toLowerCase().endsWith(".csv")
  );
}

export const csvProvider: ExtractionProvider = {
  id: "csv",
  supports: isCsvFile,
  async extract(input) {
    return {
      providerId: "csv",
      model: null,
      output: CsvParser.extractData(input.fileBuffer),
    };
  },
};
