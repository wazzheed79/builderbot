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
  isServiceRoleKey,
  pruneMemoryRateLimits,
} from "../lib/rate-limit.mjs";

test("the database count blocks once the window is used", () => {
  const blocked = decideRateLimit({
    serviceRoleConfigured: true,
    rpcError: false,
    data: { allowed: false, retry_after_sec: 40 },
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.source, "database");
  assert.equal(blocked.retryAfterSec, 40);
});

test("a database error uses the in-memory limit and does not allow every request", () => {
  const key = `fallback:${Date.now()}`;
  const first = checkMemoryRateLimit(key, 1, 60_000);
  const open = decideRateLimit({
    serviceRoleConfigured: true,
    rpcError: true,
    data: { allowed: true },
    memoryAllowed: first.allowed,
    memoryRemaining: first.remaining,
    memoryRetryAfterSec: first.retryAfterSec,
  });
  assert.equal(open.allowed, true);
  assert.equal(open.source, "memory");
  assert.equal(open.remaining, 0);
  assert.equal(open.retryAfterSec, 0);

  const second = checkMemoryRateLimit(key, 1, 60_000);
  const closed = decideRateLimit({
    serviceRoleConfigured: true,
    rpcError: true,
    data: null,
    memoryAllowed: second.allowed,
    memoryRemaining: second.remaining,
    memoryRetryAfterSec: second.retryAfterSec,
  });
  assert.equal(closed.allowed, false);
  assert.equal(closed.source, "memory");
  assert.ok(closed.retryAfterSec >= 1);
});

test("a broken reply is not treated as permission to call", () => {
  const broken = decideRateLimit({
    serviceRoleConfigured: true,
    rpcError: false,
    data: { allowed: "yes" },
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

test("only a service-role key may call the private limit", () => {
  assert.equal(isServiceRoleKey("sb_secret_example"), true);
  assert.equal(isServiceRoleKey("sb_publishable_example"), false);
  assert.equal(isServiceRoleKey(""), false);
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const servicePayload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
  const anonPayload = Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url");
  assert.equal(isServiceRoleKey(`${header}.${servicePayload}.sig`), true);
  assert.equal(isServiceRoleKey(`${header}.${anonPayload}.sig`), false);
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

test("a longer window is not wiped by the memory cleanup", () => {
  const key = `day-window:${Date.now()}`;
  const day = 24 * 60 * 60 * 1000;
  assert.equal(checkMemoryRateLimit(key, 2, day).allowed, true);
  pruneMemoryRateLimits(Date.now() + 5 * 60 * 1000);
  const second = checkMemoryRateLimit(key, 2, day);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);
  assert.equal(checkMemoryRateLimit(key, 2, day).allowed, false);
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
