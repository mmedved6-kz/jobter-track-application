export const applicationStatuses = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export type JobApplicationListQuery = {
    search?: string;
    status?: ApplicationStatus;
    page?: number;
    pageSize?: number;
};

export type JobApplicationCreateInput = {
    company?: string;
    role?: string;
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

const listQueryDefaults = {
    page: 1,
    pageSize: 10,
} as const;

const listQueryLimits = {
    pageSizeMax: 100,
    searchMaxLength: 120,
} as const;

function normalizeOptionalText(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizeLooseText(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function validateLooseText(value: unknown, label: string, maxLength: number): string | null {
    if (value === undefined) {
        return null;
    }

    if (typeof value !== "string") {
        return `${label} must be a string.`;
    }

    if (value.trim().length > maxLength) {
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
        return null;
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

function normalizeAppliedAt(value: unknown): string | Date | undefined {
    if (value == null) {
        return undefined;
    }

    if (value instanceof Date) {
        return value;
    }

    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function parsePositiveIntegerParam(
    params: URLSearchParams,
    key: "page" | "pageSize"
): { value?: number; error?: string } {
    const values = params.getAll(key);
    if (values.length === 0) {
        return {};
    }

    if (values.length > 1) {
        return { error: `${key} must be provided once.` };
    }

    const value = values[0];
    if (!/^\d+$/.test(value)) {
        return { error: `${key} must be a positive integer.` };
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        return { error: `${key} must be a positive integer.` };
    }

    if (key === "pageSize" && parsed > listQueryLimits.pageSizeMax) {
        return { error: `pageSize must be ${listQueryLimits.pageSizeMax} or less.` };
    }

    return { value: parsed };
}

export function validateJobApplicationListQuery(
    params: URLSearchParams
): ValidationResult<JobApplicationListQuery> {
    const errors: string[] = [];
    const data: JobApplicationListQuery = {
        page: listQueryDefaults.page,
        pageSize: listQueryDefaults.pageSize,
    };

    const searchValues = params.getAll("search");
    if (searchValues.length > 1) {
        errors.push("search must be provided once.");
    } else if (searchValues.length === 1) {
        const search = searchValues[0].trim();
        if (search.length > listQueryLimits.searchMaxLength) {
            errors.push(`search must be ${listQueryLimits.searchMaxLength} characters or fewer.`);
        } else if (search.length > 0) {
            data.search = search;
        }
    }

    const statusValues = params.getAll("status");
    if (statusValues.length > 1) {
        errors.push("status must be provided once.");
    } else if (statusValues.length === 1) {
        const statusRaw = statusValues[0];
        if (statusRaw) {
            const status = validateStatus(statusRaw);
            if (!status) {
                errors.push("status must be one of APPLIED, INTERVIEW, OFFER, or REJECTED.");
            } else {
                data.status = status;
            }
        }
    }

    const page = parsePositiveIntegerParam(params, "page");
    if (page.error) {
        errors.push(page.error);
    } else if (page.value !== undefined) {
        data.page = page.value;
    }

    const pageSize = parsePositiveIntegerParam(params, "pageSize");
    if (pageSize.error) {
        errors.push(pageSize.error);
    } else if (pageSize.value !== undefined) {
        data.pageSize = pageSize.value;
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    return { ok: true, data };
}

export function validateCreateJobApplicationInput(input: unknown): ValidationResult<JobApplicationCreateInput> {
    if (typeof input !== "object" || input === null) {
        return { ok: false, errors: ["Request body must be an object."] };
    }

    const record = input as Record<string, unknown>;
    const errors: string[] = [];

    const companyError = validateLooseText(record.company, "Company", 120);
    const roleError = validateLooseText(record.role, "Role", 120);
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
            company: record.company === undefined ? undefined : normalizeLooseText(record.company),
            role: record.role === undefined ? undefined : normalizeLooseText(record.role),
            location: normalizeOptionalText(record.location),
            jobUrl: normalizeOptionalText(record.jobUrl),
            status: status ?? undefined,
            appliedAt: normalizeAppliedAt(record.appliedAt),
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
        const error = validateLooseText(record.company, "Company", 120);
        if (error) errors.push(error);
        else data.company = normalizeLooseText(record.company);
    }

    if (record.role !== undefined) {
        const error = validateLooseText(record.role, "Role", 120);
        if (error) errors.push(error);
        else data.role = normalizeLooseText(record.role);
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
        else {
            const normalized = normalizeAppliedAt(record.appliedAt);
            if (normalized !== undefined) {
                data.appliedAt = normalized;
            }
        }
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
