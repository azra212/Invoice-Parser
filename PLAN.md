# Invoice Parser upgrade plan

Written after reading the repository at `0596052` (`main`). Implementation follows this document. Each phase is one pull request, kept runnable, and checked with lint, typecheck, and tests before the next phase starts. UI and manual testing are left to a human; every PR body includes manual steps.

## What the app is

Upload an invoice or purchase order (PDF, PNG/JPG, CSV, TXT). Extract structured fields. Normalize them. Validate them with deterministic rules. Store the result. Let a person review, edit, confirm, or reject it.

That purpose does not change. Statuses stay `uploaded`, `needs_review`, `validated`, and `rejected`, with two pipeline statuses added in phase 4 (`processing`, `failed`) because an async job needs them.

## Findings

### Layout and tooling

- One npm package named `react-example` (`private`, `version` `0.0.0`). No description, repository, or engines field.
- React 19 + Vite 6 UI in `src/`. Express API and the Vite dev middleware share `server.ts`. Production serves `dist/` from the same process. Render start script is `tsx server.ts`.
- TypeScript is not strict. `tsconfig.json` has no `strict`, and `lint` is only `tsc --noEmit`. No ESLint, Prettier, CI, Dockerfile, or `.env.example`.
- Frontend types are imported from `backend/models/documentTypes.ts`. There is no shared contract package.
- `metadata.json` is a Google AI Studio leftover (camera permission, capability list). Nothing in the app reads it.

### Dependencies that do not earn their place

Imported and used: React, Chakra UI v3, Emotion, Vite, Express, Mongoose, Multer, cors, dotenv, csv-parse, date-fns, `@google/genai`, lucide-react, tsx, vitest.

Declared and unused in application source:

- `firebase`
- `framer-motion` and `motion` (both)
- `tailwindcss`, `@tailwindcss/vite`, `autoprefixer` (`src/index.css` is only `@import "tailwindcss"`; every screen is Chakra)
- `pdf-parse` (PDFs are sent to Gemini as bytes; nothing calls the parser)

`vite.config.ts` injects `GEMINI_API_KEY` into the client bundle via `define`. No UI code reads it. The key still ships to the browser.

### Domain model

`backend/models/documentTypes.ts` is a set of interfaces, not a runtime schema. Mongoose schemas in `backend/models/Document.ts` repeat the same shape by hand.

Extracted fields: document type (`invoice` | `purchase_order`), supplier, number, issue date, due date, currency, line items (description, quantity, unit price, amount), subtotal, tax, total.

Validation issues: `field`, `message`, `severity` (`error` | `warning`).

Original file: original name, stored name, local path, MIME type. Multer writes to `backend/uploads/` with a 10 MB limit and an extension allow-list (not a MIME check).

### Processing

`DocumentProcessor.process` runs inside the upload request.

- CSV and TXT use deterministic parsers, then `normalizeExtractedData`.
- Everything else goes to `GeminiParser` (`gemini-3-flash-preview`) with a hand-written response schema and a strict prompt.
- Gemini output is `JSON.parse`d and cast. It is not checked with a schema. Raw model output is not stored.
- No timeout, retry, or provider interface.
- `AppError` exists and is used for AI failures. Controllers still catch locally and repeat the same JSON error shape. There is no error middleware.

### Validation

`DocumentValidator` is one class that checks totals (absolute 0.01 tolerance), dates, line-item math, and required fields. `DuplicateValidator` queries Mongo for the same document number only, ignoring supplier. No VAT sanity check. No currency minor units (JPY and three-decimal currencies use the same 0.01 tolerance). Duplicate detection is not unit-tested because it touches the database.

A clean document is stored as `uploaded`, not `validated`. The README says `validated` means the document passed validation or a person confirmed it. The code only sets `validated` when a person does. That mismatch is fixed in phase 3 for synchronous processing, then phase 4 reserves `uploaded` for "accepted, not finished".

### API and UI

Routes under `/api/documents`: upload, list, patch, delete, original file. `GET /api/health` returns `{ status: "ok" }` without checking Mongo.

No auth. Every caller sees every document. No audit trail.

The UI is a Chakra dashboard: stat cards, a table, a slide-over editor, validation messages, confirm / reject / delete. There is no preview of the original beside the fields (only a new tab), no field-level highlight, no keyboard review, no filters, search, or pagination, no export, and no dark mode. `confirm()` is used for delete.

### Tests

Vitest covers the normalizer, CSV parser, TXT parser, and part of `DocumentValidator`. Two tests sit outside their `describe` blocks and still run. No API tests, no fixtures with expected JSON, no eval script.

### Security and delivery smells

