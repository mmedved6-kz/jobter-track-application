import { getCurrentUser } from "@/lib/auth/current-user";
import { createApplication, listApplications } from "@/lib/services/job-application-service";
import { applicationStatuses } from "@/lib/validation/job-application";
import { NextRequest } from "next/server";

function toPositiveInt(value: string | null | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const page = toPositiveInt(url.searchParams.get("page"), 1);
    const pageSize = toPositiveInt(url.searchParams.get("pageSize"), 10);

    const normalizedStatus = applicationStatuses.includes(status as (typeof applicationStatuses)[number])
        ? (status as (typeof applicationStatuses)[number])
        : undefined;

    const result = await listApplications(user.id, {
        search: search?.trim() || undefined,
        status: normalizedStatus,
        page,
        pageSize,
    });

    return Response.json({ ok: true, data: result }, { status: 200 });
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const result = await createApplication(user.id, body);

        if (!result.ok) {
            return Response.json({ ok: false, errors: result.errors }, { status: 400 });
        }

        return Response.json({ ok: true, data: result.data }, { status: 201 });
    } catch (error) {
        console.error("Create application error:", error);
        return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }
}
