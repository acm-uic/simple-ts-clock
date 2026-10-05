import type {
  Condition,
  Intensity,
  NwsPoints,
  NwsStations,
  NwsObservation,
  NwsPresentWeather,
  Weather,
  NwsForecastPeriod,
  NwsHourlyForecast,
} from "./weatherTypes";
import { cached } from "./cached";

const THICK_CLOUDS = ["BKN", "OVC", "VV"];

const STATION_OVERRIDE: string | undefined = undefined;

type PointInfo = { forecastHourlyUrl: string; stationId: string };
let point: PointInfo | undefined;

// Contact for fetches
const NWS_CONTACT = "officers@acm.cs.uic.edu";

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": `(acm-uic simple-ts-clock, ${NWS_CONTACT})` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`NWS ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function getPoint(latLong: string): Promise<PointInfo> {
  if (point) return point;

  const arr = latLong.split(",").map((x) => parseFloat(x));
  const lat = arr[0].toFixed(4);
  const lon = arr[1].toFixed(4);

  const points = await getJson<NwsPoints>(`https://api.weather.gov/points/${lat},${lon}`);

  const stations = await getJson<NwsStations>(points.properties.observationStations);
  const firstId = stations.features[0]?.properties.stationIdentifier;
  const station = STATION_OVERRIDE ?? firstId;
  if (!station) throw new Error("NWS returned no stations near " + latLong);

  point = { forecastHourlyUrl: points.properties.forecastHourly, stationId: station };
  return point;
}

const MAX_OBSERVATION_AGE_MIN = 90;

async function getFreshObservation(stationId: string): Promise<NwsObservation | undefined> {
  let observation: NwsObservation;
  try {
    observation = await getJson<NwsObservation>(`https://api.weather.gov/stations/${stationId}/observations/latest`);
  } catch (err) {
    console.error("NWS observation failed, using forecast:", err);
    return undefined;
  }
  const ageMin = (Date.now() - Date.parse(observation.properties.timestamp)) / 60_000;
  if (observation.properties.temperature.value === null || ageMin > MAX_OBSERVATION_AGE_MIN) return undefined;
  return observation;
}

function findEntry(presentWeather: NwsPresentWeather[], ...words: string[]) {
  return presentWeather.find((p) => words.some((w) => p.weather.includes(w)));
}

function normalizeCondition(
  presentWeather: NwsPresentWeather[],
  cloudLayers: { amount: string }[],
  fallbackText: string,
): { condition: Condition; intensity: Intensity } {
  const storm = findEntry(presentWeather, "thunderstorm");
  if (storm) return { condition: "storm", intensity: storm.intensity ?? "normal" };

  const snow = findEntry(presentWeather, "snow");
  if (snow) return { condition: "snow", intensity: snow.intensity ?? "normal" };

  const rain = findEntry(presentWeather, "rain", "drizzle");
  if (rain) return { condition: "rain", intensity: rain.intensity ?? "normal" };

  const fog = findEntry(presentWeather, "fog");
  if (fog) return { condition: "fog", intensity: fog.intensity ?? "normal" };

  if (cloudLayers.length > 0) {
    const cloudy = cloudLayers.some((layer) => THICK_CLOUDS.includes(layer.amount));
    return { condition: cloudy ? "cloudy" : "clear", intensity: "normal" };
  }

  const text = fallbackText.toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));
  // Whole words, so "slight" doesn't count as "light"
  const words = text.split(" ");
  const intensity: Intensity = words.includes("light") ? "light" : words.includes("heavy") ? "heavy" : "normal";

  if (has("slight chance")) return { condition: "clear", intensity: "normal" };
  if (has("thunder")) return { condition: "storm", intensity };
  if (has("snow")) return { condition: "snow", intensity };
  if (has("rain", "shower", "drizzle")) return { condition: "rain", intensity };
  if (has("fog")) return { condition: "fog", intensity };
  if (has("partly")) return { condition: "clear", intensity: "normal" };
  if (has("cloudy", "overcast")) return { condition: "cloudy", intensity: "normal" };
  return { condition: "clear", intensity: "normal" };
}

function fromObservation(obs: NwsObservation): Weather {
  const c = obs.properties.temperature.value ?? 0;
  const tempC = Math.round(c);
  const tempF = Math.round((c * 9) / 5 + 32);
  const normCond = normalizeCondition(
    obs.properties.presentWeather,
    obs.properties.cloudLayers,
    obs.properties.textDescription,
  );

  return {
    tempC,
    tempF,
    condition: normCond.condition,
    isDay: obs.properties.icon?.includes("/day") ?? true,
    description: obs.properties.textDescription,
    observedAt: obs.properties.timestamp,
    source: "station",
    intensity: normCond.intensity,
  };
}

function fromForecast(period: NwsForecastPeriod): Weather {
  const tempUnit = period.temperatureUnit;
  let tempC: number;
  let tempF: number;
  if (tempUnit === "C") {
    tempC = period.temperature;
    tempF = Math.round((tempC * 9) / 5 + 32);
  } else {
    tempF = period.temperature;
    tempC = Math.round(((tempF - 32) * 5) / 9);
  }
  const normCond = normalizeCondition([], [], period.shortForecast);

  return {
    tempC,
    tempF,
    condition: normCond.condition,
    isDay: period.isDaytime,
    description: period.shortForecast,
    observedAt: period.startTime,
    source: "forecast",
    intensity: normCond.intensity,
  };
}

async function fetchWeather(latLong: string): Promise<Weather> {
  const { forecastHourlyUrl, stationId } = await getPoint(latLong);
  const obs = await getFreshObservation(stationId);
  if (obs) return fromObservation(obs);

  const forecast = await getJson<NwsHourlyForecast>(forecastHourlyUrl);
  const periods = forecast.properties.periods;

  const now = Date.now();
  const period = periods.find((p) => Date.parse(p.startTime) <= now && now < Date.parse(p.endTime)) ?? periods[0];
  if (!period) throw new Error("NWS hourly forecast has no periods");
  return fromForecast(period);
}

let cachedWeather: (() => Promise<Weather>) | undefined;

async function getWeather(weatherLatLong: string): Promise<Weather> {
  cachedWeather ??= cached(() => fetchWeather(weatherLatLong), 10);
  return cachedWeather();
}

export default getWeather;
