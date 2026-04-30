import assert from "node:assert/strict";

type Json = Record<string, unknown>;

type ApplicationRecord = {
    id: string;
    company: string;
    role: string;
    location: string | null;
    jobUrl: string | null;
    status: string;
    appliedAt: string;
    notes: string | null;
};

const baseUrl = process.env.AUTH_TEST_BASE_URL ?? "http://localhost:3005";
const email = `crud-smoke-${Date.now()}@example.com`;
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

async function patch(path: string, body: Json, withCookie = false) {
    const headers: Record<string, string> = {
        "content-type": "application/json",
    };

    if (withCookie && cookieHeader) {
        headers.cookie = cookieHeader;
    }

    const response = await fetch(`${baseUrl}${path}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
    });

    updateCookieFromHeaders(response.headers);
    return response;
}

async function del(path: string, withCookie = false) {
    const headers: Record<string, string> = {};

    if (withCookie && cookieHeader) {
        headers.cookie = cookieHeader;
    }

    const response = await fetch(`${baseUrl}${path}`, {
        method: "DELETE",
        headers,
    });

    updateCookieFromHeaders(response.headers);
    return response;
}

async function run() {
    const signup = await post("/api/auth/signup", {
        email,
        password,
        name: "CRUD Smoke Tester",
    });
    assert.equal(signup.status, 201, "signup should return 201");

    const createResponse = await post(
        "/api/applications",
        {
            company: "Acme Corp",
            role: "Frontend Engineer",
            location: "Remote",
            jobUrl: "https://example.com/jobs/frontend-engineer",
            status: "APPLIED",
            appliedAt: "2026-04-30",
            notes: "First pass",
        },
        true
    );
    assert.equal(createResponse.status, 201, "create application should return 201");
    const created = (await createResponse.json()) as Json;
    assert.equal(created.ok, true, "create response should be ok=true");

    const createdData = created.data as ApplicationRecord;
    assert.ok(createdData.id, "created application should include an id");
    assert.equal(createdData.company, "Acme Corp", "company should be preserved");

    const listResponse = await get("/api/applications", true);
    assert.equal(listResponse.status, 200, "list applications should return 200");
    const listJson = (await listResponse.json()) as Json;
    assert.equal(listJson.ok, true, "list response should be ok=true");

    const listData = listJson.data as { items: ApplicationRecord[]; total: number };
    assert.ok(listData.total >= 1, "list total should be at least 1");

    const fetchResponse = await get(`/api/applications/${createdData.id}`, true);
    assert.equal(fetchResponse.status, 200, "fetch application should return 200");
    const fetchJson = (await fetchResponse.json()) as Json;
    assert.equal(fetchJson.ok, true, "fetch response should be ok=true");

    const updateResponse = await patch(
        `/api/applications/${createdData.id}`,
        {
            role: "Senior Frontend Engineer",
            status: "INTERVIEW",
            notes: "Moved to interview round",
        },
        true
    );
    assert.equal(updateResponse.status, 200, "update application should return 200");
    const updateJson = (await updateResponse.json()) as Json;
    assert.equal(updateJson.ok, true, "update response should be ok=true");
    const updatedData = updateJson.data as ApplicationRecord;
    assert.equal(updatedData.role, "Senior Frontend Engineer", "role should update");
    assert.equal(updatedData.status, "INTERVIEW", "status should update");

    const deleteResponse = await del(`/api/applications/${createdData.id}`, true);
    assert.equal(deleteResponse.status, 200, "delete application should return 200");

    const afterDelete = await get(`/api/applications/${createdData.id}`, true);
    assert.equal(afterDelete.status, 404, "deleted application should return 404");

    console.log("Application CRUD smoke test passed");
}

run().catch((error) => {
    console.error("Application CRUD smoke test failed");
    console.error(error);
    process.exit(1);
});
