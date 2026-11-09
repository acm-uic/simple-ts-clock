import type { Request, Response } from "express";
import getEvents from "../util/getEvents";

export async function events(req: Request, res: Response) {
  try {
    const calendar = typeof req.query.calendar === "string" ? req.query.calendar : "";
    res.send(await getEvents(calendar.split(",").filter(Boolean)));
  } catch (err) {
    console.error("Events request failed:", err);
    res.status(502).json({ error: "Calendar unavailable" });
  }
}
