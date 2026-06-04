import { Redis } from "@upstash/redis";

export function isRedisConfigured() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return Boolean(url?.trim() && token?.trim());
}

export function getRedis() {
  if (!isRedisConfigured()) return null;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return new Redis({ url, token });
}

export function todayKeySuffix() {
  return new Date().toISOString().slice(0, 10);
}
