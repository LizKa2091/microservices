import express from 'express';
import { json } from 'express';
import { requestIdMiddleware } from './middleware/requestId';
import { logger } from './lib/logger';
import usersRouter from './routes/users';
import healthRouter from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

export function createServer() {
   const app = express();
   app.use(json());
   app.use(requestIdMiddleware);
   app.use((req, res, next) => {
      // attach pino logger per request
      (req as any).log = logger.child({ reqId: (req as any).requestId });
      next();
   });

   app.use('/v1/health', healthRouter);
   app.use('/v1/users', usersRouter);

   app.use(requestLogger)
   app.use(errorHandler);

   return app;
}