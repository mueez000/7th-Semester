import WorkSession from '../models/WorkSession.js';
import { awardXP } from '../services/gamification.js';


export const startWorkSession = async (req, res, next) => {
  try {
    const activeSession = await WorkSession.findOne({ userId: req.userId, endTime: null });
    if (activeSession) {
      return res.status(400).json({ success: false, error: 'A work session is already active' });
    }

    const { taskId } = req.body;

    const session = await WorkSession.create({
      userId: req.userId,
      startTime: new Date(),
      taskId: taskId || null
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

export const stopWorkSession = async (req, res, next) => {
  try {
    const session = await WorkSession.findOne({ userId: req.userId, endTime: null });
    if (!session) {
      return res.status(404).json({ success: false, error: 'No active work session found' });
    }

    session.endTime = new Date();
    // Duration in seconds
    session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
    await session.save();

    if (session.taskId && session.duration > 0) {
      const TodoTask = (await import('../models/TodoTask.js')).default;
      const task = await TodoTask.findOne({ _id: session.taskId });
      if (task) {
        const addedMinutes = Math.floor(session.duration / 60);
        await TodoTask.findByIdAndUpdate(task._id, { actualTime: task.actualTime + addedMinutes });
      }
    }

    if (session.duration > 0) {
      const minutes = Math.floor(session.duration / 60);
      const xpAmount = Math.max(5, minutes * 1); // Minimum 5 XP, 1 XP per minute
      await awardXP(req.userId, xpAmount, 'work', session._id);
      // Removed progressQuest
    }

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

export const getTodayWork = async (req, res, next) => {
  try {
    const today = new Date().setHours(0,0,0,0);
    const tomorrow = new Date(today + 86400000);

    const sessions = await WorkSession.find({
      userId: req.userId,
      startTime: { $gte: new Date(today), $lt: new Date(tomorrow) }
    });

    const totalDuration = sessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    
    res.json({ success: true, data: { totalDuration, sessions } });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const session = await WorkSession.findOne({ _id: id, userId: req.userId });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    
    const minutes = Math.floor((session.duration || 0) / 60);
    const xpAmount = Math.max(5, minutes * 1); // Minimum 5 XP

    await WorkSession.deleteOne({ _id: id, userId: req.userId });
    
    // Only deduct XP if duration > 0 (meaning it was completed and XP was awarded)
    if (session.duration > 0) {
      await awardXP(req.userId, -xpAmount, 'work_undo', id);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyWorkStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sessions = await WorkSession.find({
      userId: req.userId,
      startTime: { $gte: startOfMonth },
      endTime: { $ne: null }
    });

    if (sessions.length === 0) {
      return res.json({ success: true, data: { avgDaily: 0, personalBest: 0, currentStreak: 0 } });
    }

    let personalBest = 0;
    const dailyTotals = {};

    sessions.forEach(session => {
      if (session.duration > personalBest) {
        personalBest = session.duration;
      }
      const dateStr = session.startTime.toISOString().split('T')[0];
      if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
      dailyTotals[dateStr] += session.duration;
    });

    const activeDays = Object.keys(dailyTotals).length;
    const totalMonthDuration = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
    const avgDaily = activeDays > 0 ? (totalMonthDuration / activeDays) : 0;

    // Calculate current streak: consecutive days with at least one completed session
    // Fetch all-time sessions to get all distinct dates
    const allSessions = await WorkSession.find({
      userId: req.userId,
      endTime: { $ne: null }
    });
    const formatDate = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    };
    const allDates = [...new Set(allSessions.map(s => formatDate(s.startTime)))].sort();
    
    let currentStreak = 0;
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    
    if (allDates.length > 0) {
      const lastDate = allDates[allDates.length - 1];
      // Only count streak if today or yesterday was active
      if (lastDate === today || lastDate === yesterday) {
        currentStreak = 1;
        for (let i = allDates.length - 2; i >= 0; i--) {
          const diff = (new Date(allDates[i+1]) - new Date(allDates[i])) / 86400000;
          if (diff === 1) currentStreak++;
          else break;
        }
      }
    }

    res.json({ 
      success: true, 
      data: {
        avgDaily: Math.round(avgDaily),
        personalBest,
        dailyTotals,
        currentStreak
      }
    });
  } catch (error) {
    next(error);
  }
};
