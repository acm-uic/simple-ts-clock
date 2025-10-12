import type { Request, Response } from 'express';
import getWeather from '../util/getWeather';

export async function weather(req: Request, res: Response) {
  res.send(await getWeather(String(req.query.weatherLatLong)));
}