- Open CORS.
- No Helmet, rate limit, request id, or structured logs.
- No request-body validation. Patch writes the request body onto the Mongoose document.
- `viewOriginal` calls `findById` before rejecting an invalid id.
- Upload paths are local disk, so they disappear on Render redeploys and cannot move between instances.
- No env validation. Missing `MONGO_URI` becomes `mongoose.connect("")`.

## Decisions

These are the choices later phases implement. Short ADRs in `docs/adr` (phase 9) record the same decisions for a reader who will not open this file.

1. **npm workspaces**, not pnpm. The repo already has `package-lock.json`. Adding a second package manager is churn.
2. **Packages:** `apps/web`, `apps/api`, `packages/shared` (`@invoice-parser/shared`). Root package name becomes `invoice-parser`.
3. **Zod in `@invoice-parser/shared` is the contract.** API and UI import types via `z.infer`. Mongoose schemas follow that contract. Model output is parsed with Zod before it is trusted.
4. **One process still serves the built UI in production** until someone splits hosts. `npm start` keeps a Render web service working. Docker Compose (phase 8) runs web and API separately. Dev runs Vite and the API as two processes; Vite proxies `/api`.
5. **API runtime stays `tsx`.** A compiled `dist` server is not worth a second module-resolution setup. The web app is the artifact that is built. Phase 8 images use the same start path.
6. **Env is parsed at process start** in the API, not at import time, so unit tests can load validators without a database.
7. **BullMQ when `REDIS_URL` is set. An in-memory queue otherwise.** Compose always sets Redis. Local dev and unit tests do not require it. Uploads return after the file is stored and the job is enqueued. The in-memory adapter also returns before work runs.
8. **File storage is an interface.** Local disk in dev (`UPLOAD_DIR` or `apps/api/uploads`). S3-compatible storage when `S3_BUCKET` is set (AWS SDK, so R2 and MinIO work).
9. **Email and password, JWT in an httpOnly cookie**, plus `Authorization: Bearer` for tests. Each user gets a personal organisation. Documents and audit rows are scoped by organisation. OAuth is optional and not built.
10. **Polling for job status**, not SSE. The client refetches a document while it is `uploaded` or `processing`.
11. **Deterministic parsers are providers** next to Gemini, so the pipeline has one entry.
12. **Duplicate means same organisation + supplier + document number.** The same number from two suppliers is not a duplicate.
13. **Money comparisons use currency minor units** (0 for JPY/KRW, 3 for BHD/KWD/OMR, otherwise 2).
14. **Due date stays required**, matching today's validator, so phase 3 does not silently relax a rule a reviewer already saw.
15. **Clean extraction becomes `validated`.** Issues with severity `error` become `needs_review`. A person can still confirm or reject. `uploaded` means the file was accepted and is waiting. `processing` and `failed` are added in phase 4.

## Target layout

```text
apps/web/                 React, Vite, Chakra
apps/api/                 Express, processors, queue, storage
packages/shared/          Zod schemas and inferred types
fixtures/invoices/        Sample documents and expected JSON
scripts/eval-extraction.ts
docs/adr/
.github/workflows/ci.yml
docker-compose.yml
```

Root scripts: `dev`, `build`, `start`, `lint`, `format`, `typecheck`, `test`, `eval`.

## Shared contract (phase 1, extended later)

Phase 1 schemas match today's documents:

- `lineItemSchema`
- `extractedDataSchema`
- `validationIssueSchema`
- `documentStatusSchema`
- `originalFileSchema`
- `processedDocumentSchema`

Later phases extend them instead of inventing a second type:

- Phase 2: `fieldConfidence` map and `rawExtraction` on the stored document. A separate `modelExtractionSchema` is what Gemini must return. Confidence values are 0 to 1. Missing confidence stays null. Deterministic parsers set 1 only for values they actually read.
- Phase 3: optional `code` on a validation issue (`required.supplier`, `totals.mismatch`, …).
- Phase 4: statuses `processing` and `failed`. `originalFile.storageKey` replaces the assumption that `path` is a local disk path. Old `path` values still resolve for documents already stored.
- Phase 6: `organizationId` on documents. List responses omit `rawExtraction`. Detail responses include it.

## Phase 1 — Foundations

- Workspaces and the move above. Imports of `documentTypes` go through `@invoice-parser/shared`.
- Strict TypeScript: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noImplicitOverride`. `noUncheckedIndexedAccess` stays off (noisy in parsers; optional later).
- ESLint (flat config) and Prettier. `lint` runs ESLint. `typecheck` runs `tsc --noEmit` in each package.
- Remove unused dependencies and the Tailwind entry. Remove the Vite `GEMINI_API_KEY` define.
- Remove `metadata.json`.
- `.env.example` and `parseEnv()` (Zod). Required: `MONGO_URI`. Defaults: `PORT` 3000, `NODE_ENV` development, `CORS_ORIGINS` `http://localhost:5173`. `GEMINI_API_KEY` optional so CSV and TXT still run.
- `createApp(env)` does not listen. `start()` connects and listens. Production serves `apps/web/dist` when that folder exists.
- Upload directory resolved from `import.meta.url`, not the shell cwd.
- Existing unit tests move with the code and pass.
- README setup section updated so commands match the workspace. The product-page rewrite is phase 9.

