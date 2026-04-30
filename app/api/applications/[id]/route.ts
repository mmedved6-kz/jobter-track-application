import { getCurrentUser } from "@/lib/auth/current-user";
import { getApplication, removeApplication, updateApplication } from "@/lib/services/job-application-service";

export async function GET(_request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) {
        return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(context.params);
    const application = await getApplication(user.id, id);

    if (!application) {
        return Response.json({ ok: false, error: "Application not found" }, { status: 404 });
    }

    return Response.json({ ok: true, data: application }, { status: 200 });
}

export async function PATCH(request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) {
        return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(context.params);

    try {
        const body = await request.json();
        const result = await updateApplication(user.id, id, body);

        if (!result.ok) {
            const status = result.errors.includes("Application not found.") ? 404 : 400;
            return Response.json({ ok: false, errors: result.errors }, { status });
        }

        return Response.json({ ok: true, data: result.data }, { status: 200 });
    } catch (error) {
        console.error("Update application error:", error);
        return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }
}

export async function DELETE(_request: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) {
        return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(context.params);
    const result = await removeApplication(user.id, id);

    if (!result.ok) {
        return Response.json({ ok: false, errors: result.errors }, { status: 404 });
    }

    return Response.json({ ok: true }, { status: 200 });
}
