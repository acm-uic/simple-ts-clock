import type { Weather } from "../src/util/weatherTypes";
import type { Arrival, ArrivalGroup } from "../src/util/transitTypes";
interface StringIndexes {
  [key: string]: string;
}

const ctaRouteColors: StringIndexes = {
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
export interface Config {
  ctaBusStops?: string[];
  ctaTrainStations?: string[];
  weatherLatLong?: string;
  eventCalendars?: string[];
}

export function clearData(elementSelector?: string): void {
  if (!elementSelector) {
    document.getElementById("bus")!.innerHTML = "";
    document.getElementById("train")!.innerHTML = "";
    document.getElementById("weather")!.innerHTML = "";
    document.getElementById("events")!.innerHTML = "";
    document.getElementById("messages")!.innerHTML = "";
  } else {
    document.querySelector(elementSelector)!.innerHTML = "";
  }
}

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
    <span class="route icon" style="background-color:${color}">${g.route}</span>
    <span class="direction">${g.direction}</span>
    ${g.arrivals.map(renderArrival).join("")}
  </li>`;
}

export async function getData() {
  const { origin } = window.location;
  const urlParams = new URLSearchParams(window.location.search);
  const config = {
    ctaBusStops: urlParams.get("ctaBusStops"),
    ctaTrainStations: urlParams.get("ctaTrainStations"),
    weatherLatLong: urlParams.get("weatherLatLong"),
    eventCalendars: urlParams.get("eventCalendars"),
  };

  (async () => {
    try {
      const res = await fetch(
        `${origin}/api/transit?bus=${config.ctaBusStops ?? ""}&train=${config.ctaTrainStations ?? ""}`,
      );
      if (!res.ok) return; // keep whatever is on screen
      const groups: ArrivalGroup[] = await res.json();
      document.getElementById("train")!.innerHTML = groups
        .filter((g) => g.mode === "train")
        .map(renderGroup)
        .join("");
      document.getElementById("bus")!.innerHTML = groups
        .filter((g) => g.mode === "bus")
        .map(renderGroup)
        .join("");
    } catch (err) {
      console.error("Transit update failed:", err);
    }
  })();

  (async () => {
    try {
      const res = await fetch(`${origin}/api/weather?weatherLatLong=${config.weatherLatLong}`);
      if (!res.ok) return; // keep whatever is on screen
      const w: Weather = await res.json();
      const html = `<p>${w.description}${w.source === "forecast" ? " (est.)" : ""}</p><p>${w.tempF} &#176;F | ${w.tempC} &#176;C</p>`;
      document.getElementById("weather")!.innerHTML = html;
    } catch (err) {
      console.error("Weather update failed:", err);
    }
  })();
}
