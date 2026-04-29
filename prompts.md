I’m building a Smart Document Processing System as a take-home project using a MERN-style stack:

Frontend: React + Vite + Chakra UI
Backend: Node.js + Express + TypeScript
Database: MongoDB (Mongoose)
Current functionality

The system supports a full pipeline:

Upload → Parse → Extract → Validate → Store → Review → Update
Implemented features:
File upload (CSV, TXT, optional PDF/image)
AI-based extraction using Gemini (structured JSON output)
Manual validation engine (totals, dates, line items, required fields)
MongoDB persistence (no in-memory storage anymore)
Document status workflow:
uploaded
needs_review
validated
rejected
API endpoints:
POST /api/documents/upload
GET /api/documents
PATCH /api/documents/:id (update + revalidate)
Frontend dashboard:
list documents
show status + validation issues
review panel
manual validation/rejection
Important design decisions:
Validation is manual logic, not AI-driven
AI (Gemini) is used only for extraction
MongoDB is used for flexible document structure
Status can be manually overridden by user (even if validation errors exist)
Current state
End-to-end pipeline works
MongoDB fully integrated
Update + revalidation works
Frontend connected and functional
Next steps I want help with
Replace duplicate detection with MongoDB query (not in-memory)
Improve validation structure (possibly rule-based engine)
Fix AI edge cases (e.g. "null" strings vs actual nulls)
Clean API consistency across all endpoints
Improve frontend UX for validation vs manual override
Add basic tests (validators + parsers)
Polish README with architecture + tradeoffs + future improvements

I want guidance that is:

step-by-step
practical (code-first)
avoids overengineering
keeps this at strong junior → mid-level quality
