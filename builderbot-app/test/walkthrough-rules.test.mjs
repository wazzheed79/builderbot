import test from "node:test";
import assert from "node:assert/strict";

import {
  WALKTHROUGH_SCENES,
  WALKTHROUGH_TOTAL_DURATION_SEC,
  WALKTHROUGH_STEP_DURATION_MS,
} from "../lib/walkthrough-data.mjs";

test("walkthrough scenes: exactly 5 sequential scenes covering driver's seat to invoice", () => {
  assert.equal(WALKTHROUGH_SCENES.length, 5);
  assert.equal(WALKTHROUGH_TOTAL_DURATION_SEC, 45);
  assert.equal(WALKTHROUGH_STEP_DURATION_MS, 8000);

  WALKTHROUGH_SCENES.forEach((scene, index) => {
    assert.equal(scene.id, index);
    assert.equal(scene.stepNumber, index + 1);
    assert.ok(scene.title.length > 5);
    assert.ok(scene.shortTitle.length > 2);
    assert.ok(scene.badge.includes(":"));
    assert.ok(scene.narration.length > 20);
  });
});

test("walkthrough scene 1: speaks notes in plain English from van cab", () => {
  const scene1 = WALKTHROUGH_SCENES[0];
  assert.equal(scene1.stepNumber, 1);
  assert.match(scene1.narration, /van cab/i);
  assert.match(scene1.narration, /mic/i);
  assert.match(scene1.narration, /plain English/i);
});

test("walkthrough scene 2: gives 30-second UK breakdown with Standard, Better, Premium", () => {
  const scene2 = WALKTHROUGH_SCENES[1];
  assert.equal(scene2.stepNumber, 2);
  assert.match(scene2.narration, /Standard, Better, and Premium/i);
  assert.match(scene2.narration, /materials/i);
  assert.match(scene2.narration, /labour/i);
});

test("walkthrough scene 3: WhatsApp dispatch without customer logins", () => {
  const scene3 = WALKTHROUGH_SCENES[2];
  assert.equal(scene3.stepNumber, 3);
  assert.match(scene3.narration, /WhatsApp/i);
  assert.match(scene3.narration, /driveway/i);
});

test("walkthrough scene 4: customer finger signature and 1-tap accept", () => {
  const scene4 = WALKTHROUGH_SCENES[3];
  assert.equal(scene4.stepNumber, 4);
  assert.match(scene4.narration, /signs with their finger/i);
  assert.match(scene4.narration, /Accept/i);
});

test("walkthrough scene 5: 1-click invoice conversion with bank details", () => {
  const scene5 = WALKTHROUGH_SCENES[4];
  assert.equal(scene5.stepNumber, 5);
  assert.match(scene5.narration, /invoice/i);
  assert.match(scene5.narration, /bank payment details/i);
});
