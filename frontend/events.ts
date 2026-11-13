import type { CalEvent } from "../src/util/calendarTypes";
import { escapeHtml } from "./escapeHtml";
import { load } from "./load";

// Two small line icons, drawn in the text color
const icon = (shapes: string) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes}</svg>`;
const CLOCK_ICON = icon(`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`);
const PIN_ICON = icon(
  `<path d="M12 21s-7-6.5-7-11.5a7 7 0 0 1 14 0C19 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>`,
);

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
    ? `<div class="eventLocation">${PIN_ICON}<span>${escapeHtml(e.location)}</span></div>`
    : "";
  return `<li class="event${state}">
    <div class="eventName"><span class="eventLabel" style="background-color:${e.color}">${escapeHtml(e.label)}</span><span>${escapeHtml(e.title)}</span></div>
    <div class="eventTime">${CLOCK_ICON}<span>${timeRange(e)}</span></div>
    ${location}
  </li>`;
}

// Today's events as a list; an empty list renders nothing, so the panel is skipped
export function renderEvents(events: CalEvent[], now = Date.now()): string {
  if (events.length === 0) return "";
  return `<ul>${events.map((e) => renderEvent(e, now)).join("")}</ul>`;
}

export const loadEvents = (): Promise<void> =>
  load<CalEvent[]>("events", (events) => {
    document.getElementById("events")!.innerHTML = renderEvents(events);
  });
