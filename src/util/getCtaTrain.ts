import dotenv from "dotenv";
import type { CtaTrainPrediction, Arrival } from "./transitTypes";

dotenv.config();

async function getCtaTrain(trainStation: string) {
  const url =
    "https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=" +
    process.env.CTA_TRAIN_API_KEY +
    "&mapid=" +
    trainStation +
    "&max=10&outputType=JSON";
  const res = await fetch(url);
  return await res.json();
}

export function trainToArrival(p: CtaTrainPrediction): Arrival {
  const route = p.rt;
  const destination = p.destNm;
  const stopName = p.staNm;
  const direction = `${destination}-bound`;
  const minuteTime = Math.floor((Date.parse(p.arrT) - Date.parse(p.prdt)) / 60_000);
  const minutes = p.isApp === "1" || minuteTime <= 1 ? "due" : minuteTime;

  return {
    mode: "train",
    route,
    direction,
    destination,
    minutes,
    delayed: p.isDly === "1",
    scheduledOnly: p.isSch === "1",
    fault: p.isFlt === "1",
    canceled: false,
    expressed: false,
    stopName,
  };
}

export default getCtaTrain;
