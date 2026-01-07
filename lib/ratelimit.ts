// src/lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const ratelimit =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        // 例：1分あたり5回（ここはお好みで）
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
      })
    : null;
