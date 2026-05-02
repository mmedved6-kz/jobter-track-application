import { getCurrentUser } from "@/lib/auth/current-user";
import { jsonError, jsonSuccess } from "@/lib/http/api-response";
import { getClientIp } from "@/lib/http/request";
import { checkRateLimit, getRateLimitStatus } from "@/lib/rate-limit";
import { createApplication, listApplications } from "@/lib/services/job-application-service";
import { validateJobApplicationListQuery } from "@/lib/validation/job-application";
import { NextRequest } from "next/server";

const APPLICATION_LIST_LIMIT = 180;
const APPLICATION_WRITE_LIMIT = 60;
const APPLICATION_RATE_WINDOW_MS = 60 * 1000;

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return jsonError("Unauthorized", 401, { code: "UNAUTHORIZED" });
    }

    const clientIp = getClientIp(request);
    const listRateKey = `applications:list:${user.id}:${clientIp}`;
    if (!checkRateLimit(listRateKey, APPLICATION_LIST_LIMIT, APPLICATION_RATE_WINDOW_MS)) {
        const status = getRateLimitStatus(listRateKey, APPLICATION_LIST_LIMIT);
        return jsonError("Too many requests. Please try again later.", 429, {
            code: "RATE_LIMITED",
            headers: { "Retry-After": String(Math.max(1, Math.ceil((status.resetAt - Date.now()) / 1000))) },
        });
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = validateJobApplicationListQuery(searchParams);
    if (!queryValidation.ok) {
        return jsonError("Invalid query parameters.", 400, {
            code: "INVALID_QUERY",
            details: queryValidation.errors,
        });
    }

    const result = await listApplications(user.id, queryValidation.data);

    return jsonSuccess(result);
}

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return jsonError("Unauthorized", 401, { code: "UNAUTHORIZED" });
    }

    const clientIp = getClientIp(request);
    const writeRateKey = `applications:write:${user.id}:${clientIp}`;
    if (!checkRateLimit(writeRateKey, APPLICATION_WRITE_LIMIT, APPLICATION_RATE_WINDOW_MS)) {
        const status = getRateLimitStatus(writeRateKey, APPLICATION_WRITE_LIMIT);
        return jsonError("Too many requests. Please try again later.", 429, {
            code: "RATE_LIMITED",
            headers: { "Retry-After": String(Math.max(1, Math.ceil((status.resetAt - Date.now()) / 1000))) },
        });
    }

    try {
        const body = await request.json();
        const result = await createApplication(user.id, body);

        if (!result.ok) {
            return jsonError("Invalid request body.", 400, {
                code: "INVALID_BODY",
                details: result.errors,
            });
        }

        return jsonSuccess(result.data, 201);
    } catch (error) {
        console.error("Create application error:", error);
        return jsonError("Invalid JSON body.", 400, { code: "INVALID_JSON" });
    }
}
