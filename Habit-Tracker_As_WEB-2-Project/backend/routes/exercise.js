import express from 'express';
import { check } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { logExercise, getExerciseLogs, getExerciseStats, deleteExerciseLog } from '../controllers/exerciseController.js';

const router = express.Router();

router.use(requireAuth);

router.post('/log', [
  check('activityType', 'Activity type is required').notEmpty(),
  check('duration', 'Duration is required and must be a number').isNumeric(),
  handleValidationErrors
], logExercise);

router.get('/logs', getExerciseLogs);
router.delete('/log/:id', deleteExerciseLog);
router.get('/stats', getExerciseStats);

export default router;
