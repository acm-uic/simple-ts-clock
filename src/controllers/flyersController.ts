import type { Request, Response } from "express";
import { getFlyerImage, listFlyers } from "../util/getFlyers";

export async function flyers(_req: Request, res: Response) {
  try {
    res.send(await listFlyers());
  } catch (err) {
    console.error("Flyer list failed:", err);
    res.status(502).json({ error: "Flyers unavailable" });
  }
}

export async function flyerImage(req: Request, res: Response) {
  try {
    const image = await getFlyerImage(String(req.params.id));
    if (!image) {
      res.status(404).json({ error: "No such flyer" });
      return;
    }
    res.set("Content-Type", image.mimeType);
    res.set("Cache-Control", "public, max-age=3600"); // the browser keeps it for an hour
    res.send(image.bytes);
  } catch (err) {
    console.error("Flyer image failed:", err);
    res.status(502).json({ error: "Flyer unavailable" });
  }
}
