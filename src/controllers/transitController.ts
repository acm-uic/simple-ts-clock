import type { Request, Response } from "express";
import { getTransit } from "../util/getTransit";
import { Arrival } from "../util/transitTypes";

export async function transit(req: Request, res: Response) {
  try {
    const busStops = typeof req.query.bus === "string" ? req.query.bus : "";
    const trainStations = typeof req.query.train === "string" ? req.query.train : "";
    res.send(await getTransit(busStops, trainStations));
  } catch (err) {
    console.error("Transit request failed:", err);
    res.status(502).json({ error: "Transit service unavailable" });
  }
}
