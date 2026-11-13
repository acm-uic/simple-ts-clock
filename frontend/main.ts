// Only the Latin letters, in the three weights the page uses (regular, semi-bold, bold)
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/latin-700.css";
import "./main.css";
import type { CalEvent } from "../src/util/calendarTypes";
import { chicagoDate } from "../src/util/chicagoDate";
import type { TickerItem } from "../src/util/tickerTypes";
import type { Arrival, ArrivalGroup } from "../src/util/transitTypes";
import { scrollToFit } from "./autoScroll";
import { renderEvents } from "./events";
import { flyersReady, setFlyers, showNextFlyer } from "./flyers";
import { getData, renderGroups } from "./getData";
import { fitTicker, getMessages, renderTicker } from "./getMessages";
import { type Panel, startRotator } from "./rotator";
import { startWeatherEffects } from "./weatherEffects";

const timeElement = document.getElementById("time")!;
const dateElement = document.getElementById("date")!;
// Time and date are both Chicago's, whatever the machine's own time zone is
const clockFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "long",
  month: "long",
  day: "2-digit",
});

// Small helper so each demo arrival is one line
const demoArrival = (minutes: number | "due", flags: Partial<Arrival> = {}): Arrival => ({
  mode: "bus",
  route: "",
  direction: "",
  destination: "",
  stopName: "",
  minutes,
  delayed: false,
  scheduledOnly: false,
  fault: false,
  canceled: false,
  expressed: false,
  ...flags,
});

const demoTransit: ArrivalGroup[] = [
  {
    mode: "train",
    route: "Blue",
    direction: "Forest Park-bound",
    arrivals: [demoArrival("due"), demoArrival(9, { delayed: true })],
  },
  {
    mode: "train",
    route: "Blue",
    direction: "O'Hare-bound",
    arrivals: [demoArrival(10, { scheduledOnly: true })],
  },
  {
    mode: "bus",
    route: "8",
    direction: "Northbound",
    arrivals: [demoArrival(3, { crowding: "FULL" }), demoArrival(14)],
  },
  {
    mode: "bus",
    route: "60",
    direction: "Westbound",
    arrivals: [demoArrival(6)],
  },
];

const demoTicker: TickerItem[] = [
  { source: "weather", level: "severe", text: "Winter Storm Warning issued for Cook County until 6 PM", time: 0 },
  { source: "cta", level: "warning", text: "Blue Line: Trains operating with delays near UIC-Halsted", time: 0 },
  { source: "github", level: "info", text: "PR #54 merged in simple-ts-clock", time: 0 },
  { source: "github", level: "info", text: "sammypatel06 pushed to simple-ts-clock", time: 0 },
];

// Demo events relative to now, so "happening now" and "finished" always show
const HOUR = 60 * 60 * 1000;
const at = (hoursFromNow: number) => new Date(Date.now() + hoursFromNow * HOUR).toISOString();
const demoEvents: CalEvent[] = [
  {
    title: "Fall Hackathon Signups",
    start: chicagoDate(),
    end: "9999-12-31",
    allDay: true,
    label: "ACM",
    color: "#1e6fd9",
  },
  {
    title: "SIG Systems",
    start: at(-3),
    end: at(-2),
    allDay: false,
    location: "CDRLC 2433",
    label: "ACM",
    color: "#1e6fd9",
  },
  {
    title: "Homebrew User Group",
    start: at(-0.5),
    end: at(1),
    allDay: false,
    location: "ACM/LUG Office: CDRLC 2433",
    label: "LUG",
    color: "#2e8b57",
  },
  {
    title: "SIG AI Project",
    start: at(2),
    end: at(3),
    allDay: false,
    location: "CDRLC 2433",
    label: "ACM",
    color: "#1e6fd9",
  },
  { title: "Game Dev User Group", start: at(4), end: at(5.5), allDay: false, label: "LUG", color: "#2e8b57" },
];

const demoData: Record<string, string> = {
  bus: renderGroups(demoTransit, "bus"),
  train: renderGroups(demoTransit, "train"),
  weather: "<p>Mostly Clear (est.)</p><p>61 &#176;F | 16 &#176;C</p>",
  messages: renderTicker(demoTicker),
  events: renderEvents(demoEvents),
};

function updateTime(): void {
  const now = Object.fromEntries(clockFormat.formatToParts(new Date()).map((p) => [p.type, p.value]));
  timeElement.textContent = `${now.hour}:${now.minute}`;
  dateElement.textContent = `${now.weekday} | ${now.month} ${now.day}`;
}

window.onload = (): void => {
  const mode = window.location.pathname.split("/")[1];
  updateTime();
  setInterval(updateTime, 5000);
  startWeatherEffects();

  switch (mode) {
    // biome-ignore lint/suspicious/noFallthroughSwitchClause: Hey man, the logic makes sense.
    case "demo":
      for (const key in demoData) {
        let element = document.getElementById(`${key}`);
        if (!element) {
          const div = document.createElement("div");
          div.setAttribute("id", key);
          document.querySelector("#switcher")!.appendChild(div);
          element = document.getElementById(`${key}`)!;
        }
        element.innerHTML = demoData[key];
      }
      fitTicker();
      setFlyers([
        { url: "/demo-flyers/tall.svg", name: "Demo flyer (tall)" },
        { url: "/demo-flyers/wide.svg", name: "Demo flyer (wide)" },
      ]);
    case "offline":
      document.getElementById(`${mode}Mode`)!.style.display = "block";
      break;
    default:
      getData();
      setInterval(getData, 120000);
      getMessages();
      setInterval(getMessages, 300000); // 5 minutes; the server caches each source too
      break;
  }

  const PANEL_MS = 10_000;

  // A transit list too tall for its panel slides down to show the rest, and the
  // panel's turn then lasts one full pass. Re-measured whenever the list or the
  // panel changes size (new arrivals, a resized window, a font finishing loading).
  const transit = document.getElementById("transit")!;
  const transitList = document.getElementById("cta")!;
  let transitMs = PANEL_MS;
  const fitTransit = (restart = false): void => {
    transitMs = scrollToFit(transit, transitList, PANEL_MS, restart) || PANEL_MS;
  };
  const transitSize = new ResizeObserver(() => fitTransit());
  transitSize.observe(transit);
  transitSize.observe(transitList);

  const panels: Panel[] = [
    {
      id: "transit",
      el: transit,
      get durationMs() {
        return transitMs;
      },
      isReady: () => document.querySelector("#bus li, #train li") !== null,
      refresh: () => fitTransit(true), // back on screen: start from the top
    },
  ];

  const events = document.getElementById("events");
  if (events) {
    panels.push({
      id: "events",
      el: events,
      durationMs: PANEL_MS,
      isReady: () => events.querySelector("li.event:not(.finished)") !== null,
    });
  }

  const flyers = document.getElementById("flyers");
  if (flyers) {
    panels.push({
      id: "flyers",
      el: flyers,
      durationMs: PANEL_MS,
      isReady: flyersReady,
      refresh: showNextFlyer, // a different flyer each turn
    });
  }

  startRotator(panels, document.getElementById("fallback")!);

  // "R" on a keyboard reloads the page
  window.onkeydown = (e: KeyboardEvent): void => {
    if (e.code === "KeyR") window.location.reload();
  };

  // A fresh start every 2 hours picks up new deploys and clears anything that has built up
  setInterval(() => window.location.reload(), 2 * 60 * 60 * 1000);
};
