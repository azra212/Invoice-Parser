import {
  processJobId,
  type JobQueue,
  type ProcessDocumentJob,
} from "./jobQueue";

export class InMemoryQueue implements JobQueue {
  private readonly scheduled = new Set<string>();
  private handler: ((job: ProcessDocumentJob) => Promise<void>) | null = null;

  async enqueue(job: ProcessDocumentJob): Promise<void> {
    const id = processJobId(job);
    if (this.scheduled.has(id)) return;
    this.scheduled.add(id);
    setImmediate(() => {
      void this.handler?.(job);
    });
  }

  start(handler: (job: ProcessDocumentJob) => Promise<void>): void {
    this.handler = handler;
  }

  async stop(): Promise<void> {
    this.handler = null;
  }

  get scheduledIds(): string[] {
    return [...this.scheduled];
  }
}
