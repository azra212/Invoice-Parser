# 0003 Extraction providers

CSV, TXT, and Gemini each implement `ExtractionProvider`. The processor asks which provider supports the file. Adding another engine is a new class, not another branch in the upload handler.

Gemini receives a JSON Schema built from Zod, with a 30 second timeout and up to three transport attempts. Authentication failures are not retried. Invalid JSON or a schema mismatch gets one extra model call. The raw payload is stored on the document. Confidence is stored beside the fields. Deterministic parsers set confidence to 1 only for values they actually read.

The model is not asked to validate totals. That stays in the rules.
