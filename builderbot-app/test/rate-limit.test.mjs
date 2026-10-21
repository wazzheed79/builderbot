// Rate limits. The database function is the live counter. These tests cover the decision
// and the memory fallback used before that function is installed.
import test from "node:test";
import assert from "node:assert/strict";

import {
  bucketFromIdentifier,
  checkMemoryRateLimit,
  decideRateLimit,
  getClientIp,
  hashRateSubject,
  isMissingRateLimitFunction,
} from "../lib/rate-limit.mjs";

test("the database count blocks once the window is used, and a broken reply does not allow the call", () => {
  const blocked = decideRateLimit({
    serviceRoleConfigured: true,
    rpcError: false,
    data: { allowed: false, retry_after_sec: 40 },
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.source, "database");
  assert.equal(blocked.retryAfterSec, 40);

  const broken = decideRateLimit({
    serviceRoleConfigured: true,
    rpcError: true,
    data: { allowed: true },
  });
  assert.equal(broken.allowed, false);
  assert.equal(broken.source, "blocked");
});

test("without the SQL function, or without a service role key, the memory counter is used", () => {
  const missing = decideRateLimit({
    serviceRoleConfigured: true,
    missingFunction: true,
    rpcError: true,
    data: null,
    memoryAllowed: true,
    memoryRemaining: 4,
  });
  assert.equal(missing.allowed, true);
  assert.equal(missing.source, "memory");

  const local = decideRateLimit({
    serviceRoleConfigured: false,
    rpcError: false,
    data: { allowed: true },
    memoryAllowed: false,
    memoryRetryAfterSec: 12,
  });
  assert.equal(local.allowed, false);
  assert.equal(local.source, "memory");
  assert.equal(local.retryAfterSec, 12);
});

test("a missing consume_rate_limit function is recognised, and other errors are not", () => {
  assert.equal(isMissingRateLimitFunction({ code: "PGRST202", message: "could not find consume_rate_limit" }), true);
  assert.equal(isMissingRateLimitFunction({ code: "42501", message: "permission denied" }), false);
});

test("the stored subject is a hash, not the IP address", () => {
  const identifier = "ai-generate:203.0.113.8";
  assert.equal(bucketFromIdentifier(identifier), "ai-generate");
  const subject = hashRateSubject(identifier);
  assert.equal(subject.length, 64);
  assert.equal(subject.includes("203.0.113.8"), false);
  assert.equal(hashRateSubject(identifier), subject);
});

test("memory still stops the next call inside the window", () => {
  const key = `test-memory:${Date.now()}`;
  assert.equal(checkMemoryRateLimit(key, 1, 60_000).allowed, true);
  const second = checkMemoryRateLimit(key, 1, 60_000);
  assert.equal(second.allowed, false);
  assert.ok(second.retryAfterSec >= 1);
});

test("the platform IP is used ahead of a caller-supplied forwarded header", () => {
  const request = {
    headers: {
      get(name) {
        const headers = {
          "x-forwarded-for": "198.51.100.20",
          "x-real-ip": "198.51.100.21",
          "x-vercel-forwarded-for": "203.0.113.9, 76.76.21.21",
        };
        return headers[name] || null;
      },
    },
  };
  assert.equal(getClientIp(request), "203.0.113.9");
  assert.equal(getClientIp({ headers: { get: () => "not an ip" } }), "unknown");
});
