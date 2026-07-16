interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter({ limit, windowMs }: RateLimitOptions) {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    consume(key: string, now = Date.now()) {
      const current = buckets.get(key);
      if (!current || current.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
      }

      if (current.count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
        };
      }

      current.count += 1;
      return { allowed: true, remaining: limit - current.count, retryAfterSeconds: 0 };
    },
  };
}

export function getClientIdentifier(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown-client";
}
