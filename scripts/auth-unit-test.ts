import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { validateLoginInput, validateSignupInput } from "../lib/validation/auth";

async function run() {
  const plain = "Pass1234";
  const hash = await hashPassword(plain);

  assert.notEqual(hash, plain, "Hash should not equal plain text password");

  const ok = await verifyPassword(plain, hash);
  assert.equal(ok, true, "verifyPassword should accept correct password");

  const bad = await verifyPassword("wrong1234", hash);
  assert.equal(bad, false, "verifyPassword should reject wrong password");

  const signupValid = validateSignupInput({
    email: "  USER@example.com ",
    password: "abc12345",
    name: "  User  ",
  });

  assert.equal(signupValid.ok, true, "validateSignupInput should accept valid payload");
  if (signupValid.ok) {
    assert.equal(signupValid.data.email, "user@example.com");
    assert.equal(signupValid.data.name, "User");
  }

  const signupInvalid = validateSignupInput({
    email: "bad-email",
    password: "short",
    name: "",
  });

  assert.equal(signupInvalid.ok, false, "validateSignupInput should reject invalid payload");

  const loginInvalid = validateLoginInput({
    email: "bad-email",
    password: "",
  });

  assert.equal(loginInvalid.ok, false, "validateLoginInput should reject invalid payload");

  console.log("Auth unit checks passed");
}

run().catch((error) => {
  console.error("Auth unit checks failed");
  console.error(error);
  process.exit(1);
});