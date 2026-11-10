export type StoredFile = {
  key: string;
  originalName: string;
  mimeType: string;
};

export type StoredBody = {
  body: Buffer;
  mimeType: string;
};

export interface FileStorage {
  put(input: {
    body: Buffer;
    originalName: string;
    mimeType: string;
  }): Promise<StoredFile>;
  read(key: string): Promise<StoredBody | null>;
  delete(key: string): Promise<void>;
}

export function safeFileName(originalName: string): string {
  const base = originalName.split(/[/\\]/).pop() ?? "document";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || "document";
}

export function assertSafeKey(key: string): void {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    throw new Error("Invalid storage key.");
  }
}
