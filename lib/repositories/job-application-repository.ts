import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { JobApplicationCreateInput, JobApplicationUpdateInput, JobApplicationListQuery } from "@/lib/validation/job-application";

const jobApplicationSelect = {
    id: true,
    userId: true,
    company: true,
    role: true,
    location: true,
    jobUrl: true,
    status: true,
    appliedAt: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
} as const;

export type JobApplicationRecord = Prisma.JobApplicationGetPayload<{
    select: typeof jobApplicationSelect;
}>;

export type JobApplicationListResult = {
    items: JobApplicationRecord[];
    total: number;
    page: number;
    pageSize: number;
};

function buildWhereClause(userId: string, query: JobApplicationListQuery): Prisma.JobApplicationWhereInput {
    const where: Prisma.JobApplicationWhereInput = {
        userId,
    };

    if (query.status) {
        where.status = query.status;
    }

    if (query.search) {
        const search = query.search.trim();
        if (search) {
            where.OR = [
                { company: { contains: search, mode: "insensitive" } },
                { role: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
                { notes: { contains: search, mode: "insensitive" } },
            ];
        }
    }

    return where;
}

export async function listJobApplications(userId: string, query: JobApplicationListQuery = {}): Promise<JobApplicationListResult> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(Math.max(1, query.pageSize ?? 10), 100);
    const where = buildWhereClause(userId, query);

    const [items, total] = await Promise.all([
        prisma.jobApplication.findMany({
            where,
            orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: jobApplicationSelect,
        }),
        prisma.jobApplication.count({ where }),
    ]);

    return { items, total, page, pageSize };
}

export async function getJobApplication(userId: string, id: string): Promise<JobApplicationRecord | null> {
    return prisma.jobApplication.findFirst({
        where: { id, userId },
        select: jobApplicationSelect,
    });
}

export async function createJobApplication(userId: string, data: JobApplicationCreateInput): Promise<JobApplicationRecord> {
    return prisma.jobApplication.create({
        data: {
            userId,
            company: data.company ?? "",
            role: data.role ?? "",
            location: data.location ?? null,
            jobUrl: data.jobUrl ?? null,
            status: data.status ?? "APPLIED",
            appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
            notes: data.notes ?? null,
        },
        select: jobApplicationSelect,
    });
}

export async function updateJobApplication(userId: string, id: string, data: JobApplicationUpdateInput): Promise<JobApplicationRecord | null> {
    const existing = await prisma.jobApplication.findFirst({
        where: { id, userId },
        select: { id: true },
    });

    if (!existing) {
        return null;
    }

    return prisma.jobApplication.update({
        where: { id },
        data: {
            ...(data.company !== undefined ? { company: data.company } : {}),
            ...(data.role !== undefined ? { role: data.role } : {}),
            ...(data.location !== undefined ? { location: data.location } : {}),
            ...(data.jobUrl !== undefined ? { jobUrl: data.jobUrl } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.appliedAt !== undefined ? { appliedAt: new Date(data.appliedAt) } : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        select: jobApplicationSelect,
    });
}

export async function deleteJobApplication(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.jobApplication.findFirst({
        where: { id, userId },
        select: { id: true },
    });

    if (!existing) {
        return false;
    }

    await prisma.jobApplication.delete({
        where: { id },
    });

    return true;
}

export { jobApplicationSelect };
