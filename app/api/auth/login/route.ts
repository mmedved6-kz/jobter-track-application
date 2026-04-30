import { signIn } from "@/lib/services/auth-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { LoginInput } from "@/lib/validation/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = (await request.json()) as LoginInput;

        // Get client IP for rate limiting
        const clientIP =
            request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";

        // Rate limit: 10 login attempts per IP per 15 minutes
        const rateLimitKey = `login:ip:${clientIP}`;
        if (!checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000)) {
            return NextResponse.json(
                { ok: false, error: "Too many login attempts. Please try again later." },
                { status: 429 }
            );
        }

        const result = await signIn(body);

        if (!result.ok) {
            return NextResponse.json(
                { ok: false, errors: result.errors },
                { status: 401 }
            );
        }

        return NextResponse.json({ ok: true, user: result.user }, { status: 200 });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
