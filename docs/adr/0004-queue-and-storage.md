# 0004 Queue and file storage

Upload used to block on Gemini and write the file to local disk. That fails a request when the model is slow, and it loses files on a redeploy.

The request now stores the file and enqueues `process-document`. The response is 202. BullMQ runs the job when `REDIS_URL` is set. Otherwise an in-memory queue runs it after the response, which is enough for one process and for tests. The job id is `doc:{id}:attempt:{n}`. Reprocess increments the attempt. A second call while the document is `uploaded` or `processing` does not enqueue again.

`FileStorage` has a local implementation and an S3-compatible one. `S3_BUCKET` selects S3. Old rows that only have a filesystem path can still be opened.
