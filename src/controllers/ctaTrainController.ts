import type { Request, Response } from 'express';
import getCtaTrain from '../util/getCtaTrain';

export const ctaTrain = (req: Request, res: Response): void => {
  getCtaTrain(String(req.query.train))
    .then((result): void => {
      res.send(result);
    })
    .catch((err): Response => res.send(err));
};
