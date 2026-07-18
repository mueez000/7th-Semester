import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAnalyticsOverview, getDailyTimeline, getHeatmapData, getVelocityData, getInsights, getTrajectoryData, getFocusQualityData } from '../controllers/analyticsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/overview', getAnalyticsOverview);
router.get('/daily-timeline', getDailyTimeline);
router.get('/heatmap', getHeatmapData);
router.get('/velocity', getVelocityData);
router.get('/insights', getInsights);
router.get('/trajectory', getTrajectoryData);
router.get('/focus-quality', getFocusQualityData);

export default router;
