import express from 'express';
import { startDetox, getDetoxStatus, relapse, getDetoxHistory, deleteRelapse } from '../controllers/detoxController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/start', startDetox);
router.get('/status', getDetoxStatus);
router.post('/relapse', relapse);
router.get('/history', getDetoxHistory);
router.delete('/relapse/:relapseId', deleteRelapse);

export default router;
