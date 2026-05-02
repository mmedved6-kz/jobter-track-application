import { getCurrentUser } from "@/lib/auth/current-user";
import { jsonError, jsonSuccess } from "@/lib/http/api-response";
import { getClientIp } from "@/lib/http/request";
import { checkRateLimit, getRateLimitStatus } from "@/lib/rate-limit";
import { getApplication, removeApplication, updateApplication } from "@/lib/services/job-application-service";

const APPLICATION_READ_LIMIT = 240;
const APPLICATION_WRITE_LIMIT = 60;
const APPLICATION_RATE_WINDOW_MS = 60 * 1000;

export async function GET(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) {
        return jsonError("Unauthorized", 401, { code: "UNAUTHORIZED" });
    }

    const clientIp = getClientIp(request);
    const readRateKey = `applications:item-read:${user.id}:${clientIp}`;
    if (!checkRateLimit(readRateKey, APPLICATION_READ_LIMIT, APPLICATION_RATE_WINDOW_MS)) {
        const status = getRateLimitStatus(readRateKey, APPLICATION_READ_LIMIT);
        return jsonError("Too many requests. Please try again later.", 429, {
            code: "RATE_LIMITED",
            headers: { "Retry-After": String(Math.max(1, Math.ceil((status.resetAt - Date.now()) / 1000))) },
        });
    }

    const { id } = await Promise.resolve(context.params);
    const application = await getApplication(user.id, id);

    if (!application) {
        return jsonError("Application not found.", 404, { code: "APPLICATION_NOT_FOUND" });
    }

    return jsonSuccess(application);
}

export async function PATCH(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) {
        return jsonError("Unauthorized", 401, { code: "UNAUTHORIZED" });
    }

    const clientIp = getClientIp(request);
    const writeRateKey = `applications:item-write:${user.id}:${clientIp}`;
    if (!checkRateLimit(writeRateKey, APPLICATION_WRITE_LIMIT, APPLICATION_RATE_WINDOW_MS)) {
        const status = getRateLimitStatus(writeRateKey, APPLICATION_WRITE_LIMIT);
        return jsonError("Too many requests. Please try again later.", 429, {
            code: "RATE_LIMITED",
            headers: { "Retry-After": String(Math.max(1, Math.ceil((status.resetAt - Date.now()) / 1000))) },
        });
    }

    const { id } = await Promise.resolve(context.params);

    try {
        const body = await request.json();
        const result = await updateApplication(user.id, id, body);

        if (!result.ok) {
            const status = result.errors.includes("Application not found.") ? 404 : 400;
            return jsonError(
                status === 404 ? "Application not found." : "Invalid request body.",
                status,
                {
                    code: status === 404 ? "APPLICATION_NOT_FOUND" : "INVALID_BODY",
                    details: status === 404 ? undefined : result.errors,
                }
            );
        }

        return jsonSuccess(result.data);
    } catch (error) {
        console.error("Update application error:", error);
        return jsonError("Invalid JSON body.", 400, { code: "INVALID_JSON" });
    }
}

export async function DELETE(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) {
        return jsonError("Unauthorized", 401, { code: "UNAUTHORIZED" });
    }

    const clientIp = getClientIp(request);
    const writeRateKey = `applications:item-write:${user.id}:${clientIp}`;
    if (!checkRateLimit(writeRateKey, APPLICATION_WRITE_LIMIT, APPLICATION_RATE_WINDOW_MS)) {
        const status = getRateLimitStatus(writeRateKey, APPLICATION_WRITE_LIMIT);
        return jsonError("Too many requests. Please try again later.", 429, {
            code: "RATE_LIMITED",
            headers: { "Retry-After": String(Math.max(1, Math.ceil((status.resetAt - Date.now()) / 1000))) },
        });
    }

    const { id } = await Promise.resolve(context.params);
    const result = await removeApplication(user.id, id);

    if (!result.ok) {
        return jsonError("Application not found.", 404, { code: "APPLICATION_NOT_FOUND" });
    }

    return jsonSuccess({ deleted: true });
}
