export type Condition = "clear" | "cloudy" | "rain" | "snow" | "storm" | "fog";
export type Source = "station" | "forecast";
export type Intensity = "light" | "heavy" | "normal";

export interface Weather {
  tempF: number;
  tempC: number;
  condition: Condition;
  isDay: boolean;
  description: string;
  observedAt: string; // ISO 8601
  source: Source;
  intensity: Intensity;
}

export interface NwsValue {
  value: number | null; // null when a sensor missed a reading
  unitCode: string;
}

export interface NwsPoints {
  properties: {
    forecastHourly: string;
    observationStations: string;
  };
}

export interface NwsStations {
  features: {
    properties: {
      stationIdentifier: string;
    };
  }[];
}

export interface NwsPresentWeather {
  intensity: "light" | "heavy" | null; // NWS's shape; null = moderate
  weather: string; // "rain", "snow", "thunderstorms", ...
}

// observation.json
export interface NwsObservation {
  properties: {
    timestamp: string;
    temperature: NwsValue; // °C
    windChill: NwsValue;
    heatIndex: NwsValue;
    textDescription: string;
    presentWeather: NwsPresentWeather[];
    windSpeed: NwsValue; // km/h
    windDirection: NwsValue; // degrees
    cloudLayers: { amount: string }[]; // "CLR", "FEW", "SCT", "BKN", "OVC", "VV"
    icon: string | null;
  };
}

// forecast-hourly.json
export interface NwsForecastPeriod {
  startTime: string;
  endTime: string;
  temperature: number; // plain number, unit in temperatureUnit
  temperatureUnit: "F" | "C";
  probabilityOfPrecipitation: NwsValue; // percent
  shortForecast: string;
  isDaytime: boolean;
}

export interface NwsHourlyForecast {
  properties: {
    periods: NwsForecastPeriod[];
  };
}
