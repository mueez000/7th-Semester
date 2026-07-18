import StreakLog from '../models/StreakLog.js';


import User from '../models/User.js';

export const startStreak = async (req, res, next) => {
  try {
    const { targetDays } = req.body || {};
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
        targetDays: targetDays || 7,
        relapseHistory: []
      });
    } else {
      streak.startTime = new Date();
      streak.isActive = true;
      streak.currentStreak = 0;
      if (targetDays) streak.targetDays = targetDays;
      await streak.save();
    }

    // Removed awardXP(10) for start

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
      
      // Removed progressQuest

      streak.currentStreak = durationDays;
      if (durationDays > streak.longestStreak) {
        streak.longestStreak = durationDays;
      }
      
      if (!streak.targetDays || streak.targetDays < 7) {
        streak.targetDays = 7;
      }
      
      streak.lastCheckIn = now;
      await streak.save();
    }

    res.json({ success: true, data: { ...streak.toObject(), currentStreak: streak.currentStreak, targetDays: streak.targetDays } });
  } catch (error) {
    next(error);
  }
};

export const relapse = async (req, res, next) => {
  try {
    const { reason, notes, withPorn, bathTaken } = req.body;
    
    const streak = await StreakLog.findOne({ userId: req.userId });
    if (!streak || !streak.isActive) {
      return res.status(400).json({ success: false, error: 'No active streak found' });
    }

    const now = new Date();
    const diffTime = Math.abs(now - streak.startTime);
    const durationDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const currentLongest = streak.longestStreak || 0;
    if (durationDays > currentLongest) {
      streak.longestStreak = durationDays;
    }



    const previousStartTime = streak.startTime;
    const previousTargetDays = streak.targetDays;

    streak.relapseHistory.push({
      date: now,
      reason: reason || '',
      notes: notes || '',
      withPorn: Boolean(withPorn),
      bathTaken: Boolean(bathTaken),
      previousStartTime: previousStartTime,
      enduredTime: diffTime,
      previousTargetDays: previousTargetDays
    });

    streak.startTime = now;
    streak.currentStreak = 0;
    streak.lastCheckIn = now;
    
    await streak.save();


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
    


    if (relapseEntry.previousStartTime) {
      streak.startTime = relapseEntry.previousStartTime;
      streak.targetDays = relapseEntry.previousTargetDays || streak.targetDays;
    }

    streak.relapseHistory = streak.relapseHistory.filter(r => r._id.toString() !== relapseId);
    await streak.save();


    res.json({ success: true, data: streak });
  } catch (error) {
    next(error);
  }
};
