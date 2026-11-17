const TIMED_OUT = Symbol("timed out");

/**
 * Waits for a slow source no longer than `ms`. On a timeout the fallback is
 * returned and `onTimeout` is told, so a page can still answer with what it has.
 * The slow call keeps running in the background; its result is dropped.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
  onTimeout?: () => void
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms);
  });
  try {
    const result = await Promise.race([promise, limit]);
    if (result === TIMED_OUT) {
      onTimeout?.();
      return fallback;
    }
    return result;
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
