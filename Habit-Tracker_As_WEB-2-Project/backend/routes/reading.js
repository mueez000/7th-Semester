import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { logReading, getReadingLogs, deleteReadingLog, getReadingStats, getTodayReadingLogs } from '../controllers/readingController.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', logReading);
router.get('/today', getTodayReadingLogs);
router.get('/', getReadingLogs);
router.get('/stats', getReadingStats);
router.delete('/:id', deleteReadingLog);

export default router;
