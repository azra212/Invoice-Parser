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
