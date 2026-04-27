export type SignupInput = {
  email: string;
  password: string;
  name?: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!pattern.test(normalized)) {
    return "Enter a valid email address.";
  }

  return null;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/\d/.test(password)) {
    return "Password must include at least one number.";
  }

  return null;
}

function validateName(name?: string | null): string | null {
  if (name == null || name.trim() === "") {
    return null;
  }

  if (name.trim().length > 100) {
    return "Name must be 100 characters or fewer.";
  }

  return null;
}

export function validateSignupInput(input: SignupInput): ValidationResult<SignupInput> {
  const errors: string[] = [];

  const emailError = validateEmail(input.email);
  const passwordError = validatePassword(input.password);
  const nameError = validateName(input.name);

  if (emailError) errors.push(emailError);
  if (passwordError) errors.push(passwordError);
  if (nameError) errors.push(nameError);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      email: normalizeEmail(input.email),
      password: input.password,
      name: input.name?.trim() || null,
    },
  };
}

export function validateLoginInput(input: LoginInput): ValidationResult<LoginInput> {
  const errors: string[] = [];

  const emailError = validateEmail(input.email);

  if (emailError) errors.push(emailError);
  if (!input.password || input.password.trim().length === 0) {
    errors.push("Password is required.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      email: normalizeEmail(input.email),
      password: input.password,
    },
  };
}