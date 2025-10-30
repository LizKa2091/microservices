import express from 'express';
import { json } from 'express';
import { requestIdMiddleware } from './middleware/requestId';
import { logger } from './lib/logger';
import healthRouter from './routes/health';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const USERS_URL = process.env.USERS_URL || 'http://localhost:4001';
const ORDERS_URL = process.env.ORDERS_URL || 'http://localhost:4002';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const limiter = rateLimit({
   windowMs: 60 * 1000, // 1 minute
   max: 100 // basic throttle
});

const app = express();
app.use(cors());
app.use(limiter);

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
   createProxyMiddleware({
      target: USERS_URL,
      changeOrigin: true,
      pathRewrite: { '^/v1/users': '/v1/users' },
      onProxyReq(proxyReq: any, req: any) {
         const rid = (req as any).requestId;
         if (rid) proxyReq.setHeader('X-Request-ID', rid);
      },
   } as any)
);

app.use(
   '/v1/orders',
   createProxyMiddleware({
      target: ORDERS_URL,
      changeOrigin: true,
      pathRewrite: { '^/v1/orders': '/v1/orders' },
      onProxyReq(proxyReq: any, req: any) {
         const rid = (req as any).requestId;
         if (rid) proxyReq.setHeader('X-Request-ID', rid);
      }
   } as any)
);

function checkJwtForProtected(req: any, res: any, next: any) {
   // allow public: POST /v1/users/register and POST /v1/users/login
   const path = req.path;

   if (req.method === 'POST' && (path === '/v1/users/register' || path === '/v1/users/login')) return next();

   const auth = req.headers['authorization'] || '';
   const parts = (auth as string).split(' ');
   
   if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, error: { code: 'unauthorized', message: 'Missing token' } });
   
   const token = parts[1];
   try {
      const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'change_me');

      (req as any).user = { id: payload.sub, roles: payload.roles };
      next();
   } catch (err) {
      return res.status(401).json({ success: false, error: { code: 'unauthorized', message: 'Invalid token' } });
   }
}

app.use('/v1/users', checkJwtForProtected);
app.use('/v1/orders', checkJwtForProtected);

app.listen(port, () => {
   console.log(`api-gateway listening on ${port}`);
});