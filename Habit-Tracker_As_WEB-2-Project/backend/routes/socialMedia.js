import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { startSocialSession, stopSocialSession, getTodaySocial, deleteSocialSession, getMonthlySocialStats } from '../controllers/socialMediaController.js';

const router = express.Router();

router.use(requireAuth);

router.post('/start', startSocialSession);
router.post('/stop', stopSocialSession);
router.get('/today', getTodaySocial);
router.get('/monthly', getMonthlySocialStats);
router.delete('/session/:id', deleteSocialSession);

export default router;
