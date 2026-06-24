const fs = require('fs');

let timing = fs.readFileSync('frontend/src/components/analytics/HabitTimingChart.jsx', 'utf8');

// Add detox to dropdown
timing = timing.replace(
  /<option value="streak">Relapse Timing<\/option>/,
  '<option value="streak">Relapse Timing</option>\n               <option value="detox">Detox Relapse Timing</option>'
);

// Add detox to options map
timing = timing.replace(
  /streak: \{ title: 'Relapse', icon: <Shield size=\{16\} \/>, color: '#ef5350' \}/,
  "streak: { title: 'Relapse', icon: <Shield size={16} />, color: '#ef5350' },\n    detox: { title: 'Detox Relapse', icon: <Activity size={16} />, color: '#1a73e8' }"
);

fs.writeFileSync('frontend/src/components/analytics/HabitTimingChart.jsx', timing);
console.log('Updated HabitTimingChart.jsx');
