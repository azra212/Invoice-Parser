# 📄 Smart Document Processing System

A full-stack application for extracting, validating, and managing structured data from business documents (invoices and purchase orders).

Built with a MERN-style architecture, the system focuses on **reliability, transparency, and practical use of AI**.

---

## 🚀 Features

### 📥 Document Processing Pipeline

End-to-end workflow:

```
Upload → Extract → Normalize → Validate → Store → Review → Update/Delete
```

---

### 📄 Multi-Format Support

- PDF and images (AI-based extraction)
- CSV and TXT (basic support, extensible)

---

### 🤖 AI-Powered Extraction

- Uses **Google Gemini (Flash)** for OCR + structured data extraction
- AI is used **only for extraction**, not validation
- Outputs normalized into a consistent schema

---

### ✅ Validation Engine (Deterministic)

Custom rule-based validation:

- Required fields (supplier, total, date, etc.)
- Arithmetic checks (subtotal + tax = total)
- Date validation (issue vs due date)
- Line item consistency

Validation produces:

- **errors** → require review
- **warnings** → optional review

---

### 🗄️ Persistent Storage

- MongoDB with Mongoose
- Flexible schema for semi-structured documents
- No in-memory storage

---

### 🔄 Document Lifecycle

Each document has a status:

- `uploaded`
- `needs_review`
- `validated`
- `rejected`

Users can:

- manually override status
- edit extracted fields
- re-run validation

---

### 🖥️ Frontend Dashboard

Built with **React + Chakra UI**:

- Document table (status, supplier, totals)
- Review panel with validation issues
- Manual validation / rejection
- Delete support (full CRUD)

---

## 🛠️ Architecture

### Backend (Node.js + Express + TypeScript)

```
/backend
  /controllers     → request handling (upload, get, update, delete)
  /services
    /parsers       → AI extraction (Gemini)
    /normalizers   → clean & standardize AI output
    /validators    → rule-based validation engine
    documentProcessor.ts → orchestrates pipeline
  /models          → Mongoose schemas & types
  /routes          → API endpoints
```

---

### Frontend (React + Vite + Chakra UI)

- Functional components + hooks
- Local state management (no external state library)
- REST API integration

---

## 📡 API Endpoints

| Method | Endpoint                | Description                  |
| ------ | ----------------------- | ---------------------------- |
| POST   | `/api/documents/upload` | Upload & process document    |
| GET    | `/api/documents`        | List all documents           |
| PATCH  | `/api/documents/:id`    | Update + revalidate document |
| DELETE | `/api/documents/:id`    | Delete document              |

---

## 🧠 Design Decisions

### 1. AI for Extraction Only

AI (Gemini) is used strictly for:

- OCR
- mapping document → structured JSON

Validation is handled deterministically to ensure:

- predictability
- debuggability
- consistency

---

### 2. Normalization Layer

AI output is cleaned before validation:

- `"null"` → `null`
- numeric strings → numbers
- currency separated from totals

This prevents downstream errors and keeps validation reliable.

---

### 3. Rule-Based Validation (Not AI)

Validation is implemented as explicit rules:

- easier to test
- easier to extend
- avoids hallucination issues

---

### 4. Manual Override Support

Users can mark documents as:

- validated
- rejected

even if validation issues exist.

This reflects real-world workflows.

---

### 5. MongoDB for Flexibility

Documents can vary in structure:

- optional fields
- inconsistent formats

MongoDB allows flexible schema while maintaining structure via Mongoose.

---

## ⚙️ Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in `/backend`:

```env
GEMINI_API_KEY=your_api_key_here
MONGO_URI=your_mongodb_connection
```

---

## 🚧 Future Improvements

- CSV/TXT deterministic parsers (reduce AI dependency)
- Duplicate detection using MongoDB queries
- Improved validation rule engine (config-driven)
- AI fallback provider (e.g. OpenAI)
- Better UX for validation vs manual override
- Unit tests for validators and parsers

---

## 📌 Summary

This project demonstrates:

- practical use of AI in a constrained role
- clean separation of concerns
- full CRUD document workflow
- handling of real-world messy data

---

## 📷 Screenshots (optional)

_Add screenshots here if needed._

---

## 🧑‍💻 Author

Built as a take-home project.
