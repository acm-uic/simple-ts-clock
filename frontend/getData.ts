import type { Weather } from "../src/util/weatherTypes";
interface StringIndexes {
  [key: string]: string;
}

const ctaRouteColors: StringIndexes = {
  // TODO: Pick Better Colors
  Red: "#c10000",
  Blue: "#03396c",
  Brown: "#560d0d",
  Green: "#004a2f",
  Orange: "#ff6337",
  Pink: "#ff3e6d",
  Purple: "#866ec7",
  Yellow: "#e4c666",
};

interface CtaBusPrediction {
  tmstmp: string;
  typ: string;
  stpnm: string;
  stpid: string;
  vid: string;
  dstp: number;
  rt: string;
  rtdd: string;
  rtdir: string;
  des: string;
  prdtm: string;
  tablockid: string;
  tatripid: string;
  dly: boolean;
  prdctdn: string;
  zone: string;
}

interface CtaBusError {
  stpid: string;
  msg: string;
}

interface CtaBusPredictions {
  "bustime-response": {
    prd?: CtaBusPrediction[];
    error?: CtaBusError[];
  };
}

interface CtaTrainPrediction {
  staId: string;
  stpId: string;
  staNm: string;
  stpDe: string;
  rn: string;
  rt: string;
  destSt: string;
  destNm: string;
  trDr: string;
  prdt: Date;
  arrT: Date;
  isApp: string;
  isSch: string;
  isDly: string;
  isFlt: string;
  flags: boolean;
  lat: string;
  lon: string;
  heading: string;
}

interface CtaTrainPredictions {
  ctatt: {
    tmst: string;
    errCd: string;
    errNm: number;
    eta: CtaTrainPrediction[];
  };
}

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

export async function getData() {
  const { origin } = window.location;
  const urlParams = new URLSearchParams(window.location.search);
  const config = {
    ctaBusStops: urlParams.get("ctaBusStops"),
    ctaTrainStations: urlParams.get("ctaTrainStations"),
    weatherLatLong: urlParams.get("weatherLatLong"),
    eventCalendars: urlParams.get("eventCalendars"),
  };

  clearData("#bus");
  (async () => {
    const res = await fetch(`${origin}/api/ctaBus?bus=${config.ctaBusStops}`);
    const result = await res.json();
    const timeNow = new Date();
    if (Object.hasOwn(result["bustime-response"], "prd")) {
      for (let i = 0; i < result["bustime-response"].prd!.length; i++) {
        const timeFromApi = result["bustime-response"].prd![i].prdtm;
        const prdTime = new Date(`${timeFromApi.slice(0, 4)}/${timeFromApi.slice(4, 6)}/${timeFromApi.slice(6, 16)}`);
        const eta = Math.floor(Math.abs(prdTime.valueOf() - timeNow.valueOf()) / 1000 / 60);
        document.getElementById("bus")!.innerHTML +=
          `<li class='busItem'><span class='route icon'>${result["bustime-response"].prd[i].rt}</span><span class='eta'>${eta}m</span><span class='direction'>${result["bustime-response"].prd[i].rtdir}</span></li>`;
      }
      result["bustime-response"].prd!.forEach((ele: CtaBusPrediction): void => {
        const timeFromApi = ele.prdtm;
        const prdTime = new Date(`${timeFromApi.slice(0, 4)}/${timeFromApi.slice(4, 6)}/${timeFromApi.slice(6, 16)}`);
        const eta = Math.floor(Math.abs(prdTime.valueOf() - timeNow.valueOf()) / 1000 / 60);
        document.getElementById("bus")!.innerHTML +=
          `<li class='busItem'><span class='route icon'>${ele.rt}</span><span class='eta'>${eta}m</span><span class='direction'>${ele.rtdir}</span></li>`;
      });
    }
  })();

  clearData("#train");
  config.ctaTrainStations!.split(",").forEach((ele): void => {
    (async () => {
      const res = await fetch(`${origin}/api/ctaTrain?train=${ele}`);
      const result = await res.json();
      const timeNow = new Date();
      for (let j = 0; j < result.ctatt.eta.length; j++) {
        const prdTime = new Date(result.ctatt.eta[j].arrT);
        const eta = Math.floor(Math.abs(prdTime.valueOf() - timeNow.valueOf()) / 1000 / 60);
        const routeColor = ctaRouteColors[result.ctatt.eta[j].rt];
        document.getElementById("train")!.innerHTML +=
          `<li class='trainItem'><i class='fa fa-train icon' style=background-color:${routeColor};></i><span class='eta' style=color:${routeColor};border-color:${routeColor};>${eta}m</span><span class='direction'>${result.ctatt.eta[j].destNm}</span></li>`;
      }
    })();
  });

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
