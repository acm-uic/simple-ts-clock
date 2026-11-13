import { cached } from "./cached";
import { fetchJson } from "./fetchJson";
import type {
  Condition,
  Intensity,
  NwsForecastPeriod,
  NwsHourlyForecast,
  NwsObservation,
  NwsPoints,
  NwsPresentWeather,
  NwsStations,
  Weather,
} from "./weatherTypes";

// Where the clock is: "latitude,longitude" (NWS allows at most 4 decimals)
export const WEATHER_LAT_LONG = "41.8659,-87.6482";

const THICK_CLOUDS = ["BKN", "OVC", "VV"];

// NWS asks every client to identify itself with a contact address
const NWS_HEADERS = { "User-Agent": "(acm-uic simple-ts-clock, officers@acm.cs.uic.edu)" };

export const getNws = <T>(url: string): Promise<T> => fetchJson<T>(url, "NWS", NWS_HEADERS);

type PointInfo = { forecastHourlyUrl: string; stationId: string };
let point: PointInfo | undefined;

// The forecast URL and nearest station for the clock's location never change, so look them up once
async function getPoint(): Promise<PointInfo> {
  if (point) return point;

  const points = await getNws<NwsPoints>(`https://api.weather.gov/points/${WEATHER_LAT_LONG}`);
  const stations = await getNws<NwsStations>(points.properties.observationStations);
  const stationId = stations.features[0]?.properties.stationIdentifier;
  if (!stationId) throw new Error(`NWS returned no stations near ${WEATHER_LAT_LONG}`);

  point = { forecastHourlyUrl: points.properties.forecastHourly, stationId };
  return point;
}

const MAX_OBSERVATION_AGE_MIN = 90;

async function getFreshObservation(stationId: string): Promise<NwsObservation | undefined> {
  let observation: NwsObservation;
  try {
    observation = await getNws<NwsObservation>(`https://api.weather.gov/stations/${stationId}/observations/latest`);
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
  const inC = period.temperatureUnit === "C";
  const tempC = inC ? period.temperature : Math.round(((period.temperature - 32) * 5) / 9);
  const tempF = inC ? Math.round((period.temperature * 9) / 5 + 32) : period.temperature;
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

async function fetchWeather(): Promise<Weather> {
  const { forecastHourlyUrl, stationId } = await getPoint();
  const obs = await getFreshObservation(stationId);
  if (obs) return fromObservation(obs);

  const forecast = await getNws<NwsHourlyForecast>(forecastHourlyUrl);
  const periods = forecast.properties.periods;

  const now = Date.now();
  const period = periods.find((p) => Date.parse(p.startTime) <= now && now < Date.parse(p.endTime)) ?? periods[0];
  if (!period) throw new Error("NWS hourly forecast has no periods");
  return fromForecast(period);
}

const getWeather = cached(fetchWeather, 10);

export default getWeather;
