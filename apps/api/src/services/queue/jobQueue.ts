export type ProcessDocumentJob = {
  documentId: string;
  attempt: number;
};

export function processJobId(job: ProcessDocumentJob): string {
  return `doc:${job.documentId}:attempt:${job.attempt}`;
}

export interface JobQueue {
  enqueue(job: ProcessDocumentJob): Promise<void>;
  start(handler: (job: ProcessDocumentJob) => Promise<void>): void;
  stop(): Promise<void>;
}
