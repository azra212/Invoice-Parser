import { describe, expect, it } from "vitest";
import { InMemoryQueue } from "./inMemoryQueue";

describe("InMemoryQueue", () => {
  it("runs a job after enqueue returns and ignores the same attempt", async () => {
    const queue = new InMemoryQueue();
    const seen: string[] = [];
    queue.start(async (job) => {
      seen.push(`${job.documentId}:${job.attempt}`);
    });

    await queue.enqueue({ documentId: "doc-1", attempt: 1 });
    await queue.enqueue({ documentId: "doc-1", attempt: 1 });
    await queue.enqueue({ documentId: "doc-1", attempt: 2 });

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(seen).toEqual(["doc-1:1", "doc-1:2"]);
  });
});
