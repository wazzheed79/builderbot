import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  WALKTHROUGH_CLIP_FALLBACK_MS,
  WALKTHROUGH_CLIP_SRC,
  WALKTHROUGH_SCENES,
} from "../lib/walkthrough-data.mjs";

const NARRATION = [
  "Sat in your van after looking at the job? Just tap the mic and describe the work in plain English. No typing needed.",
  "In seconds, Chuffed Quotes turns that into a priced quote, with materials and labour, and gives you Standard, Better and Premium options.",
  "Then send the quote link straight to your customer on WhatsApp, before you've even pulled off the drive.",
  "Your customer picks an option, taps Accept on their phone, and types their name to sign.",
  "And when the job's done, turn the accepted quote into a proper invoice in one tap.",
];

test("walkthrough scenes match the recorded lines and stay in order", () => {
  assert.equal(WALKTHROUGH_SCENES.length, 5);
  assert.equal(WALKTHROUGH_CLIP_SRC.length, 5);
  assert.equal(WALKTHROUGH_CLIP_FALLBACK_MS.length, 5);

  WALKTHROUGH_SCENES.forEach((scene, index) => {
    assert.equal(scene.id, index);
    assert.equal(scene.stepNumber, index + 1);
    assert.equal(scene.narration, NARRATION[index]);
    assert.equal(WALKTHROUGH_CLIP_SRC[index], `/audio/walkthrough/step-${index + 1}.mp3`);
    assert.ok(WALKTHROUGH_CLIP_FALLBACK_MS[index] > 1000);
    assert.ok(scene.title.length > 5);
    assert.ok(scene.shortTitle.length > 2);
    assert.doesNotMatch(scene.title, /30-second|45-second|merchant|finger|IP Verified/i);
    assert.doesNotMatch(scene.narration, /finger|notified immediately|merchant/i);
  });

  assert.deepEqual(WALKTHROUGH_CLIP_FALLBACK_MS, [6888, 8760, 5520, 5160, 5424]);

  const totalMs = WALKTHROUGH_CLIP_FALLBACK_MS.reduce((sum, ms) => sum + ms, 0);
  assert.ok(totalMs > 25000 && totalMs < 40000, `clips total ${totalMs}ms`);
});

test("walkthrough audio files exist and the player does not use speech synthesis", () => {
  for (const name of ["step-1.mp3", "step-2.mp3", "step-3.mp3", "step-4.mp3", "step-5.mp3"]) {
    const file = new URL(`../public/audio/walkthrough/${name}`, import.meta.url);
    assert.equal(fs.existsSync(file), true, name);
  }

  const player = fs.readFileSync(new URL("../components/VanWalkthrough.tsx", import.meta.url), "utf8");
  const modal = fs.readFileSync(new URL("../components/VanWalkthroughModal.tsx", import.meta.url), "utf8");
  assert.equal(player.includes("speechSynthesis"), false);
  assert.equal(modal.includes("speechSynthesis"), false);
  assert.match(player, /HTMLAudioElement|new Audio/);
  assert.match(player, /Tap for sound/);
  assert.match(player, /00-00-00/);
  assert.match(player, /12345678/);
  assert.doesNotMatch(player, /20-40-60|83920194|IP Verified|Transcribed on device|VAT registered|Certified Plumbing|Signed 22\/10\/2026/);
  assert.doesNotMatch(player, /45-Second|45-second/);
});
