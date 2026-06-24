const fs = require('fs');

let calendar = fs.readFileSync('frontend/src/components/analytics/HabitCalendar.jsx', 'utf8');

// Add detox to dropdown and rename social (we will remove social or just add detox)
calendar = calendar.replace(
  /<option value="streak">Commitment Streak<\/option>/,
  '<option value="streak">Commitment Streak</option>\n               <option value="detox">Dopamine Detox</option>'
);

// Add cell style for detox
calendar = calendar.replace(
  /if \(activeHabit === 'streak'\) \{/,
  `if (activeHabit === 'detox') {
      const isActive = calendarData?.detox?.includes(dateStr);
      const isRelapse = calendarData?.detoxRelapses?.includes(dateStr);
      if (!isActive) return { className: 'bg-white border-[#dadce0] hover:border-gray-300', style: {} };
      if (isRelapse) return { className: 'border-red-500 shadow-sm', style: { backgroundColor: '#ef5350' } };
      return { className: 'border-blue-500 shadow-sm', style: { backgroundColor: '#bfdbfe' } };
    }

    if (activeHabit === 'streak') {`
);

// Add hasAnyData
calendar = calendar.replace(
  /if \(activeHabit === 'streak'\) return calendarData\?\.streak\?\.includes\(dateStr\);/,
  `if (activeHabit === 'streak') return calendarData?.streak?.includes(dateStr);\n    if (activeHabit === 'detox') return calendarData?.detox?.includes(dateStr);`
);

// Add day details
calendar = calendar.replace(
  /if \(calendarData\.streakRelapses\?\.includes\(dateStr\)\) details\.push\(\{ icon: <AlertTriangle size=\{14\}\/>, label: 'Streak Relapsed', color: 'text-red-600' \}\);/,
  `if (calendarData.streakRelapses?.includes(dateStr)) details.push({ icon: <AlertTriangle size={14}/>, label: 'Streak Relapsed', color: 'text-red-600' });
    if (calendarData.detox?.includes(dateStr)) details.push({ icon: <Shield size={14}/>, label: 'Detox Active', color: 'text-blue-600' });
    if (calendarData.detoxRelapses?.includes(dateStr)) details.push({ icon: <AlertTriangle size={14}/>, label: 'Detox Relapsed', color: 'text-red-600' });`
);

// Add getCellText logic for streak and detox to show numbers
calendar = calendar.replace(
  /if \(activeHabit === 'streak'\) \{\s*if \(calendarData\?\.streakRelapses\?\.includes\(dateStr\)\) return 'Relapsed';\s*if \(calendarData\?\.streak\?\.includes\(dateStr\)\) return 'Active';\s*return null;\s*\}/s,
  `if (activeHabit === 'streak') {
      if (calendarData?.streakRelapses?.includes(dateStr)) return 'Relapsed';
      if (calendarData?.streak?.includes(dateStr)) {
         return calendarData.streakDayNumbers?.[dateStr] ? \`Day \${calendarData.streakDayNumbers[dateStr]}\` : 'Active';
      }
      return null;
    }
    if (activeHabit === 'detox') {
      if (calendarData?.detoxRelapses?.includes(dateStr)) return 'Relapsed';
      if (calendarData?.detox?.includes(dateStr)) {
         return calendarData.detoxDayNumbers?.[dateStr] ? \`Day \${calendarData.detoxDayNumbers[dateStr]}\` : 'Active';
      }
      return null;
    }`
);

fs.writeFileSync('frontend/src/components/analytics/HabitCalendar.jsx', calendar);
console.log('Updated HabitCalendar.jsx');
