import { getCurrentUser } from "@/lib/auth/current-user";
import { listApplications } from "@/lib/services/job-application-service";
import { applicationStatuses } from "@/lib/validation/job-application";

function getQueryValue(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
}

function formatDate(value: Date): string {
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);
}

function getStatusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function Home({
    searchParams,
}: {
    searchParams?: Record<string, string | string[] | undefined>;
}) {
    const user = await getCurrentUser();
    const search = getQueryValue(searchParams?.search);
    const status = getQueryValue(searchParams?.status);
    const page = Number(getQueryValue(searchParams?.page) ?? 1) || 1;

    const queryStatus = applicationStatuses.includes(status as (typeof applicationStatuses)[number])
        ? (status as (typeof applicationStatuses)[number])
        : undefined;

    const applicationsResult = user
        ? await listApplications(user.id, {
              search: search?.trim() || undefined,
              status: queryStatus,
              page,
              pageSize: 10,
          })
        : null;

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
                <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl space-y-3">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                                Jobter Tracker
                            </p>
                            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                                Track applications without losing the thread.
                            </h1>
                            <p className="max-w-2xl text-base leading-7 text-slate-600">
                                Phase 1 is the working foundation: secure auth is in place, and the
                                application CRUD API plus the first list view are ready to grow into a
                                kanban board later.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <div className="font-medium text-slate-900">
                                {user ? user.email : "Not signed in"}
                            </div>
                            <div>{user ? "Dashboard access enabled" : "Use the auth API to sign in"}</div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Applications</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-950">
                            {applicationsResult ? applicationsResult.total : "—"}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Status filters</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-950">4</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Phase 1</p>
                        <p className="mt-2 text-lg font-medium text-slate-950">API + list view</p>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-950">Applications</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Search, status filtering, and pagination are wired into the list query.
                                </p>
                            </div>
                            <form className="grid gap-3 sm:grid-cols-3" method="get">
                                <input
                                    name="search"
                                    defaultValue={search}
                                    placeholder="Search company, role, notes"
                                    className="h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-sky-500"
                                />
                                <select
                                    name="status"
                                    defaultValue={queryStatus ?? ""}
                                    className="h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-sky-500"
                                >
                                    <option value="">All statuses</option>
                                    {applicationStatuses.map((option) => (
                                        <option key={option} value={option}>
                                            {getStatusLabel(option)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
                                >
                                    Filter
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="p-6">
                        {!user ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                                Sign in through the auth routes to view and manage your applications.
                            </div>
                        ) : applicationsResult && applicationsResult.items.length > 0 ? (
                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Company</th>
                                            <th className="px-4 py-3 font-medium">Role</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Applied</th>
                                            <th className="px-4 py-3 font-medium">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {applicationsResult.items.map((application) => (
                                            <tr key={application.id} className="hover:bg-slate-50/70">
                                                <td className="px-4 py-4 font-medium text-slate-950">
                                                    <div>{application.company}</div>
                                                    {application.jobUrl ? (
                                                        <a
                                                            href={application.jobUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mt-1 inline-block text-xs text-sky-700 hover:underline"
                                                        >
                                                            Job link
                                                        </a>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-4 text-slate-700">{application.role}</td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                        {getStatusLabel(application.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">{formatDate(application.appliedAt)}</td>
                                                <td className="px-4 py-4 text-slate-600">{application.location ?? "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                                {user
                                    ? "No applications yet. Create one via POST /api/applications."
                                    : "No dashboard data available until you sign in."}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
