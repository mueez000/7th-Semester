import HabitLog from '../models/HabitLog.js';

export const calculateStreak = async (habitId) => {
  // Find all logs for the habit, sorted by date descending
  const logs = await HabitLog.find({ habitId })
    .sort({ date: -1 })
    .select('date completed')
    .lean();

  if (!logs || logs.length === 0) {
    return { current: 0, best: 0 };
  }

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date().setHours(0, 0, 0, 0);
  const msInDay = 24 * 60 * 60 * 1000;

  // We should evaluate if the log corresponds to continuous days
  let previousDate = today; 
  let hasCheckedToday = false;

  for (const log of logs) {
    const logDate = new Date(log.date).setHours(0, 0, 0, 0);
    
    // Check if the first log is today or yesterday
    if (!hasCheckedToday) {
       hasCheckedToday = true;
       if (logDate !== today && logDate !== today - msInDay) {
           break; // Streak broken if neither today nor yesterday was logged
       }
    } else {
        // Enforce continuity
        if (previousDate - logDate > msInDay) {
            break; // Streak broken
        }
    }

    if (log.completed) {
      currentStreak++;
      previousDate = logDate;
    } else {
      break; 
    }
  }

  // Calculate personal best streak 
  // It's maximum consecutive true values
  let personalBest = 0;
  let tempStreak = 0;
  let lastDate = null;

  // Sort logs ascending for easiest best streak calc
  const ascendingLogs = [...logs].sort((a,b) => new Date(a.date) - new Date(b.date));

  for (const log of ascendingLogs) {
      if (log.completed) {
          const logDate = new Date(log.date).getTime();
          if (lastDate === null || (logDate - lastDate) === msInDay) {
             tempStreak++;
          } else {
             // gap > 1 day
             if (tempStreak > personalBest) personalBest = tempStreak;
             tempStreak = 1;
          }
          lastDate = logDate;
      } else {
          if (tempStreak > personalBest) personalBest = tempStreak;
          tempStreak = 0;
          lastDate = null;
      }
  }
  if (tempStreak > personalBest) personalBest = tempStreak;

  return { current: currentStreak, best: personalBest };
};
