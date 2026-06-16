import ExerciseLog from '../models/ExerciseLog.js';
import { awardXP } from '../services/gamification.js';
import { progressQuest } from '../services/questService.js';

export const logExercise = async (req, res, next) => {
  try {
    const { activityType, distance, duration, calories, date } = req.body;

    let finalCalories = calories;
    if (!finalCalories && duration) {
      const type = activityType?.toLowerCase() || '';
      if (type.includes('run')) finalCalories = duration * 10;
      else if (type.includes('walk')) finalCalories = duration * 5;
      else if (type.includes('cycl')) finalCalories = duration * 8;
      else if (type.includes('gym') || type.includes('weight')) finalCalories = duration * 7;
      else finalCalories = duration * 5; // default fallback
    }

    const log = await ExerciseLog.create({
      userId: req.userId,
      activityType,
      distance,
      duration,
      calories: finalCalories,
      date: date || new Date()
    });

    const xpAmount = Math.max(20, (duration || 0) * 2);
    await awardXP(req.userId, xpAmount, 'exercise', log._id);
    await progressQuest(req.userId, 'exercise', finalCalories);

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

export const deleteExerciseLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const exercise = await ExerciseLog.findOne({ _id: id, userId: req.userId });
    if (!exercise) return res.status(404).json({ success: false, error: 'Workout not found' });
    
    const xpAmount = Math.max(20, (exercise.duration || 0) * 2);

    await ExerciseLog.deleteOne({ _id: id, userId: req.userId });
    
    await awardXP(req.userId, -xpAmount, 'exercise_undo', id);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getExerciseLogs = async (req, res, next) => {
  try {
    const { month, year, type } = req.query;
    let query = { userId: req.userId };
    
    if (type) query.activityType = type;
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const logs = await ExerciseLog.find(query).sort({ date: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export const getTodayExerciseLogs = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await ExerciseLog.find({
      userId: req.userId,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ date: -1 });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export const getExerciseStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all logs to dynamically calculate streaks securely
    const allLogs = await ExerciseLog.find({ userId: req.userId }).sort({ date: -1 }).lean();

    let currentStreak = 0;
    const msInDay = 24 * 60 * 60 * 1000;
    let today = new Date().setHours(0,0,0,0);
    
    let activeDate = today;
    let hasCheckedToday = false;
    
    for (const log of allLogs) {
      const logDate = new Date(log.date).setHours(0,0,0,0);
      if (!hasCheckedToday) {
         hasCheckedToday = true;
         if (logDate !== activeDate && logDate !== (activeDate - msInDay)) {
             break; // Streak broken if neither today nor yesterday has a log
         }
         activeDate = logDate;
         currentStreak++;
      } else {
         if (activeDate - logDate === 0) {
            continue; // multiple logs same day don't advance the streak but keep it going
         } else if (activeDate - logDate === msInDay) {
            currentStreak++;
            activeDate = logDate;
         } else {
            break;
         }
      }
    }

    // Filter to just this month to compute the other duration stats
    const monthLogs = allLogs.filter(log => new Date(log.date) >= startOfMonth);

    let totalDuration = 0;
    let totalDistance = 0;
    let longestDistance = 0; 
    let longestDuration = 0; 

    const activityTotals = {};

    monthLogs.forEach(log => {
      totalDuration += log.duration;
      if (log.distance) totalDistance += log.distance;

      if (!activityTotals[log.activityType]) {
        activityTotals[log.activityType] = { duration: 0, distance: 0 };
      }
      activityTotals[log.activityType].duration += log.duration;
      if (log.distance) activityTotals[log.activityType].distance += log.distance;

      if (log.duration > longestDuration) longestDuration = log.duration;
      if (log.distance && log.distance > longestDistance) longestDistance = log.distance;
    });

    const highestCalories = monthLogs.reduce((max, log) => (log.calories && log.calories > max ? log.calories : max), 0);
    const totalCalories = monthLogs.reduce((sum, log) => sum + (log.calories || 0), 0);

    res.json({ 
      success: true, 
      data: {
        totalDuration,
        totalDistance,
        longestDistance,
        longestDuration,
        highestCalories,
        totalCalories,
        currentStreak,
        activityTotals
      }
    });
  } catch (error) {
    next(error);
  }
};
