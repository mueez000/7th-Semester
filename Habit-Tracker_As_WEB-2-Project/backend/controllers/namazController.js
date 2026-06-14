import NamazLog from '../models/NamazLog.js';
import { awardXP } from '../services/gamification.js';
import { progressQuest } from '../services/questService.js';

export const getTodayNamaz = async (req, res, next) => {
  try {
    const today = new Date().setHours(0,0,0,0);
    
    let log = await NamazLog.findOne({ userId: req.userId, date: today });
    if (!log) {
      log = await NamazLog.create({ userId: req.userId, date: today });
    }
    
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

export const logNamaz = async (req, res, next) => {
  try {
    const { prayer, completed } = req.body;
    const today = new Date().setHours(0,0,0,0);
    
    // validate prayer name
    const validPrayers = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
    if (!validPrayers.includes(prayer)) {
      return res.status(400).json({ success: false, error: 'Invalid prayer name' });
    }
    
    let existingLog = await NamazLog.findOne({ userId: req.userId, date: today });
    const wasCompleted = existingLog ? existingLog[prayer] : false;

    const update = {};
    update[prayer] = completed;

    const log = await NamazLog.findOneAndUpdate(
      { userId: req.userId, date: today },
      { $set: update },
      { new: true, upsert: true }
    );
    
    if (completed && !wasCompleted) {
      await awardXP(req.userId, 20, 'namaz', prayer);
    } else if (!completed && wasCompleted) {
      await awardXP(req.userId, -20, 'namaz_undo', prayer);
    }
    
    if (completed) {
      await progressQuest(req.userId, 'namaz', 1);
    }

    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyNamazStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const logs = await NamazLog.find({ 
      userId: req.userId, 
      date: { $gte: startOfMonth } 
    }).sort({ date: 1 });

    let totalPrayersCompleted = 0;
    let currentStreakDays = 0; // days with all 5 prayers completed

    logs.forEach(log => {
      let dailyCount = 0;
      if (log.fajr) dailyCount++;
      if (log.zuhr) dailyCount++;
      if (log.asr) dailyCount++;
      if (log.maghrib) dailyCount++;
      if (log.isha) dailyCount++;
      
      totalPrayersCompleted += dailyCount;
      
      if (dailyCount === 5) {
        currentStreakDays++;
      } else {
        // Enforce continuity streak if logic requires it, here just counting consecutive
        currentStreakDays = 0;
      }
    });

    res.json({ 
      success: true, 
      data: {
        totalCompleted: totalPrayersCompleted,
        fullDaysStreak: currentStreakDays
      } 
    });
  } catch (error) {
    next(error);
  }
};
