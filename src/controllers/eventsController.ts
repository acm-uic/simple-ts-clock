import type { Request, Response } from 'express';
import getEvents from '../util/getCtaBus';

export async function events(req: Request, res: Response) {
  res.send(await getEvents(String(req.query.calendar)));
}
