import type { Env } from "../../config/env";
import type { FileStorage } from "./fileStorage";
import { LocalFileStorage } from "./localFileStorage";
import { S3FileStorage } from "./s3FileStorage";

export function createStorage(env: Env): FileStorage {
  if (env.S3_BUCKET) return new S3FileStorage(env);
  return new LocalFileStorage(env.UPLOAD_DIR);
}
