import { cached } from "./cached";
import getCtaBus from "./getCtaBus";
import getCtaTrain from "./getCtaTrain";
import type { Arrival, ArrivalGroup } from "./transitTypes";

const PER_GROUP = 2;

// "due" counts as 0 minutes when sorting
function sortMinutes(a: Arrival): number {
  return a.minutes === "due" ? 0 : a.minutes;
}

export function groupAndLimit(arrivals: Arrival[]): ArrivalGroup[] {
  const groups = new Map<string, ArrivalGroup>();
  const visible = arrivals.filter((a) => !a.canceled && !a.expressed);
  visible.sort((a, b) => sortMinutes(a) - sortMinutes(b)); // sort them soonest first
  visible.forEach((a) => {
    const key = `${a.mode}|${a.route}|${a.direction}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        mode: a.mode,
        route: a.route,
        direction: a.direction,
        arrivals: [],
      };
      groups.set(key, group);
    }
    if (group.arrivals.length < PER_GROUP) group.arrivals.push(a);
  });
  return [...groups.values()];
}

let cachedBus: (() => Promise<Arrival[]>) | undefined;
let cachedTrain: (() => Promise<Arrival[]>) | undefined;

export async function getTransit(busStops: string, trainStations: string): Promise<ArrivalGroup[]> {
  cachedBus ??= cached(() => getCtaBus(busStops), 1);
  cachedTrain ??= cached(async () => {
    const lists = await Promise.all(trainStations.split(",").map((id) => getCtaTrain(id)));
    return lists.flat();
  }, 1);

  const [bus, train] = await Promise.allSettled([
    busStops ? cachedBus() : Promise.resolve([]),
    trainStations ? cachedTrain() : Promise.resolve([]),
  ]);
  if (bus.status === "rejected" && train.status === "rejected")
    throw new Error("CTA bus and train requests both failed");
  if (bus.status === "rejected") console.error("CTA bus request failed:", bus.reason);
  if (train.status === "rejected") console.error("CTA train request failed:", train.reason);

  const busArrivals = bus.status === "fulfilled" ? bus.value : [];
  const trainArrivals = train.status === "fulfilled" ? train.value : [];
  return groupAndLimit([...busArrivals, ...trainArrivals]);
}
