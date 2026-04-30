import { getJobApplication, listJobApplications, createJobApplication, updateJobApplication, deleteJobApplication, JobApplicationRecord, JobApplicationListResult } from "@/lib/repositories/job-application-repository";
import { validateCreateJobApplicationInput, validateUpdateJobApplicationInput, JobApplicationListQuery } from "@/lib/validation/job-application";

export type JobApplicationResult<T> =
    | { ok: true; data: T }
    | { ok: false; errors: string[] };

export async function listApplications(userId: string, query: JobApplicationListQuery = {}): Promise<JobApplicationListResult> {
    return listJobApplications(userId, query);
}

export async function getApplication(userId: string, id: string): Promise<JobApplicationRecord | null> {
    return getJobApplication(userId, id);
}

export async function createApplication(userId: string, input: unknown): Promise<JobApplicationResult<JobApplicationRecord>> {
    const validation = validateCreateJobApplicationInput(input);
    if (!validation.ok) {
        return { ok: false, errors: validation.errors };
    }

    const application = await createJobApplication(userId, validation.data);
    return { ok: true, data: application };
}

export async function updateApplication(userId: string, id: string, input: unknown): Promise<JobApplicationResult<JobApplicationRecord>> {
    const validation = validateUpdateJobApplicationInput(input);
    if (!validation.ok) {
        return { ok: false, errors: validation.errors };
    }

    const application = await updateJobApplication(userId, id, validation.data);
    if (!application) {
        return { ok: false, errors: ["Application not found."] };
    }

    return { ok: true, data: application };
}

export async function removeApplication(userId: string, id: string): Promise<JobApplicationResult<null>> {
    const deleted = await deleteJobApplication(userId, id);
    if (!deleted) {
        return { ok: false, errors: ["Application not found."] };
    }

    return { ok: true, data: null };
}
