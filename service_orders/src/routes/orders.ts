import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { PrismaOrderRepo } from '../repo/prismaOrderRepo';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

export default (orderRepo: PrismaOrderRepo) => {
   const router = Router();

   function sendOk(res: any, data: any) {
      res.json({ success: true, data });
   }

   function sendError(res: any, code: string, message: string, status = 400) {
      res.status(status).json({ success: false, error: { code, message } });
   }

   async function authMiddleware(req: any, res: any, next: any) {
      const auth = req.headers['authorization'] || '';
      const parts = (auth as string).split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') return sendError(res, 'unauthorized', 'Missing token', 401);

      const token = parts[1];
      try {
         const payload: any = jwt.verify(token, JWT_SECRET);
         req.user = { id: payload.sub, roles: payload.roles };
         next();
      } catch (err) {
         return sendError(res, 'unauthorized', 'Invalid token', 401);
      }
   }

   const createSchema = z.object({
      items: z.array(
         z.object({
         productId: z.string(),
         quantity: z.number().min(1),
         price: z.number().min(0),
         })
      ).min(1),
   });

   router.post('/', authMiddleware, async (req: any, res, next) => {
      try {
         const parsed = createSchema.parse(req.body);
         const order = await orderRepo.create({ userId: req.user.id, items: parsed.items });
         sendOk(res, order);
      } catch (err) {
         next(err);
      }
   });

   router.get('/:id', authMiddleware, async (req: any, res, next) => {
      try {
         const order = await orderRepo.findById(req.params.id);
         if (!order) return sendError(res, 'not_found', 'Order not found', 404);
         if (order.userId !== req.user.id && !(req.user.roles || []).includes('admin')) {
         return sendError(res, 'forbidden', 'Forbidden', 403);
         }
         sendOk(res, order);
      } catch (err) {
         next(err);
      }
   });

   router.get('/', authMiddleware, async (req: any, res, next) => {
      try {
         const page = parseInt((req.query.page as string) || '1', 10);
         const limit = parseInt((req.query.limit as string) || '10', 10);
         const data = await orderRepo.listByUser(req.user.id, { page, limit });
         sendOk(res, data);
      } catch (err) {
         next(err);
      }
   });

   router.patch('/:id/status', authMiddleware, async (req: any, res, next) => {
      try {
         const status = req.body.status as string;
         const allowed = ['created', 'in_progress', 'done', 'cancelled'];
         if (!allowed.includes(status)) return sendError(res, 'invalid_status', 'Invalid status', 400);

         const order = await orderRepo.findById(req.params.id);
         if (!order) return sendError(res, 'not_found', 'Order not found', 404);
         if (order.userId !== req.user.id && !(req.user.roles || []).includes('admin')) {
         return sendError(res, 'forbidden', 'Forbidden', 403);
         }

         const updated = await orderRepo.updateStatus(order.id, status);
         sendOk(res, updated);
      } catch (err) {
         next(err);
      }
   });

   router.delete('/:id', authMiddleware, async (req: any, res, next) => {
      try {
         const order = await orderRepo.findById(req.params.id);
         if (!order) return sendError(res, 'not_found', 'Order not found', 404);
         if (order.userId !== req.user.id && !(req.user.roles || []).includes('admin')) {
         return sendError(res, 'forbidden', 'Forbidden', 403);
         }

         await orderRepo.delete(order.id);
         sendOk(res, { id: order.id });
      } catch (err) {
         next(err);
      }
   });

   return router;
};