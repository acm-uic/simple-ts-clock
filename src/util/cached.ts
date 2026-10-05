export function cached<T>(getFresh: () => Promise<T>, maxAgeMinutes: number): () => Promise<T> {
  let saved: { value: T; at: number } | undefined;

  return async () => {
    if (saved && Date.now() - saved.at < maxAgeMinutes * 60_000) return saved.value;
    try {
      const value = await getFresh();
      saved = { value, at: Date.now() };
      return value;
    } catch (err) {
      console.error(err);
      if (saved) return saved.value;
      else throw err;
    }
  };
}
