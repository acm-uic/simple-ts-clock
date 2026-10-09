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
