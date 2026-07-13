import express from 'express';
import { check } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { getTodayNamaz, logNamaz, getMonthlyNamazStats, logSleptEarly } from '../controllers/namazController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/today', getTodayNamaz);
router.get('/monthly', getMonthlyNamazStats);
router.post('/slept-early', logSleptEarly);

router.post('/log', [
  check('prayer', 'Prayer name is required').notEmpty(),
  check('status', 'Status must be a valid string').isIn(['none', 'prayed', 'kaza', 'jamat', 'unprayed']),
  handleValidationErrors
], logNamaz);

export default router;
