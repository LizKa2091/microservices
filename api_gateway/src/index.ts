import express from 'express';
import { json } from 'express';
import { requestIdMiddleware } from './middleware/requestId';
import { logger } from './lib/logger';
import healthRouter from './routes/health';
import proxy from 'http-proxy-middleware';

const USERS_URL = process.env.USERS_URL || 'http://localhost:4001';
const ORDERS_URL = process.env.ORDERS_URL || 'http://localhost:4002';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use(json());
app.use(requestIdMiddleware);
app.use((req, _res, next) => {
   (req as any).log = logger.child({ reqId: (req as any).requestId });
   next();
});

app.use('/v1/health', healthRouter);

// Proxy routes
app.use(
   '/v1/users',
   proxy.createProxyMiddleware({
      target: USERS_URL,
      changeOrigin: true,
      pathRewrite: { '^/v1/users': '/v1/users' },
      onProxyReq(proxyReq, req) {
         const rid = (req as any).requestId;
         if (rid) proxyReq.setHeader('X-Request-ID', rid);
      }
   })
);

app.use(
   '/v1/orders',
   proxy.createProxyMiddleware({
      target: ORDERS_URL,
      changeOrigin: true,
      pathRewrite: { '^/v1/orders': '/v1/orders' },
      onProxyReq(proxyReq, req) {
         const rid = (req as any).requestId;
         if (rid) proxyReq.setHeader('X-Request-ID', rid);
      }
   })
);

app.listen(port, () => {
   console.log(`api-gateway listening on ${port}`);
});