Behavior of extraction, validation, and routes stays the same in this phase, including the current status bug. Strictness fixes that are required to compile (optional ids, unused parameters) are allowed.

## Phase 2 — Extraction quality

- `ExtractionProvider` with `id`, `supports`, and `extract`. Implementations: `gemini`, `csv`, `txt`. An orchestrator picks the provider. Adding another engine means a new class, not a new branch in the processor.
- Gemini response schema is produced from `modelExtractionSchema` (Zod JSON schema, adapted to the SDK's schema object if the SDK cannot take JSON Schema directly).
- The provider returns raw output. The orchestrator normalizes, then `safeParse`s. A failed parse is an error, never a partial document. One extra attempt is allowed when the failure is invalid JSON or a schema mismatch. Transport failures use exponential backoff (3 attempts), a per-attempt timeout (30s), and no retry on authentication errors.
- Persist `rawExtraction` (`provider`, `model`, `output`, `receivedAt`) and `fieldConfidence`.
- Unit tests: schema rejection, retry classification, JSON-schema generation, CSV/TXT confidence. Gemini HTTP is not called in tests.

## Phase 3 — Validation engine

Rule interface:

```ts
type ValidationRule = {
  id: string;
  validate: (doc: ExtractedData, ctx: ValidationContext) => ValidationIssue[] | Promise<ValidationIssue[]>;
};
```

`ValidationContext` carries currency rounding helpers and a `findDuplicate` function so rules stay pure in unit tests.

Rules, each with its own tests:

| Rule | Behavior |
| --- | --- |
| `requiredFields` | document type, supplier, number, issue date, currency, total, due date. Severity `error`. |
| `dateLogic` | ISO dates, due date on or after issue date. |
| `lineItemMath` | quantity × unit price versus amount, using currency rounding. Missing line fields stay warnings. A math mismatch is a warning, matching today. |
| `totals` | Sum of line amounts versus subtotal. Subtotal + tax versus total. Both errors. |
| `duplicateDocument` | Same supplier + number in the organisation. Skipped when either value is missing. Excludes the current document id. |
| `vatRate` | When subtotal and tax are present: negative tax or a rate above 30% is an error. A positive rate that is not within 0.5 percentage points of a common VAT rate (0, 5, 7, 8, 9, 10, 13, 15, 17, 18, 19, 20, 21, 23, 25, 27) is a warning. Zero tax is valid. |

Issues always include `field`, `severity`, `message`, and `code`.

Status after synchronous validation: any error → `needs_review`, otherwise → `validated`. Phase 4's worker uses the same helper.

## Phase 4 — Processing pipeline

- Upload stores the file, inserts a document with status `uploaded`, enqueues `process-document`, and returns 202 with the document. The request does not wait for Gemini.
- Worker: set `processing`, extract, normalize, validate, set `needs_review`, `validated`, or `failed`. Failures store a validation-style issue on the document and an error message. The worker does not throw away the file.
- Reprocess (`POST /documents/:id/reprocess`) increments an attempt, sets `uploaded`, and enqueues `process-document` with job id `doc:{id}:attempt:{n}`. If status is already `uploaded` or `processing`, the endpoint returns the current document and does not enqueue a second job.
- `GET /documents/:id` is the poll target.
- Storage interface as in decision 8. Delete removes the stored object.
- The UI polls while status is `uploaded` or `processing`, and shows `failed`. Full review redesign waits for phase 7.
- Queue and storage adapters have unit tests with fakes. The worker is tested with a fake provider.

## Phase 5 — API hardening

- Routes move to `/api/v1`. `/api/documents` and `/api/health` stay as aliases so the current Render health check and any old client keep working. The UI calls `/api/v1`.
- Central error middleware. `AppError` carries `statusCode`, `code`, and `message`. Unexpected errors become 500 with a generic message. The response body is `{ success: false, code, message, requestId }`.
- Zod on params, query, and JSON body. Upload: 10 MB, allowed MIME types and extensions (`application/pdf`, `image/png`, `image/jpeg`, `text/csv`, `text/plain`, plus the extensions already accepted). Reject mismatched extension and MIME.
- `helmet`, `express-rate-limit` (stricter on upload), CORS allow-list from `CORS_ORIGINS`, credentials enabled.
- `pino` and `pino-http`. Every log line and the `x-request-id` response header share an id. Health is quiet.
- `GET /api/v1/health` reports Mongo and Redis (`up`, `down`, or `disabled`). 503 when Mongo is down.
- `GET /api/v1/openapi.json` generated from the shared Zod schemas and the route contracts.
- List query: `status`, `q`, `page`, `limit`. The UI can keep loading the first page until phase 7.

## Phase 6 — Auth and multi-user

- `POST /api/v1/auth/register`, `login`, `logout`, `GET /auth/me`.
- Passwords with bcrypt (cost 12), minimum 8 characters. Email validated with Zod.
- JWT (HS256, 7 days) in httpOnly cookie `access_token`. Same token accepted as a bearer token.
- `JWT_SECRET` required, minimum 16 characters. Documented in `.env.example`. Render must set it or the process refuses to boot. That is intentional.
- Register creates an organisation. Documents created after this phase store `organizationId`. Queries filter on it. There is no migration of old rows: they have no organisation and will not appear. Deploy notes say so.
- Audit collection: organisation, document, user, action (`created`, `edited`, `confirmed`, `rejected`, `deleted`, `reprocessed`), optional field diff, timestamp. `GET /api/v1/documents/:id/audit`.
- A small sign-in / register screen so the app is usable. Phase 7 does not redesign it beyond sharing the theme.
- Confirm and reject record the user. Edits record a diff of extracted fields, not the raw file.

## Phase 7 — Review UX

- Side-by-side on wide screens: original preview (image, PDF iframe, or text) and the editable fields. Stacked on narrow screens.
- Fields with an error or warning get a visible outline and the message next to the field, not only in a list.
- Confidence under 0.6 is marked on the field.
- Keyboard: `c` confirm, `r` reject, `s` save corrections, `Esc` close, when the focus is not in an input. Shortcuts are visible in the panel.
- Dashboard: status filter, search (supplier and number), pagination, the existing status counts (including failed).
- Light and dark, with a toggle that persists. Restrained palette already in the app (paper, ink, one blue). No gradient hero, no glass, no decorative motion.
- Export validated documents (respecting the current filter) as CSV and JSON via `GET /api/v1/documents/export`.
- Labels, focus order, dialog semantics, and contrast that hold in both themes. Replace `confirm()` with an explicit confirm step.

## Phase 8 — Quality and delivery

- Vitest unit tests for rules, normalizer, parsers, queue idempotency, and storage fakes stay in CI.
- Supertest plus `mongodb-memory-server` for: health, auth, upload of a TXT fixture through the in-memory queue, cross-organisation isolation, validation issues on a bad fixture, reprocess idempotency.
- `fixtures/invoices/` holds invented documents only. `npm run eval` scores field accuracy against `*.expected.json`. Deterministic fixtures must score 100%. A live Gemini pass is behind `--live` and is not part of CI.
- GitHub Actions: install, lint, typecheck, test, build, eval.
- `Dockerfile` for the API (Node 22, runs `tsx`) and a web image (built assets, nginx, `/api` proxied to the API). `docker-compose.yml`: `api`, `web`, `mongo`, `redis`.
- `docs/deploy.md`: Render (single service using `npm start`, and the split layout) and Fly. Required env vars listed. No secrets.

## Phase 9 — Presentation

- README as a product page a reviewer can finish in a few minutes: problem, mermaid architecture, pipeline, how to run, how evals work, tests, roadmap.
- `docs/adr` with the decisions above, each about half a page.
- Screenshot placeholders under `docs/screenshots/` with filenames and a one-line caption. No fake images presented as real UI.
- `package.json` name, description, repository, engines, and private flag corrected at the root and in each workspace.

## Explicitly not built

Noted so they are not mistaken for missing scope:

- OAuth and SSO
- Server-sent events
- OCR-before-LLM fallback
- Multi-file upload
- Locking a validated document against later edits
- Email notifications or webhooks
- Automatic migration of pre-auth documents
- A compiled API bundle (`tsc` / `tsup`)

## Definition of done

- CI workflow is green (lint, typecheck, test, build, eval).
- Validators, the pipeline, and the API have automated tests.
- `npm run eval` passes on the fixtures.
- `docker compose up` starts API, web, MongoDB, and Redis.
- README explains the system on its own.
- Each phase has a PR with manual test steps.

## Manual test habit (every PR)

1. Copy `.env.example` to `.env` and fill `MONGO_URI` (and, once they exist, `GEMINI_API_KEY`, `REDIS_URL`, `JWT_SECRET`).
2. `npm install`, `npm run dev`.
3. Open `http://localhost:5173`.
4. Upload `fixtures` TXT/CSV once they exist; until then upload a small `.txt` invoice.
5. Exercise the endpoint or screen the phase changed.
6. `npm run lint`, `npm run typecheck`, `npm test`.
