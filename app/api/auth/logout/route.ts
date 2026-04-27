import { signOut } from "@/lib/services/auth-service";

export async function POST() {
  await signOut();
  return Response.json({ ok: true }, { status: 200 });
}