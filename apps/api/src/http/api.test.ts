import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request, { type Agent } from "supertest";
import { parseEnv } from "../config/env";
import { createApp } from "../server";
import { processStoredDocument } from "../services/documentProcessor";
import { InMemoryQueue } from "../services/queue/inMemoryQueue";
import { configureRuntime } from "../services/runtime";
import { LocalFileStorage } from "../services/storage/localFileStorage";

const secret = "test-secret-value-16";
const badInvoice = `Invoice TXT-9
Supplier: Northstar Digital Services Ltd.
Invoice Number: TXT-9
Issue Date: 2025-03-14
Due Date: 2025-04-13
Currency: EUR
Description | Qty | Unit Price | Amount
Hosting | 2 | 50 | 100
Subtotal: 100
Tax: 20
Total: 90 EUR
`;

describe("HTTP API", () => {
  let mongo: MongoMemoryServer;
  let uploads: string;
  let releaseJob: (() => void) | undefined;
  let holdJobs = false;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    uploads = await fs.mkdtemp(path.join(os.tmpdir(), "invoice-api-"));
    const queue = new InMemoryQueue();
    configureRuntime({
      storage: new LocalFileStorage(uploads),
      queue,
    });
    queue.start(async (job) => {
      if (holdJobs) {
        await new Promise<void>((resolve) => {
          releaseJob = resolve;
        });
      }
      await processStoredDocument(job.documentId, job.attempt);
    });
    await mongoose.connect(mongo.getUri());
  }, 120_000);

  afterAll(async () => {
    holdJobs = false;
    releaseJob?.();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await mongoose.disconnect();
    await mongo.stop();
    await fs.rm(uploads, { recursive: true, force: true });
  });

  function app() {
    return createApp(
      parseEnv({
        NODE_ENV: "test",
        MONGO_URI: mongo.getUri(),
        JWT_SECRET: secret,
        CORS_ORIGINS: "http://localhost:5173",
      }),
    );
  }

  async function register(email: string) {
    const agent = request.agent(app());
    const response = await agent.post("/api/v1/auth/register").send({
      name: "Ada",
      email,
      password: "correct horse",
    });
    expect(response.status).toBe(201);
    return agent;
  }

  async function waitForStatus(agent: Agent, id: string) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await agent.get("/api/v1/documents");
      const document = response.body.data.find(
        (item: { _id: string }) => item._id === id,
      );
      if (document && !["uploaded", "processing"].includes(document.status)) {
        return document;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error("document was not processed");
  }

  it("reports health when MongoDB is connected", async () => {
    const response = await request(app()).get("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.body.mongo).toBe("up");
    expect(response.body.redis).toBe("disabled");
  });

  it("rejects document calls without a session", async () => {
    const response = await request(app()).get("/api/v1/documents");
    expect(response.status).toBe(401);
    expect(response.body.code).toBe("UNAUTHENTICATED");
  });

  it("processes a text invoice and hides it from another organisation", async () => {
    const owner = await register("owner@example.com");
    const other = await register("other@example.com");
    const uploaded = await owner
      .post("/api/v1/documents/upload")
      .attach("file", Buffer.from(badInvoice), {
        filename: "invoice.txt",
        contentType: "text/plain",
      });

    expect(uploaded.status).toBe(202);
    const id = uploaded.body.data._id as string;
    const processed = await waitForStatus(owner, id);
    expect(processed.status).toBe("needs_review");
    expect(
      processed.validationIssues.some(
        (issue: { code: string }) => issue.code === "totals.total",
      ),
    ).toBe(true);

    const foreign = await other.get("/api/v1/documents");
    expect(foreign.body.data).toEqual([]);
    const hidden = await other.get(`/api/v1/documents/${id}/original`);
    expect(hidden.status).toBe(404);
  });

  it("does not enqueue a second job while a reprocess is waiting", async () => {
    const owner = await register("reprocess@example.com");
    const uploaded = await owner
      .post("/api/v1/documents/upload")
      .attach("file", Buffer.from(badInvoice), {
        filename: "invoice.txt",
        contentType: "text/plain",
      });
    const id = uploaded.body.data._id as string;
    await waitForStatus(owner, id);

    holdJobs = true;
    const first = await owner.post(`/api/v1/documents/${id}/reprocess`);
    const second = await owner.post(`/api/v1/documents/${id}/reprocess`);
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(second.body.data.processingAttempt).toBe(
      first.body.data.processingAttempt,
    );
    holdJobs = false;
    releaseJob?.();
  });
});
