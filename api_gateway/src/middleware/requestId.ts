import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
   const header = req.header('X-Request-ID') || req.header('x-request-id');
   
   (req as any).requestId = header || uuidv4();
   res.setHeader('X-Request-ID', (req as any).requestId);
   
   next();
}