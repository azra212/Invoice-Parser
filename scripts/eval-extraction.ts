import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { extractDocument } from "../apps/api/src/services/extraction/extractDocument";
import { csvProvider } from "../apps/api/src/services/extraction/csvProvider";
import { txtProvider } from "../apps/api/src/services/extraction/txtProvider";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(root, "fixtures", "invoices");
const fields = [
  "documentType",
  "supplierName",
  "documentNumber",
  "issueDate",
  "dueDate",
  "currency",
  "lineItems",
  "subtotal",
  "tax",
  "total",
] as const;

type Expected = Record<(typeof fields)[number], unknown>;

function same(actual: unknown, expected: unknown) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

const files = fs
  .readdirSync(fixtureDir)
  .filter((name) => name.endsWith(".expected.json"));

let compared = 0;
let matched = 0;
let failed = false;

for (const expectedName of files) {
  const baseName = expectedName.replace(/\.expected\.json$/, "");
  const sourceName = fs.existsSync(path.join(fixtureDir, `${baseName}.txt`))
    ? `${baseName}.txt`
    : `${baseName}.csv`;
  const sourcePath = path.join(fixtureDir, sourceName);
  const expected = JSON.parse(
    fs.readFileSync(path.join(fixtureDir, expectedName), "utf8"),
  ) as Expected;
  const result = await extractDocument({
    input: {
      fileBuffer: fs.readFileSync(sourcePath),
      mimeType: sourceName.endsWith(".csv") ? "text/csv" : "text/plain",
      fileName: sourceName,
    },
    providers: [csvProvider, txtProvider],
  });

  let fileMatched = 0;
  for (const field of fields) {
    compared += 1;
    if (same(result.data[field], expected[field])) {
      matched += 1;
      fileMatched += 1;
    }
  }
  const accuracy = fileMatched / fields.length;
  console.log(
    `${sourceName}  ${Math.round(accuracy * 100)}%  (${fileMatched}/${fields.length})`,
  );
  if (accuracy < 1) failed = true;
}

const overall = compared === 0 ? 0 : matched / compared;
console.log(`Overall ${Math.round(overall * 100)}%  (${matched}/${compared})`);
if (failed || overall < 1) process.exit(1);
