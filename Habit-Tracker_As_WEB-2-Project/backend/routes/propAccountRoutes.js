import express from 'express';
import { getPropAccount, setPropAccount, advancePhase, failAccount } from '../controllers/propAccountController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.route('/')
  .get(getPropAccount)
  .post(setPropAccount);

router.patch('/advance-phase', advancePhase);
router.patch('/fail', failAccount);

export default router;
