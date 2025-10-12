import type { Request, Response } from "express";
import getCtaBus from "../util/getCtaBus";

export async function ctaBus(req: Request, res: Response) {
  res.send(await getCtaBus(String(req.query.bus)));
}
