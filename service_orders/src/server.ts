import express from 'express';
import { json } from 'express';
import { requestIdMiddleware } from './middleware/requestId';
import { logger } from './lib/logger';
import ordersRouter from './routes/orders';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import healthRouter from './routes/health';

export function createServer() {
   const app = express();
   
   app.use(json());

   app.use(requestIdMiddleware);

   app.use((req, _res, next) => {
      // attach pino logger per request
      (req as any).log = logger.child({ reqId: (req as any).requestId });
      next();
   });

   app.use(requestLogger);

   app.use('/v1/health', healthRouter);
   app.use('/v1/orders', ordersRouter);

   app.use(errorHandler);

   return app;
}