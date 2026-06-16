import NamazLog from '../models/NamazLog.js';
import WorkSession from '../models/WorkSession.js';
import ExerciseLog from '../models/ExerciseLog.js';
import TodoTask from '../models/TodoTask.js';
import SocialMediaSession from '../models/SocialMediaSession.js';
import ReadingLog from '../models/ReadingLog.js';
import StreakLog from '../models/StreakLog.js';

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
    const workMinutes = {};

    workSessions.forEach(session => {
      const day = session.startTime.toLocaleDateString('en-US', { weekday: 'short' });
      if (!dailyWork[day]) dailyWork[day] = 0;
      dailyWork[day] += session.duration / 3600; 
      
      const dateStr = formatLocalDate(session.startTime);
      workActiveDatesSet.add(dateStr);
      if (!workMinutes[dateStr]) workMinutes[dateStr] = 0;
      workMinutes[dateStr] += Math.floor(session.duration / 60); 
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

    // 4. Todo Data (Productivity)
    const allTasks = await TodoTask.find({ userId: req.userId });
    
    const tasksCompletedThisMonth = allTasks.filter(t => {
       if (t.status !== 'completed' || !t.completedAt) return false;
       const compDate = new Date(t.completedAt);
       return compDate >= startOfMonth && compDate <= endOfMonth;
    });

    const dailyTasks = {};
    const productivityActiveDatesSet = new Set();
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

    // 5. Social Media Data
    const socialSessions = await SocialMediaSession.find({
      userId: req.userId,
      startTime: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const dailySocial = {};
    const socialMinutes = {};
    const socialActiveDatesSet = new Set();
    
    socialSessions.forEach(session => {
      const day = session.startTime.toLocaleDateString('en-US', { weekday: 'short' });
      if (!dailySocial[day]) dailySocial[day] = 0;
      dailySocial[day] += session.duration / 60; // minutes
      
      const dateStr = formatLocalDate(session.startTime);
      socialActiveDatesSet.add(dateStr);
      if (!socialMinutes[dateStr]) socialMinutes[dateStr] = 0;
      socialMinutes[dateStr] += Math.floor(session.duration / 60);
    });

    const socialData = Object.keys(dailySocial).map(day => ({
      day,
      minutes: Number(dailySocial[day].toFixed(1))
    }));

    // 6. Reading Data
    const readingLogs = await ReadingLog.find({
      userId: req.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const dailyReading = {};
    const readingPages = {};
    const readingActiveDatesSet = new Set();

    readingLogs.forEach(log => {
      const day = new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' });
      if (!dailyReading[day]) dailyReading[day] = 0;
      dailyReading[day] += log.pagesRead;
      
      const dateStr = formatLocalDate(log.date);
      readingActiveDatesSet.add(dateStr);
      if (!readingPages[dateStr]) readingPages[dateStr] = 0;
      readingPages[dateStr] += log.pagesRead;
    });

    const readingData = Object.keys(dailyReading).map(day => ({
      day,
      pages: dailyReading[day]
    }));

    // Timing Data for Line Charts
    const timingData = { work: [], exercise: [], productivity: [], social: [], reading: [], streak: [] };
    
    workSessions.forEach(s => {
      const d = new Date(s.startTime);
      timingData.work.push({ date: formatLocalDate(d), timeDecimal: Number((d.getHours() + d.getMinutes()/60).toFixed(2)), timestamp: d.getTime() });
    });
    exerciseLogs.forEach(l => {
      const d = new Date(l.date);
      timingData.exercise.push({ date: formatLocalDate(d), timeDecimal: Number((d.getHours() + d.getMinutes()/60).toFixed(2)), timestamp: d.getTime() });
    });
    tasksCompletedThisMonth.forEach(t => {
      const d = new Date(t.completedAt);
      timingData.productivity.push({ date: formatLocalDate(d), timeDecimal: Number((d.getHours() + d.getMinutes()/60).toFixed(2)), timestamp: d.getTime() });
    });
    socialSessions.forEach(s => {
      const d = new Date(s.startTime);
      timingData.social.push({ date: formatLocalDate(d), timeDecimal: Number((d.getHours() + d.getMinutes()/60).toFixed(2)), timestamp: d.getTime() });
    });
    readingLogs.forEach(l => {
      const d = new Date(l.date);
      timingData.reading.push({ date: formatLocalDate(d), timeDecimal: Number((d.getHours() + d.getMinutes()/60).toFixed(2)), timestamp: d.getTime() });
    });

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
    const socialMonthlyAvg = elapsedDays > 0 ? (socialData.reduce((acc, curr) => acc + curr.minutes, 0) / elapsedDays) : 0;
    const readingMonthlyAvg = elapsedDays > 0 ? (readingData.reduce((acc, curr) => acc + curr.pages, 0) / elapsedDays) : 0;

    const monthlyAverages = {
      namaz: Math.round(namazMonthlyAvg),
      work: Number(workMonthlyAvg.toFixed(1)),
      exercise: Math.round(exerciseMonthlyAvg),
      productivity: Number(productivityMonthlyAvg.toFixed(1)),
      social: Math.round(socialMonthlyAvg),
      reading: Math.round(readingMonthlyAvg)
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

    const allReading = await ReadingLog.find({ userId: req.userId }).sort({ date: 1 });
    const readingDatesAll = [...new Set(allReading.map(l => formatLocalDate(l.date)))];
    let readingStreakVal = 0, readingBest = 0;
    for (let i = 0; i < readingDatesAll.length; i++) {
      if (i === 0) { readingStreakVal = 1; }
      else {
        const diff = (new Date(readingDatesAll[i]) - new Date(readingDatesAll[i-1])) / 86400000;
        readingStreakVal = diff === 1 ? readingStreakVal + 1 : 1;
      }
      readingBest = Math.max(readingBest, readingStreakVal);
    }

    // For productivity best
    const allTasksCompleted = await TodoTask.find({ userId: req.userId, status: 'completed', completedAt: { $ne: null } }).sort({ completedAt: 1 });
    const prodDates = [...new Set(allTasksCompleted.map(t => formatLocalDate(t.completedAt)))];
    let prodStreak = 0, prodBest = 0;
    for (let i = 0; i < prodDates.length; i++) {
      if (i === 0) { prodStreak = 1; }
      else {
        const diff = (new Date(prodDates[i]) - new Date(prodDates[i-1])) / 86400000;
        prodStreak = diff === 1 ? prodStreak + 1 : 1;
      }
      prodBest = Math.max(prodBest, prodStreak);
    }

    // For social best, we find the lowest daily total among active days
    const allSocial = await SocialMediaSession.find({ userId: req.userId, endTime: { $ne: null } });
    const allSocialDaily = {};
    allSocial.forEach(session => {
      const dateStr = formatLocalDate(session.startTime);
      if (!allSocialDaily[dateStr]) allSocialDaily[dateStr] = 0;
      allSocialDaily[dateStr] += session.duration / 60;
    });
    const socialDailyVals = Object.values(allSocialDaily);
    const socialBest = socialDailyVals.length > 0 ? Math.round(Math.min(...socialDailyVals)) : 0;

    const streakLog = await StreakLog.findOne({ userId: req.userId });
    const streakBest = streakLog ? streakLog.longestStreak : 0;
    
    if (streakLog && streakLog.relapseHistory) {
      streakLog.relapseHistory.forEach(r => {
        const d = new Date(r.date);
        if (d >= startOfMonth && d <= endOfMonth) {
          timingData.streak.push({ date: formatLocalDate(d), timeDecimal: Number((d.getHours() + d.getMinutes()/60).toFixed(2)), timestamp: d.getTime() });
        }
      });
    }

    const streakActiveDatesSet = new Set();
    const streakRelapsesSet = new Set();
    
    if (streakLog) {
      const createdAt = new Date(streakLog.createdAt || Date.now());
      createdAt.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(23, 59, 59, 999);
      
      for (let d = new Date(createdAt); d <= todayDate; d.setDate(d.getDate() + 1)) {
        streakActiveDatesSet.add(formatLocalDate(d));
      }
      
      streakLog.relapseHistory.forEach(relapse => {
         if (relapse.date) {
           streakRelapsesSet.add(formatLocalDate(relapse.date));
         }
      });
    }
    
    // Generate streakData for the charts (streak duration in days)
    const streakData = [];
    let relapsesThisMonth = 0;
    
    if (streakLog) {
      const createdAtDate = new Date(streakLog.createdAt || Date.now());
      createdAtDate.setHours(0,0,0,0);
      
      const relapses = streakLog.relapseHistory.map(r => {
        const d = new Date(r.date);
        d.setHours(0,0,0,0);
        return d;
      }).sort((a,b) => a - b);
      
      relapsesThisMonth = relapses.filter(d => d >= startOfMonth && d <= endOfMonth).length;

      for (let i = 1; i <= endOfMonth.getDate(); i++) {
          let y = year || new Date().getFullYear();
          let m = month ? month - 1 : new Date().getMonth();
          const d = new Date(y, m, i);
          d.setHours(0,0,0,0);
          
          const isRelapse = relapses.some(r => r.getTime() === d.getTime());
          let duration = 0;
          
          if (isRelapse) {
            duration = 0;
          } else if (d >= createdAtDate && d <= new Date(new Date().setHours(0,0,0,0))) {
            const lastRelapse = [...relapses].reverse().find(r => r < d);
            const startDate = lastRelapse ? lastRelapse : createdAtDate;
            duration = Math.floor((d - startDate) / 86400000);
          }
          
          streakData.push({
              date: i + (['st', 'nd', 'rd'][((i+90)%100-10)%10-1] || 'th'),
              days: duration
          });
      }
    }

    monthlyAverages.streak = relapsesThisMonth;

    const highestStreaks = {
      namaz: namazBest,
      work: workBest,
      exercise: exBest,
      productivity: prodBest,
      reading: readingBest,
      social: socialBest,
      streak: streakBest
    };

    res.json({
      success: true,
      data: {
        namazData,
        workData,
        exerciseData,
        productivityData,
        socialData,
        readingData,
        streakData,
        timingData,
        monthlyAverages,
        highestStreaks,
        calendar: {
          namaz: namazActiveDates,
          work: Array.from(workActiveDatesSet),
          exercise: Array.from(new Set(exerciseActiveDates)),
          productivity: Array.from(productivityActiveDatesSet),
          social: Array.from(socialActiveDatesSet),
          reading: Array.from(readingActiveDatesSet),
          streak: Array.from(streakActiveDatesSet),
          namazCounts,
          workMinutes,
          exerciseMinutes,
          productivityCounts,
          socialMinutes,
          readingPages,
          streakRelapses: Array.from(streakRelapsesSet)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getDailyTimeline = async (req, res, next) => {
  try {
    const dateQuery = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(dateQuery.getFullYear(), dateQuery.getMonth(), dateQuery.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(dateQuery.getFullYear(), dateQuery.getMonth(), dateQuery.getDate(), 23, 59, 59, 999);

    const timeline = [];

    const workSessions = await WorkSession.find({
      userId: req.userId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      endTime: { $ne: null }
    });
    workSessions.forEach(w => {
      timeline.push({
        id: w._id,
        type: 'Deep Work',
        time: w.startTime,
        duration: Math.round(w.duration / 60),
        color: '#1a73e8'
      });
    });

    const exerciseLogs = await ExerciseLog.find({
      userId: req.userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    exerciseLogs.forEach(e => {
      timeline.push({
        id: e._id,
        type: 'Exercise',
        time: e.date,
        duration: e.duration || 0,
        color: '#e37400'
      });
    });

    const todoTasks = await TodoTask.find({
      userId: req.userId,
      status: 'completed',
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    });
    todoTasks.forEach(t => {
      timeline.push({
        id: t._id,
        type: 'Task',
        title: t.title,
        time: t.completedAt,
        duration: t.actualTime || 0,
        color: '#fbbc04'
      });
    });

    const socialSessions = await SocialMediaSession.find({
      userId: req.userId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });
    socialSessions.forEach(s => {
      timeline.push({
        id: s._id,
        type: 'Social Media',
        time: s.startTime,
        duration: Math.round(s.duration / 60),
        color: '#E4405F'
      });
    });

    const readingLogs = await ReadingLog.find({
      userId: req.userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    readingLogs.forEach(r => {
      timeline.push({
        id: r._id,
        type: 'Reading',
        title: `${r.pagesRead} pages`,
        time: r.date,
        duration: 0,
        color: '#b45309'
      });
    });

    timeline.sort((a, b) => a.time - b.time);

    res.json({ success: true, data: timeline });
  } catch (error) {
    next(error);
  }
};

