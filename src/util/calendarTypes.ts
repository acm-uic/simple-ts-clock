export interface CalEvent {
  title: string;
  start: string; // ISO date-time, or "2026-11-09" for all-day events
  end: string; // all-day: the day after the last day (Google's convention)
  allDay: boolean;
  location?: string;
  label: string; // "ACM", "LUG"
  color: string; // CSS color for the label
}

// The fields we read from Google Calendar's events.list
export interface GoogleEvent {
  status?: string; // "cancelled" for removed occurrences
  summary?: string; // missing on private events in public calendars
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export interface GoogleEventList {
  items?: GoogleEvent[];
}
