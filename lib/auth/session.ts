import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "jobter_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_SECRET = process.env.AUTH_SECRET ?? process.env.SESSION_SECRET ?? "jobter-dev-session-secret";

type SessionPayload = {
    userId: string;
    expiresAt: number;
};

function signSessionPayload(userId: string, expiresAt: number): string {
    return crypto.createHmac("sha256", SESSION_SECRET).update(`${userId}:${expiresAt}`).digest("hex");
}

function isValidSignature(userId: string, expiresAt: number, signature: string): boolean {
    const expected = signSessionPayload(userId, expiresAt);

    if (expected.length !== signature.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function createSessionToken(userId: string): string {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const signature = signSessionPayload(userId, expiresAt);

    return `${userId}:${expiresAt}:${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
    const parts = token.split(":");

    if (parts.length !== 3) {
        return null;
    }

    const [userId, expiresAtValue, signature] = parts;
    const expiresAt = Number(expiresAtValue);

    if (!userId || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        return null;
    }

    if (!isValidSignature(userId, expiresAt, signature)) {
        return null;
    }

    return { userId, expiresAt };
}

export async function setSessionCookie(userId: string): Promise<void> {
    const token = createSessionToken(userId);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(Date.now() + SESSION_DURATION_MS),
    });
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionCookieValue(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
    const token = await getSessionCookieValue();

    if (!token) {
        return null;
    }

    return verifySessionToken(token);
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
