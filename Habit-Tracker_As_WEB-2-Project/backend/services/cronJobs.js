import cron from 'node-cron';
import User from '../models/User.js';
import NamazLog from '../models/NamazLog.js';
import WorkSession from '../models/WorkSession.js';
import { awardXP } from './gamification.js';

export const runDailyChecks = async () => {
  console.log('[CRON] Running daily checks...');
  try {
    const users = await User.find({});
    
    // We want to check up to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    for (const user of users) {
      let startDate = user.lastDailyCheckDate;
      if (!startDate) {
        // If not set, start from 7 days ago
        startDate = new Date(yesterday);
        startDate.setDate(startDate.getDate() - 7); // Check for the last 7 days
      } else {
        startDate = new Date(startDate);
      }

      // Start checking from the day AFTER the last check
      let checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + 1);
      checkDate.setHours(0, 0, 0, 0);

      while (checkDate.getTime() <= yesterday.getTime()) {
        const checkDateEnd = new Date(checkDate);
        checkDateEnd.setHours(23, 59, 59, 999);
        
        console.log(`[CRON] Checking penalties for user ${user._id} on date ${checkDate.toDateString()}`);

        // --- 1. Namaz Penalty Check ---
        const namazLog = await NamazLog.findOne({ 
          userId: user._id, 
          date: { $gte: checkDate, $lte: checkDateEnd } 
        });

        const normalize = (val) => {
          if (val === true || val === 'true') return 'prayed';
          if (val === false || val === 'false') return 'unprayed';
          return val || 'none';
        };

        const fajrStatus = namazLog ? normalize(namazLog.fajr) : 'none';
        const zuhrStatus = namazLog ? normalize(namazLog.zuhr) : 'none';
        const asrStatus = namazLog ? normalize(namazLog.asr) : 'none';
        const maghribStatus = namazLog ? normalize(namazLog.maghrib) : 'none';
        const ishaStatus = namazLog ? normalize(namazLog.isha) : 'none';
        const sleptEarly = namazLog ? namazLog.sleptEarlyAfterIsha : false;

        const isCompleted = (status) => ['qaza', 'prayed', 'jamat'].includes(status);
        const allPrayed = isCompleted(fajrStatus) && 
                          isCompleted(zuhrStatus) && 
                          isCompleted(asrStatus) && 
                          isCompleted(maghribStatus) && 
                          isCompleted(ishaStatus);

        if (!allPrayed || !sleptEarly) {
          await awardXP(user._id, -200, 'namaz_daily_penalty', null);
          console.log(`[CRON] Deducted 200 XP from user ${user._id} for missing any prayer or not sleeping early on ${checkDate.toDateString()}`);
        }

        // --- 2. Deep Work Penalty Check ---
        const workSessions = await WorkSession.find({
          userId: user._id,
          startTime: { $gte: checkDate, $lte: checkDateEnd }
        });

        const totalDuration = workSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

        if (workSessions.length === 0 || totalDuration < 3600) {
          await awardXP(user._id, -200, 'deep_work_daily_penalty', null);
          console.log(`[CRON] Deducted 200 XP from user ${user._id} for missing Deep Work (less than 1 hour) on ${checkDate.toDateString()}`);
        }

        // --- 2.5 Daily Hardworker Combo Check ---
        const allJamat = ishaStatus === 'jamat' && fajrStatus === 'jamat' && zuhrStatus === 'jamat' && asrStatus === 'jamat' && maghribStatus === 'jamat';
        
        const { default: ExerciseLog } = await import('../models/ExerciseLog.js');
        const exerciseLogs = await ExerciseLog.find({
          userId: user._id,
          date: { $gte: checkDate, $lte: checkDateEnd }
        });
        
        const runningMinutes = exerciseLogs.reduce((acc, log) => {
          if ((log.type || '').toLowerCase() === 'running' || (log.activity || '').toLowerCase() === 'running') {
            return acc + (log.duration || 0);
          }
          return acc;
        }, 0);

        if (allJamat && totalDuration >= 36000 && runningMinutes >= 30) {
          await awardXP(user._id, 500, 'daily_hardworker_combo', null);
          console.log(`[CRON] Awarded 500 XP to user ${user._id} for Daily Hardworker Combo on ${checkDate.toDateString()}`);
        }

        // Move to next day
        checkDate.setDate(checkDate.getDate() + 1);
        checkDate.setHours(0, 0, 0, 0);
      }
      
      // Update user's lastDailyCheckDate
      if (!user.lastDailyCheckDate || user.lastDailyCheckDate.getTime() < yesterday.getTime()) {
        user.lastDailyCheckDate = yesterday;
        await user.save();
      }
      
      // --- Weekly Rewards Check (Done only once per run for the user to avoid spam, or based on yesterday) ---
      const sevenDaysAgoForReward = new Date(yesterday);
      sevenDaysAgoForReward.setDate(sevenDaysAgoForReward.getDate() - 7);
      sevenDaysAgoForReward.setHours(0, 0, 0, 0);

      const last7DaysNamaz = await NamazLog.find({
        userId: user._id,
        date: { $gte: sevenDaysAgoForReward, $lte: yesterday }
      });
      
      let earlySleepStreak = 0;
      last7DaysNamaz.forEach(log => {
        const fajr = normalize(log.fajr);
        const zuhr = normalize(log.zuhr);
        const asr = normalize(log.asr);
        const maghrib = normalize(log.maghrib);
        const isha = normalize(log.isha);
        
        const isCompleted = (status) => ['qaza', 'prayed', 'jamat'].includes(status);
        const allPrayed = isCompleted(fajr) && isCompleted(zuhr) && isCompleted(asr) && isCompleted(maghrib) && isCompleted(isha);

        if (log.sleptEarlyAfterIsha && allPrayed) earlySleepStreak++;
      });

      if (earlySleepStreak >= 7) {
        const { default: XpHistory } = await import('../models/XpHistory.js');
        const alreadyRewarded = await XpHistory.findOne({
          userId: user._id,
          source: 'early_sleep_weekly',
          date: { $gte: sevenDaysAgoForReward }
        });
        if (!alreadyRewarded) {
          await awardXP(user._id, 500, 'early_sleep_weekly', null);
        }
      }

      const last7DaysWork = await WorkSession.find({
        userId: user._id,
        startTime: { $gte: sevenDaysAgoForReward, $lte: new Date(yesterday.getTime() + 86399999) }
      });

      const dailyWorkMap = {};
      last7DaysWork.forEach(s => {
        const day = new Date(s.startTime).setHours(0,0,0,0);
        dailyWorkMap[day] = (dailyWorkMap[day] || 0) + (s.duration || 0);
      });

      let deepWorkDays = 0;
      for (let duration of Object.values(dailyWorkMap)) {
        if (duration >= 36000) deepWorkDays++; // 10 hours = 36000 seconds
      }

      if (deepWorkDays >= 7) {
        const { default: XpHistory } = await import('../models/XpHistory.js');
        const alreadyRewardedWork = await XpHistory.findOne({
          userId: user._id,
          source: 'deep_work_weekly',
          date: { $gte: sevenDaysAgoForReward }
        });
        if (!alreadyRewardedWork) {
          await awardXP(user._id, 500, 'deep_work_weekly', null);
        }
      }
    }
    
    // --- 3. Clean up 7-day old Relapse History & Habit Logs ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { default: StreakLog } = await import('../models/StreakLog.js');
    const { default: ExerciseLog } = await import('../models/ExerciseLog.js');
    const { default: ReadingLog } = await import('../models/ReadingLog.js');
    const { default: TodoTask } = await import('../models/TodoTask.js');

    // Pull old relapse histories
    await StreakLog.updateMany(
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
    
    console.log('[CRON] Daily checks completed successfully.');
  } catch (error) {
    console.error('[CRON] Error running daily checks:', error);
  }
};

const startCronJobs = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', runDailyChecks);
  
  // Also run once on startup (after a small delay to ensure DB connection is fully ready)
  setTimeout(() => {
    runDailyChecks();
  }, 5000);
};

export default startCronJobs;
