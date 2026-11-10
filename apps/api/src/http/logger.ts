import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import pino from "pino";
import pinoHttp from "pino-http";

export const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "test" ? "silent" : "info"),
});

export function requestLogger() {
  return pinoHttp({
    logger,
    genReqId(req: IncomingMessage, res: ServerResponse) {
      const header = req.headers["x-request-id"];
      const id =
        typeof header === "string" && header.trim()
          ? header.trim()
          : randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },
    autoLogging: {
      ignore(req: IncomingMessage) {
        const url = req.url ?? "";
        return (
          url.startsWith("/api/v1/health") || url.startsWith("/api/health")
        );
      },
    },
  });
}
