import { AppError } from "../../errors/AppError";

export class InvalidExtractionError extends AppError {
  constructor(
    message = "Extraction did not match the document schema.",
    code = "EXTRACTION_INVALID",
  ) {
    super(message, 502, code);
  }
}
