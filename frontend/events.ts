import type { CalEvent } from "../src/util/calendarTypes";
import { escapeHtml } from "./escapeHtml";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  hour: "numeric",
  minute: "2-digit",
});

function timeRange(e: CalEvent): string {
  if (e.allDay) return "All day";
  return `${timeFormat.format(new Date(e.start))} – ${timeFormat.format(new Date(e.end))}`;
}

function renderEvent(e: CalEvent, now: number): string {
  const start = e.allDay ? Number.NEGATIVE_INFINITY : Date.parse(e.start);
  const end = e.allDay ? Number.POSITIVE_INFINITY : Date.parse(e.end);
  const state = now >= end ? " finished" : now >= start ? " happeningNow" : "";
  const location = e.location
    ? `<div class="eventLocation"><i class="fas icon fa-map-marker-alt"></i><span>${escapeHtml(e.location)}</span></div>`
    : "";
  return `<li class="event${state}">
    <div class="eventName"><span class="eventLabel" style="background-color:${e.color}">${escapeHtml(e.label)}</span><span>${escapeHtml(e.title)}</span></div>
    <div class="eventTime"><i class="fas icon fa-clock"></i><span>${timeRange(e)}</span></div>
    ${location}
  </li>`;
}

// Today's events as a list; an empty list renders nothing, so the panel is skipped
export function renderEvents(events: CalEvent[], now = Date.now()): string {
  if (events.length === 0) return "";
  return `<ul>${events.map((e) => renderEvent(e, now)).join("")}</ul>`;
}

export async function loadEvents(calendars: string): Promise<void> {
  const el = document.getElementById("events");
  if (!el || !calendars) return;
  try {
    const res = await fetch(`${window.location.origin}/api/events?calendar=${encodeURIComponent(calendars)}`);
    if (!res.ok) return; // keep whatever is on screen
    const events: CalEvent[] = await res.json();
    el.innerHTML = renderEvents(events);
  } catch (err) {
    console.error("Events update failed:", err);
  }
}
