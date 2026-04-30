import { signUp } from "@/lib/services/auth-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { SignupInput } from "@/lib/validation/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = (await request.json()) as SignupInput;
        const { email } = body;

        // Rate limit: 5 signup attempts per email per hour
        const rateLimitKey = `signup:email:${email?.toLowerCase()}`;
        if (!checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000)) {
            return NextResponse.json(
                { ok: false, error: "Too many signup attempts. Please try again later." },
                { status: 429 }
            );
        }

        const result = await signUp(body);

        if (!result.ok) {
            return NextResponse.json(
                { ok: false, errors: result.errors },
                { status: 400 }
            );
        }

        return NextResponse.json({ ok: true, user: result.user }, { status: 201 });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
