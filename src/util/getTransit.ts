import { cached } from "./cached";
import getCtaBus from "./getCtaBus";
import getCtaTrain from "./getCtaTrain";
import type { Arrival, ArrivalGroup } from "./transitTypes";

// The stops and stations shown on the clock
const BUS_STOPS = ["6700", "6627", "307", "332", "4640", "14487", "6347", "206"];
const TRAIN_STATIONS = ["40350"];
const PER_GROUP = 2;

// "due" counts as 0 minutes when sorting
const sortMinutes = (a: Arrival): number => (a.minutes === "due" ? 0 : a.minutes);

// One group per route and direction, soonest arrivals first, at most PER_GROUP each
export function groupAndLimit(arrivals: Arrival[]): ArrivalGroup[] {
  const visible = arrivals.filter((a) => !a.canceled && !a.expressed).sort((a, b) => sortMinutes(a) - sortMinutes(b));
  const groups = Map.groupBy(visible, (a) => `${a.mode}|${a.route}|${a.direction}`);
  return [...groups.values()].map((list) => ({
    mode: list[0].mode,
    route: list[0].route,
    direction: list[0].direction,
    arrivals: list.slice(0, PER_GROUP),
  }));
}

const cachedBus = cached(() => getCtaBus(BUS_STOPS.join(",")), 1);
const cachedTrain = cached(async () => (await Promise.all(TRAIN_STATIONS.map((id) => getCtaTrain(id)))).flat(), 1);

// Bus and train fail on their own (cached() logs each failure); only both failing is an error
export async function getTransit(): Promise<ArrivalGroup[]> {
  const results = await Promise.allSettled([cachedBus(), cachedTrain()]);
  if (results.every((r) => r.status === "rejected")) throw new Error("CTA bus and train requests both failed");
  return groupAndLimit(results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])));
}
