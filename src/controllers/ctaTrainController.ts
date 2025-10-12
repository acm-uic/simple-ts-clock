import type { Request, Response } from 'express';
import getCtaTrain from '../util/getCtaTrain';

export async function ctaTrain(req: Request, res: Response) {
  res.send(await getCtaTrain(String(req.query.train)));
}
