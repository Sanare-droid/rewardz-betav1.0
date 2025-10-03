// Minimal, idempotent global fetch retry wrapper to mitigate transient network
// failures (e.g., proxy, CORS preflight, or instrumentation wrappers).
(function applyFetchPatch() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__FETCH_PATCHED__) return;
  if (!w.fetch) return;
  const origFetch = w.fetch.bind(w);

  async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, attempts = 2): Promise<Response> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await origFetch(input as any, init);
        return res;
      } catch (err) {
        lastErr = err;
        // Small backoff before retrying
        await new Promise((r) => setTimeout(r, i === 0 ? 120 : 300));
      }
    }
    throw lastErr;
  }

  w.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
    // Only retry on network-layer failures, not HTTP errors
    return fetchWithRetry(input, init, 3);
  } as typeof fetch;

  w.__FETCH_PATCHED__ = true;
})();
