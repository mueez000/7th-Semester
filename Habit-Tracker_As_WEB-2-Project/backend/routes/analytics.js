import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAnalyticsOverview } from '../controllers/analyticsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/overview', getAnalyticsOverview);

export default router;
