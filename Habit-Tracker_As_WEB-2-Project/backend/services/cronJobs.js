import cron from 'node-cron';
import User from '../models/User.js';
import NamazLog from '../models/NamazLog.js';
import WorkSession from '../models/WorkSession.js';
import { awardXP } from './gamification.js';

const startCronJobs = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily midnight checks...');
    
    try {
      const users = await User.find({});
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      for (const user of users) {
        // --- 1. Namaz Penalty Check ---
        const namazLog = await NamazLog.findOne({ 
          userId: user._id, 
          date: { $gte: yesterday, $lte: yesterdayEnd } 
        });

        const normalize = (val) => {
          if (val === true || val === 'true') return 'prayed';
          if (val === false || val === 'false') return 'none';
          return val || 'none';
        };

        let prayedCount = 0;
        if (namazLog) {
          if (normalize(namazLog.fajr) !== 'none') prayedCount++;
          if (normalize(namazLog.zuhr) !== 'none') prayedCount++;
          if (normalize(namazLog.asr) !== 'none') prayedCount++;
          if (normalize(namazLog.maghrib) !== 'none') prayedCount++;
          if (normalize(namazLog.isha) !== 'none') prayedCount++;
        }

        // If fewer than 5 prayers completed yesterday
        if (prayedCount < 5) {
          await awardXP(user._id, -200, 'namaz_daily_penalty', null);
          console.log(`[CRON] Deducted 200 XP from user ${user._id} for missing Namaz`);
        }

        // --- 2. Deep Work Penalty Check ---
        const workSessions = await WorkSession.find({
          userId: user._id,
          startTime: { $gte: yesterday, $lte: yesterdayEnd }
        });

        // Sum duration or simply check if any session exists.
        // Assuming any recorded session satisfies the rule.
        const totalDuration = workSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

        if (workSessions.length === 0 || totalDuration < 3600) {
          await awardXP(user._id, -200, 'deep_work_daily_penalty', null);
          console.log(`[CRON] Deducted 200 XP from user ${user._id} for missing Deep Work (less than 1 hour)`);
        }
      }
      
      // --- 3. Clean up 7-day old Relapse History & Habit Logs ---
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const StreakLog = (await import('../models/StreakLog.js')).default;
      const DetoxLog = (await import('../models/DetoxLog.js')).default;
      const NamazLog = (await import('../models/NamazLog.js')).default;
      const ExerciseLog = (await import('../models/ExerciseLog.js')).default;
      const WorkSession = (await import('../models/WorkSession.js')).default;
      const ReadingLog = (await import('../models/ReadingLog.js')).default;
      const TodoTask = (await import('../models/TodoTask.js')).default;

      // Pull old relapse histories
      await StreakLog.updateMany(
        {},
        { $pull: { relapseHistory: { date: { $lt: sevenDaysAgo } } } }
      );
      
      await DetoxLog.updateMany(
        {},
        { $pull: { relapseHistory: { date: { $lt: sevenDaysAgo } } } }
      );

      // Delete old habit logs
      await NamazLog.deleteMany({ date: { $lt: sevenDaysAgo } });
      await ExerciseLog.deleteMany({ date: { $lt: sevenDaysAgo } });
      await WorkSession.deleteMany({ startTime: { $lt: sevenDaysAgo } });
      await ReadingLog.deleteMany({ date: { $lt: sevenDaysAgo } });
      await TodoTask.deleteMany({ status: 'completed', updatedAt: { $lt: sevenDaysAgo } });

      console.log('[CRON] Cleaned up relapse history and habit logs older than 7 days.');
      
      console.log('[CRON] Daily midnight checks completed successfully.');
    } catch (error) {
      console.error('[CRON] Error running midnight checks:', error);
    }
  });
};

export default startCronJobs;
