import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { startWorkSession, stopWorkSession, getTodayWork, getMonthlyWorkStats, deleteWorkSession, rateSessionQuality } from '../controllers/workController.js';

const router = express.Router();

router.use(requireAuth);

router.post('/start', startWorkSession);
router.post('/stop', stopWorkSession);
router.delete('/session/:id', deleteWorkSession);
router.patch('/session/:id/quality', rateSessionQuality);
router.get('/today', getTodayWork);
router.get('/monthly', getMonthlyWorkStats);

export default router;
