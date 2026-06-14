import express from 'express';
import { getRewards, createReward, deleteReward, purchaseReward } from '../controllers/rewardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.route('/')
  .get(getRewards)
  .post(createReward);

router.route('/:id')
  .delete(deleteReward);

router.route('/:id/purchase')
  .post(purchaseReward);

export default router;
