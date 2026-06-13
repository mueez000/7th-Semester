import NamazLog from '../models/NamazLog.js';
import WorkSession from '../models/WorkSession.js';
import ExerciseLog from '../models/ExerciseLog.js';

import TodoTask from '../models/TodoTask.js';

export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    
    // Determine the month bounds
    let startOfMonth;
    let endOfMonth;
    
    if (year && month) {
       startOfMonth = new Date(year, month - 1, 1);
       endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
       const now = new Date();
       startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
       endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const formatLocalDate = (dateStr) => {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 1. Namaz Data
    const namazLogs = await NamazLog.find({ 
      userId: req.userId, 
      date: { $gte: startOfMonth, $lte: endOfMonth } 
    }).sort({ date: 1 });

    const namazData = namazLogs.map(log => {
      let prayers = 0;
      if (log.fajr) prayers++;
      if (log.zuhr) prayers++;
      if (log.asr) prayers++;
      if (log.maghrib) prayers++;
      if (log.isha) prayers++;
      
      return {
        date: log.date.getDate() + (['st', 'nd', 'rd'][((log.date.getDate()+90)%100-10)%10-1] || 'th'),
        prayers
      };
    });

    // Per-day namaz prayer counts: dateStr -> count (0-5)
    // Only dates that have a log record will be in this map
    const namazCounts = {};
    namazLogs.forEach(log => {
      const dateStr = formatLocalDate(log.date);
      let count = 0;
      if (log.fajr) count++;
      if (log.zuhr) count++;
      if (log.asr) count++;
      if (log.maghrib) count++;
      if (log.isha) count++;
      namazCounts[dateStr] = count;
    });

    // Calendar: list of dates with at least 1 prayer (for popup detail)
    const namazActiveDates = namazLogs
      .filter(log => (log.fajr || log.zuhr || log.asr || log.maghrib || log.isha))
      .map(log => formatLocalDate(log.date));

    // 2. Work Data
    const workSessions = await WorkSession.find({
      userId: req.userId,
      startTime: { $gte: startOfMonth, $lte: endOfMonth },
      endTime: { $ne: null }
    }).sort({ startTime: 1 });

    const dailyWork = {};
    const workActiveDatesSet = new Set();
    // Per-day work minutes: dateStr -> total minutes
    const workMinutes = {};

    workSessions.forEach(session => {
      const day = session.startTime.toLocaleDateString('en-US', { weekday: 'short' });
      if (!dailyWork[day]) dailyWork[day] = 0;
      dailyWork[day] += session.duration / 3600; // hours for chart
      
      const dateStr = formatLocalDate(session.startTime);
      workActiveDatesSet.add(dateStr);
      if (!workMinutes[dateStr]) workMinutes[dateStr] = 0;
      workMinutes[dateStr] += Math.floor(session.duration / 60); // convert seconds to minutes
    });

    const workData = Object.keys(dailyWork).map(day => ({
      day,
      hours: Number(dailyWork[day].toFixed(1))
    }));

    // 3. Exercise Data
    const exerciseLogs = await ExerciseLog.find({
      userId: req.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const exerciseActiveDates = exerciseLogs.map(log => formatLocalDate(log.date));

    // Per-day exercise minutes
    const exerciseMinutes = {};
    const dailyExercise = {};
    exerciseLogs.forEach(log => {
      const day = new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' });
      if (!dailyExercise[day]) dailyExercise[day] = 0;
      dailyExercise[day] += log.duration || 0;

      const dateStr = formatLocalDate(log.date);
      if (!exerciseMinutes[dateStr]) exerciseMinutes[dateStr] = 0;
      exerciseMinutes[dateStr] += log.duration || 0;
    });

    const exerciseData = Object.keys(dailyExercise).map(day => ({
      day,
      duration: dailyExercise[day]
    }));



    // 5. Todo Data (Productivity)
    const allTasks = await TodoTask.find({ userId: req.userId });
    
    const tasksCompletedThisMonth = allTasks.filter(t => {
       if (t.status !== 'completed' || !t.completedAt) return false;
       const compDate = new Date(t.completedAt);
       return compDate >= startOfMonth && compDate <= endOfMonth;
    });

    const dailyTasks = {};
    const productivityActiveDatesSet = new Set();
    // Per-day productivity counts
    const productivityCounts = {};
    
    tasksCompletedThisMonth.forEach(task => {
        const d = new Date(task.completedAt);
        const day = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (!dailyTasks[day]) dailyTasks[day] = 0;
        dailyTasks[day]++;

        const dateStr = formatLocalDate(d);
        productivityActiveDatesSet.add(dateStr);
        if (!productivityCounts[dateStr]) productivityCounts[dateStr] = 0;
        productivityCounts[dateStr]++;
    });

    const productivityData = Object.keys(dailyTasks).map(day => ({
        day, 
        completed: dailyTasks[day]
    }));

    // Monthly Averages
    let elapsedDays = endOfMonth.getDate();
    const now = new Date();
    if (year && month && Number(year) === now.getFullYear() && Number(month) === now.getMonth() + 1) {
       elapsedDays = now.getDate();
    } else if (!year || !month) {
       elapsedDays = now.getDate();
    }
    
    const namazMonthlyAvg = elapsedDays > 0 ? (namazData.reduce((acc, curr) => acc + curr.prayers, 0) / (elapsedDays * 5)) * 100 : 0;
    const workMonthlyAvg = elapsedDays > 0 ? (workData.reduce((acc, curr) => acc + curr.hours, 0) / elapsedDays) : 0;

    const exerciseMonthlyAvg = elapsedDays > 0 ? (exerciseData.reduce((acc, curr) => acc + curr.duration, 0) / elapsedDays) : 0;
    const productivityMonthlyAvg = elapsedDays > 0 ? (productivityData.reduce((acc, curr) => acc + curr.completed, 0) / elapsedDays) : 0;

    const monthlyAverages = {
      namaz: Math.round(namazMonthlyAvg),
      work: Number(workMonthlyAvg.toFixed(1)),

      exercise: Math.round(exerciseMonthlyAvg),
      productivity: Number(productivityMonthlyAvg.toFixed(1))
    };

    // Highest Streaks (all-time, across all logs)
    const allNamaz = await NamazLog.find({ userId: req.userId }).sort({ date: 1 });
    let namazStreak = 0, namazBest = 0;
    for (const log of allNamaz) {
      const done = log.fajr || log.zuhr || log.asr || log.maghrib || log.isha;
      if (done) { namazStreak++; namazBest = Math.max(namazBest, namazStreak); } else { namazStreak = 0; }
    }

    const allWork = await WorkSession.find({ userId: req.userId, endTime: { $ne: null } }).sort({ startTime: 1 });
    const workDates = [...new Set(allWork.map(s => formatLocalDate(s.startTime)))];
    let workStreakVal = 0, workBest = 0;
    for (let i = 0; i < workDates.length; i++) {
      if (i === 0) { workStreakVal = 1; }
      else {
        const diff = (new Date(workDates[i]) - new Date(workDates[i-1])) / 86400000;
        workStreakVal = diff === 1 ? workStreakVal + 1 : 1;
      }
      workBest = Math.max(workBest, workStreakVal);
    }



    const allExercise = await ExerciseLog.find({ userId: req.userId }).sort({ date: 1 });
    const exDates = [...new Set(allExercise.map(l => formatLocalDate(l.date)))];
    let exStreak = 0, exBest = 0;
    for (let i = 0; i < exDates.length; i++) {
      if (i === 0) { exStreak = 1; }
      else {
        const diff = (new Date(exDates[i]) - new Date(exDates[i-1])) / 86400000;
        exStreak = diff === 1 ? exStreak + 1 : 1;
      }
      exBest = Math.max(exBest, exStreak);
    }

    const highestStreaks = {
      namaz: namazBest,
      work: workBest,

      exercise: exBest,
    };

    res.json({
      success: true,
      data: {
        namazData,
        workData,
        exerciseData,

        productivityData,
        monthlyAverages,
        highestStreaks,
        // Per-habit daily data maps for heatmap coloring
        calendar: {
          namaz: namazActiveDates,
          work: Array.from(workActiveDatesSet),
          exercise: Array.from(new Set(exerciseActiveDates)),

          productivity: Array.from(productivityActiveDatesSet),
          // NEW: per-day counts/minutes for precise heatmap coloring
          namazCounts,       // { "YYYY-MM-DD": 0-5 }
          workMinutes,       // { "YYYY-MM-DD": minutes }

          exerciseMinutes,   // { "YYYY-MM-DD": minutes }
          productivityCounts // { "YYYY-MM-DD": task count }
        }
      }
    });

  } catch (error) {
    next(error);
  }
};
