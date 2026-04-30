type RateLimitEntry = {
    count: number;
    resetAt: number;
};

// In-memory store for rate limits (key -> {count, resetAt})
const store = new Map<string, RateLimitEntry>();

/**
 * Sliding window rate limiter using in-memory store
 * @param key Unique identifier (e.g., email, IP address)
 * @param maxAttempts Maximum attempts allowed
 * @param windowMs Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = store.get(key);

    // If no entry exists or window has expired, create new entry
    if (!entry || now >= entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    // Increment count and check against limit
    if (entry.count < maxAttempts) {
        entry.count++;
        return true;
    }

    // Rate limit exceeded
    return false;
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
    store.delete(key);
}

/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(key: string, maxAttempts: number): {
    remaining: number;
    resetAt: number;
} {
    const entry = store.get(key);
    const now = Date.now();

    if (!entry || now >= entry.resetAt) {
        return { remaining: maxAttempts, resetAt: now };
    }

    return {
        remaining: Math.max(0, maxAttempts - entry.count),
        resetAt: entry.resetAt,
    };
}

/**
 * Cleanup: Remove expired entries periodically (runs every 5 minutes)
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now >= entry.resetAt) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);
