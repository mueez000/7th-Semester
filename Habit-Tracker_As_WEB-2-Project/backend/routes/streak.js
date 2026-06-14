import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { startStreak, getStreakStatus, relapse, getStreakHistory, deleteRelapse } from '../controllers/streakController.js';

const router = express.Router();

router.use(requireAuth);

router.post('/start', startStreak);
router.get('/status', getStreakStatus);
router.post('/relapse', relapse);
router.get('/history', getStreakHistory);
router.delete('/relapse/:relapseId', deleteRelapse);

export default router;
