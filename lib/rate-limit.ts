type RateEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateEntry>();

export function rateLimit(
  key: string,
  options: { max: number; windowMs: number }
) {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.max - 1 };
  }

  if (existing.count >= options.max) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  store.set(key, existing);
  return { allowed: true, remaining: options.max - existing.count };
}
