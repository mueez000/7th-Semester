import express from 'express';
import { getMyGamification, getGamificationStats } from '../controllers/gamificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/me', getMyGamification);
router.get('/stats', getGamificationStats);

export default router;
