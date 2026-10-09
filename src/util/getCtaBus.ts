import dotenv from "dotenv";
import type { CtaBusPrediction, CtaBusPredictions, Arrival } from "./transitTypes";

dotenv.config();

const CROWDING = ["EMPTY", "HALF_EMPTY", "FULL"] as const;
// dyn codes from the Bus Tracker docs' "Dynamic Action Types" table: 1 canceled, 16/17 invalidated
// ("should not be shown to the public"), 18 canceled (dynamically created trip)
const CANCELED_DYN = [1, 16, 17, 18];
const EXPRESSED_DYN = 4; // drop-off only, won't pick up

async function getCtaBus(busStop: string): Promise<Arrival[]> {
  const url =
    "https://www.ctabustracker.com/bustime/api/v3/getpredictions?key=" +
    process.env.CTA_BUS_API_KEY +
    "&stpid=" +
    busStop +
    "&format=json";
  const res = await fetch(url, {signal: AbortSignal.timeout(10_000)});
  if (!res.ok) throw new Error(`CTA Bus Tracker HTTP ${res.status}`);
  const data = (await res.json()) as CtaBusPredictions;
  const prd = data["bustime-response"]?.prd ?? [];
  return prd.map(busToArrival);
}

// "20261005 14:37" (Chicago local time) → milliseconds
function parseBusTime(t: string): number {
  return Date.parse(`${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}T${t.slice(9)}`);
}

export function busToArrival(p: CtaBusPrediction): Arrival {
  // Both times are Chicago local, so the time zone cancels out (same as trains' arrT - prdt)
  const minuteTime = Math.round((parseBusTime(p.prdtm) - parseBusTime(p.tmstmp)) / 60_000);
  const minutes = p.prdctdn === "DUE" || minuteTime <= 1 ? "due" : minuteTime;

  return {
    mode: "bus",
    route: p.rt,
    direction: p.rtdir,
    destination: p.des,
    stopName: p.stpnm,
    delayed: p.dly === true, // v2 leaves dly out unless the bus is delayed
    scheduledOnly: false,
    fault: false,
    canceled: p.dyn !== undefined && CANCELED_DYN.includes(p.dyn),
    expressed: p.dyn === EXPRESSED_DYN,
    minutes,
    crowding: CROWDING.find((c) => c === p.psgld),
  };
}

export default getCtaBus;
