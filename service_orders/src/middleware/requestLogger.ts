import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
   const start = Date.now();
   const reqId = (req as any).requestId;

   res.on('finish', () => {
      const ms = Date.now() - start;
      const userId = (req as any).user?.id;
      logger.info({ reqId, method: req.method, path: req.path, status: res.statusCode, ms, userId }, 'request');
   });
   
   next();
}