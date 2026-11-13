// Fetch one data route and hand the result to `show`. A failed update keeps what's on screen.
export async function load<T>(name: string, show: (data: T) => void): Promise<void> {
  try {
    const res = await fetch(`/api/${name}`);
    if (res.ok) show(await res.json());
  } catch (err) {
    console.error(`${name} update failed:`, err);
  }
}
