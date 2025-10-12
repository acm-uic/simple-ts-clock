import type { Request, Response } from 'express';
import getWeather from '../util/getWeather';

export const weather = (req: Request, res: Response): void => {
  getWeather(String(req.query.weatherLatLong))
    .then((result): void => {
      res.send(result);
    })
    .catch((err): Response => res.send(err));
};
