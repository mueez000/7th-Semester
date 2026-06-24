import express from 'express';
import { check } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { getTodayNamaz, logNamaz, getMonthlyNamazStats } from '../controllers/namazController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/today', getTodayNamaz);
router.get('/monthly', getMonthlyNamazStats);

router.post('/log', [
  check('prayer', 'Prayer name is required').notEmpty(),
  check('status', 'Status must be a valid string').isIn(['none', 'prayed', 'kaza']),
  handleValidationErrors
], logNamaz);

export default router;
