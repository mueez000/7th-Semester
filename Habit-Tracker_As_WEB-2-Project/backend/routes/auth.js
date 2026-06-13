import express from 'express';
import { check } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.post('/register', [
  check('name', 'Name is required').trim().notEmpty().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }).trim().escape(),
  check('dob', 'Date of birth is required').notEmpty(),
  handleValidationErrors
], register);

router.post('/login', [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists().trim().escape(),
  handleValidationErrors
], login);

router.get('/me', requireAuth, getMe);

export default router;
