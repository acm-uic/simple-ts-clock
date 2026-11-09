import { getData, renderGroups } from "./getData";
import "@fontsource/montserrat";
// Icons from the installed package, not a CDN, so they load even if the network is slow at boot
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "./main.css";
import { type Panel, startRotator } from "./rotator";
import type { CalEvent } from "../src/util/calendarTypes";
import type { TickerItem } from "../src/util/tickerTypes";
import type { Arrival, ArrivalGroup } from "../src/util/transitTypes";
import { renderEvents } from "./events";
import { flyersReady, setFlyers, showNextFlyer } from "./flyers";
import { fitTicker, getMessages, renderTicker } from "./getMessages";
import { startWeatherEffects } from "./weatherEffects";

const timeElement = document.getElementById("time")!;
const dateElement = document.getElementById("date")!;
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  hour: "2-digit",
  minute: "2-digit",
});

interface StringIndexes {
  [key: string]: string;
}

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
const todayChicago = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
const demoEvents: CalEvent[] = [
  {
    title: "Fall Hackathon Signups",
    start: todayChicago,
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

const demoData: StringIndexes = {
  bus: renderGroups(demoTransit, "bus"),
  train: renderGroups(demoTransit, "train"),
  weather: "<p>Mostly Clear (est.)</p><p>61 &#176;F | 16 &#176;C</p>",
  messages: renderTicker(demoTicker),
  events: renderEvents(demoEvents),
};

function updateTime(): void {
  const now = new Date();
  const nowFormat = timeFormat.formatToParts(now);
  const hour = nowFormat.find((p) => p.type === "hour")?.value;
  const min = nowFormat.find((p) => p.type === "minute")?.value;
  const date = now.getDate().toString().padStart(2, "0");
  timeElement.innerHTML = `${hour}:${min}`;
  dateElement.innerHTML = `${days[now.getDay()]} | ${months[now.getMonth()]} ${date}`;
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

  const panels: Panel[] = [
    {
      id: "transit",
      el: document.getElementById("transit")!,
      durationMs: PANEL_MS,
      isReady: () => document.querySelector("#bus li, #train li") !== null,
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

  window.onkeydown = (e: KeyboardEvent): void => {
    switch (e.code) {
      case "KeyR":
        window.location.reload();
        break;
      case "KeyD":
        if (confirm("Are you sure that you want to load the default configuration?")) window.location.pathname = "/";
        break;
      case "KeyC":
        document.getElementById("config").style.display = "block";
        break;
      case "Escape":
        document.getElementById("config").style.display = "none";
        break;
    }
  };

  setInterval((): void => {
    window.location.reload();
  }, 7200000);
};
