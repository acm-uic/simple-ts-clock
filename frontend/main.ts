import { getData, renderGroups } from "./getData";
import "@fontsource/montserrat";
import "./main.css";
import { type Panel, startRotator } from "./rotator";
import type { Arrival, ArrivalGroup } from "../src/util/transitTypes";
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

const demoData: StringIndexes = {
  bus: renderGroups(demoTransit, "bus"),
  train: renderGroups(demoTransit, "train"),
  weather: "<p>Mostly Clear (est.)</p><p>61 &#176;F | 16 &#176;C</p>",
  messages: "<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolore eveniet pariatur sed expedita</p>",
  events:
    '<ul><li class="event happeningNow"><div class=eventName><span>Test Event 1</span></div><div class=eventDate><i class="fas icon fa-calendar-alt"></i><span>May 25</span></div><div class=eventTime><i class="fas icon fa-clock"></i><span>02:00 PM - 04:00 PM</span></div><div class=eventLocation><i class="fas icon fa-map-marker-alt"></i><span>SELE 2264</span></div><li class=event><div class=eventName><span>Test Event 2</span></div><div class=eventDate><i class="fas icon fa-calendar-alt"></i><span>May 25</span></div><div class=eventTime><i class="fas icon fa-clock"></i><span>02:00 PM - 04:00 PM</span></div><div class=eventLocation><i class="fas icon fa-map-marker-alt"></i><span>SELE 2264</span></div><li class=event><div class=eventName><span>Test Event 3</span></div><div class=eventDate><i class="fas icon fa-calendar-alt"></i><span>May 25</span></div><div class=eventTime><i class="fas icon fa-clock"></i><span>02:00 PM - 04:00 PM</span></div><div class=eventLocation><i class="fas icon fa-map-marker-alt"></i><span>SELE 2264</span></div><li class=event><div class=eventName><span>Test Event 4</span></div><div class=eventDate><i class="fas icon fa-calendar-alt"></i><span>May 25</span></div><div class=eventTime><i class="fas icon fa-clock"></i><span>02:00 PM - 04:00 PM</span></div><div class=eventLocation><i class="fas icon fa-map-marker-alt"></i><span>SELE 2264</span></div><li class=event><div class=eventName><span>Test Event 5</span></div><div class=eventDate><i class="fas icon fa-calendar-alt"></i><span>May 25</span></div><div class=eventTime><i class="fas icon fa-clock"></i><span>02:00 PM - 04:00 PM</span></div><div class=eventLocation><i class="fas icon fa-map-marker-alt"></i><span>SELE 2264</span></div><li class=event><div class=eventName><span>Test Event 6</span></div><div class=eventDate><i class="fas icon fa-calendar-alt"></i><span>May 25</span></div><div class=eventTime><i class="fas icon fa-clock"></i><span>02:00 PM - 04:00 PM</span></div><div class=eventLocation><i class="fas icon fa-map-marker-alt"></i><span>SELE 2264</span></div><li class=event><div class=eventName><span>Test Event 7</span></div><div class=eventDate><i class="fas icon fa-calendar-alt"></i><span>May 25</span></div><div class=eventTime><i class="fas icon fa-clock"></i><span>02:00 PM - 04:00 PM</span></div><div class=eventLocation><i class="fas icon fa-map-marker-alt"></i><span>SELE 2264</span></div><li class=event><div class=eventName><span>Test Event 8</span></div><div class=eventDate><i class="fas icon fa-calendar-alt"></i><span>May 25</span></div><div class=eventTime><i class="fas icon fa-clock"></i><span>02:00 PM - 04:00 PM</span></div><div class=eventLocation><i class="fas icon fa-map-marker-alt"></i><span>SELE 2264</span></div></ul>',
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
    case "offline":
      document.getElementById(`${mode}Mode`)!.style.display = "block";
      break;
    default:
      getData();
      setInterval(getData, 120000);
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
      isReady: () => events.children.length > 0,
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
