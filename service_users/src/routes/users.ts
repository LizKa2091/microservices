import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepo } from '../repo/inMemoryUserRepo';
import { logger } from '../lib/logger';

const router = Router();

const registerSchema = z.object({
   email: z.string().email(),
   password: z.string().min(6),
   name: z.string().min(1)
});

const loginSchema = z.object({
   email: z.string().email(),
   password: z.string().min(6)
});

function sendOk(res: any, data: any) {
   res.json({ success: true, data });
}

function sendError(res: any, code: string, message: string, status = 400) {
   res.status(status).json({ success: false, error: { code, message } });
}

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const JWT_EXPIRES = '2h';

router.post('/register', async (req, res, next) => {
   try {
      const parsed = registerSchema.parse(req.body);
      const existing = await userRepo.findByEmail(parsed.email);

      if (existing) return sendError(res, 'user_exists', 'User with this email already exists', 409);

      const hash = await bcrypt.hash(parsed.password, 10);

      const created = await userRepo.create({
         email: parsed.email,
         passwordHash: hash,
         name: parsed.name,
         roles: ['user']
      } as any);

      sendOk(res, { id: created.id });
   } catch (err) {
      next(err);
   }
});

router.post('/login', async (req, res, next) => {
   try {
      const parsed = loginSchema.parse(req.body);
      const user = await userRepo.findByEmail(parsed.email);

      if (!user) return sendError(res, 'invalid_credentials', 'Invalid email or password', 401);

      const ok = await bcrypt.compare(parsed.password, user.passwordHash);
      if (!ok) return sendError(res, 'invalid_credentials', 'Invalid email or password', 401);

      const token = jwt.sign({ sub: user.id, roles: user.roles }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

      sendOk(res, { token });
   } catch (err) {
      next(err);
   }
});

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

function requireRole(role: string) {
   return (req: any, res: any, next: any) => {
      const roles: string[] = req.user?.roles || [];

      if (!roles.includes(role)) return sendError(res, 'forbidden', 'Forbidden', 403);

      next();
   };
}

router.get('/me', authMiddleware, async (req: any, res, next) => {
   try {
      const user = await userRepo.findById(req.user.id);

      if (!user) return sendError(res, 'not_found', 'User not found', 404);

      const { passwordHash, ...safe } = user as any;
      sendOk(res, safe);
   } catch (err) {
      next(err);
   }
});

const updateProfileSchema = z.object({
   name: z.string().min(1).optional(),
   password: z.string().min(6).optional()
});

router.put('/me', authMiddleware, async (req: any, res, next) => {
   try {
      const parsed = updateProfileSchema.parse(req.body);
      const patch: any = {};

      if (parsed.name) patch.name = parsed.name;
      if (parsed.password) patch.passwordHash = await bcrypt.hash(parsed.password, 10);

      const updated = await userRepo.update(req.user.id, patch);
      if (!updated) return sendError(res, 'not_found', 'User not found', 404);

      const { passwordHash, ...safe } = updated as any;
      sendOk(res, safe);
   } catch (err) {
      next(err);
   }
});

router.get('/', authMiddleware, requireRole('admin'), async (req: any, res, next) => {
   try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '10', 10);
      const filterEmail = req.query.email as string | undefined;
      const data = await (require('../repo/inMemoryUserRepo').userRepo).list({ page, limit, filterEmail });
      
      sendOk(res, data);
   } catch (err) {
      next(err);
   }
});

export default router;