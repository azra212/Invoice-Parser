# Smart Document Processing System

A full-stack take-home project for uploading, extracting, validating, reviewing, and managing business documents such as invoices and purchase orders.

The system uses AI only for extraction from PDFs/images, while validation is handled by deterministic application logic.

## Tech Stack

- React + Vite
- Chakra UI
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Google Gemini

## Processing Flow

```txt
Upload → Extract → Normalize → Validate → Store → Review
```

## Supported Files

| File type    | Processing method    |
| ------------ | -------------------- |
| PDF          | Gemini               |
| PNG/JPG/JPEG | Gemini               |
| CSV          | Deterministic parser |
| TXT          | Deterministic parser |

## Core Features

- Upload business documents
- Extract invoice or purchase order data
- Normalize extracted fields
- Validate totals, dates, required fields, line items, and duplicate document numbers
- Store processed documents in MongoDB
- Review, edit, validate, reject, or delete documents
- Re-run validation after manual corrections

## Extracted Data

- Document type
- Supplier/company name
- Document number
- Issue date
- Due date
- Currency
- Line items
- Subtotal
- Tax
- Total

Example extracted JSON object:
```json
{
  "documentType": "invoice",
  "supplierName": "Acme Supplies",
  "documentNumber": "INV-1001",
  "issueDate": "2026-04-10",
  "dueDate": "2026-05-10",
  "currency": "USD",
  "lineItems": [
    {
      "description": "Office chairs",
      "quantity": 2,
      "unitPrice": 120,
      "amount": 240
    }
  ],
  "subtotal": 240,
  "tax": 24,
  "total": 264
}
```

## Document Statuses

| Status         | Meaning                                     |
| -------------- | ------------------------------------------- |
| `uploaded`     | Document was uploaded                       |
| `needs_review` | Validation issues found                     |
| `validated`    | Document passed validation or was confirmed |
| `rejected`     | Document was manually rejected              |

## API Endpoints

| Method   | Endpoint                | Description                     |
| -------- | ----------------------- | ------------------------------- |
| `POST`   | `/api/documents/upload` | Upload and process document     |
| `GET`    | `/api/documents`        | Get all documents               |
| `PATCH`  | `/api/documents/:id`    | Update and re-validate document |
| `DELETE` | `/api/documents/:id`    | Delete document                 |

## Setup

Create a `.env` file:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Install and run:

```bash
npm install
npm run dev
```

Run tests:

```bash
npm test
```

## Testing

Tests cover deterministic logic such as parsing, normalization, required fields, totals, dates, and line item validation.

Gemini calls are not unit tested because they depend on a third-party API.

## Current State

Implemented: upload, extraction, parsing, normalization, validation, MongoDB storage, dashboard, review panel, edit/delete support, status workflow, and basic tests.

Still to polish: live deployment, `.env.example`, View Original button.

## Future Improvements

- Use OCR as the first extraction step for simpler PDFs and images, and fall back to AI only for messy or poorly structured documents. This would reduce token usage and lower processing costs.
- Store original uploaded files
- Add authentication
- Add API documentation
- Add Docker setup
- Add queue-based processing for large files
- Improve OCR handling for messy scanned documents
- Allow multiple file uploads

Priority 1

Remove uploaded files from backend/uploads.
Change frontend imports to import type.
Type documents and selectedDoc.
Remove dead “Original” button or disable it.
Make upload/update status logic consistent.
Split format helpers into src/utils/formatters.ts.
Priority 2

Then:

Extract API calls into src/api/documentsApi.ts.
Extract DocumentTable from App.tsx.
Extract LineItemsEditor from DocumentReviewModal.tsx.
Extract ValidationIssuesBox.
Add file size limit to Multer.
Remove console logs.
Priority 3

Optional polish:

Refactor validator into simple rule functions.
Move shared types to shared/documentTypes.ts.
Add .env.example.
Add API response types.
Add tests for update status behavior.

7. Biggest “reviewer impression” risks

These are the things I would expect a reviewer to notice:

1. Huge frontend files

Not fatal, but easy to criticize.

2. any in frontend state

This weakens the TypeScript story.

3. Status inconsistency

A clean upload becomes uploaded, but a clean edit becomes validated.

4. Dead Original button

A visible button that only logs to console looks unfinished.

5. Uploaded files included in project zip

Even though .gitignore has uploads/, the zip includes uploaded files. Remove them.