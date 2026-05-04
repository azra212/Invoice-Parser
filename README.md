# Smart Document Processing System

A full-stack app for uploading, extracting, validating, reviewing, and managing business documents such as invoices and purchase orders.

**Live demo:** https://invoice-parser-9xqd.onrender.com/

> Note: The app is hosted on Render’s free tier, so the first request may take a little while if the server has been idle.

## Tech Stack

- React + Vite
- Chakra UI
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Google Gemini

## What It Does

The app supports document ingestion, extraction, validation, review, and persistence.

Supported file types:

- PDF
- PNG / JPG / JPEG
- CSV
- TXT

Processing flow:

```txt
Upload → Extract → Normalize → Validate → Store → Review
```

## Core Features

- Upload invoices and purchase orders
- Extract document type, supplier, document number, dates, currency, line items, subtotal, tax, and total
- Validate required fields, dates, totals, line item calculations, and duplicate document numbers
- Highlight validation issues in the review interface
- Edit extracted data manually and re-run validation
- Confirm, reject, or delete documents
- Store processed documents in MongoDB
- View previously processed documents in the dashboard
- Display document statuses and detected issues

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
  "success": true,
  "data": [
    {
      "_id": "69f8b939d783b886c78ad261",
      "fileName": "Invoice TXT-1047.txt",
      "originalFile": {
        "originalName": "Invoice TXT-1047.txt",
        "storedName": "1777908025339-Invoice TXT-1047.txt",
        "path": "backend\\uploads\\1777908025339-Invoice TXT-1047.txt",
        "mimeType": "text/plain"
      },
      "documentType": "invoice",
      "supplierName": "Northstar Digital Services Ltd.",
      "documentNumber": "TXT-1047",
      "issueDate": "2025-03-14",
      "dueDate": "2025-04-13",
      "currency": "EUR",
      "lineItems": [
        {
          "description": "Website maintenance - March",
          "quantity": 12,
          "unitPrice": 45,
          "amount": 540,
          "_id": "69f8b951d783b886c78ad277"
        }
      ],
      "subtotal": 1100,
      "tax": 220,
      "total": 1310,
      "validationIssues": [
        {
          "field": "total",
          "message": "Total calculation error. Subtotal (1100) + Tax (220) = 1320, which differs from Total (1310).",
          "severity": "error",
          "_id": "69f8b954d783b886c78ad285"
        }
      ],
      "status": "needs_review",
      "createdAt": "2026-05-04T15:20:25.538Z",
      "updatedAt": "2026-05-04T15:20:52.401Z",
      "__v": 2
    }
  ]
}
```

## Document Statuses

| Status         | Meaning                                              |
| -------------- | ---------------------------------------------------- |
| `uploaded`     | Document was uploaded                                |
| `needs_review` | Validation issues were found                         |
| `validated`    | Document passed validation or was manually confirmed |
| `rejected`     | Document was manually rejected                       |

## API Endpoints

| Method   | Endpoint                     | Description                       |
| -------- | ---------------------------- | --------------------------------- |
| `POST`   | `/api/documents/upload`      | Upload and process a document     |
| `GET`    | `/api/documents`             | Get all processed documents       |
| `PATCH`  | `/api/documents/:id`         | Update and re-validate a document |
| `DELETE` | `/api/documents/:id`         | Delete a document                 |
| `GET`    | `api/documents/:id/original` | Get original file info            |

## Setup

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Run tests:

```bash
npm run test
```

Build for production:

```bash
npm run build
```

## Validation Approach

AI is used for extraction from PDFs and images. CSV and TXT files are parsed with deterministic logic.

Validation is handled by application code, not by AI. The validation engine checks:

- Missing required fields
- Invalid dates
- Incorrect subtotal, tax, and total values
- Incorrect line item calculations
- Duplicate document numbers

## AI Tools Used

Google Gemini is used to extract structured data from PDF and image documents. The extracted data is then normalized and validated by deterministic backend logic.
ChatGPT basic mode was used during development for file-by-file logic review, implementation help, and iterative improvements. The project was reviewed in parts by uploading zipped versions of the app, checking the code, improving it, and then copying the changes back into the project.

## Tests

The project includes basic tests for deterministic parts of the system, including parsing, normalization, required fields, totals, dates, and line item validation.
Gemini API calls are not unit tested because they depend on an external service.

## Future Improvements

- Finalize a document once it is Validated, preventing future edits
- Use OCR as the first extraction step for simpler PDFs and images, and fall back to AI only for messy or poorly structured documents. This would reduce token usage and lower processing costs.
- Add authentication
- Add API documentation
- Add Docker setup
- Add queue-based processing for large files
- Improve OCR handling for messy scanned documents
- Support multiple file uploads
