import NamazLog from '../models/NamazLog.js';
import { awardXP } from '../services/gamification.js';


export const getTodayNamaz = async (req, res, next) => {
  try {
    const today = new Date().setHours(0,0,0,0);
    
    let log = await NamazLog.findOne({ userId: req.userId, date: today });
    if (!log) {
      log = await NamazLog.create({ userId: req.userId, date: today });
    }
    
    const normalize = (val) => {
      if (val === true || val === 'true') return 'prayed';
      if (val === false || val === 'false') return 'none';
      return val || 'none';
    };
    
    const normalizedLog = { ...log.toObject() };
    ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'].forEach(p => {
      normalizedLog[p] = normalize(normalizedLog[p]);
    });
    
    res.json({ success: true, data: normalizedLog });
  } catch (error) {
    next(error);
  }
};

export const logNamaz = async (req, res, next) => {
  try {
    const { prayer, status } = req.body;
    const today = new Date().setHours(0,0,0,0);
    
    // validate prayer name
    const validPrayers = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
    if (!validPrayers.includes(prayer)) {
      return res.status(400).json({ success: false, error: 'Invalid prayer name' });
    }
    
    const normalize = (val) => {
      if (val === true || val === 'true') return 'prayed';
      if (val === false || val === 'false') return 'none';
      return val || 'none';
    };

    let existingLog = await NamazLog.findOne({ userId: req.userId, date: today });
    const previousStatus = existingLog ? normalize(existingLog[prayer]) : 'none';

    const update = {};
    update[prayer] = status || 'none';

    const log = await NamazLog.findOneAndUpdate(
      { userId: req.userId, date: today },
      { $set: update },
      { new: true, upsert: true }
    );
    
    const getXpForStatus = (s) => {
      if (s === 'prayed') return 20;
      if (s === 'kaza') return 10;
      return 0; // 'none'
    };
    
    const xpDiff = getXpForStatus(status) - getXpForStatus(previousStatus);
    
    if (xpDiff > 0) {
      await awardXP(req.userId, xpDiff, 'namaz', prayer);
    } else if (xpDiff < 0) {
      await awardXP(req.userId, xpDiff, 'namaz_undo', prayer);
    }
    
    if ((status === 'prayed' || status === 'kaza') && previousStatus === 'none') {
      // Removed progressQuest
    }

    const normalizedLog = { ...log.toObject() };
    ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'].forEach(p => {
      normalizedLog[p] = normalize(normalizedLog[p]);
    });

    res.json({ success: true, data: normalizedLog });
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

    const normalize = (val) => {
      if (val === true || val === 'true') return 'prayed';
      if (val === false || val === 'false') return 'none';
      return val || 'none';
    };

    logs.forEach(log => {
      let dailyCount = 0;
      if (normalize(log.fajr) !== 'none') dailyCount++;
      if (normalize(log.zuhr) !== 'none') dailyCount++;
      if (normalize(log.asr) !== 'none') dailyCount++;
      if (normalize(log.maghrib) !== 'none') dailyCount++;
      if (normalize(log.isha) !== 'none') dailyCount++;
      
      totalPrayersCompleted += dailyCount;
      
      if (dailyCount === 5) {
        currentStreakDays++;
      } else {
        const isToday = new Date(log.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
        if (!isToday) {
          // Enforce continuity streak if logic requires it, here just counting consecutive
          currentStreakDays = 0;
        }
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
