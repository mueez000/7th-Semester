import User from '../models/User.js';
import Badge from '../models/Badge.js';
import XpHistory from '../models/XpHistory.js';

const getRPGTitle = (level) => {
  if (level < 5) return 'Novice';
  if (level < 10) return 'Apprentice';
  if (level < 25) return 'Disciplined';
  if (level < 50) return 'Adept';
  if (level < 100) return 'Master';
  return 'Grandmaster';
};

export const getMyGamification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('level xp coins xp_to_next_level');
    
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const badges = await Badge.find({ userId: req.userId }).sort({ earnedAt: -1 });
    const recentHistory = await XpHistory.find({ userId: req.userId }).sort({ date: -1 }).limit(20);

    res.json({
      success: true,
      data: {
        level: user.level,
        title: getRPGTitle(user.level),
        xp: user.xp,
        coins: user.coins !== undefined ? user.coins : user.xp,
        xp_to_next_level: user.xp_to_next_level,
        badges,
        recentHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getGamificationStats = async (req, res, next) => {
  try {
    // Aggregated XP by source
    const categoryXPAgg = await XpHistory.aggregate([
      { $match: { userId: req.userId, source: { $not: /_undo/ } } },
      { $group: { _id: '$source', totalXP: { $sum: '$amount' } } }
    ]);
    const categoryXP = categoryXPAgg.map(c => ({ source: c._id, totalXP: c.totalXP }));

    // Last 7 days XP history for sparkline
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyXPAgg = await XpHistory.aggregate([
      { $match: { userId: req.userId, date: { $gte: sevenDaysAgo }, source: { $not: /_undo/ } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const dailyXP = dailyXPAgg.map(d => ({ day: d._id, amount: d.amount }));

    res.json({
      success: true,
      data: {
        categoryXP,
        dailyXP
      }
    });
  } catch (error) {
    next(error);
  }
};
