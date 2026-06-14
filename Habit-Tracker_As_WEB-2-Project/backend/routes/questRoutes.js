import express from 'express';
import { getMyQuests, claimQuestReward } from '../controllers/questController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getMyQuests);
router.post('/:id/claim', claimQuestReward);

export default router;
