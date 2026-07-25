const fs = require('fs');
const path = 'c:/Users/moiah/Desktop/New folder/Habit-Tracker_As_WEB-2-Project/frontend/src/pages/Analytics.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove TimeOfDayChart from Deep Work and add GoalTrajectory
content = content.replace(
  '<FocusQualityChart />\n          <TimeOfDayChart timingData={data.timingData} />',
  '<FocusQualityChart />\n          <GoalTrajectory selectedMonth={selectedMonth} />'
);

// 2. Remove GoalTrajectory from Productivity
content = content.replace(
  '<VelocityChart />\n          <GoalTrajectory selectedMonth={selectedMonth} />',
  '<VelocityChart />'
);

// 3. Add TimeOfDayChart to Overview
content = content.replace(
  '<AIInsights />\n          <HabitTimingChart',
  '<AIInsights />\n          <TimeOfDayChart timingData={data.timingData} />\n          <HabitTimingChart'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully applied tab moves');
