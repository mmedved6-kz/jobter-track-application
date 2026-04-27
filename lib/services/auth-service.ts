import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { findUserByEmail, createUser } from "@/lib/repositories/user-repository";
import {
  validateLoginInput,
  validateSignupInput,
  type LoginInput,
  type SignupInput,
} from "@/lib/validation/auth";

export type AuthFailure = {
  ok: false;
  errors: string[];
};

export type AuthSuccess<T> = {
  ok: true;
  user: T;
};

export type AuthResult<T> = AuthSuccess<T> | AuthFailure;

function fail(errors: string[]): AuthFailure {
  return { ok: false, errors };
}

function success<T>(user: T): AuthSuccess<T> {
  return { ok: true, user };
}

export async function signUp(input: SignupInput): Promise<AuthResult<Awaited<ReturnType<typeof createUser>>>> {
  const validation = validateSignupInput(input);

  if (!validation.ok) {
    return fail(validation.errors);
  }

  const existing = await findUserByEmail(validation.data.email);

  if (existing) {
    return fail(["An account with that email already exists."]);
  }

  const passwordHash = await hashPassword(validation.data.password);

  const user = await createUser({
    email: validation.data.email,
    passwordHash,
    name: validation.data.name,
  });

  await setSessionCookie(user.id);

  return success(user);
}

export async function signIn(input: LoginInput): Promise<AuthResult<{
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}>> {
  const validation = validateLoginInput(input);

  if (!validation.ok) {
    return fail(validation.errors);
  }

  const user = await findUserByEmail(validation.data.email);

  if (!user) {
    return fail(["Invalid email or password."]);
  }

  const validPassword = await verifyPassword(validation.data.password, user.passwordHash);

  if (!validPassword) {
    return fail(["Invalid email or password."]);
  }

  await setSessionCookie(user.id);

  return success({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}

export async function signOut(): Promise<void> {
  await clearSessionCookie();
}