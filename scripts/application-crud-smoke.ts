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

type ErrorBody = {
    ok: false;
    error: {
        message: string;
        code?: string;
        details?: string[];
    };
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

    const unauthCreate = await post("/api/applications", { company: "NoAuth" });
    assert.equal(unauthCreate.status, 401, "unauthenticated create should return 401");

    const createBlankResponse = await post("/api/applications", {}, true);
    assert.equal(createBlankResponse.status, 201, "blank create payload should return 201");
    const createBlankJson = (await createBlankResponse.json()) as Json;
    assert.equal(createBlankJson.ok, true, "blank create should be ok=true");
    const blankData = createBlankJson.data as ApplicationRecord;
    assert.equal(blankData.company, "", "blank create should default company to empty string");
    assert.equal(blankData.role, "", "blank create should default role to empty string");

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

    const invalidListResponse = await get("/api/applications?page=abc", true);
    assert.equal(invalidListResponse.status, 400, "invalid page should return 400");
    const invalidListJson = (await invalidListResponse.json()) as ErrorBody;
    assert.equal(invalidListJson.ok, false, "invalid list response should be ok=false");
    assert.equal(invalidListJson.error.code, "INVALID_QUERY", "invalid list should return INVALID_QUERY");

    const filteredListResponse = await get("/api/applications?status=INTERVIEW&page=1&pageSize=1", true);
    assert.equal(filteredListResponse.status, 200, "filtered list should return 200");
    const filteredListJson = (await filteredListResponse.json()) as Json;
    assert.equal(filteredListJson.ok, true, "filtered list should be ok=true");

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

    const invalidPatch = await patch(
        `/api/applications/${createdData.id}`,
        { status: "INVALID" },
        true
    );
    assert.equal(invalidPatch.status, 400, "invalid patch should return 400");
    const invalidPatchJson = (await invalidPatch.json()) as ErrorBody;
    assert.equal(invalidPatchJson.ok, false, "invalid patch should be ok=false");
    assert.equal(invalidPatchJson.error.code, "INVALID_BODY", "invalid patch should return INVALID_BODY");

    const missingFetch = await get("/api/applications/nonexistent-id", true);
    assert.equal(missingFetch.status, 404, "missing fetch should return 404");

    const deleteResponse = await del(`/api/applications/${createdData.id}`, true);
    assert.equal(deleteResponse.status, 200, "delete application should return 200");

    const afterDelete = await get(`/api/applications/${createdData.id}`, true);
    assert.equal(afterDelete.status, 404, "deleted application should return 404");

    const deleteMissing = await del(`/api/applications/${createdData.id}`, true);
    assert.equal(deleteMissing.status, 404, "deleting missing application should return 404");

    const deleteBlank = await del(`/api/applications/${blankData.id}`, true);
    assert.equal(deleteBlank.status, 200, "blank record delete should return 200");

    console.log("Application CRUD smoke test passed");
}

run().catch((error) => {
    console.error("Application CRUD smoke test failed");
    console.error(error);
    process.exit(1);
});
