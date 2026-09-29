import mongoose from "mongoose";
import { getEnv } from "./env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // Module-level cache across hot-reloads / serverless invocations.
  var __mongooseCache: MongooseCache | undefined;
}

function getCache(): MongooseCache {
  if (!globalThis.__mongooseCache) {
    globalThis.__mongooseCache = { conn: null, promise: null };
  }
  return globalThis.__mongooseCache;
}

/**
 * Connect to MongoDB, reusing a single cached connection across
 * hot-reloads and serverless invocations.
 *
 * Fail-fast: getEnv() throws a descriptive error when MONGODB_URI is
 * missing (validated by Zod in lib/env.ts).
 */
export async function connectDB(): Promise<typeof mongoose> {
  const cache = getCache();
  if (cache.conn) return cache.conn;

  const { MONGODB_URI } = getEnv();
  const uri = MONGODB_URI;

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

/** Test/dev helper: drop the cached connection without disconnecting. */
export function resetConnectionCacheForTests(): void {
  globalThis.__mongooseCache = { conn: null, promise: null };
}
