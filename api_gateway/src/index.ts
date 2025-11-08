import express from 'express';
import { json } from 'express';
import { requestIdMiddleware } from './middleware/requestId';
import { logger } from './lib/logger';
import healthRouter from './routes/health';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { requestLogger } from './middleware/requestLogger';
import { ClientRequest } from 'http';

interface ProxyOptions {
   target: string;
   changeOrigin?: boolean;
   pathRewrite?: Record<string, string>;
   onProxyReq?: (proxyReq: ClientRequest, req: Request, res: any) => void;
}

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

app.use(requestLogger);

app.use('/v1/health', healthRouter);

function checkJwtForProtected(req: any, res: any, next: any) {
   const path = req.path;

   if (req.method === 'POST' && (req.path === '/register' || req.path === '/login')) {
      return next();
   }

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

function onProxyReq(proxyReq: any, req: any) {
   if (req.requestId) proxyReq.setHeader('X-Request-ID', req.requestId);
   if (req.headers.authorization) proxyReq.setHeader('Authorization', req.headers.authorization);

   if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      proxyReq.end()
   }
}

const usersProxy: ProxyOptions = {
   target: USERS_URL,
   changeOrigin: true,
   pathRewrite: { '^/v1/users': '/v1/users' },
   onProxyReq,
};

const ordersProxy: ProxyOptions = {
   target: ORDERS_URL,
   changeOrigin: true,
   pathRewrite: { '^/v1/orders': '/v1/orders' },
   onProxyReq,
};

app.use('/v1/users', checkJwtForProtected, createProxyMiddleware(usersProxy));
app.use('/v1/orders', checkJwtForProtected, createProxyMiddleware(ordersProxy));

app.listen(port, () => {
   console.log(`api-gateway listening on ${port}`);
});