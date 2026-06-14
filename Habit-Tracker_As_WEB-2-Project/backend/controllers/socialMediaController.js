import SocialMediaSession from '../models/SocialMediaSession.js';
import { awardXP } from '../services/gamification.js';

export const startSocialSession = async (req, res, next) => {
  try {
    const activeSession = await SocialMediaSession.findOne({ userId: req.userId, endTime: null });
    if (activeSession) {
      return res.status(400).json({ success: false, error: 'A social media session is already active' });
    }

    const { platform } = req.body;
    if (!['instagram', 'x', 'youtube', 'news', 'movies'].includes(platform)) {
      return res.status(400).json({ success: false, error: 'Invalid platform' });
    }

    const session = await SocialMediaSession.create({
      userId: req.userId,
      platform,
      startTime: new Date()
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

export const stopSocialSession = async (req, res, next) => {
  try {
    const session = await SocialMediaSession.findOne({ userId: req.userId, endTime: null });
    if (!session) {
      return res.status(404).json({ success: false, error: 'No active social media session found' });
    }

    session.endTime = new Date();
    session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
    await session.save();

    // Deduct XP: 1 XP per minute
    if (session.duration > 0) {
      const minutes = Math.floor(session.duration / 60);
      const xpAmount = minutes * 1;
      
      if (xpAmount > 0) {
        await awardXP(req.userId, -xpAmount, 'social', session._id);
      }
    }

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

export const getTodaySocial = async (req, res, next) => {
  try {
    const today = new Date().setHours(0,0,0,0);
    const tomorrow = new Date(today + 86400000);

    const sessions = await SocialMediaSession.find({
      userId: req.userId,
      startTime: { $gte: new Date(today), $lt: new Date(tomorrow) }
    }).sort({ startTime: -1 });

    const totalDurationPerPlatform = sessions.reduce((acc, curr) => {
      acc[curr.platform] = (acc[curr.platform] || 0) + (curr.duration || 0);
      return acc;
    }, {});
    
    res.json({ success: true, data: { totalDurationPerPlatform, sessions } });
  } catch (error) {
    next(error);
  }
};

export const deleteSocialSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const session = await SocialMediaSession.findOne({ _id: id, userId: req.userId });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    
    const minutes = Math.floor((session.duration || 0) / 60);
    const xpAmount = minutes * 1;

    await SocialMediaSession.deleteOne({ _id: id, userId: req.userId });
    
    if (xpAmount > 0) {
      await awardXP(req.userId, xpAmount, 'social_undo', id);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getMonthlySocialStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sessions = await SocialMediaSession.find({
      userId: req.userId,
      startTime: { $gte: startOfMonth },
      endTime: { $ne: null }
    });

    if (sessions.length === 0) {
      return res.json({ success: true, data: { avgDaily: 0, personalBest: 0, currentStreak: 0, dailyTotals: {} } });
    }

    let personalBest = 0;
    const dailyTotals = {};

    sessions.forEach(session => {
      if (session.duration > personalBest) {
        personalBest = session.duration; // "Lowest time = best streak", but personal best duration might mean longest session? The prompt says "Personal Best". Let's track longest session.
      }
      const dateStr = session.startTime.toISOString().split('T')[0];
      if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
      dailyTotals[dateStr] += session.duration;
    });

    const activeDays = Object.keys(dailyTotals).length;
    const totalMonthDuration = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
    const avgDaily = activeDays > 0 ? (totalMonthDuration / activeDays) : 0;

    // Calculate current streak
    const allSessions = await SocialMediaSession.find({
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
