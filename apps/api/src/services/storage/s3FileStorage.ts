import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import type { Env } from "../../config/env";
import { assertSafeKey, safeFileName, type FileStorage } from "./fileStorage";

export class S3FileStorage implements FileStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(env: Env) {
    if (!env.S3_BUCKET) {
      throw new Error("S3_BUCKET is required for object storage.");
    }
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async put(input: { body: Buffer; originalName: string; mimeType: string }) {
    const key = `uploads/${Date.now()}-${randomUUID()}-${safeFileName(input.originalName)}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.mimeType,
      }),
    );
    return {
      key,
      originalName: input.originalName,
      mimeType: input.mimeType,
    };
  }

  async read(key: string) {
    assertSafeKey(key);
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) return null;
      return {
        body: Buffer.from(bytes),
        mimeType: result.ContentType ?? "application/octet-stream",
      };
    } catch (error) {
      if (error instanceof NoSuchKey || isMissing(error)) return null;
      throw error;
    }
  }

  async delete(key: string) {
    assertSafeKey(key);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}

function isMissing(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  return name === "NoSuchKey" || name === "NotFound";
}
