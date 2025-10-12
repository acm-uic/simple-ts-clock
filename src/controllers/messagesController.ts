import type { Request, Response } from "express";
import getMessages from "../util/getMessages";

export async function messages(_req: Request, res: Response) {
  res.send(await getMessages());
}
