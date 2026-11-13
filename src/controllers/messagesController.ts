import type { Request, Response } from "express";
import getMessages from "../util/getMessages";

export async function messages(req: Request, res: Response) {
  try {
    const weatherLatLong = typeof req.query.weatherLatLong === "string" ? req.query.weatherLatLong : "";
    res.send(await getMessages(weatherLatLong));
  } catch (err) {
    console.error("Ticker request failed:", err);
    res.status(502).json({ error: "Ticker unavailable" });
  }
}
