import type { Request, Response } from "express";
import getWeather from "../util/getWeather";

export async function weather(req: Request, res: Response) {
  try {
    res.send(await getWeather(String(req.query.weatherLatLong)));
  } catch (err) {
    console.error("Weather request failed:", err);
    res.status(502).json({ error: `Weather service unavailable` });
  }
}
