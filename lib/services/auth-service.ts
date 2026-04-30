import { validateSignupInput, validateLoginInput, SignupInput, LoginInput } from "@/lib/validation/auth";
import { findUserByEmail, createUser } from "@/lib/repositories/user-repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

type User = {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type AuthResult<T> =
    | { ok: true; user: T }
    | { ok: false; errors: string[] };

export async function signUp(input: SignupInput): Promise<AuthResult<User>> {
    // Validate input
    const validation = validateSignupInput(input);
    if (!validation.ok) {
        return { ok: false, errors: validation.errors };
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    // NOTE: We use a generic error message to avoid account enumeration attacks
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        return { ok: false, errors: ["Invalid email or password."] };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await createUser({ email, passwordHash, name });

    // Set session
    await setSessionCookie(user.id);

    return { ok: true, user };
}

export async function signIn(input: LoginInput): Promise<AuthResult<User>> {
    // Validate input
    const validation = validateLoginInput(input);
    if (!validation.ok) {
        return { ok: false, errors: validation.errors };
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
        // Use generic error to avoid account enumeration
        return { ok: false, errors: ["Invalid email or password."] };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
        return { ok: false, errors: ["Invalid email or password."] };
    }

    // Set session
    await setSessionCookie(user.id);

    // Return user without password hash (destructure to exclude it)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { ok: true, user: userWithoutPassword };
}

export async function signOut(): Promise<void> {
    await clearSessionCookie();
}
