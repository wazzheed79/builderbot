import test from "node:test";
import assert from "node:assert/strict";
import { appendSpokenText, applyRecognitionResults } from "../lib/speech-draft.mjs";

test("interim speech stays out of the notes until it is final", () => {
  const hearing = applyRecognitionResults("", [
    { isFinal: false, transcript: "unblock the " },
  ]);
  assert.equal(hearing.delta, "");
  assert.equal(hearing.interim, "unblock the");

  const finished = applyRecognitionResults(hearing.appliedFinals, [
    { isFinal: true, transcript: "unblock the kitchen sink" },
  ]);
  assert.equal(finished.delta, "unblock the kitchen sink");
  assert.equal(finished.interim, "");
  const notes = appendSpokenText("Replace the trap.", finished.delta);
  assert.equal(notes, "Replace the trap. unblock the kitchen sink");
});

test("a final transcript is not written twice, including after typed text", () => {
  const first = applyRecognitionResults("", [
    { isFinal: true, transcript: " kitchen tap" },
  ]);
  const typed = appendSpokenText("Replace the", first.delta, 2000);
  assert.equal(typed, "Replace the kitchen tap");

  const repeat = applyRecognitionResults(first.appliedFinals, [
    { isFinal: true, transcript: "kitchen tap" },
  ]);
  assert.equal(repeat.delta, "");
  assert.equal(appendSpokenText(typed, repeat.delta), typed);

  const more = applyRecognitionResults(repeat.appliedFinals, [
    { isFinal: true, transcript: "kitchen tap" },
    { isFinal: false, transcript: " and the waste" },
  ]);
  assert.equal(more.delta, "");
  assert.equal(more.interim, "and the waste");
  const committed = applyRecognitionResults(more.appliedFinals, [
    { isFinal: true, transcript: "kitchen tap and the waste" },
  ]);
  assert.equal(committed.delta, "and the waste");
  assert.equal(appendSpokenText(typed, committed.delta), "Replace the kitchen tap and the waste");
});

test("speech stops at the notes limit", () => {
  assert.equal(appendSpokenText("abc", "defgh", 6), "abc de");
});
