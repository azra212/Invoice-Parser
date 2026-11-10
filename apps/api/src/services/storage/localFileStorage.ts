import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import {
  assertSafeKey,
  safeFileName,
  type FileStorage,
  type StoredFile,
} from "./fileStorage";

const defaultRoot = path.resolve(
  fileURLToPath(new URL("../../../uploads", import.meta.url)),
);

export class LocalFileStorage implements FileStorage {
  constructor(private readonly root = defaultRoot) {}

  async put(input: {
    body: Buffer;
    originalName: string;
    mimeType: string;
  }): Promise<StoredFile> {
    await fs.mkdir(this.root, { recursive: true });
    const storedName = `${Date.now()}-${randomUUID()}-${safeFileName(input.originalName)}`;
    const key = `uploads/${storedName}`;
    await fs.writeFile(path.join(this.root, storedName), input.body);
    return {
      key,
      originalName: input.originalName,
      mimeType: input.mimeType,
    };
  }

  async read(key: string) {
    assertSafeKey(key);
    const filePath = this.resolve(key);
    try {
      const body = await fs.readFile(filePath);
      return { body, mimeType: mimeFromName(filePath) };
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  }

  async delete(key: string) {
    assertSafeKey(key);
    await fs.rm(this.resolve(key), { force: true });
  }

  private resolve(key: string) {
    const relative = key.startsWith("uploads/")
      ? key.slice("uploads/".length)
      : key;
    return path.join(this.root, relative);
  }
}

function mimeFromName(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".csv") return "text/csv";
  if (extension === ".txt") return "text/plain";
  return "application/octet-stream";
}

function isMissing(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
