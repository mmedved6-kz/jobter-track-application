import { signUp } from "@/lib/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await signUp({
      email: body?.email ?? "",
      password: body?.password ?? "",
      name: body?.name ?? null,
    });

    if (!result.ok) {
      return Response.json({ ok: false, errors: result.errors }, { status: 400 });
    }

    return Response.json({ ok: true, user: result.user }, { status: 201 });
  } catch {
    return Response.json({ ok: false, errors: ["Invalid JSON body."] }, { status: 400 });
  }
}