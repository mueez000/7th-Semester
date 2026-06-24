import User from '../models/User.js';
import XpHistory from '../models/XpHistory.js';
import Badge from '../models/Badge.js';
import NamazLog from '../models/NamazLog.js';
import WorkSession from '../models/WorkSession.js';

import TodoTask from '../models/TodoTask.js';
import DetoxLog from '../models/DetoxLog.js';
import ReadingLog from '../models/ReadingLog.js';

export const calculateNextLevelXP = (level) => {
  const absLevel = Math.abs(level);
  return 100 * Math.pow(absLevel === 0 ? 1 : absLevel, 2);
};

export const awardXP = async (userId, amount, source, sourceId = null) => {
  const user = await User.findById(userId);
  if (!user) return null;

  let { level, xp, xp_to_next_level, coins } = user;
  xp += amount;
  
  if (coins === undefined) coins = xp; // For old users, initialize coins to current xp
  coins += amount;
  if (coins < 0) coins = 0;

  const levelUps = [];

  if (amount > 0) {
    while (xp >= xp_to_next_level) {
      xp -= xp_to_next_level;
      level += 1;
      xp_to_next_level = calculateNextLevelXP(level);
      levelUps.push(level);
    }
  } else if (amount < 0) {
    while (xp < 0) {
      level -= 1;
      xp_to_next_level = calculateNextLevelXP(level);
      xp += xp_to_next_level;
    }
  }

  user.level = level;
  user.xp = xp;
  user.coins = coins;
  user.xp_to_next_level = xp_to_next_level;
  await user.save();

  await XpHistory.create({
    userId, amount, source, sourceId, date: new Date()
  });

  const newBadges = await checkAndAwardBadges(userId, level, source);

  return {
    amount,
    currentXP: xp,
    level,
    xpToNext: xp_to_next_level,
    levelUps,
    newBadges
  };
};

const checkAndAwardBadges = async (userId, userLevel, lastSource) => {
  const earnedBadges = [];
  const existingBadgesRecords = await Badge.find({ userId });
  const existingBadges = existingBadgesRecords.map(b => b.name);

  const awardBadge = async (name, description, icon) => {
    if (existingBadges.includes(name)) return;
    
    await Badge.create({
      userId, name, description, icon, earnedAt: new Date()
    });
    
    earnedBadges.push({ name, description, icon, earnedAt: new Date() });
  };

  if (userLevel >= 5) await awardBadge('Level 5 Pioneer', 'Reached Level 5! You are getting the hang of it.', '🏅');
  if (userLevel >= 10) await awardBadge('Habit Master', 'Reached Level 10! Consistency is key.', '🏆');
  if (userLevel >= 25) await awardBadge('Centurion', 'Reached Level 25! A true legend of HabitFlow.', '💎');

  if (lastSource === 'namaz') {
    const namazCount = await NamazLog.countDocuments({ userId });
    if (namazCount >= 7) await awardBadge('Faithful First Week', 'Logged prayers for 7 days.', '🌙');
    if (namazCount >= 30) await awardBadge('Pillar of Strength', 'Logged prayers for a whole month.', '🕌');
  }

  if (lastSource === 'work') {
    const workSessions = await WorkSession.find({ userId });
    
    const totalDuration = workSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    
    const totalHours = totalDuration / 3600;
    if (totalHours >= 10) await awardBadge('Iron Focus', 'Completed 10 hours of deep work.', '⚡');
    if (totalHours >= 100) await awardBadge('Deep Work Specialist', '100 hours of deep work productivity. Phenomenal!', '👨‍💻');
  }

  if (lastSource === 'todo') {
    const completedTasks = await TodoTask.countDocuments({ userId, status: 'completed' });
    if (completedTasks >= 10) await awardBadge('Task Smasher', 'Completed your first 10 tasks.', '✅');
    if (completedTasks >= 50) await awardBadge('Getting Things Done', '50 tasks completed! Your efficiency is off the charts.', '🚀');
  }

  if (lastSource === 'detox_start') {
    const detox = await DetoxLog.findOne({ userId });
    if (detox) await awardBadge('Digital Detox', 'Taking control of your screen time.', '🛑');
  }

  if (lastSource === 'detox_relapse') {
    const detox = await DetoxLog.findOne({ userId });
    if (detox && detox.longestStreak >= 7) {
      await awardBadge('Mindful Scroller', 'Logged 7 days of conscious dopamine detox.', '📱');
    }
  }

  if (lastSource === 'reading') {
    const readingLogs = await ReadingLog.find({ userId });
    
    const totalPages = readingLogs.reduce((acc, log) => acc + log.pagesRead, 0);
    if (totalPages >= 1000) await awardBadge('Bookworm', 'Read 1000 pages total.', '📚');

    const distinctDays = new Set(readingLogs.map(s => new Date(s.date).toISOString().split('T')[0])).size;
    if (distinctDays >= 7) await awardBadge('Daily Reader', 'Read for 7 distinct days.', '📖');
    if (distinctDays >= 30) await awardBadge('Scholar', 'Read for 30 distinct days.', '🎓');
  }

  return earnedBadges;
};
