import dotenv from "dotenv";
import type { CalEvent, GoogleEvent, GoogleEventList } from "./calendarTypes";
import { cached } from "./cached";

dotenv.config();

// The calendars the clock may read: also the allowlist for /api/events, so nobody
// can use the server's API key to read other calendars.
export const CALENDARS: Record<string, { label: string; color: string }> = {
  "kc72g1ctfg8b88df34qqb62d1s@group.calendar.google.com": { label: "ACM", color: "#1e6fd9" },
  "c_d025da6dd12eef635c3eaadaa5f28ec45c98523cd5241f7248da67632f8522ff@group.calendar.google.com": {
    label: "LUG",
    color: "#2e8b57",
  },
};

// "2026-11-09" for a moment in Chicago; text in this form compares correctly
const chicagoDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

async function fetchCalendar(id: string, apiKey: string): Promise<CalEvent[]> {
  const now = Date.now();
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`);
  url.search = new URLSearchParams({
    key: apiKey,
    singleEvents: "true", // expand weekly meetings into separate occurrences
    orderBy: "startTime", // requires singleEvents
    // A wide window; the "today in Chicago" filter happens below
    timeMin: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    timeMax: new Date(now + 36 * 60 * 60 * 1000).toISOString(),
    maxResults: "50",
  }).toString();

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  // Never log the URL: it contains the API key
  if (!res.ok) throw new Error(`Google Calendar HTTP ${res.status} for ${CALENDARS[id].label}`);
  const data = (await res.json()) as GoogleEventList;

  const { label, color } = CALENDARS[id];
  return (data.items ?? [])
    .filter((e: GoogleEvent) => e.status !== "cancelled" && e.summary)
    .map((e: GoogleEvent) => ({
      title: e.summary ?? "",
      start: e.start.dateTime ?? e.start.date ?? "",
      end: e.end.dateTime ?? e.end.date ?? "",
      allDay: !e.start.dateTime,
      location: e.location,
      label,
      color,
    }));
}

function isToday(e: CalEvent, now: Date): boolean {
  const today = chicagoDate.format(now);
  if (e.allDay) return e.start <= today && today < e.end; // end is the day after
  const start = new Date(e.start);
  const end = new Date(e.end);
  return chicagoDate.format(start) === today || (start <= now && now < end);
}

// One cached fetcher per set of calendars (the clock always asks for the same set)
const fetchers = new Map<string, () => Promise<CalEvent[]>>();

async function getEvents(requestedIds: string[]): Promise<CalEvent[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return []; // no key yet: the panel hides itself

  const ids = requestedIds.filter((id) => id in CALENDARS);
  if (ids.length === 0) return [];

  const cacheKey = ids.join(",");
  let fetchAll = fetchers.get(cacheKey);
  if (!fetchAll) {
    fetchAll = cached(async () => {
      const results = await Promise.allSettled(ids.map((id) => fetchCalendar(id, apiKey)));
      const events: CalEvent[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") events.push(...r.value);
        else console.error("Calendar fetch failed:", r.reason);
      }
      if (events.length === 0 && results.every((r) => r.status === "rejected")) {
        throw new Error("All calendar requests failed");
      }
      return events;
    }, 10);
    fetchers.set(cacheKey, fetchAll);
  }

  const now = new Date();
  return (await fetchAll())
    .filter((e) => isToday(e, now))
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start));
}

export default getEvents;
