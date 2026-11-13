// "Fetch, check the status, parse the JSON", with a timeout, in one place.
// Errors name the label, never the URL: some URLs contain API keys.
export async function fetchJson<T>(url: string | URL, label: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
  return (await res.json()) as T;
}
