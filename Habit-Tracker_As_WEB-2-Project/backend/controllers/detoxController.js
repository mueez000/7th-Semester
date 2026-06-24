import DetoxLog from '../models/DetoxLog.js';
import { awardXP } from '../services/gamification.js';
import User from '../models/User.js';

export const startDetox = async (req, res, next) => {
  try {
    const { targetDays } = req.body || {};
    let detox = await DetoxLog.findOne({ userId: req.userId });
    
    if (detox && detox.isActive) {
      return res.status(400).json({ success: false, error: 'A dopamine detox is already active' });
    }

    if (!detox) {
      detox = await DetoxLog.create({
        userId: req.userId,
        startTime: new Date(),
        isActive: true,
        currentStreak: 0,
        longestStreak: 0,
        targetDays: targetDays || 7,
        relapseHistory: []
      });
    } else {
      detox.startTime = new Date();
      detox.isActive = true;
      detox.currentStreak = 0;
      if (targetDays) detox.targetDays = targetDays;
      await detox.save();
    }

    // Removed awardXP(10) for start

    res.status(201).json({ success: true, data: detox });
  } catch (error) {
    next(error);
  }
};

export const getDetoxStatus = async (req, res, next) => {
  try {
    const detox = await DetoxLog.findOne({ userId: req.userId });
    if (!detox) {
      return res.json({ success: true, data: null });
    }

    if (detox.isActive) {
      const now = new Date();
      const diffTime = Math.abs(now - detox.startTime);
      const durationDays = Math.floor((now.getTime() - detox.startTime.getTime()) / (1000 * 3600 * 24));
      
      detox.currentStreak = durationDays;
      if (durationDays > detox.longestStreak) {
        detox.longestStreak = durationDays;
      }
      detox.lastCheckIn = now;
      await detox.save();
    }

    res.json({ success: true, data: { ...detox.toObject(), currentStreak: detox.currentStreak, targetDays: detox.targetDays } });
  } catch (error) {
    next(error);
  }
};

export const relapse = async (req, res, next) => {
  try {
    const { app, notes } = req.body;
    
    const detox = await DetoxLog.findOne({ userId: req.userId });
    if (!detox || !detox.isActive) {
      return res.status(400).json({ success: false, error: 'No active detox found' });
    }

    const now = new Date();
    const diffTime = Math.abs(now - detox.startTime);
    const durationDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const currentLongest = detox.longestStreak || 0;
    if (durationDays > currentLongest) {
      detox.longestStreak = durationDays;
    }

    let earnedXp = 0;
    const currentTarget = detox.targetDays || 7;
    
    if (durationDays < currentTarget) {
      earnedXp = -500; // Heavy penalty
    } else {
      earnedXp = 50; // Achieved target, reward XP
      detox.targetDays = currentTarget + 1; // Increase target for next time
    }

    const previousStartTime = detox.startTime;
    const previousTargetDays = detox.targetDays;

    detox.relapseHistory.push({
      date: now,
      app: app || '',
      notes: notes || '',
      xpEarned: earnedXp,
      previousStartTime: previousStartTime,
      previousTargetDays: previousTargetDays
    });

    detox.startTime = now;
    detox.currentStreak = 0;
    detox.lastCheckIn = now;
    
    await detox.save();

    if (earnedXp !== 0) {
      await awardXP(req.userId, earnedXp, 'detox_relapse_penalty', detox._id);
    }

    res.json({ success: true, data: detox });
  } catch (error) {
    next(error);
  }
};

export const getDetoxHistory = async (req, res, next) => {
  try {
    const detox = await DetoxLog.findOne({ userId: req.userId });
    if (!detox) {
      return res.json({ success: true, data: { relapseHistory: [], longestStreak: 0 } });
    }

    res.json({ 
      success: true, 
      data: { 
        relapseHistory: detox.relapseHistory.sort((a, b) => b.date - a.date),
        longestStreak: detox.longestStreak
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRelapse = async (req, res, next) => {
  try {
    const { relapseId } = req.params;
    
    const detox = await DetoxLog.findOne({ userId: req.userId });
    if (!detox) {
      return res.status(404).json({ success: false, error: 'Detox log not found' });
    }

    const relapseEntry = detox.relapseHistory.find(r => r._id.toString() === relapseId);
    if (!relapseEntry) {
      return res.status(404).json({ success: false, error: 'Relapse entry not found' });
    }
    
    const xpEarned = relapseEntry.xpEarned || 0;

    if (relapseEntry.previousStartTime) {
      detox.startTime = relapseEntry.previousStartTime;
      detox.targetDays = relapseEntry.previousTargetDays || detox.targetDays;
    }

    detox.relapseHistory = detox.relapseHistory.filter(r => r._id.toString() !== relapseId);
    await detox.save();

    if (xpEarned !== 0) {
      await awardXP(req.userId, -xpEarned, 'detox_relapse_undo', detox._id);
    }

    res.json({ success: true, data: detox });
  } catch (error) {
    next(error);
  }
};
