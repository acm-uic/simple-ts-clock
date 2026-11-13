import { fetchJson } from "./fetchJson";
import type { Arrival, CtaTrainPrediction, CtaTrainPredictions } from "./transitTypes";

async function getCtaTrain(trainStation: string): Promise<Arrival[]> {
  const url =
    "https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=" +
    process.env.CTA_TRAIN_API_KEY +
    "&mapid=" +
    trainStation +
    "&max=10&outputType=JSON";
  const data = await fetchJson<CtaTrainPredictions>(url, "CTA Train Tracker");
  if (data.ctatt.errCd !== "0") throw new Error(`CTA Train Tracker error ${data.ctatt.errCd}: ${data.ctatt.errNm}`);
  return (data.ctatt.eta ?? []).map(trainToArrival);
}

export function trainToArrival(p: CtaTrainPrediction): Arrival {
  const minuteTime = Math.floor((Date.parse(p.arrT) - Date.parse(p.prdt)) / 60_000);
  const minutes = p.isApp === "1" || minuteTime <= 1 ? "due" : minuteTime;

  return {
    mode: "train",
    route: p.rt,
    direction: `${p.destNm}-bound`,
    destination: p.destNm,
    minutes,
    delayed: p.isDly === "1",
    scheduledOnly: p.isSch === "1",
    fault: p.isFlt === "1",
    canceled: false,
    expressed: false,
    stopName: p.staNm,
  };
}

export default getCtaTrain;
