import type { Request, Response } from 'express';
import getCtaBus from '../util/getCtaBus';

export const ctaBus = (req: Request, res: Response): void => {
  getCtaBus(String(req.query.bus))
    .then((result): void => {
      res.send(result);
    })
    .catch((err): Response => res.send(err));
};
