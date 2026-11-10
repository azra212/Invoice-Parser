import type { FileStorage } from "./storage/fileStorage";
import { LocalFileStorage } from "./storage/localFileStorage";
import type { JobQueue } from "./queue/jobQueue";
import { InMemoryQueue } from "./queue/inMemoryQueue";

let storage: FileStorage = new LocalFileStorage();
let queue: JobQueue = new InMemoryQueue();

export function getStorage(): FileStorage {
  return storage;
}

export function getQueue(): JobQueue {
  return queue;
}

export function configureRuntime(next: {
  storage: FileStorage;
  queue: JobQueue;
}): void {
  storage = next.storage;
  queue = next.queue;
}
