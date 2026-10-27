import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { emailCodeDigits, emailCodeError } from "../lib/email-code.mjs";

test("an email code keeps digits and accepts 6 to 10 of them", () => {
  assert.equal(emailCodeDigits("9912 1061"), "99121061");
  assert.equal(emailCodeDigits("12ab345678"), "12345678");
  assert.equal(emailCodeError("123456"), "");
  assert.equal(emailCodeError("99121061"), "");
  assert.equal(emailCodeError("1234567890"), "");
  assert.equal(emailCodeError("12345"), "Enter the code from the email. It is 6 to 10 digits.");
  assert.equal(emailCodeError("12345678901"), "Enter the code from the email. It is 6 to 10 digits.");
  assert.equal(emailCodeError(""), "Enter the code from the email. It is 6 to 10 digits.");
});

test("the sign-in page describes the button and the code in the email", () => {
  const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
  const auth = readFileSync(new URL("../components/AuthProvider.tsx", import.meta.url), "utf8");
  assert.match(login, /Got a code\? Type it here/);
  assert.match(login, /It has a button/);
  assert.doesNotMatch(login, /does not include a code/);
  assert.doesNotMatch(login, /6-digit/);
  assert.match(login, /EMAIL_CODE_MAX_LENGTH/);
  assert.match(auth, /emailCodeError/);
  assert.match(auth, /type: "email"/);
});
