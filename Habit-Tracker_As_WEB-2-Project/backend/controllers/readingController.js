import ReadingLog from '../models/ReadingLog.js';
import { awardXP } from '../services/gamification.js';


export const logReading = async (req, res, next) => {
  try {
    const { bookTitle, pagesRead, duration, notes, date, isCompleted } = req.body;

    if (!bookTitle || !pagesRead) {
      return res.status(400).json({ success: false, error: 'Book title and pages read are required' });
    }

    const logDate = date ? new Date(date) : new Date();

    const readingLog = await ReadingLog.create({
      userId: req.userId,
      bookTitle,
      pagesRead,
      duration: duration || null,
      notes: notes || '',
      date: logDate,
      isCompleted: isCompleted || false
    });

    // Determine total pages read today to cap XP
    const todayStart = new Date(logDate).setHours(0,0,0,0);
    const todayEnd = new Date(todayStart + 86400000);
    
    const todayLogs = await ReadingLog.find({
      userId: req.userId,
      date: { $gte: new Date(todayStart), $lt: new Date(todayEnd) }
    });

    const totalPagesToday = todayLogs.reduce((acc, log) => acc + log.pagesRead, 0);
    const totalDurationToday = todayLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
    
    const previousPagesToday = totalPagesToday - pagesRead;
    const previousDurationToday = totalDurationToday - (duration || 0);

    // 2 XP per page, max 100 XP per day (which means max 50 pages count towards XP)
    // 1 XP per minute, max 120 XP per day (max 120 mins)
    const MAX_PAGES_FOR_XP = 50;
    const MAX_DURATION_FOR_XP = 120;
    
    let pagesToReward = 0;
    if (previousPagesToday < MAX_PAGES_FOR_XP) {
      pagesToReward = Math.min(pagesRead, MAX_PAGES_FOR_XP - previousPagesToday);
    }

    let durationToReward = 0;
    if (duration && previousDurationToday < MAX_DURATION_FOR_XP) {
      durationToReward = Math.min(duration, MAX_DURATION_FOR_XP - previousDurationToday);
    }

    const xpAmount = (pagesToReward * 2) + durationToReward;

    if (xpAmount > 0) {
      await awardXP(req.userId, xpAmount, 'reading', readingLog._id);
    }
    // Removed progressQuest

    res.status(201).json({ success: true, data: readingLog });
  } catch (error) {
    next(error);
  }
};

export const getReadingLogs = async (req, res, next) => {
  try {
    const { month, year, bookTitle } = req.query;
    
    let query = { userId: req.userId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (bookTitle) {
      query.bookTitle = { $regex: bookTitle, $options: 'i' };
    }

    const logs = await ReadingLog.find(query).sort({ date: -1 });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export const getTodayReadingLogs = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await ReadingLog.find({
      userId: req.userId,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ date: -1 });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export const deleteReadingLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const log = await ReadingLog.findOne({ _id: id, userId: req.userId });
    if (!log) return res.status(404).json({ success: false, error: 'Reading log not found' });
    
    const xpAmount = Math.min(log.pagesRead * 2, 100); // Rough estimation for undoing

    await ReadingLog.deleteOne({ _id: id, userId: req.userId });
    
    if (xpAmount > 0) {
      await awardXP(req.userId, -xpAmount, 'reading_undo', id);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getReadingStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const logs = await ReadingLog.find({ userId: req.userId });
    
    const thisMonthLogs = logs.filter(log => new Date(log.date) >= startOfMonth);
    const totalPagesThisMonth = thisMonthLogs.reduce((acc, log) => acc + log.pagesRead, 0);

    const activeDays = new Set(thisMonthLogs.map(l => new Date(l.date).toISOString().split('T')[0])).size;
    const avgDaily = activeDays > 0 ? Math.round(totalPagesThisMonth / activeDays) : 0;

    // We now count actual books completed
    const totalPagesAllTime = logs.reduce((acc, log) => acc + log.pagesRead, 0);
    const booksFinished = logs.filter(log => log.isCompleted).length;

    // Calculate current streak
    const formatDate = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    };
    const allDates = [...new Set(logs.map(l => formatDate(l.date)))].sort();
    
    let currentStreak = 0;
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    
    if (allDates.length > 0) {
      const lastDate = allDates[allDates.length - 1];
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
        totalPagesThisMonth,
        avgDaily,
        currentStreak,
        booksFinished,
        totalPagesAllTime
      }
    });
  } catch (error) {
    next(error);
  }
};
