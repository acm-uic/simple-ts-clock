import type { Arrival, ArrivalGroup } from "../src/util/transitTypes";
import type { Weather } from "../src/util/weatherTypes";
import { escapeHtml } from "./escapeHtml";
import { loadEvents } from "./events";
import { loadFlyers } from "./flyers";
import { load } from "./load";
import { showWeather } from "./weatherEffects";

const ctaRouteColors: Record<string, string> = {
  // TODO: Pick Better Colors
  Red: "#c10000",
  Blue: "#03396c",
  Brn: "#560d0d",
  G: "#004a2f",
  Org: "#ff6337",
  Pink: "#ff3e6d",
  P: "#866ec7",
  Y: "#e4c666",
};

// One arrival: "Due" or "7m", plus its flags
function renderArrival(a: Arrival): string {
  const time = a.minutes === "due" ? "Due" : `${a.minutes}m`;

  const flags = [
    a.delayed ? `<span class="flag delayed">Delayed</span>` : "",
    a.scheduledOnly ? `<span class="flag scheduled">sched.</span>` : "",
    a.crowding === "FULL" ? `<span class="flag full">Full</span>` : "",
  ].join("");

  return `<span class="arrival"><span class="time">${time}</span>${flags}</span>`;
}

// One group: route badge, direction, up to two arrivals
function renderGroup(g: ArrivalGroup): string {
  const color = ctaRouteColors[g.route] ?? "";
  return `<li class="group">
    <span class="route icon" style="background-color:${color}">${escapeHtml(g.route)}</span>
    <span class="direction">${escapeHtml(g.direction)}</span>
    ${g.arrivals.map(renderArrival).join("")}
  </li>`;
}

export function renderGroups(groups: ArrivalGroup[], mode: "bus" | "train"): string {
  return groups
    .filter((g) => g.mode === mode)
    .map(renderGroup)
    .join("");
}

export function getData(): void {
  load<ArrivalGroup[]>("transit", (groups) => {
    document.getElementById("train")!.innerHTML = renderGroups(groups, "train");
    document.getElementById("bus")!.innerHTML = renderGroups(groups, "bus");
  });
  load<Weather>("weather", (w) => {
    const estimate = w.source === "forecast" ? " (est.)" : "";
    document.getElementById("weather")!.innerHTML =
      `<p>${escapeHtml(w.description)}${estimate}</p><p>${w.tempF} &#176;F | ${w.tempC} &#176;C</p>`;
    showWeather(w);
  });
  loadEvents();
  loadFlyers();
}
