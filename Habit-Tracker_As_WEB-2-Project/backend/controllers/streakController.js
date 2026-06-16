import StreakLog from '../models/StreakLog.js';
import { awardXP } from '../services/gamification.js';
import { progressQuest } from '../services/questService.js';
import User from '../models/User.js';

export const startStreak = async (req, res, next) => {
  try {
    let streak = await StreakLog.findOne({ userId: req.userId });
    
    if (streak && streak.isActive) {
      return res.status(400).json({ success: false, error: 'A streak is already active' });
    }

    if (!streak) {
      streak = await StreakLog.create({
        userId: req.userId,
        startTime: new Date(),
        isActive: true,
        currentStreak: 0,
        longestStreak: 0,
        shieldsEarned: 0,
        relapseHistory: []
      });
    } else {
      streak.startTime = new Date();
      streak.isActive = true;
      streak.currentStreak = 0;
      streak.shieldsEarned = 0;
      await streak.save();
    }

    await awardXP(req.userId, 10, 'streak_start', streak._id);

    res.status(201).json({ success: true, data: streak });
  } catch (error) {
    next(error);
  }
};

export const getStreakStatus = async (req, res, next) => {
  try {
    const streak = await StreakLog.findOne({ userId: req.userId });
    if (!streak) {
      return res.json({ success: true, data: null });
    }

    if (streak.isActive) {
      const now = new Date();
      const diffTime = Math.abs(now - streak.startTime);
      const durationDays = Math.floor((now.getTime() - streak.startTime.getTime()) / (1000 * 3600 * 24));
      
      // We update progress using durationDays, setting isAbsolute to true
      if (durationDays > 0) {
        await progressQuest(req.userId, 'streak', durationDays, true);
      }

      const shieldsToEarn = Math.floor(durationDays / 90);
      if (shieldsToEarn > (streak.shieldsEarned || 0)) {
        const newShields = shieldsToEarn - (streak.shieldsEarned || 0);
        streak.shieldsEarned = shieldsToEarn;
        
        const user = await User.findById(req.userId);
        if (user) {
          user.shields = (user.shields || 0) + newShields;
          await user.save();
          await awardXP(req.userId, newShields * 50, 'shield_earned', streak._id);
        }
      }

      streak.currentStreak = durationDays;
      if (durationDays > streak.longestStreak) {
        streak.longestStreak = durationDays;
      }
      streak.lastCheckIn = now;
      await streak.save();
    }

    res.json({ success: true, data: { ...streak.toObject(), currentStreak: streak.currentStreak } });
  } catch (error) {
    next(error);
  }
};

export const relapse = async (req, res, next) => {
  try {
    const { withPorn, notes, bathTaken } = req.body;
    
    const streak = await StreakLog.findOne({ userId: req.userId });
    if (!streak || !streak.isActive) {
      return res.status(400).json({ success: false, error: 'No active streak found' });
    }

    const now = new Date();
    const diffTime = Math.abs(now - streak.startTime);
    const durationDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (durationDays > streak.longestStreak) {
      streak.longestStreak = durationDays;
    }

    let earnedXp = 0;
    let usedShield = false;
    const user = await User.findById(req.userId);

    if (user && user.shields > 0) {
      user.shields -= 1;
      await user.save();
      usedShield = true;
      earnedXp = 0; // Shield protects from penalty
    } else {
      if (withPorn || bathTaken === false) {
        earnedXp = -500; // Heavy penalty
      } else {
        earnedXp = durationDays * 25; // XP only if without porn AND bath taken
      }
    }

    streak.relapseHistory.push({
      date: now,
      withPorn: Boolean(withPorn),
      bathTaken: Boolean(bathTaken),
      notes: (notes || '') + (usedShield ? ' [Shield Used]' : ''),
      xpEarned: earnedXp
    });

    streak.startTime = now;
    streak.currentStreak = 0;
    streak.shieldsEarned = 0;
    streak.lastCheckIn = now;
    
    await streak.save();

    if (earnedXp !== 0) {
      await awardXP(req.userId, earnedXp, 'streak_relapse', streak._id);
    }

    res.json({ success: true, data: streak });
  } catch (error) {
    next(error);
  }
};

export const getStreakHistory = async (req, res, next) => {
  try {
    const streak = await StreakLog.findOne({ userId: req.userId });
    if (!streak) {
      return res.json({ success: true, data: { relapseHistory: [], longestStreak: 0 } });
    }

    res.json({ 
      success: true, 
      data: { 
        relapseHistory: streak.relapseHistory.sort((a, b) => b.date - a.date),
        longestStreak: streak.longestStreak
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRelapse = async (req, res, next) => {
  try {
    const { relapseId } = req.params;
    
    const streak = await StreakLog.findOne({ userId: req.userId });
    if (!streak) {
      return res.status(404).json({ success: false, error: 'Streak log not found' });
    }

    const relapseEntry = streak.relapseHistory.find(r => r._id.toString() === relapseId);
    if (!relapseEntry) {
      return res.status(404).json({ success: false, error: 'Relapse entry not found' });
    }
    
    const xpEarned = relapseEntry.xpEarned || 0;

    streak.relapseHistory = streak.relapseHistory.filter(r => r._id.toString() !== relapseId);
    await streak.save();

    if (xpEarned > 0) {
      await awardXP(req.userId, -xpEarned, 'streak_relapse_undo', streak._id);
    }

    res.json({ success: true, data: streak });
  } catch (error) {
    next(error);
  }
};
