type ApiErrorOptions = {
    code?: string;
    details?: string[];
    headers?: HeadersInit;
};

export function jsonSuccess<T>(data: T, status = 200): Response {
    return Response.json({ ok: true, data }, { status });
}

export function jsonError(message: string, status: number, options: ApiErrorOptions = {}): Response {
    const body = {
        ok: false as const,
        error: {
            message,
            ...(options.code ? { code: options.code } : {}),
            ...(options.details && options.details.length > 0 ? { details: options.details } : {}),
        },
    };

    return Response.json(body, {
        status,
        ...(options.headers ? { headers: options.headers } : {}),
    });
}
