import express from 'express';
import { check } from 'express-validator';
import User from '../models/User.js';
import NamazLog from '../models/NamazLog.js';
import WorkSession from '../models/WorkSession.js';

import ExerciseLog from '../models/ExerciseLog.js';
import TodoTask from '../models/TodoTask.js';
import TodoList from '../models/TodoList.js';
import XpHistory from '../models/XpHistory.js';
import Badge from '../models/Badge.js';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, dob, weight, gender } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { 
        $set: { 
          name, 
          dob: dob || undefined, 
          weight: weight || undefined, 
          gender: gender || undefined 
        } 
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.put('/password', [
  requireAuth,
  check('currentPassword', 'Current password is required').exists(),
  check('newPassword', 'New password must be 6 or more characters').isLength({ min: 6 }),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, data: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/account', [
  requireAuth,
  check('email', 'Email is required').isEmail(),
  check('password', 'Password is required').exists(),
  handleValidationErrors
], async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    if (user.email !== email) {
      return res.status(400).json({ success: false, error: 'Email does not match' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Incorrect password' });
    }

    // Delete all associated user data
    await Promise.all([
      NamazLog.deleteMany({ userId: req.userId }),
      WorkSession.deleteMany({ userId: req.userId }),

      ExerciseLog.deleteMany({ userId: req.userId }),
      TodoTask.deleteMany({ userId: req.userId }),
      TodoList.deleteMany({ userId: req.userId }),
      XpHistory.deleteMany({ userId: req.userId }),
      Badge.deleteMany({ userId: req.userId }),
      User.findByIdAndDelete(req.userId)
    ]);
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
