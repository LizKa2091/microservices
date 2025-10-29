import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
   logger.error({ err, reqId: (req as any).requestId }, 'Unhandled error');

   const code = err?.code || 'internal_error';
   const message = err?.message || 'Internal server error';
   
   res.status(err?.status || 500).json({ success: false, error: { code, message } });
}