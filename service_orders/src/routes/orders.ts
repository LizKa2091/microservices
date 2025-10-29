import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
   res.json({ success: true, data: { message: 'orders root' } });
});

export default router;