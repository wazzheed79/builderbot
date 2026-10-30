import test from "node:test";
import assert from "node:assert/strict";
import { decideAiTurn, quotaMessage } from "../lib/ai-quota.mjs";

test("the database count blocks the next AI quote once the hour is used up", () => {
  const turn = decideAiTurn({
    serviceRoleConfigured: true,
    rpcError: false,
    data: { allowed: false, retry_after_sec: 1200 },
  });
  assert.equal(turn.allowed, false);
  assert.equal(turn.source, "database");
  assert.equal(turn.retryAfterSec, 1200);
  assert.match(quotaMessage(turn, "generate"), /this hour/);
});

test("a database error uses the hourly memory limit instead of stopping every build", () => {
  const allowed = decideAiTurn({
    serviceRoleConfigured: true,
    rpcError: true,
    data: { allowed: true },
    memoryAllowed: true,
    memoryRetryAfterSec: 0,
  });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.source, "memory");
  assert.equal(allowed.retryAfterSec, 0);

  const usedUp = decideAiTurn({
    serviceRoleConfigured: true,
    rpcError: true,
    data: null,
    memoryAllowed: false,
    memoryRetryAfterSec: 90,
  });
  assert.equal(usedUp.allowed, false);
  assert.equal(usedUp.source, "memory");
  assert.equal(usedUp.retryAfterSec, 90);
  assert.match(quotaMessage(usedUp, "generate"), /this hour/);
});

test("a broken quota reply cannot be treated as allowed", () => {
  const turn = decideAiTurn({
    serviceRoleConfigured: true,
    rpcError: false,
    data: "not-json",
  });
  assert.equal(turn.allowed, false);
  assert.equal(turn.source, "blocked");
});

test("without a service role key the local counter is used, and a client flag is ignored", () => {
  const blocked = decideAiTurn({
    serviceRoleConfigured: false,
    rpcError: false,
    data: { allowed: true },
    memoryAllowed: false,
    memoryRetryAfterSec: 30,
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.source, "memory");
  assert.equal(blocked.retryAfterSec, 30);

  const open = decideAiTurn({
    serviceRoleConfigured: false,
    rpcError: true,
    data: null,
    memoryAllowed: true,
    memoryRetryAfterSec: 3600,
  });
  assert.equal(open.allowed, true);
  assert.equal(open.source, "memory");
});
