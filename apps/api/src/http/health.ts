import IORedis from "ioredis";
import mongoose from "mongoose";
import type { Env } from "../config/env";

const clients = new Map<string, IORedis>();

async function redisStatus(url?: string): Promise<"up" | "down" | "disabled"> {
  if (!url) return "disabled";
  try {
    let client = clients.get(url);
    if (!client) {
      client = new IORedis(url, {
        maxRetriesPerRequest: 1,
        connectTimeout: 1000,
        lazyConnect: true,
      });
      clients.set(url, client);
    }
    if (client.status === "wait") {
      await client.connect();
    }
    return (await client.ping()) === "PONG" ? "up" : "down";
  } catch {
    return "down";
  }
}

export async function healthReport(env: Pick<Env, "REDIS_URL">) {
  const mongo = mongoose.connection.readyState === 1 ? "up" : "down";
  const redis = await redisStatus(env.REDIS_URL);
  const mongoUp = mongo === "up";
  return {
    statusCode: mongoUp ? 200 : 503,
    body: {
      status: !mongoUp ? "down" : redis === "down" ? "degraded" : "ok",
      mongo,
      redis,
      uptime: Math.round(process.uptime()),
    },
  };
}
