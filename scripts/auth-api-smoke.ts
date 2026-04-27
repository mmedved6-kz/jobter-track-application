import assert from "node:assert/strict";

type Json = Record<string, unknown>;

const baseUrl = process.env.AUTH_TEST_BASE_URL ?? "http://localhost:3005";
const email = `auth-smoke-${Date.now()}@example.com`;
const password = "testpass123";

let cookieHeader = "";

function updateCookieFromHeaders(headers: Headers) {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return;

  const first = setCookie.split(",")[0];
  const pair = first.split(";")[0];
  if (pair.includes("=")) {
    cookieHeader = pair;
  }
}

async function post(path: string, body?: Json, withCookie = false) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (withCookie && cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  updateCookieFromHeaders(response.headers);
  return response;
}

async function get(path: string, withCookie = false) {
  const headers: Record<string, string> = {};

  if (withCookie && cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers,
  });

  updateCookieFromHeaders(response.headers);
  return response;
}

async function run() {
  const signup = await post("/api/auth/signup", {
    email,
    password,
    name: "Smoke Tester",
  });
  assert.equal(signup.status, 201, "signup should return 201");

  const signupJson = (await signup.json()) as Json;
  assert.equal(signupJson.ok, true, "signup response should be ok=true");

  const meAfterSignup = await get("/api/auth/me", true);
  assert.equal(meAfterSignup.status, 200, "me after signup should return 200");
  const meJson = (await meAfterSignup.json()) as Json;
  assert.equal(meJson.ok, true, "me after signup should be ok=true");

  const logout = await post("/api/auth/logout", undefined, true);
  assert.equal(logout.status, 200, "logout should return 200");

  const meAfterLogout = await get("/api/auth/me", true);
  assert.equal(meAfterLogout.status, 401, "me after logout should return 401");

  const badLogin = await post("/api/auth/login", {
    email,
    password: "wrong1234",
  });
  assert.equal(badLogin.status, 401, "bad login should return 401");

  const login = await post("/api/auth/login", {
    email,
    password,
  });
  assert.equal(login.status, 200, "login should return 200");

  const meAfterLogin = await get("/api/auth/me", true);
  assert.equal(meAfterLogin.status, 200, "me after login should return 200");

  const duplicateSignup = await post("/api/auth/signup", {
    email,
    password,
  });
  assert.equal(duplicateSignup.status, 400, "duplicate signup should return 400");

  console.log("Auth API smoke test passed");
}

run().catch((error) => {
  console.error("Auth API smoke test failed");
  console.error(error);
  process.exit(1);
});