type RateRecord = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __ztuRateLimitStore?: Map<string, RateRecord>;
};

const store = globalForRateLimit.__ztuRateLimitStore ?? new Map<string, RateRecord>();
globalForRateLimit.__ztuRateLimitStore = store;

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}
