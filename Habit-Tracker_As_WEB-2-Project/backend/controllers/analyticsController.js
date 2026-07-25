import WorkSession from '../models/WorkSession.js';
import TodoTask from '../models/TodoTask.js';
import StreakLog from '../models/StreakLog.js';
import TradeLog from '../models/TradeLog.js';

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

    // 1. Work Data
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

    // 2. Todo Data (Productivity)
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

    // 3. Timing Data & Trades
    const tradesThisMonth = await TradeLog.find({
      userId: req.userId,
      entryDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const timingData = { work: [], productivity: [], streak: [], trades: [] };
    
    workSessions.forEach(s => {
      const d = new Date(s.startTime);
      timingData.work.push({ date: formatLocalDate(d), timeDecimal: Number((d.getHours() + d.getMinutes()/60).toFixed(2)), timestamp: d.getTime() });
    });
    tasksCompletedThisMonth.forEach(t => {
      const d = new Date(t.completedAt);
      timingData.productivity.push({ date: formatLocalDate(d), timeDecimal: Number((d.getHours() + d.getMinutes()/60).toFixed(2)), timestamp: d.getTime() });
    });
    
    const tradeActiveDatesSet = new Set();
    const tradePnL = {}; // Track total PnL per day for calendar
    
    tradesThisMonth.forEach(t => {
      const d = new Date(t.entryDate);
      const dateStr = formatLocalDate(d);
      timingData.trades.push({ date: dateStr, timeDecimal: Number((d.getHours() + d.getMinutes()/60).toFixed(2)), timestamp: d.getTime() });
      tradeActiveDatesSet.add(dateStr);
      if (!tradePnL[dateStr]) tradePnL[dateStr] = 0;
      tradePnL[dateStr] += (t.pnl || 0);
    });

    // 4. Monthly Averages
    let elapsedDays = endOfMonth.getDate();
    const now = new Date();
    if (year && month && Number(year) === now.getFullYear() && Number(month) === now.getMonth() + 1) {
       elapsedDays = Math.max(1, now.getDate() - 1);
    } else if (!year || !month) {
       elapsedDays = Math.max(1, now.getDate() - 1);
    }
    
    const workMonthlyAvg = elapsedDays > 0 ? (workData.reduce((acc, curr) => acc + curr.hours, 0) / elapsedDays) : 0;
    const productivityMonthlyAvg = elapsedDays > 0 ? (productivityData.reduce((acc, curr) => acc + curr.completed, 0) / elapsedDays) : 0;

    // 5. Streak Data
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
    const streakDayNumbers = {};
    
    if (streakLog) {
      const createdAt = new Date(streakLog.createdAt || Date.now());
      createdAt.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(23, 59, 59, 999);
      
      const relapses = streakLog.relapseHistory.map(r => {
        const d = new Date(r.date);
        d.setHours(0,0,0,0);
        return d;
      });

      let currentStreakVal = 1;
      for (let d = new Date(createdAt); d <= todayDate; d.setDate(d.getDate() + 1)) {
        const dTime = d.getTime();
        const dateStr = formatLocalDate(d);
        streakActiveDatesSet.add(dateStr);
        
        const isRelapse = relapses.some(r => r.getTime() === dTime);
        if (isRelapse) {
          currentStreakVal = 1;
        } else {
          streakDayNumbers[dateStr] = currentStreakVal;
          currentStreakVal++;
        }
      }
      
      streakLog.relapseHistory.forEach(relapse => {
         if (relapse.date) {
           streakRelapsesSet.add(formatLocalDate(relapse.date));
         }
      });
    }

    // Generate streakData for charts
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

    // 6. Highest Streaks (Work & Tasks)
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

    const monthlyAverages = {
      work: Number(workMonthlyAvg.toFixed(1)),
      productivity: Number(productivityMonthlyAvg.toFixed(1)),
      streak: relapsesThisMonth
    };

    const highestStreaks = {
      work: workBest,
      productivity: prodBest,
      streak: streakBest
    };

    res.json({
      success: true,
      data: {
        workData,
        productivityData,
        streakData,
        timingData,
        monthlyAverages,
        highestStreaks,
        calendar: {
          work: Array.from(workActiveDatesSet),
          productivity: Array.from(productivityActiveDatesSet),
          streak: Array.from(streakActiveDatesSet),
          trades: Array.from(tradeActiveDatesSet),
          workMinutes,
          productivityCounts,
          tradePnL,
          streakRelapses: Array.from(streakRelapsesSet),
          streakDayNumbers
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

    const trades = await TradeLog.find({
      userId: req.userId,
      entryDate: { $gte: startOfDay, $lte: endOfDay }
    });
    trades.forEach(t => {
      timeline.push({
        id: t._id,
        type: 'Trade',
        title: `${t.position} ${t.asset}`,
        time: t.entryDate,
        duration: 0,
        color: t.status === 'Win' ? '#22c55e' : t.status === 'Loss' ? '#ef4444' : '#a855f7'
      });
    });

    timeline.sort((a, b) => a.time - b.time);

    res.json({ success: true, data: timeline });
  } catch (error) {
    next(error);
  }
};

export const getHeatmapData = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const oneYearAgo = new Date();
    oneYearAgo.setDate(today.getDate() - 365);
    oneYearAgo.setHours(0, 0, 0, 0);

    const workSessions = await WorkSession.find({
      userId: req.userId,
      startTime: { $gte: oneYearAgo, $lte: today },
      endTime: { $ne: null }
    });

    const tasks = await TodoTask.find({
      userId: req.userId,
      status: 'completed',
      completedAt: { $gte: oneYearAgo, $lte: today }
    });

    const trades = await TradeLog.find({
      userId: req.userId,
      entryDate: { $gte: oneYearAgo, $lte: today }
    });

    const workData = {};
    const taskData = {};
    const tradeData = {};

    const formatLocalDate = (dateStr) => {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    workSessions.forEach(s => {
      const dStr = formatLocalDate(s.startTime);
      if (!workData[dStr]) workData[dStr] = 0;
      workData[dStr] += s.duration / 3600; // in hours
    });

    tasks.forEach(t => {
      const dStr = formatLocalDate(t.completedAt);
      if (!taskData[dStr]) taskData[dStr] = 0;
      taskData[dStr] += 1;
    });

    trades.forEach(t => {
      const dStr = formatLocalDate(t.entryDate);
      if (!tradeData[dStr]) tradeData[dStr] = 0;
      tradeData[dStr] += 1; // Count of trades, or could be PnL
    });

    res.json({
      success: true,
      data: {
        work: workData,
        tasks: taskData,
        trades: tradeData
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getVelocityData = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(today.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const formatLocalDate = (d) =>
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    // Fetch tasks created in range
    const allCreated = await TodoTask.find({
      userId: req.userId,
      createdAt: { $gte: startDate, $lte: today }
    });

    // Fetch tasks completed in range
    const allCompleted = await TodoTask.find({
      userId: req.userId,
      status: 'completed',
      completedAt: { $gte: startDate, $lte: today }
    });

    // Build per-day maps
    const addedByDay = {};
    const completedByDay = {};

    allCreated.forEach(t => {
      const d = formatLocalDate(new Date(t.createdAt));
      addedByDay[d] = (addedByDay[d] || 0) + 1;
    });

    allCompleted.forEach(t => {
      const d = formatLocalDate(new Date(t.completedAt));
      completedByDay[d] = (completedByDay[d] || 0) + 1;
    });

    // Build a daily series
    const series = [];
    let cumulativeAdded = 0;
    let cumulativeCompleted = 0;

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dStr = formatLocalDate(d);
      const label = `${d.getMonth()+1}/${d.getDate()}`;

      const added = addedByDay[dStr] || 0;
      const completed = completedByDay[dStr] || 0;
      cumulativeAdded += added;
      cumulativeCompleted += completed;

      series.push({
        date: label,
        added,
        completed,
        debt: cumulativeAdded - cumulativeCompleted,
        cumulativeAdded,
        cumulativeCompleted
      });
    }

    // Velocity: avg tasks completed per day (over days with at least 1 completion)
    const activeDays = series.filter(d => d.completed > 0).length || 1;
    const velocity = +(allCompleted.length / activeDays).toFixed(1);

    // Total task debt
    const totalDebt = allCreated.length - allCompleted.length;

    // Weekly snapshot (last 7 days)
    const last7 = series.slice(-7);
    const weekAdded = last7.reduce((a, d) => a + d.added, 0);
    const weekCompleted = last7.reduce((a, d) => a + d.completed, 0);
    const weekDebt = weekAdded - weekCompleted;

    res.json({
      success: true,
      data: {
        series,
        velocity,
        totalDebt,
        totalAdded: allCreated.length,
        totalCompleted: allCompleted.length,
        weekAdded,
        weekCompleted,
        weekDebt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const now = new Date();
    const insights = [];

    // ── Helpers ──────────────────────────────────────────────
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const nDaysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; };
    const formatDay = (d) => DAY_NAMES[new Date(d).getDay()];

    // ── 1. STREAK: Relapse Day-of-Week Pattern ─────────────────
    const streakLog = await StreakLog.findOne({ userId: req.userId });
    if (streakLog && streakLog.relapseHistory && streakLog.relapseHistory.length >= 3) {
      const dayCount = {};
      streakLog.relapseHistory.forEach(r => {
        const d = new Date(r.date).getDay();
        dayCount[d] = (dayCount[d] || 0) + 1;
      });
      const total = streakLog.relapseHistory.length;
      const sorted = Object.entries(dayCount).sort((a,b) => b[1]-a[1]);
      const [topDay, topCount] = sorted[0];
      const pct = Math.round((topCount / total) * 100);
      const isWeekend = topDay == 0 || topDay == 6;
      const nextOccurrence = (() => {
        const today = now.getDay();
        let diff = (parseInt(topDay) - today + 7) % 7;
        if (diff === 0) diff = 7;
        const target = new Date(now);
        target.setDate(now.getDate() + diff);
        return DAY_NAMES[target.getDay()];
      })();
      if (pct >= 40) {
        insights.push({
          type: 'warning',
          icon: '🎯',
          title: 'Streak Vulnerability Detected',
          message: `${pct}% of your relapses happen on ${DAY_NAMES[topDay]}s${isWeekend ? ' (weekends)' : ''}. Stay extra alert this coming ${nextOccurrence}!`,
          priority: 1
        });
      }

      // Streak milestone
      if (streakLog.currentStreak >= 7 && streakLog.currentStreak % 7 === 0) {
        insights.push({
          type: 'achievement',
          icon: '🔥',
          title: `${streakLog.currentStreak}-Day Streak Milestone!`,
          message: `You have maintained your commitment for ${streakLog.currentStreak} consecutive days. That's incredible discipline!`,
          priority: 1
        });
      } else if (streakLog.currentStreak > 0) {
        const daysToNext = 7 - (streakLog.currentStreak % 7);
        if (daysToNext <= 3) {
          insights.push({
            type: 'encouragement',
            icon: '⚡',
            title: 'Almost at a Milestone!',
            message: `Just ${daysToNext} more days to reach your next 7-day streak milestone. Don't break it now!`,
            priority: 2
          });
        }
      }
    }

    // ── 2. DEEP WORK: Monthly Pace vs Personal Best ────────────
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const allWorkThisMonth = await WorkSession.find({
      userId: req.userId,
      startTime: { $gte: startOfMonth },
      endTime: { $ne: null }
    });
    const totalSecsThisMonth = allWorkThisMonth.reduce((acc, s) => acc + s.duration, 0);
    const totalHoursThisMonth = totalSecsThisMonth / 3600;

    // Best month ever
    const allWorkEver = await WorkSession.find({ userId: req.userId, endTime: { $ne: null } });
    const monthlyMap = {};
    allWorkEver.forEach(s => {
      const key = `${new Date(s.startTime).getFullYear()}-${new Date(s.startTime).getMonth()}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + s.duration / 3600;
    });
    const bestMonth = Math.max(...Object.values(monthlyMap), 0);
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    delete monthlyMap[currentMonthKey]; // exclude current month from best calc
    const bestPrevMonth = Math.max(...Object.values(monthlyMap), 0);

    if (bestPrevMonth > 0) {
      const elapsedDays = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const projectedHours = (totalHoursThisMonth / elapsedDays) * daysInMonth;
      if (projectedHours > bestPrevMonth) {
        insights.push({
          type: 'achievement',
          icon: '🚀',
          title: 'On Track for a Personal Record!',
          message: `At your current pace you'll hit ${projectedHours.toFixed(0)}h of deep work this month, beating your previous best of ${bestPrevMonth.toFixed(0)}h!`,
          priority: 1
        });
      } else {
        const needed = bestPrevMonth - totalHoursThisMonth;
        const remainingDays = daysInMonth - elapsedDays;
        if (remainingDays > 0 && needed > 0 && needed <= remainingDays * 12) {
          insights.push({
            type: 'tip',
            icon: '💡',
            title: 'Beat Your Deep Work Record',
            message: `You need ${needed.toFixed(1)} more hours in ${remainingDays} days to beat your best month (${bestPrevMonth.toFixed(0)}h). That's ${(needed/remainingDays).toFixed(1)}h/day — you can do it!`,
            priority: 3
          });
        }
      }
    }

    // ── 3. WORK: Best & Worst day of week ─────────────────────
    const last60Work = await WorkSession.find({
      userId: req.userId,
      startTime: { $gte: nDaysAgo(60) },
      endTime: { $ne: null }
    });
    if (last60Work.length >= 5) {
      const dayHours = Array(7).fill(0);
      const dayCounts = Array(7).fill(0);
      last60Work.forEach(s => {
        const d = new Date(s.startTime).getDay();
        dayHours[d] += s.duration / 3600;
        dayCounts[d]++;
      });
      const dayAvg = dayHours.map((h, i) => dayCounts[i] > 0 ? h / dayCounts[i] : 0);
      const bestDay = dayAvg.indexOf(Math.max(...dayAvg));
      const worstDay = dayAvg.indexOf(Math.min(...dayAvg.filter(v => v > 0)));
      if (dayAvg[bestDay] > 0) {
        insights.push({
          type: 'tip',
          icon: '📊',
          title: `${DAY_NAMES[bestDay]}s Are Your Power Days`,
          message: `You average ${dayAvg[bestDay].toFixed(1)}h of deep work on ${DAY_NAMES[bestDay]}s — your best day. Schedule your hardest tasks then!`,
          priority: 3
        });
      }
      if (worstDay !== bestDay && dayAvg[worstDay] > 0 && dayAvg[bestDay] / dayAvg[worstDay] > 1.5) {
        insights.push({
          type: 'warning',
          icon: '📉',
          title: `${DAY_NAMES[worstDay]}s Need More Focus`,
          message: `${DAY_NAMES[worstDay]}s are your lowest deep work days (avg ${dayAvg[worstDay].toFixed(1)}h). Consider protecting this time from distractions.`,
          priority: 2
        });
      }
    }

    // ── 4. TODO: Task Debt Velocity Warning ────────────────────
    const last7Created = await TodoTask.countDocuments({ userId: req.userId, createdAt: { $gte: nDaysAgo(7) } });
    const last7Completed = await TodoTask.countDocuments({ userId: req.userId, status: 'completed', completedAt: { $gte: nDaysAgo(7) } });
    const weekDebt = last7Created - last7Completed;
    if (last7Created > 0) {
      if (weekDebt >= 5) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Task Overload Alert',
          message: `You added ${last7Created} tasks but only completed ${last7Completed} this week. A backlog of ${weekDebt} tasks is building up — consider prioritizing or removing tasks.`,
          priority: 1
        });
      } else if (weekDebt <= 0 && last7Completed >= 3) {
        insights.push({
          type: 'achievement',
          icon: '✅',
          title: 'Zero Task Debt This Week!',
          message: `You completed ${last7Completed} tasks and stayed ahead of your additions. Excellent execution!`,
          priority: 2
        });
      }
    }

    // ── 5. Early Morning / Late Night check ───────────────────
    const last30Work = await WorkSession.find({
      userId: req.userId,
      startTime: { $gte: nDaysAgo(30) },
      endTime: { $ne: null }
    });
    if (last30Work.length >= 5) {
      const earlyCount = last30Work.filter(s => new Date(s.startTime).getHours() < 6).length;
      const lateCount = last30Work.filter(s => new Date(s.startTime).getHours() >= 22).length;
      const earlyPct = Math.round((earlyCount / last30Work.length) * 100);
      const latePct = Math.round((lateCount / last30Work.length) * 100);
      if (earlyPct >= 30) {
        insights.push({
          type: 'tip',
          icon: '🌅',
          title: 'You Are a True Morning Warrior',
          message: `${earlyPct}% of your deep work sessions start before 6 AM. Incredible discipline — protect your early mornings!`,
          priority: 3
        });
      } else if (latePct >= 30) {
        insights.push({
          type: 'tip',
          icon: '🦉',
          title: 'Night Owl Confirmed',
          message: `${latePct}% of your sessions start after 10 PM. Just make sure late nights don't affect your recovery and next-day output.`,
          priority: 3
        });
      }
    }

    // Sort by priority and cap at 5
    insights.sort((a, b) => a.priority - b.priority);
    const topInsights = insights.slice(0, 5);

    if (topInsights.length === 0) {
      topInsights.push({
        type: 'tip',
        icon: '🌱',
        title: 'Keep Going — Patterns Are Forming',
        message: 'Log a few more sessions and tasks so the system can detect your personal patterns and give you smart insights!',
        priority: 5
      });
    }

    res.json({ success: true, data: topInsights });
  } catch (error) {
    next(error);
  }
};

export const getFocusQualityData = async (req, res, next) => {
  try {
    const sessions = await WorkSession.find({
      userId: req.userId,
      endTime: { $ne: null },
      focusQuality: { $ne: null }
    }).sort({ startTime: -1 }).limit(200);

    const points = sessions.map(s => ({
      id: s._id,
      hours: Number((s.duration / 3600).toFixed(2)),
      quality: s.focusQuality,
      date: s.startTime
    }));

    // Average quality per star bucket for trend
    const qualityGroups = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    points.forEach(p => { if (qualityGroups[p.quality]) qualityGroups[p.quality].push(p.hours); });
    const qualitySummary = Object.entries(qualityGroups).map(([star, hrs]) => ({
      star: parseInt(star),
      avgHours: hrs.length > 0 ? Number((hrs.reduce((a,b)=>a+b,0)/hrs.length).toFixed(2)) : 0,
      count: hrs.length
    }));

    // Overall average quality
    const avgQuality = points.length > 0
      ? Number((points.reduce((a,p)=>a+p.quality,0)/points.length).toFixed(1))
      : 0;

    res.json({ success: true, data: { points, qualitySummary, avgQuality, total: points.length } });
  } catch (error) {
    next(error);
  }
};

export const getTrajectoryData = async (req, res, next) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const todayDay = isCurrentMonth ? now.getDate() : daysInMonth;

    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);

    const workSessions = await WorkSession.find({
      userId: req.userId,
      startTime: { $gte: startOfMonth, $lte: endOfMonth },
      endTime: { $ne: null }
    }).sort({ startTime: 1 });

    // Build daily hours map
    const dailyHoursMap = {};
    workSessions.forEach(s => {
      const d = new Date(s.startTime).getDate();
      dailyHoursMap[d] = (dailyHoursMap[d] || 0) + s.duration / 3600;
    });

    // Build cumulative series up to today
    const series = [];
    let cumulative = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const isActual = day <= todayDay;
      const dailyHours = dailyHoursMap[day] || 0;
      if (isActual) cumulative += dailyHours;

      series.push({
        day,
        dailyHours: isActual ? Number(dailyHours.toFixed(2)) : null,
        actual: isActual ? Number(cumulative.toFixed(2)) : null,
      });
    }

    // Velocity: cumulative hours / elapsed days
    const elapsedDays = Math.max(1, todayDay);
    const velocity = Number((cumulative / elapsedDays).toFixed(2)); // hours/day
    const forecastTotal = Number((velocity * daysInMonth).toFixed(1));

    res.json({
      success: true,
      data: {
        series,
        daysInMonth,
        todayDay,
        totalSoFar: Number(cumulative.toFixed(2)),
        velocity,
        forecastTotal
      }
    });
  } catch (error) {
    next(error);
  }
};
