import { signIn } from "@/lib/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await signIn({
      email: body?.email ?? "",
      password: body?.password ?? "",
    });

    if (!result.ok) {
      return Response.json({ ok: false, errors: result.errors }, { status: 401 });
    }

    return Response.json({ ok: true, user: result.user }, { status: 200 });
  } catch {
    return Response.json({ ok: false, errors: ["Invalid JSON body."] }, { status: 400 });
  }
}