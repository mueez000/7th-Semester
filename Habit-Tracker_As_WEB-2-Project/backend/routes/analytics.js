import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAnalyticsOverview, getDailyTimeline } from '../controllers/analyticsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/overview', getAnalyticsOverview);
router.get('/daily-timeline', getDailyTimeline);

export default router;
