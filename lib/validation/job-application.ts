export const applicationStatuses = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export type JobApplicationListQuery = {
    search?: string;
    status?: ApplicationStatus;
    page?: number;
    pageSize?: number;
};

export type JobApplicationCreateInput = {
    company: string;
    role: string;
    location?: string | null;
    jobUrl?: string | null;
    status?: ApplicationStatus;
    appliedAt?: string | Date;
    notes?: string | null;
};

export type JobApplicationUpdateInput = {
    company?: string;
    role?: string;
    location?: string | null;
    jobUrl?: string | null;
    status?: ApplicationStatus;
    appliedAt?: string | Date;
    notes?: string | null;
};

export type ValidationResult<T> =
    | { ok: true; data: T }
    | { ok: false; errors: string[] };

function normalizeText(value: string): string {
    return value.trim();
}

function normalizeOptionalText(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function validateRequiredText(value: unknown, label: string, maxLength: number): string | null {
    if (typeof value !== "string") {
        return `${label} is required.`;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return `${label} is required.`;
    }

    if (trimmed.length > maxLength) {
        return `${label} must be ${maxLength} characters or fewer.`;
    }

    return null;
}

function validateOptionalText(value: unknown, label: string, maxLength: number): string | null {
    if (value == null) {
        return null;
    }

    if (typeof value !== "string") {
        return `${label} must be a string.`;
    }

    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
        return `${label} must be ${maxLength} characters or fewer.`;
    }

    return null;
}

function validateStatus(value: unknown): ApplicationStatus | null {
    if (typeof value !== "string") {
        return null;
    }

    return applicationStatuses.includes(value as ApplicationStatus) ? (value as ApplicationStatus) : null;
}

function validateUrl(value: unknown): string | null {
    if (value == null || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        return "Job URL must be a string.";
    }

    try {
        const parsed = new URL(value.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return "Job URL must use http or https.";
        }
    } catch {
        return "Job URL must be a valid URL.";
    }

    return null;
}

function validateAppliedAt(value: unknown): string | null {
    if (value == null || value === "") {
        return "Applied date must be a valid date.";
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return "Applied date must be a valid date.";
        }

        return null;
    }

    if (typeof value !== "string") {
        return "Applied date must be a string or Date.";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Applied date must be a valid date.";
    }

    return null;
}

export function validateCreateJobApplicationInput(input: unknown): ValidationResult<JobApplicationCreateInput> {
    if (typeof input !== "object" || input === null) {
        return { ok: false, errors: ["Request body must be an object."] };
    }

    const record = input as Record<string, unknown>;
    const errors: string[] = [];

    const companyError = validateRequiredText(record.company, "Company", 120);
    const roleError = validateRequiredText(record.role, "Role", 120);
    const locationError = validateOptionalText(record.location, "Location", 120);
    const jobUrlError = validateUrl(record.jobUrl);
    const notesError = validateOptionalText(record.notes, "Notes", 5000);
    const appliedAtError = record.appliedAt === undefined ? null : validateAppliedAt(record.appliedAt);
    const status = validateStatus(record.status);

    if (companyError) errors.push(companyError);
    if (roleError) errors.push(roleError);
    if (locationError) errors.push(locationError);
    if (jobUrlError) errors.push(jobUrlError);
    if (notesError) errors.push(notesError);
    if (appliedAtError) errors.push(appliedAtError);

    if (record.status != null && !status) {
        errors.push("Status must be one of APPLIED, INTERVIEW, OFFER, or REJECTED.");
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    return {
        ok: true,
        data: {
            company: normalizeText(record.company as string),
            role: normalizeText(record.role as string),
            location: normalizeOptionalText(record.location),
            jobUrl: normalizeOptionalText(record.jobUrl),
            status: status ?? undefined,
            appliedAt: typeof record.appliedAt === "string" || record.appliedAt instanceof Date ? record.appliedAt : undefined,
            notes: normalizeOptionalText(record.notes),
        },
    };
}

export function validateUpdateJobApplicationInput(input: unknown): ValidationResult<JobApplicationUpdateInput> {
    if (typeof input !== "object" || input === null) {
        return { ok: false, errors: ["Request body must be an object."] };
    }

    const record = input as Record<string, unknown>;
    const errors: string[] = [];
    const data: JobApplicationUpdateInput = {};

    if (record.company !== undefined) {
        const error = validateRequiredText(record.company, "Company", 120);
        if (error) errors.push(error);
        else data.company = normalizeText(record.company as string);
    }

    if (record.role !== undefined) {
        const error = validateRequiredText(record.role, "Role", 120);
        if (error) errors.push(error);
        else data.role = normalizeText(record.role as string);
    }

    if (record.location !== undefined) {
        const error = validateOptionalText(record.location, "Location", 120);
        if (error) errors.push(error);
        else data.location = normalizeOptionalText(record.location);
    }

    if (record.jobUrl !== undefined) {
        const error = validateUrl(record.jobUrl);
        if (error) errors.push(error);
        else data.jobUrl = normalizeOptionalText(record.jobUrl);
    }

    if (record.notes !== undefined) {
        const error = validateOptionalText(record.notes, "Notes", 5000);
        if (error) errors.push(error);
        else data.notes = normalizeOptionalText(record.notes);
    }

    if (record.appliedAt !== undefined) {
        const error = validateAppliedAt(record.appliedAt);
        if (error) errors.push(error);
        else data.appliedAt = record.appliedAt as string | Date;
    }

    if (record.status !== undefined) {
        const status = validateStatus(record.status);
        if (!status) {
            errors.push("Status must be one of APPLIED, INTERVIEW, OFFER, or REJECTED.");
        } else {
            data.status = status;
        }
    }

    if (Object.keys(data).length === 0) {
        errors.push("Provide at least one field to update.");
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    return { ok: true, data };
}
