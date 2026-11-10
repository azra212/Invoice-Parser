import type { Env } from "../../config/env";
import { BullJobQueue } from "./bullQueue";
import { InMemoryQueue } from "./inMemoryQueue";
import type { JobQueue } from "./jobQueue";

export function createQueue(env: Pick<Env, "REDIS_URL">): JobQueue {
  if (env.REDIS_URL) return new BullJobQueue(env.REDIS_URL);
  return new InMemoryQueue();
}
