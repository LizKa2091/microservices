import { Request, Response, NextFunction } from 'express';

export async function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
   const { v4: uuidv4 } = await import('uuid');
   const header = req.header('X-Request-ID') || req.header('x-request-id');
   
   (req as any).requestId = header || uuidv4();
   res.setHeader('X-Request-ID', (req as any).requestId);
   
   next();
}