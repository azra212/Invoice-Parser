import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import {
  processJobId,
  type JobQueue,
  type ProcessDocumentJob,
} from "./jobQueue";

export class BullJobQueue implements JobQueue {
  private readonly connection: IORedis;
  private readonly queue: Queue<ProcessDocumentJob>;
  private worker: Worker<ProcessDocumentJob> | null = null;

  constructor(redisUrl: string) {
    this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue<ProcessDocumentJob>("process-document", {
      connection: this.connection,
    });
  }

  async enqueue(job: ProcessDocumentJob): Promise<void> {
    try {
      await this.queue.add("process-document", job, {
        jobId: processJobId(job),
        removeOnComplete: 100,
        removeOnFail: 100,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!/already exists|Job is already waiting/i.test(message)) {
        throw error;
      }
    }
  }

  start(handler: (job: ProcessDocumentJob) => Promise<void>): void {
    this.worker = new Worker<ProcessDocumentJob>(
      "process-document",
      async (bullJob) => {
        await handler(bullJob.data);
      },
      { connection: this.connection.duplicate() },
    );
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    await this.queue.close();
    await this.connection.quit();
  }
}
