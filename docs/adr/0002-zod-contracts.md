# 0002 Zod is the contract

Document, line item, and validation issue shapes used to be a TypeScript interface in the API and a Mongoose schema written by hand. The UI imported the interface. Nothing checked JSON at runtime.

`@invoice-parser/shared` now owns the Zod schemas. Both apps import types with `z.infer`. Gemini's response schema is generated from the same model schema. Model output is normalized and then `safeParse`d. A failed parse is an error, not a partial document.

Mongoose still stores the document. It is not the source of the shape. When the API and the UI disagree, the schema is what gets fixed.
