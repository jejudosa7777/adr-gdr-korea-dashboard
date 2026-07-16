import { describe, expect, it } from "vitest";
import { createRateLimiter, getClientIdentifier } from "@/lib/api/rate-limit";

describe("createRateLimiter", () => {
  it("허용 횟수를 넘으면 차단하고 윈도우 이후 다시 허용한다", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });

    expect(limiter.consume("client", 1_000).allowed).toBe(true);
    expect(limiter.consume("client", 2_000).allowed).toBe(true);
    expect(limiter.consume("client", 3_000)).toMatchObject({ allowed: false, retryAfterSeconds: 58 });
    expect(limiter.consume("client", 61_000).allowed).toBe(true);
  });

  it("프록시 헤더의 첫 번째 주소를 호출자 식별자로 사용한다", () => {
    const request = new Request("http://localhost", { headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" } });
    expect(getClientIdentifier(request)).toBe("203.0.113.10");
  });
});
