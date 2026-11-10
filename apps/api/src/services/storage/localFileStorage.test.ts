import fs from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { LocalFileStorage } from "./localFileStorage";

describe("LocalFileStorage", () => {
  it("stores, reads, and deletes a file", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "invoice-uploads-"));
    const storage = new LocalFileStorage(root);

    const stored = await storage.put({
      body: Buffer.from("Invoice TXT-1\nTotal: 10 EUR"),
      originalName: "Invoice TXT-1.txt",
      mimeType: "text/plain",
    });

    const read = await storage.read(stored.key);
    expect(read?.body.toString("utf8")).toContain("Invoice TXT-1");
    expect(stored.key.startsWith("uploads/")).toBe(true);

    await storage.delete(stored.key);
    expect(await storage.read(stored.key)).toBeNull();
    await fs.rm(root, { recursive: true, force: true });
  });

  it("rejects keys that leave the upload directory", async () => {
    const storage = new LocalFileStorage(os.tmpdir());
    await expect(storage.read("../secrets.txt")).rejects.toThrow(
      /Invalid storage key/,
    );
  });
});
