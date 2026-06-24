const fs = require('fs');

let analytics = fs.readFileSync('backend/controllers/analyticsController.js', 'utf8');

analytics = analytics.replace(
  /const timingData = \{ work: \[\], exercise: \[\], productivity: \[\], social: \[\], reading: \[\], streak: \[\] \};/,
  'const timingData = { work: [], exercise: [], productivity: [], social: [], reading: [], streak: [], detox: [] };'
);

const streakReplacement = `
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
`;

analytics = analytics.replace(
  /if \(streakLog\) \{\s*const createdAt = new Date\(streakLog\.createdAt \|\| Date\.now\(\)\);\s*createdAt\.setHours\(0, 0, 0, 0\);\s*const todayDate = new Date\(\);\s*todayDate\.setHours\(23, 59, 59, 999\);\s*for \(let d = new Date\(createdAt\); d <= todayDate; d\.setDate\(d\.getDate\(\) \+ 1\)\) \{\s*streakActiveDatesSet\.add\(formatLocalDate\(d\)\);\s*\}\s*streakLog\.relapseHistory\.forEach\(relapse => \{\s*if \(relapse\.date\) \{\s*streakRelapsesSet\.add\(formatLocalDate\(relapse\.date\)\);\s*\}\s*\}\);\s*\}/s,
  streakReplacement
);

const detoxLogic = `
    const detoxLog = await DetoxLog.findOne({ userId: req.userId });
    const detoxActiveDatesSet = new Set();
    const detoxRelapsesSet = new Set();
    const detoxDayNumbers = {};
    let detoxRelapsesThisMonth = 0;

    if (detoxLog) {
      const relapses = detoxLog.relapseHistory.map(r => {
        const d = new Date(r.date);
        d.setHours(0,0,0,0);
        return d;
      });
      
      detoxRelapsesThisMonth = detoxLog.relapseHistory.filter(r => new Date(r.date) >= startOfMonth && new Date(r.date) <= endOfMonth).length;

      const createdAt = new Date(detoxLog.createdAt || detoxLog.startTime || Date.now());
      createdAt.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(23, 59, 59, 999);

      let currentDetoxVal = 1;
      for (let d = new Date(createdAt); d <= todayDate; d.setDate(d.getDate() + 1)) {
        const dTime = d.getTime();
        const dateStr = formatLocalDate(d);
        detoxActiveDatesSet.add(dateStr);

        const isRelapse = relapses.some(r => r.getTime() === dTime);
        if (isRelapse) {
          currentDetoxVal = 1;
        } else {
          detoxDayNumbers[dateStr] = currentDetoxVal;
          currentDetoxVal++;
        }
      }

      detoxLog.relapseHistory.forEach(r => {
        if (r.date) {
           detoxRelapsesSet.add(formatLocalDate(r.date));
           const dt = new Date(r.date);
           if (dt >= startOfMonth && dt <= endOfMonth) {
             timingData.detox.push({ date: formatLocalDate(dt), timeDecimal: Number((dt.getHours() + dt.getMinutes()/60).toFixed(2)), timestamp: dt.getTime() });
           }
        }
      });
    }
    
    monthlyAverages.detox = detoxRelapsesThisMonth;
`;

analytics = analytics.replace(
  /monthlyAverages\.streak = relapsesThisMonth;/,
  'monthlyAverages.streak = relapsesThisMonth;\n' + detoxLogic
);

analytics = analytics.replace(
  /streak: streakBest/,
  'streak: streakBest,\n      detox: detoxLog ? detoxLog.longestStreak : 0'
);

analytics = analytics.replace(
  /streakRelapses: Array\.from\(streakRelapsesSet\)/,
  'streakRelapses: Array.from(streakRelapsesSet),\n          streakDayNumbers,\n          detox: Array.from(detoxActiveDatesSet),\n          detoxRelapses: Array.from(detoxRelapsesSet),\n          detoxDayNumbers'
);

fs.writeFileSync('backend/controllers/analyticsController.js', analytics);
console.log('Updated analyticsController.js successfully!');
