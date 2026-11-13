import { cached } from "./cached";
import type { CalEvent, GoogleEvent, GoogleEventList } from "./calendarTypes";
import { chicagoDate } from "./chicagoDate";
import { fetchJson } from "./fetchJson";

// The calendars shown on the clock
const CALENDARS: Record<string, { label: string; color: string }> = {
  "kc72g1ctfg8b88df34qqb62d1s@group.calendar.google.com": { label: "ACM", color: "#1e6fd9" },
  "c_d025da6dd12eef635c3eaadaa5f28ec45c98523cd5241f7248da67632f8522ff@group.calendar.google.com": {
    label: "LUG",
    color: "#2e8b57",
  },
};

async function fetchCalendar(id: string): Promise<CalEvent[]> {
  const { label, color } = CALENDARS[id];
  const now = Date.now();
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`);
  url.search = new URLSearchParams({
    key: process.env.GOOGLE_API_KEY ?? "",
    singleEvents: "true", // expand weekly meetings into separate occurrences
    orderBy: "startTime", // requires singleEvents
    // A wide window; the "today in Chicago" filter happens below
    timeMin: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    timeMax: new Date(now + 36 * 60 * 60 * 1000).toISOString(),
    maxResults: "50",
  }).toString();

  const data = await fetchJson<GoogleEventList>(url, `Google Calendar (${label})`);
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
  const today = chicagoDate(now);
  if (e.allDay) return e.start <= today && today < e.end; // end is the day after
  const start = new Date(e.start);
  const end = new Date(e.end);
  return chicagoDate(start) === today || (start <= now && now < end);
}

// Each calendar fails on its own; only all of them failing is an error
const fetchAll = cached(async () => {
  const results = await Promise.allSettled(Object.keys(CALENDARS).map((id) => fetchCalendar(id)));
  for (const r of results) if (r.status === "rejected") console.error("Calendar fetch failed:", r.reason);
  if (results.every((r) => r.status === "rejected")) throw new Error("All calendar requests failed");
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}, 10);

async function getEvents(): Promise<CalEvent[]> {
  if (!process.env.GOOGLE_API_KEY) return []; // no key yet: the panel hides itself

  const now = new Date();
  return (await fetchAll())
    .filter((e) => isToday(e, now))
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start));
}

export default getEvents;
