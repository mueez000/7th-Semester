import express from 'express';
import { getTrades, addTrade, updateTrade, deleteTrade } from '../controllers/tradeController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

router.route('/')
  .get(getTrades)
  .post(addTrade);

router.route('/:id')
  .put(updateTrade)
  .delete(deleteTrade);

export default router;
