import type { Request, Response } from 'express';
import getMessages from '../util/getMessages';

export const messages = (req: Request, res: Response): void => {
  getMessages()
    .then((result): void => {
      res.send(result);
    })
    .catch((err): Response => res.send(err));
};
