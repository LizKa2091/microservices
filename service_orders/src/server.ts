import express from 'express';
import { json } from 'express';
import { requestIdMiddleware } from './middleware/requestId';
import { logger } from './lib/logger';
import healthRouter from './routes/health';
import { PrismaOrderRepo } from './repo/prismaOrderRepo';
import ordersRouter from './routes/orders';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

export function createServer() {
   const app = express();
   app.use(json());

   app.use(requestIdMiddleware);

   app.use((req, _res, next) => {
      (req as any).log = logger.child({ reqId: (req as any).requestId });
      next();
   });

   app.use(requestLogger);

   const orderRepo = new PrismaOrderRepo();

   app.use('/v1/health', healthRouter);
   app.use('/v1/orders', ordersRouter(orderRepo));

   app.use(errorHandler);

   return app;
}